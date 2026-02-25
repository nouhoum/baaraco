package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/baaraco/baara/apps/api/internal/repositories"
	"github.com/baaraco/baara/pkg/logger"
	"github.com/baaraco/baara/pkg/models"
	"github.com/baaraco/baara/pkg/queue"
)

// Interview session errors
var (
	ErrInterviewSessionNotFound  = errors.New("interview session not found")
	ErrInterviewNotStarted       = errors.New("interview not started")
	ErrInterviewAlreadyCompleted = errors.New("interview already completed")
	ErrInterviewTimedOut         = errors.New("interview timed out")
	ErrAttemptNotOwned           = errors.New("attempt does not belong to user")
)

// InterviewSessionService handles interview session business logic
type InterviewSessionService struct {
	evalConfigRepo *repositories.EvalConfigRepository
	sessionRepo    *repositories.InterviewSessionRepository
	attemptRepo    *repositories.AttemptRepository
}

// NewInterviewSessionService creates a new interview session service
func NewInterviewSessionService(
	evalConfigRepo *repositories.EvalConfigRepository,
	sessionRepo *repositories.InterviewSessionRepository,
	attemptRepo *repositories.AttemptRepository,
) *InterviewSessionService {
	return &InterviewSessionService{
		evalConfigRepo: evalConfigRepo,
		sessionRepo:    sessionRepo,
		attemptRepo:    attemptRepo,
	}
}

// GetSession returns an interview session by attempt ID with ownership check
func (s *InterviewSessionService) GetSession(attemptID string, userID string) (*models.InterviewSession, error) {
	// Verify attempt ownership
	attempt, err := s.attemptRepo.FindByID(attemptID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAttemptNotFound
		}
		return nil, err
	}

	if attempt.CandidateID != userID {
		return nil, ErrAttemptNotOwned
	}

	session, err := s.sessionRepo.FindByAttemptID(attemptID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrInterviewSessionNotFound
		}
		return nil, err
	}

	return session, nil
}

// StartInterview creates a new interview session if none exists, or returns existing one
func (s *InterviewSessionService) StartInterview(attemptID string, user *models.User) (*models.InterviewSession, error) {
	// Verify attempt ownership
	attempt, err := s.attemptRepo.FindByID(attemptID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAttemptNotFound
		}
		return nil, err
	}

	if attempt.CandidateID != user.ID {
		return nil, ErrAttemptNotOwned
	}

	// Check if session already exists
	existingSession, err := s.sessionRepo.FindByAttemptID(attemptID)
	if err == nil {
		// Session exists - check if it can be continued
		if existingSession.Status == models.SessionCompleted {
			return nil, ErrInterviewAlreadyCompleted
		}

		if existingSession.Status == models.SessionTimedOut || existingSession.IsTimedOut() {
			// Mark as timed out if not already
			if existingSession.Status != models.SessionTimedOut {
				existingSession.Status = models.SessionTimedOut
				now := time.Now()
				existingSession.EndedAt = &now
				if updateErr := s.sessionRepo.Update(existingSession); updateErr != nil {
					logger.Error("Failed to update timed out session", zap.Error(updateErr))
				}
			}
			return nil, ErrInterviewTimedOut
		}

		// Return existing session for continuation
		return existingSession, nil
	}

	// Create new session
	now := time.Now()
	session := &models.InterviewSession{
		AttemptID:          attemptID,
		Status:             models.SessionInProgress,
		StartedAt:          &now,
		CurrentTopicIndex:  0,
		MaxDurationMinutes: 45, // Default 45 minutes
	}

	if err := s.sessionRepo.Create(session); err != nil {
		logger.Error("Failed to create interview session",
			zap.Error(err),
			zap.String("attempt_id", attemptID),
		)
		return nil, err
	}

	// Update attempt status to interviewing
	attempt.Status = models.AttemptStatusInterviewing
	if updateErr := s.attemptRepo.Update(attempt); updateErr != nil {
		logger.Error("Failed to update attempt status",
			zap.Error(updateErr),
			zap.String("attempt_id", attemptID),
		)
	}

	logger.Info("Interview session started",
		zap.String("session_id", session.ID),
		zap.String("attempt_id", attemptID),
		zap.String("user_id", user.ID),
	)

	return session, nil
}

// SaveMessage adds a message to the interview session
func (s *InterviewSessionService) SaveMessage(attemptID string, userID string, msg models.InterviewMessage) error {
	// Verify attempt ownership
	attempt, err := s.attemptRepo.FindByID(attemptID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrAttemptNotFound
		}
		return err
	}

	if attempt.CandidateID != userID {
		return ErrAttemptNotOwned
	}

	session, err := s.sessionRepo.FindByAttemptID(attemptID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrInterviewNotStarted
		}
		return err
	}

	// Check if session is still active
	if session.Status == models.SessionCompleted {
		return ErrInterviewAlreadyCompleted
	}

	if session.Status == models.SessionTimedOut || session.IsTimedOut() {
		return ErrInterviewTimedOut
	}

	// Set timestamp if not provided
	if msg.Timestamp.IsZero() {
		msg.Timestamp = time.Now()
	}

	// Append message to session
	if err := session.AppendMessage(msg); err != nil {
		logger.Error("Failed to append message",
			zap.Error(err),
			zap.String("session_id", session.ID),
		)
		return err
	}

	// Update session
	if err := s.sessionRepo.Update(session); err != nil {
		logger.Error("Failed to save session with message",
			zap.Error(err),
			zap.String("session_id", session.ID),
		)
		return err
	}

	return nil
}

// EndInterview marks the interview session as completed
func (s *InterviewSessionService) EndInterview(attemptID string, userID string) (*models.InterviewSession, error) {
	// Verify attempt ownership
	attempt, err := s.attemptRepo.FindByID(attemptID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAttemptNotFound
		}
		return nil, err
	}

	if attempt.CandidateID != userID {
		return nil, ErrAttemptNotOwned
	}

	session, err := s.sessionRepo.FindByAttemptID(attemptID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrInterviewNotStarted
		}
		return nil, err
	}

	// Check if already completed
	if session.Status == models.SessionCompleted {
		return session, nil
	}

	// Mark as completed
	now := time.Now()
	session.Status = models.SessionCompleted
	session.EndedAt = &now

	if err := s.sessionRepo.Update(session); err != nil {
		logger.Error("Failed to end interview session",
			zap.Error(err),
			zap.String("session_id", session.ID),
		)
		return nil, err
	}

	// Update attempt status to submitted
	attempt.Status = models.AttemptStatusSubmitted
	attempt.SubmittedAt = &now
	if updateErr := s.attemptRepo.Update(attempt); updateErr != nil {
		logger.Error("Failed to update attempt status after interview",
			zap.Error(updateErr),
			zap.String("attempt_id", attemptID),
		)
	}

	logger.Info("Interview session ended",
		zap.String("session_id", session.ID),
		zap.String("attempt_id", attemptID),
		zap.String("user_id", userID),
	)

	return session, nil
}

// CheckTimeout checks if the session has timed out and updates status if needed
func (s *InterviewSessionService) CheckTimeout(session *models.InterviewSession) bool {
	if session.Status == models.SessionTimedOut {
		return true
	}

	if session.IsTimedOut() {
		// Update status to timed out
		session.Status = models.SessionTimedOut
		now := time.Now()
		session.EndedAt = &now

		if err := s.sessionRepo.Update(session); err != nil {
			logger.Error("Failed to update timed out session",
				zap.Error(err),
				zap.String("session_id", session.ID),
			)
		}

		return true
	}

	return false
}

// GetSessionByAttemptID returns a session by attempt ID without ownership verification.
// This is intended for internal use (e.g. SSE streaming) where authentication has
// already been performed at the connection level.
func (s *InterviewSessionService) GetSessionByAttemptID(attemptID string) (*models.InterviewSession, error) {
	session, err := s.sessionRepo.FindByAttemptID(attemptID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrInterviewSessionNotFound
		}
		return nil, err
	}
	return session, nil
}

// GetAttemptByID returns an attempt by ID without ownership verification.
// This is intended for internal use where authentication has already been performed.
func (s *InterviewSessionService) GetAttemptByID(attemptID string) (*models.WorkSampleAttempt, error) {
	attempt, err := s.attemptRepo.FindByID(attemptID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAttemptNotFound
		}
		return nil, err
	}
	return attempt, nil
}

// ResolveEvalConfig loads the evaluation configuration for an attempt.
func (s *InterviewSessionService) ResolveEvalConfig(attempt *models.WorkSampleAttempt) (*models.EvalConfig, error) {
	return s.evalConfigRepo.Resolve(attempt)
}

// UpdateSession persists changes to an interview session.
func (s *InterviewSessionService) UpdateSession(session *models.InterviewSession) error {
	return s.sessionRepo.Update(session)
}

// FinalizeInterview marks the session as completed, stores converted answers on the
// attempt, marks the attempt as submitted, and queues asynchronous evaluation.
func (s *InterviewSessionService) FinalizeInterview(
	session *models.InterviewSession,
	attempt *models.WorkSampleAttempt,
	answers json.RawMessage,
) error {
	// Mark session as completed
	now := time.Now()
	session.Status = models.SessionCompleted
	session.EndedAt = &now

	if err := s.sessionRepo.Update(session); err != nil {
		return fmt.Errorf("failed to save session: %w", err)
	}

	// Update attempt with answers and mark as submitted
	attempt.Answers = answers
	attempt.Status = models.AttemptStatusSubmitted
	attempt.SubmittedAt = &now
	attempt.Progress = 100

	if err := s.attemptRepo.Update(attempt); err != nil {
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
