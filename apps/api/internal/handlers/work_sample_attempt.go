package handlers

import (
	"net/http"
	"time"

	"github.com/baaraco/baara/apps/api/internal/middleware"
	"github.com/baaraco/baara/pkg/database"
	"github.com/baaraco/baara/pkg/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
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
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	// Only candidates can have attempts
	if user.Role != models.RoleCandidate {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only candidates can access work sample attempts"})
		return
	}

	var attempt models.WorkSampleAttempt
	err := database.Db.Where("candidate_id = ?", user.ID).First(&attempt).Error

	if err == gorm.ErrRecordNotFound {
		// Create a new attempt for the candidate
		attempt = models.WorkSampleAttempt{
			CandidateID: user.ID,
			Status:      models.AttemptStatusDraft,
			Progress:    0,
		}
		if err := attempt.SetAnswers(make(map[string]string)); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to initialize attempt"})
			return
		}
		if err := database.Db.Create(&attempt).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create attempt"})
			return
		}
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch attempt"})
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
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	attemptID := c.Param("id")

	var attempt models.WorkSampleAttempt
	if err := database.Db.First(&attempt, "id = ?", attemptID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Attempt not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch attempt"})
		return
	}

	// Check authorization: candidate can only see their own, recruiters/admins can see all
	if user.Role == models.RoleCandidate && attempt.CandidateID != user.ID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only view your own attempts"})
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
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	if user.Role != models.RoleCandidate {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only candidates can save attempts"})
		return
	}

	attemptID := c.Param("id")

	var attempt models.WorkSampleAttempt
	if err := database.Db.First(&attempt, "id = ?", attemptID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Attempt not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch attempt"})
		return
	}

	// Check ownership
	if attempt.CandidateID != user.ID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only edit your own attempts"})
		return
	}

	// Check if editable
	if !attempt.IsEditable() {
		c.JSON(http.StatusBadRequest, gin.H{"error": "This attempt has been submitted and cannot be edited"})
		return
	}

	var req SaveAttemptRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate progress
	if req.Progress < 0 || req.Progress > 100 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Progress must be between 0 and 100"})
		return
	}

	// Update answers
	if err := attempt.SetAnswers(req.Answers); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to set answers"})
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save attempt"})
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
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	if user.Role != models.RoleCandidate {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only candidates can submit attempts"})
		return
	}

	attemptID := c.Param("id")

	var attempt models.WorkSampleAttempt
	if err := database.Db.First(&attempt, "id = ?", attemptID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Attempt not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch attempt"})
		return
	}

	// Check ownership
	if attempt.CandidateID != user.ID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only submit your own attempts"})
		return
	}

	// Check if editable
	if !attempt.IsEditable() {
		c.JSON(http.StatusBadRequest, gin.H{"error": "This attempt has already been submitted"})
		return
	}

	// Validate that there's at least some content
	answers, err := attempt.GetAnswers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read answers"})
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
		c.JSON(http.StatusBadRequest, gin.H{"error": "Please provide at least one answer before submitting"})
		return
	}

	// Submit the attempt
	now := time.Now()
	attempt.Status = models.AttemptStatusSubmitted
	attempt.SubmittedAt = &now
	attempt.LastSavedAt = &now
	attempt.Progress = 100

	if err := database.Db.Save(&attempt).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to submit attempt"})
		return
	}

	// TODO: Trigger proof profile generation
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
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	if user.Role != models.RoleCandidate {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only candidates can request alternative formats"})
		return
	}

	attemptID := c.Param("id")

	var attempt models.WorkSampleAttempt
	if err := database.Db.First(&attempt, "id = ?", attemptID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Attempt not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch attempt"})
		return
	}

	// Check ownership
	if attempt.CandidateID != user.ID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only request format changes for your own attempts"})
		return
	}

	// Check if there's already a pending request
	var existingRequest models.FormatRequest
	err := database.Db.Where("attempt_id = ? AND status = ?", attemptID, models.FormatRequestStatusPending).First(&existingRequest).Error
	if err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "You already have a pending format request"})
		return
	} else if err != gorm.ErrRecordNotFound {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check existing requests"})
		return
	}

	var req FormatRequestRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
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
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid reason"})
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
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid preferred format"})
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create format request"})
		return
	}

	// TODO: Send notification to team about format request

	c.JSON(http.StatusOK, gin.H{
		"format_request": formatRequest.ToResponse(),
		"message":        "Nous avons reçu votre demande. Nous reviendrons vers vous sous 48h.",
	})
}
