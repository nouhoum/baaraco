package handlers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/baaraco/baara/apps/api/internal/middleware"
	"github.com/baaraco/baara/apps/api/internal/services"
	"github.com/baaraco/baara/pkg/apierror"
	"github.com/baaraco/baara/pkg/logger"
	"github.com/baaraco/baara/pkg/models"
	"github.com/baaraco/baara/pkg/queue"
)

type WorkSampleAttemptHandler struct {
	service *services.WorkSampleAttemptService
}

func NewWorkSampleAttemptHandler(service *services.WorkSampleAttemptService) *WorkSampleAttemptHandler {
	return &WorkSampleAttemptHandler{service: service}
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

	meta, err := h.service.GetMyAttempt(user.ID)
	if err != nil {
		if errors.Is(err, services.ErrAttemptNotFound) {
			apierror.AttemptNotFound.Send(c)
			return
		}
		apierror.FetchError.Send(c)
		return
	}

	var formatRequest *models.FormatRequestResponse
	if meta.FormatRequest != nil {
		formatRequest = meta.FormatRequest.ToResponse()
	}

	c.JSON(http.StatusOK, gin.H{
		"attempt":        meta.Attempt.ToResponse(),
		"format_request": formatRequest,
		"work_sample":    meta.WorkSample,
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

	meta, err := h.service.GetAttempt(attemptID, user)
	if err != nil {
		if errors.Is(err, services.ErrAttemptNotFound) {
			apierror.AttemptNotFound.Send(c)
			return
		}
		if errors.Is(err, services.ErrNotOwner) {
			apierror.AccessDenied.Send(c)
			return
		}
		apierror.FetchError.Send(c)
		return
	}

	var formatRequest *models.FormatRequestResponse
	if meta.FormatRequest != nil {
		formatRequest = meta.FormatRequest.ToResponse()
	}

	c.JSON(http.StatusOK, gin.H{
		"attempt":        meta.Attempt.ToResponse(),
		"format_request": formatRequest,
		"work_sample":    meta.WorkSample,
	})
}

// GetMyAttempts returns all work sample attempts for the current candidate
// GET /api/v1/work-sample-attempts/mine
func (h *WorkSampleAttemptHandler) GetMyAttempts(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		apierror.NotAuthenticated.Send(c)
		return
	}

	if user.Role != models.RoleCandidate {
		apierror.RoleRequired.Send(c)
		return
	}

	metas, err := h.service.GetMyAttempts(user.ID)
	if err != nil {
		apierror.FetchError.Send(c)
		return
	}

	type attemptWithMeta struct {
		Attempt       *models.WorkSampleAttemptResponse `json:"attempt"`
		RoleType      string                            `json:"role_type"`
		JobTitle      string                            `json:"job_title,omitempty"`
		WorkSample    *models.JobWorkSampleResponse     `json:"work_sample,omitempty"`
		FormatRequest *models.FormatRequestResponse     `json:"format_request,omitempty"`
	}

	results := make([]attemptWithMeta, 0, len(metas))
	for _, m := range metas {
		var fmtReq *models.FormatRequestResponse
		if m.FormatRequest != nil {
			fmtReq = m.FormatRequest.ToResponse()
		}

		results = append(results, attemptWithMeta{
			Attempt:       m.Attempt.ToResponse(),
			RoleType:      m.RoleType,
			JobTitle:      m.JobTitle,
			WorkSample:    m.WorkSample,
			FormatRequest: fmtReq,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"attempts": results,
		"total":    len(results),
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

	attempt, err := h.service.SaveAttempt(attemptID, user.ID, req.Answers, req.Progress)
	if err != nil {
		if errors.Is(err, services.ErrAttemptNotFound) {
			apierror.AttemptNotFound.Send(c)
			return
		}
		if errors.Is(err, services.ErrNotOwner) {
			apierror.AccessDenied.Send(c)
			return
		}
		if errors.Is(err, services.ErrNotEditable) {
			apierror.NotEditable.Send(c)
			return
		}
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

	attempt, err := h.service.SubmitAttempt(attemptID, user)
	if err != nil {
		if errors.Is(err, services.ErrAttemptNotFound) {
			apierror.AttemptNotFound.Send(c)
			return
		}
		if errors.Is(err, services.ErrNotOwner) {
			apierror.AccessDenied.Send(c)
			return
		}
		if errors.Is(err, services.ErrAlreadySubmitted) {
			apierror.AlreadySubmitted.Send(c)
			return
		}
		if errors.Is(err, services.ErrNotEditable) {
			apierror.NotEditable.Send(c)
			return
		}
		if errors.Is(err, services.ErrNoContent) {
			apierror.NoContent.Send(c)
			return
		}
		apierror.UpdateError.Send(c)
		return
	}

	// Send confirmation email to candidate
	locale := "fr"
	if user.Locale != "" {
		locale = user.Locale
	}
	if err := queue.QueueEmail(map[string]string{
		"type":   "submission_confirmation",
		"to":     user.Email,
		"name":   user.Name,
		"locale": locale,
	}); err != nil {
		logger.Error("Failed to queue submission confirmation email",
			zap.String("attempt_id", attempt.ID),
			zap.Error(err),
		)
	}

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

	formatRequest, err := h.service.RequestAlternativeFormat(
		attemptID,
		user.ID,
		string(req.Reason),
		string(req.PreferredFormat),
		req.Comment,
	)
	if err != nil {
		if errors.Is(err, services.ErrAttemptNotFound) {
			apierror.AttemptNotFound.Send(c)
			return
		}
		if errors.Is(err, services.ErrNotOwner) {
			apierror.AccessDenied.Send(c)
			return
		}
		if errors.Is(err, services.ErrDuplicateRequest) {
			apierror.DuplicateRequest.Send(c)
			return
		}
		apierror.CreateError.Send(c)
		return
	}

	// Send notification to team about format request
	if err := queue.QueueEmail(map[string]string{
		"type":             "format_request_notification",
		"candidate_name":   user.Name,
		"candidate_email":  user.Email,
		"reason":           string(req.Reason),
		"preferred_format": string(req.PreferredFormat),
		"comment":          req.Comment,
	}); err != nil {
		logger.Error("Failed to queue format request notification",
			zap.String("attempt_id", attemptID),
			zap.Error(err),
		)
	}

	c.JSON(http.StatusOK, gin.H{
		"format_request": formatRequest.ToResponse(),
		"message":        "We have received your request. We will get back to you within 48 hours.",
	})
}
