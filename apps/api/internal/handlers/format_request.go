package handlers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/baaraco/baara/apps/api/internal/middleware"
	"github.com/baaraco/baara/apps/api/internal/services"
	"github.com/baaraco/baara/pkg/apierror"
	"github.com/baaraco/baara/pkg/models"
)

type FormatRequestHandler struct {
	service *services.FormatRequestService
}

func NewFormatRequestHandler(service *services.FormatRequestService) *FormatRequestHandler {
	return &FormatRequestHandler{
		service: service,
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

	status := c.Query("status")

	requests, err := h.service.List(status)
	if err != nil {
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

	request, err := h.service.Get(requestID, user)
	if err != nil {
		if errors.Is(err, services.ErrFormatRequestNotFound) {
			apierror.FormatRequestNotFound.Send(c)
			return
		}
		apierror.FetchError.Send(c)
		return
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

	request, err := h.service.Respond(requestID, user.ID, payload.Status, payload.ResponseMessage)
	if err != nil {
		if errors.Is(err, services.ErrFormatRequestNotFound) {
			apierror.FormatRequestNotFound.Send(c)
			return
		}
		if errors.Is(err, services.ErrAlreadyProcessed) {
			apierror.AlreadyProcessed.Send(c)
			return
		}
		apierror.UpdateError.Send(c)
		return
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

	count, err := h.service.GetPendingCount()
	if err != nil {
		apierror.FetchError.Send(c)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"pending_count": count,
	})
}
