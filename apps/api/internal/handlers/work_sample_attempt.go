package handlers

import (
	"errors"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/baaraco/baara/apps/api/internal/middleware"
	"github.com/baaraco/baara/pkg/apierror"
	"github.com/baaraco/baara/pkg/database"
	"github.com/baaraco/baara/pkg/logger"
	"github.com/baaraco/baara/pkg/models"
	"github.com/baaraco/baara/pkg/queue"
)

type WorkSampleAttemptHandler struct{}

func NewWorkSampleAttemptHandler() *WorkSampleAttemptHandler {
	return &WorkSampleAttemptHandler{}
}

// SaveAttemptRequest is the request body for saving an attempt
type SaveAttemptRequest struct {
	Answers  map[string]string `json:"answers" binding:"required"`
	Progress int               `json:"progress"`
}

// FormatRequestRequest is the request body for requesting an alternative format
type FormatRequestRequest struct {
	Reason          models.FormatRequestReason     `json:"reason" binding:"required"`
	PreferredFormat models.FormatRequestPreference `json:"preferred_format" binding:"required"`
	Comment         string                         `json:"comment"`
}

// GetMyAttempt returns the current candidate's work sample attempt
// GET /api/v1/work-sample-attempts/me
func (h *WorkSampleAttemptHandler) GetMyAttempt(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		apierror.NotAuthenticated.Send(c)
		return
	}

	// Only candidates can have attempts
	if user.Role != models.RoleCandidate {
		apierror.RoleRequired.Send(c)
		return
	}

	var attempt models.WorkSampleAttempt
	err := database.Db.Where("candidate_id = ?", user.ID).First(&attempt).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Create a new attempt for the candidate
			attempt = models.WorkSampleAttempt{
				CandidateID: user.ID,
				Status:      models.AttemptStatusDraft,
				Progress:    0,
			}
			if err := attempt.SetAnswers(make(map[string]string)); err != nil {
				apierror.CreateError.Send(c)
				return
			}
			if err := database.Db.Create(&attempt).Error; err != nil {
				apierror.CreateError.Send(c)
				return
			}
		}

		apierror.FetchError.Send(c)
		return
	}

	// Check for format request
	var formatRequest *models.FormatRequestResponse
	var fr models.FormatRequest
	if err := database.Db.Where("attempt_id = ?", attempt.ID).First(&fr).Error; err == nil {
		formatRequest = fr.ToResponse()
	}

	c.JSON(http.StatusOK, gin.H{
		"attempt":        attempt.ToResponse(),
		"format_request": formatRequest,
	})
}

// GetAttempt returns a specific work sample attempt
// GET /api/v1/work-sample-attempts/:id
func (h *WorkSampleAttemptHandler) GetAttempt(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		apierror.NotAuthenticated.Send(c)
		return
	}

	attemptID := c.Param("id")

	var attempt models.WorkSampleAttempt
	if err := database.Db.First(&attempt, "id = ?", attemptID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			apierror.AttemptNotFound.Send(c)
			return
		}
		apierror.FetchError.Send(c)
		return
	}

	// Check authorization: candidate can only see their own, recruiters/admins can see all
	if user.Role == models.RoleCandidate && attempt.CandidateID != user.ID {
		apierror.AccessDenied.Send(c)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"attempt": attempt.ToResponse(),
	})
}

// SaveAttempt saves the candidate's progress
// PATCH /api/v1/work-sample-attempts/:id
func (h *WorkSampleAttemptHandler) SaveAttempt(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		apierror.NotAuthenticated.Send(c)
		return
	}

	if user.Role != models.RoleCandidate {
		apierror.RoleRequired.Send(c)
		return
	}

	attemptID := c.Param("id")

	var attempt models.WorkSampleAttempt
	if err := database.Db.First(&attempt, "id = ?", attemptID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			apierror.AttemptNotFound.Send(c)
			return
		}
		apierror.FetchError.Send(c)
		return
	}

	// Check ownership
	if attempt.CandidateID != user.ID {
		apierror.AccessDenied.Send(c)
		return
	}

	// Check if editable
	if !attempt.IsEditable() {
		apierror.NotEditable.Send(c)
		return
	}

	var req SaveAttemptRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apierror.InvalidData.Send(c)
		return
	}

	// Validate progress
	if req.Progress < 0 || req.Progress > 100 {
		apierror.InvalidProgress.Send(c)
		return
	}

	// Update answers
	if err := attempt.SetAnswers(req.Answers); err != nil {
		apierror.UpdateError.Send(c)
		return
	}

	// Update status to in_progress if it was draft
	if attempt.Status == models.AttemptStatusDraft {
		attempt.Status = models.AttemptStatusInProgress
	}

	now := time.Now()
	attempt.Progress = req.Progress
	attempt.LastSavedAt = &now

	if err := database.Db.Save(&attempt).Error; err != nil {
		apierror.UpdateError.Send(c)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"attempt": attempt.ToResponse(),
		"message": "Draft saved",
	})
}

// SubmitAttempt submits the work sample for review
// POST /api/v1/work-sample-attempts/:id/submit
func (h *WorkSampleAttemptHandler) SubmitAttempt(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		apierror.NotAuthenticated.Send(c)
		return
	}

	if user.Role != models.RoleCandidate {
		apierror.RoleRequired.Send(c)
		return
	}

	attemptID := c.Param("id")

	var attempt models.WorkSampleAttempt
	if err := database.Db.First(&attempt, "id = ?", attemptID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			apierror.AttemptNotFound.Send(c)
			return
		}
		apierror.FetchError.Send(c)
		return
	}

	// Check ownership
	if attempt.CandidateID != user.ID {
		apierror.AccessDenied.Send(c)
		return
	}

	// Check if editable
	if !attempt.IsEditable() {
		apierror.AlreadySubmitted.Send(c)
		return
	}

	// Validate that there's at least some content
	answers, err := attempt.GetAnswers()
	if err != nil {
		apierror.FetchError.Send(c)
		return
	}

	hasContent := false
	for _, answer := range answers {
		if len(answer) > 0 {
			hasContent = true
			break
		}
	}

	if !hasContent {
		apierror.NoContent.Send(c)
		return
	}

	// Submit the attempt
	now := time.Now()
	attempt.Status = models.AttemptStatusSubmitted
	attempt.SubmittedAt = &now
	attempt.LastSavedAt = &now
	attempt.Progress = 100

	if err := database.Db.Save(&attempt).Error; err != nil {
		apierror.UpdateError.Send(c)
		return
	}

	// Trigger evaluation job
	if err := queue.QueueEvaluateWorkSample(attempt.ID); err != nil {
		logger.Error("Failed to queue evaluation job",
			zap.String("attempt_id", attempt.ID),
			zap.Error(err),
		)
		// Don't fail the submission - evaluation can be retried manually
	}

	// TODO: Send confirmation email to candidate

	c.JSON(http.StatusOK, gin.H{
		"attempt": attempt.ToResponse(),
		"message": "Work sample submitted successfully",
	})
}

// RequestAlternativeFormat creates a request for an alternative format
// POST /api/v1/work-sample-attempts/:id/format-request
func (h *WorkSampleAttemptHandler) RequestAlternativeFormat(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		apierror.NotAuthenticated.Send(c)
		return
	}

	if user.Role != models.RoleCandidate {
		apierror.RoleRequired.Send(c)
		return
	}

	attemptID := c.Param("id")

	var attempt models.WorkSampleAttempt
	if err := database.Db.First(&attempt, "id = ?", attemptID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			apierror.AttemptNotFound.Send(c)
			return
		}
		apierror.FetchError.Send(c)
		return
	}

	// Check ownership
	if attempt.CandidateID != user.ID {
		apierror.AccessDenied.Send(c)
		return
	}

	// Check if there's already a pending request
	var existingRequest models.FormatRequest
	err := database.Db.Where("attempt_id = ? AND status = ?", attemptID, models.FormatRequestStatusPending).First(&existingRequest).Error
	if err == nil {
		apierror.DuplicateRequest.Send(c)
		return
	} else if err != gorm.ErrRecordNotFound {
		apierror.FetchError.Send(c)
		return
	}

	var req FormatRequestRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apierror.InvalidData.Send(c)
		return
	}

	// Validate reason
	validReasons := map[models.FormatRequestReason]bool{
		models.FormatReasonOral:          true,
		models.FormatReasonMoreTime:      true,
		models.FormatReasonAccessibility: true,
		models.FormatReasonOther:         true,
	}
	if !validReasons[req.Reason] {
		apierror.InvalidReason.Send(c)
		return
	}

	// Validate preferred format
	validFormats := map[models.FormatRequestPreference]bool{
		models.FormatPreferenceVideoCall:  true,
		models.FormatPreferenceGoogleDocs: true,
		models.FormatPreferenceMultiStep:  true,
		models.FormatPreferenceOther:      true,
	}
	if !validFormats[req.PreferredFormat] {
		apierror.InvalidFormat.Send(c)
		return
	}

	// Create the format request with candidate_id for easier querying
	formatRequest := models.FormatRequest{
		AttemptID:       attemptID,
		CandidateID:     &user.ID,
		Reason:          req.Reason,
		PreferredFormat: req.PreferredFormat,
		Comment:         req.Comment,
		Status:          models.FormatRequestStatusPending,
	}

	if err := database.Db.Create(&formatRequest).Error; err != nil {
		apierror.CreateError.Send(c)
		return
	}

	// TODO: Send notification to team about format request

	c.JSON(http.StatusOK, gin.H{
		"format_request": formatRequest.ToResponse(),
		"message":        "We have received your request. We will get back to you within 48 hours.",
	})
}
