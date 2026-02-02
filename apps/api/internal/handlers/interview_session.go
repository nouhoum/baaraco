package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/baaraco/baara/apps/api/internal/middleware"
	"github.com/baaraco/baara/pkg/ai"
	"github.com/baaraco/baara/pkg/apierror"
	"github.com/baaraco/baara/pkg/database"
	"github.com/baaraco/baara/pkg/logger"
	"github.com/baaraco/baara/pkg/models"
	"github.com/baaraco/baara/pkg/queue"
)

// InterviewSessionHandler handles conversational AI interview endpoints
type InterviewSessionHandler struct {
	aiClient ai.Generator
	hub      *SessionHub
}

// NewInterviewSessionHandler creates a new interview session handler
func NewInterviewSessionHandler() *InterviewSessionHandler {
	return &InterviewSessionHandler{
		aiClient: ai.NewClient(),
		hub:      GetSessionHub(),
	}
}

// SendMessageRequest is the request body for sending a candidate message
type SendMessageRequest struct {
	Content string `json:"content" binding:"required"`
}

// StartInterview creates an interview session and generates the AI opening message
// POST /api/v1/work-sample-attempts/:id/interview/start
func (h *InterviewSessionHandler) StartInterview(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		apierror.NotAuthenticated.Send(c)
		return
	}

	attemptID := c.Param("id")

	// Load the attempt
	var attempt models.WorkSampleAttempt
	if err := database.Db.First(&attempt, "id = ?", attemptID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			apierror.AttemptNotFound.Send(c)
			return
		}
		apierror.FetchError.Send(c)
		return
	}

	// Verify ownership
	if attempt.CandidateID != user.ID {
		apierror.AccessDenied.Send(c)
		return
	}

	// Check if already submitted or reviewed
	if attempt.Status == models.AttemptStatusSubmitted || attempt.Status == models.AttemptStatusReviewed {
		apierror.AlreadySubmitted.Send(c)
		return
	}

	// Check for existing session
	var session models.InterviewSession
	err := database.Db.Where("attempt_id = ?", attemptID).First(&session).Error
	if err == nil {
		// Session exists — return it if not completed
		if session.Status == models.SessionCompleted || session.Status == models.SessionTimedOut {
			apierror.InterviewAlreadyCompleted.Send(c)
			return
		}
		c.JSON(http.StatusOK, gin.H{"session": session.ToResponse()})
		return
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		apierror.FetchError.Send(c)
		return
	}

	// Load evaluation config (from template or job)
	cfg, err := models.ResolveEvalConfig(database.Db, &attempt)
	if err != nil {
		logger.Error("Failed to resolve eval config", zap.Error(err))
		apierror.FetchError.Send(c)
		return
	}

	// Create the interview session
	now := time.Now()
	session = models.InterviewSession{
		AttemptID:          attemptID,
		Status:             models.SessionInProgress,
		StartedAt:          &now,
		MaxDurationMinutes: 45,
	}

	if err = database.Db.Create(&session).Error; err != nil {
		logger.Error("Failed to create interview session", zap.Error(err))
		apierror.CreateError.Send(c)
		return
	}

	// Update attempt status and mode
	attempt.Status = models.AttemptStatusInterviewing
	attempt.InterviewMode = "conversation"
	if err = database.Db.Save(&attempt).Error; err != nil {
		logger.Error("Failed to update attempt", zap.Error(err))
	}

	// Build the conversation manager and generate opening message
	cm := ai.NewConversationManager(
		&session,
		cfg.Sections,
		cfg.Criteria,
		cfg.Title,
		cfg.Seniority,
	)

	systemPrompt := cm.BuildSystemPrompt()

	// Generate the opening message (non-streaming for the start)
	response, err := h.aiClient.Generate(systemPrompt, "Commence l'entretien.", 2048)
	if err != nil {
		logger.Error("Failed to generate opening message", zap.Error(err))
		apierror.AIError.Send(c)
		return
	}

	// Process control tags (strip them from display)
	display, _, _, _ := ai.ProcessAIResponse(response)

	// Store the opening message
	openingMsg := models.InterviewMessage{
		Role:       "assistant",
		Content:    display,
		Timestamp:  time.Now(),
		TopicIndex: 0,
	}
	if err := session.AppendMessage(openingMsg); err != nil {
		logger.Error("Failed to append message", zap.Error(err))
		apierror.UpdateError.Send(c)
		return
	}
	if err := database.Db.Save(&session).Error; err != nil {
		logger.Error("Failed to save session", zap.Error(err))
		apierror.UpdateError.Send(c)
		return
	}

	c.JSON(http.StatusCreated, gin.H{"session": session.ToResponse()})
}

// SendMessage adds a candidate message to the session
// POST /api/v1/work-sample-attempts/:id/interview/message
func (h *InterviewSessionHandler) SendMessage(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		apierror.NotAuthenticated.Send(c)
		return
	}

	attemptID := c.Param("id")

	var req SendMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apierror.InvalidData.Send(c)
		return
	}

	if strings.TrimSpace(req.Content) == "" {
		apierror.NoContent.Send(c)
		return
	}

	// Load attempt and verify ownership
	var attempt models.WorkSampleAttempt
	if err := database.Db.First(&attempt, "id = ?", attemptID).Error; err != nil {
		apierror.AttemptNotFound.Send(c)
		return
	}
	if attempt.CandidateID != user.ID {
		apierror.AccessDenied.Send(c)
		return
	}

	// Load session
	var session models.InterviewSession
	if err := database.Db.Where("attempt_id = ?", attemptID).First(&session).Error; err != nil {
		apierror.InterviewSessionNotFound.Send(c)
		return
	}

	// Check session status
	if session.Status != models.SessionInProgress {
		if session.Status == models.SessionCompleted || session.Status == models.SessionTimedOut {
			apierror.InterviewAlreadyCompleted.Send(c)
		} else {
			apierror.InterviewNotStarted.Send(c)
		}
		return
	}

	// Check for timeout
	if session.IsTimedOut() {
		session.Status = models.SessionTimedOut
		now := time.Now()
		session.EndedAt = &now
		database.Db.Save(&session)
		apierror.InterviewTimedOut.Send(c)
		return
	}

	// Record timing metadata
	if timingMessages, mErr := session.GetMessages(); mErr == nil && len(timingMessages) > 0 {
		lastMsg := timingMessages[len(timingMessages)-1]
		responseTimeMs := time.Since(lastMsg.Timestamp).Milliseconds()
		if tErr := session.AddTimingEntry(models.TimingEntry{
			MessageIndex:   len(timingMessages),
			ResponseTimeMs: responseTimeMs,
			MessageLength:  len(req.Content),
		}); tErr != nil {
			logger.Error("Failed to add timing entry", zap.Error(tErr))
		}
	}

	// Append user message
	userMsg := models.InterviewMessage{
		Role:       "user",
		Content:    strings.TrimSpace(req.Content),
		Timestamp:  time.Now(),
		TopicIndex: session.CurrentTopicIndex,
	}
	if err := session.AppendMessage(userMsg); err != nil {
		apierror.UpdateError.Send(c)
		return
	}

	if err := database.Db.Save(&session).Error; err != nil {
		apierror.UpdateError.Send(c)
		return
	}

	// Signal the SSE stream to process the AI response
	h.hub.Signal(attemptID)

	c.JSON(http.StatusAccepted, gin.H{"status": "accepted"})
}

// Stream handles the SSE connection for streaming AI responses
// GET /api/v1/work-sample-attempts/:id/interview/stream
func (h *InterviewSessionHandler) Stream(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		apierror.NotAuthenticated.Send(c)
		return
	}

	attemptID := c.Param("id")

	// Verify ownership
	var attempt models.WorkSampleAttempt
	if err := database.Db.First(&attempt, "id = ?", attemptID).Error; err != nil {
		apierror.AttemptNotFound.Send(c)
		return
	}
	if attempt.CandidateID != user.ID {
		apierror.AccessDenied.Send(c)
		return
	}

	// Set SSE headers
	c.Writer.Header().Set("Content-Type", "text/event-stream")
	c.Writer.Header().Set("Cache-Control", "no-cache")
	c.Writer.Header().Set("Connection", "keep-alive")
	c.Writer.Header().Set("X-Accel-Buffering", "no")

	// Subscribe to signals for this attempt
	signalCh := h.hub.Subscribe(attemptID)
	defer h.hub.Unsubscribe(attemptID)

	ctx := c.Request.Context()
	heartbeat := time.NewTicker(15 * time.Second)
	defer heartbeat.Stop()

	// Send initial connected event
	h.sseEvent(c.Writer, "connected", `{"status":"connected"}`)
	c.Writer.Flush()

	for {
		select {
		case <-ctx.Done():
			// Client disconnected
			return

		case <-heartbeat.C:
			h.sseEvent(c.Writer, "heartbeat", `{}`)
			c.Writer.Flush()

		case _, ok := <-signalCh:
			if !ok {
				// Channel closed
				return
			}

			// Process the AI response
			h.processAIResponse(c, attemptID)
		}
	}
}

// processAIResponse loads the session, builds context, streams AI response via SSE
func (h *InterviewSessionHandler) processAIResponse(c *gin.Context, attemptID string) {
	// Load session
	var session models.InterviewSession
	if err := database.Db.Where("attempt_id = ?", attemptID).First(&session).Error; err != nil {
		h.sseEvent(c.Writer, "error", `{"error":"session not found"}`)
		c.Writer.Flush()
		return
	}

	// Load attempt early (needed for both timeout finalization and normal flow)
	var attempt models.WorkSampleAttempt
	if err := database.Db.First(&attempt, "id = ?", attemptID).Error; err != nil {
		return
	}

	// Check timeout
	if session.IsTimedOut() {
		session.Status = models.SessionTimedOut
		now := time.Now()
		session.EndedAt = &now
		database.Db.Save(&session)

		// Finalize: convert transcript to answers and queue evaluation
		cfg, err := models.ResolveEvalConfig(database.Db, &attempt)
		if err == nil {
			cm := ai.NewConversationManager(&session, cfg.Sections, cfg.Criteria, cfg.Title, cfg.Seniority)
			if err := h.finalizeInterview(&session, &attempt, cm); err != nil {
				logger.Error("Failed to finalize timed-out interview", zap.Error(err))
			}
		}

		h.sseEvent(c.Writer, "timeout", `{}`)
		c.Writer.Flush()
		return
	}

	cfg, err := models.ResolveEvalConfig(database.Db, &attempt)
	if err != nil {
		logger.Error("Failed to resolve eval config for AI response", zap.Error(err))
		return
	}

	// Build conversation manager
	cm := ai.NewConversationManager(
		&session,
		cfg.Sections,
		cfg.Criteria,
		cfg.Title,
		cfg.Seniority,
	)

	systemPrompt := cm.BuildSystemPrompt()
	messages := cm.BuildMessages()

	// Stream the AI response
	streamCtx, cancel := context.WithTimeout(c.Request.Context(), 120*time.Second)
	defer cancel()

	chunks, err := h.aiClient.StreamConversation(streamCtx, systemPrompt, messages, 2048)
	if err != nil {
		logger.Error("Failed to start AI stream", zap.Error(err))
		h.sseEvent(c.Writer, "error", `{"error":"AI streaming failed"}`)
		c.Writer.Flush()
		return
	}

	var fullResponse strings.Builder

	for chunk := range chunks {
		if chunk.Error != nil {
			logger.Error("AI stream chunk error", zap.Error(chunk.Error))
			h.sseEvent(c.Writer, "error", `{"error":"AI streaming error"}`)
			c.Writer.Flush()
			break
		}

		if chunk.Done {
			break
		}

		if chunk.Text != "" {
			fullResponse.WriteString(chunk.Text)
			if data, jErr := json.Marshal(map[string]string{"text": chunk.Text}); jErr == nil {
				h.sseEvent(c.Writer, "chunk", string(data))
				c.Writer.Flush()
			}
		}
	}

	// Process the full response for control tags
	raw := fullResponse.String()
	display, topicChanged, newTopicIndex, interviewComplete := ai.ProcessAIResponse(raw)

	// Store the AI message
	aiMsg := models.InterviewMessage{
		Role:       "assistant",
		Content:    display,
		Timestamp:  time.Now(),
		TopicIndex: session.CurrentTopicIndex,
	}
	if err := session.AppendMessage(aiMsg); err != nil {
		logger.Error("Failed to append AI message", zap.Error(err))
	}

	// Handle topic change
	if topicChanged {
		if tcErr := session.AddTopicCompleted(session.CurrentTopicIndex); tcErr != nil {
			logger.Error("Failed to add topic completed", zap.Error(tcErr))
		}
		session.CurrentTopicIndex = newTopicIndex
	}

	// Save session
	if err := database.Db.Save(&session).Error; err != nil {
		logger.Error("Failed to save session after AI response", zap.Error(err))
	}

	// Send done event
	if doneData, jErr := json.Marshal(map[string]interface{}{
		"topic_index":        session.CurrentTopicIndex,
		"interview_complete": interviewComplete,
	}); jErr == nil {
		h.sseEvent(c.Writer, "done", string(doneData))
		c.Writer.Flush()
	}

	// If interview is complete, auto-end it
	if interviewComplete {
		if fErr := h.finalizeInterview(&session, &attempt, cm); fErr != nil {
			logger.Error("Failed to finalize interview", zap.Error(fErr))
		}
		h.sseEvent(c.Writer, "complete", `{}`)
		c.Writer.Flush()
	}
}

// EndInterview manually ends the interview, converts transcript and queues evaluation
// POST /api/v1/work-sample-attempts/:id/interview/end
func (h *InterviewSessionHandler) EndInterview(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		apierror.NotAuthenticated.Send(c)
		return
	}

	attemptID := c.Param("id")

	var attempt models.WorkSampleAttempt
	if err := database.Db.First(&attempt, "id = ?", attemptID).Error; err != nil {
		apierror.AttemptNotFound.Send(c)
		return
	}
	if attempt.CandidateID != user.ID {
		apierror.AccessDenied.Send(c)
		return
	}

	var session models.InterviewSession
	if err := database.Db.Where("attempt_id = ?", attemptID).First(&session).Error; err != nil {
		apierror.InterviewSessionNotFound.Send(c)
		return
	}

	if session.Status == models.SessionCompleted || session.Status == models.SessionTimedOut {
		apierror.InterviewAlreadyCompleted.Send(c)
		return
	}

	if session.Status == models.SessionNotStarted {
		apierror.InterviewNotStarted.Send(c)
		return
	}

	// Load evaluation config (supports both template and job-based evaluations)
	cfg, err := models.ResolveEvalConfig(database.Db, &attempt)
	if err != nil {
		apierror.FetchError.Send(c)
		return
	}

	cm := ai.NewConversationManager(
		&session,
		cfg.Sections,
		cfg.Criteria,
		cfg.Title,
		cfg.Seniority,
	)

	if err := h.finalizeInterview(&session, &attempt, cm); err != nil {
		logger.Error("Failed to finalize interview", zap.Error(err))
		apierror.UpdateError.Send(c)
		return
	}

	c.JSON(http.StatusOK, gin.H{"session": session.ToResponse()})
}

// GetSession returns the full interview session state (for reconnection)
// GET /api/v1/work-sample-attempts/:id/interview/session
func (h *InterviewSessionHandler) GetSession(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		apierror.NotAuthenticated.Send(c)
		return
	}

	attemptID := c.Param("id")

	var attempt models.WorkSampleAttempt
	if err := database.Db.First(&attempt, "id = ?", attemptID).Error; err != nil {
		apierror.AttemptNotFound.Send(c)
		return
	}
	if attempt.CandidateID != user.ID {
		apierror.AccessDenied.Send(c)
		return
	}

	var session models.InterviewSession
	if err := database.Db.Where("attempt_id = ?", attemptID).First(&session).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			apierror.InterviewSessionNotFound.Send(c)
			return
		}
		apierror.FetchError.Send(c)
		return
	}

	c.JSON(http.StatusOK, gin.H{"session": session.ToResponse()})
}

// finalizeInterview converts the conversation transcript to answers and queues evaluation
func (h *InterviewSessionHandler) finalizeInterview(
	session *models.InterviewSession,
	attempt *models.WorkSampleAttempt,
	cm *ai.ConversationManager,
) error {
	// Mark session as completed
	now := time.Now()
	session.Status = models.SessionCompleted
	session.EndedAt = &now

	if err := database.Db.Save(session).Error; err != nil {
		return fmt.Errorf("failed to save session: %w", err)
	}

	// Convert transcript to answers format
	answers := cm.ConvertToAnswers()
	answersJSON, err := json.Marshal(answers)
	if err != nil {
		return fmt.Errorf("failed to marshal answers: %w", err)
	}

	// Update attempt
	attempt.Answers = answersJSON
	attempt.Status = models.AttemptStatusSubmitted
	attempt.SubmittedAt = &now
	attempt.Progress = 100

	if err := database.Db.Save(attempt).Error; err != nil {
		return fmt.Errorf("failed to save attempt: %w", err)
	}

	// Queue evaluation
	if err := queue.QueueEvaluateWorkSample(attempt.ID); err != nil {
		logger.Error("Failed to queue evaluation after interview",
			zap.String("attempt_id", attempt.ID),
			zap.Error(err),
		)
		// Don't fail — evaluation can be retried manually
	}

	return nil
}

// sseEvent writes a Server-Sent Event
func (h *InterviewSessionHandler) sseEvent(w io.Writer, event, data string) {
	fmt.Fprintf(w, "event: %s\ndata: %s\n\n", event, data)
}
