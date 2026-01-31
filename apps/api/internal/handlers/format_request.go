package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/baaraco/baara/apps/api/internal/middleware"
	"github.com/baaraco/baara/pkg/apierror"
	"github.com/baaraco/baara/pkg/auth"
	"github.com/baaraco/baara/pkg/database"
	"github.com/baaraco/baara/pkg/logger"
	"github.com/baaraco/baara/pkg/mailer"
	"github.com/baaraco/baara/pkg/models"
)

type FormatRequestHandler struct {
	emailService *auth.EmailService
}

func NewFormatRequestHandler(m mailer.Mailer) *FormatRequestHandler {
	return &FormatRequestHandler{
		emailService: auth.NewEmailService(m),
	}
}

// RespondToRequestPayload is the request body for responding to a format request
type RespondToRequestPayload struct {
	Status          models.FormatRequestStatus `json:"status" binding:"required"`
	ResponseMessage string                     `json:"response_message"`
}

// ListFormatRequests returns all format requests (for recruiters/admins)
// GET /api/v1/format-requests
func (h *FormatRequestHandler) ListFormatRequests(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		apierror.NotAuthenticated.Send(c)
		return
	}

	// Only recruiters and admins can list format requests
	if user.Role != models.RoleRecruiter && user.Role != models.RoleAdmin {
		apierror.AccessDenied.Send(c)
		return
	}

	// Query params
	status := c.Query("status")

	// Build query
	query := database.Db.Preload("Candidate").Preload("Attempt")

	// Filter by status if provided
	if status != "" {
		query = query.Where("status = ?", status)
	}

	// For recruiters, potentially filter by org (future enhancement)
	// For now, show all requests

	var requests []models.FormatRequest
	if err := query.Order("created_at DESC").Find(&requests).Error; err != nil {
		apierror.FetchError.Send(c)
		return
	}

	// Convert to response
	responses := make([]*models.FormatRequestDetailResponse, len(requests))
	for i, req := range requests {
		responses[i] = req.ToDetailResponse()
	}

	c.JSON(http.StatusOK, gin.H{
		"format_requests": responses,
		"total":           len(responses),
	})
}

// GetFormatRequest returns a specific format request
// GET /api/v1/format-requests/:id
func (h *FormatRequestHandler) GetFormatRequest(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		apierror.NotAuthenticated.Send(c)
		return
	}

	requestID := c.Param("id")

	var request models.FormatRequest
	err := database.Db.Preload("Candidate").Preload("Reviewer").Preload("Attempt").
		First(&request, "id = ?", requestID).Error

	if err == gorm.ErrRecordNotFound {
		apierror.FormatRequestNotFound.Send(c)
		return
	}
	if err != nil {
		apierror.FetchError.Send(c)
		return
	}

	// Candidates can only see their own requests
	if user.Role == models.RoleCandidate {
		if request.CandidateID == nil || *request.CandidateID != user.ID {
			apierror.AccessDenied.Send(c)
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"format_request": request.ToDetailResponse(),
	})
}

// RespondToFormatRequest handles a recruiter/admin response to a format request
// PATCH /api/v1/format-requests/:id
func (h *FormatRequestHandler) RespondToFormatRequest(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		apierror.NotAuthenticated.Send(c)
		return
	}

	// Only recruiters and admins can respond
	if user.Role != models.RoleRecruiter && user.Role != models.RoleAdmin {
		apierror.RoleRequired.Send(c)
		return
	}

	requestID := c.Param("id")

	var request models.FormatRequest
	err := database.Db.Preload("Candidate").First(&request, "id = ?", requestID).Error

	if err == gorm.ErrRecordNotFound {
		apierror.FormatRequestNotFound.Send(c)
		return
	}
	if err != nil {
		apierror.FetchError.Send(c)
		return
	}

	// Check if already responded
	if request.Status != models.FormatRequestStatusPending {
		apierror.AlreadyProcessed.Send(c)
		return
	}

	var payload RespondToRequestPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		apierror.InvalidData.Send(c)
		return
	}

	// Validate status
	if payload.Status != models.FormatRequestStatusApproved && payload.Status != models.FormatRequestStatusDenied {
		apierror.InvalidStatus.Send(c)
		return
	}

	// Update the request
	now := time.Now()
	updates := map[string]interface{}{
		"status":           payload.Status,
		"response_message": payload.ResponseMessage,
		"reviewed_by":      user.ID,
		"reviewed_at":      now,
	}

	if err := database.Db.Model(&request).Updates(updates).Error; err != nil {
		apierror.UpdateError.Send(c)
		return
	}

	// Reload with associations
	database.Db.Preload("Candidate").Preload("Reviewer").First(&request, "id = ?", requestID)

	// Send notification email to candidate
	if request.Candidate != nil {
		approved := payload.Status == models.FormatRequestStatusApproved
		locale := request.Candidate.Locale
		if locale == "" {
			locale = "fr"
		}

		go func() {
			if err := h.emailService.SendFormatRequestResponse(
				request.Candidate.Email,
				approved,
				payload.ResponseMessage,
				locale,
			); err != nil {
				logger.Error("Failed to send format request response email",
					zap.Error(err),
					zap.String("candidate_email", request.Candidate.Email),
					zap.String("request_id", request.ID),
				)
			} else {
				logger.Info("Format request response email sent",
					zap.String("candidate_email", request.Candidate.Email),
					zap.Bool("approved", approved),
				)
			}
		}()
	}

	c.JSON(http.StatusOK, gin.H{
		"format_request": request.ToDetailResponse(),
		"message":        "Response sent successfully",
	})
}

// GetPendingCount returns the count of pending format requests (for dashboard)
// GET /api/v1/format-requests/pending-count
func (h *FormatRequestHandler) GetPendingCount(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		apierror.NotAuthenticated.Send(c)
		return
	}

	// Only recruiters and admins can access this
	if user.Role != models.RoleRecruiter && user.Role != models.RoleAdmin {
		apierror.AccessDenied.Send(c)
		return
	}

	var count int64
	if err := database.Db.Model(&models.FormatRequest{}).
		Where("status = ?", models.FormatRequestStatusPending).
		Count(&count).Error; err != nil {
		apierror.FetchError.Send(c)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"pending_count": count,
	})
}
