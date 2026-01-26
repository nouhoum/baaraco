package handlers

import (
	"net/http"
	"time"

	"github.com/baaraco/baara/apps/api/internal/middleware"
	"github.com/baaraco/baara/pkg/auth"
	"github.com/baaraco/baara/pkg/database"
	"github.com/baaraco/baara/pkg/logger"
	"github.com/baaraco/baara/pkg/mailer"
	"github.com/baaraco/baara/pkg/models"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"gorm.io/gorm"
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
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	// Only recruiters and admins can list format requests
	if user.Role != models.RoleRecruiter && user.Role != models.RoleAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch format requests"})
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
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	requestID := c.Param("id")

	var request models.FormatRequest
	err := database.Db.Preload("Candidate").Preload("Reviewer").Preload("Attempt").
		First(&request, "id = ?", requestID).Error

	if err == gorm.ErrRecordNotFound {
		c.JSON(http.StatusNotFound, gin.H{"error": "Format request not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch format request"})
		return
	}

	// Candidates can only see their own requests
	if user.Role == models.RoleCandidate {
		if request.CandidateID == nil || *request.CandidateID != user.ID {
			c.JSON(http.StatusForbidden, gin.H{"error": "You can only view your own format requests"})
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
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	// Only recruiters and admins can respond
	if user.Role != models.RoleRecruiter && user.Role != models.RoleAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only recruiters and admins can respond to format requests"})
		return
	}

	requestID := c.Param("id")

	var request models.FormatRequest
	err := database.Db.Preload("Candidate").First(&request, "id = ?", requestID).Error

	if err == gorm.ErrRecordNotFound {
		c.JSON(http.StatusNotFound, gin.H{"error": "Format request not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch format request"})
		return
	}

	// Check if already responded
	if request.Status != models.FormatRequestStatusPending {
		c.JSON(http.StatusBadRequest, gin.H{"error": "This request has already been processed"})
		return
	}

	var payload RespondToRequestPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate status
	if payload.Status != models.FormatRequestStatusApproved && payload.Status != models.FormatRequestStatusDenied {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Status must be 'approved' or 'denied'"})
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update format request"})
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
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	// Only recruiters and admins can access this
	if user.Role != models.RoleRecruiter && user.Role != models.RoleAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	var count int64
	if err := database.Db.Model(&models.FormatRequest{}).
		Where("status = ?", models.FormatRequestStatusPending).
		Count(&count).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count pending requests"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"pending_count": count,
	})
}
