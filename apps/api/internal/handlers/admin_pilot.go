package handlers

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/baaraco/baara/apps/api/internal/services"
	"github.com/baaraco/baara/pkg/apierror"
	"github.com/baaraco/baara/pkg/models"
)

type AdminPilotHandler struct {
	service *services.AdminPilotService
}

func NewAdminPilotHandler(service *services.AdminPilotService) *AdminPilotHandler {
	return &AdminPilotHandler{
		service: service,
	}
}

// =============================================================================
// Request/Response types
// =============================================================================

type PilotRequestListResponse struct {
	Requests []*models.PilotRequestListItem `json:"requests"`
	Total    int64                          `json:"total"`
	Page     int                            `json:"page"`
	PerPage  int                            `json:"per_page"`
	Stats    *PilotRequestStats             `json:"stats"`
}

type PilotRequestStats struct {
	New          int64 `json:"new"`
	Contacted    int64 `json:"contacted"`
	InDiscussion int64 `json:"in_discussion"`
	Converted    int64 `json:"converted"`
	Rejected     int64 `json:"rejected"`
	Total        int64 `json:"total"`
}

type UpdatePilotStatusRequest struct {
	AdminStatus models.AdminStatus `json:"admin_status" binding:"required"`
}

type AddNoteRequest struct {
	Content string `json:"content" binding:"required,min=1"`
}

type ConvertToPilotRequest struct {
	OrgName        string `json:"org_name"`
	SendInvitation bool   `json:"send_invitation"`
}

type ConvertResponse struct {
	UserID   string `json:"user_id"`
	OrgID    string `json:"org_id"`
	InviteID string `json:"invite_id,omitempty"`
	Message  string `json:"message"`
}

// =============================================================================
// GET /api/v1/admin/pilot-requests
// List all pilot requests with filters
// =============================================================================

func (h *AdminPilotHandler) ListPilotRequests(c *gin.Context) {
	// Parse query params
	statusFilter := c.Query("status")
	search := strings.TrimSpace(c.Query("search"))
	pageStr := c.DefaultQuery("page", "1")
	perPageStr := c.DefaultQuery("per_page", "20")

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}
	perPage, err := strconv.Atoi(perPageStr)
	if err != nil || perPage < 1 || perPage > 100 {
		perPage = 20
	}

	filters := services.AdminPilotFilters{
		Status:  statusFilter,
		Search:  search,
		Page:    page,
		PerPage: perPage,
	}

	requests, total, svcStats, err := h.service.List(filters)
	if err != nil {
		apierror.FetchError.Send(c)
		return
	}

	// Convert to list items
	items := make([]*models.PilotRequestListItem, len(requests))
	for i, req := range requests {
		items[i] = req.ToListItem()
	}

	// Map service stats to handler stats
	var stats *PilotRequestStats
	if svcStats != nil {
		stats = &PilotRequestStats{
			New:          svcStats.New,
			Contacted:    svcStats.Contacted,
			InDiscussion: svcStats.InDiscussion,
			Converted:    svcStats.Converted,
			Rejected:     svcStats.Rejected,
			Total:        svcStats.New + svcStats.Contacted + svcStats.InDiscussion + svcStats.Converted + svcStats.Rejected + svcStats.Archived,
		}
	}

	c.JSON(http.StatusOK, PilotRequestListResponse{
		Requests: items,
		Total:    total,
		Page:     page,
		PerPage:  perPage,
		Stats:    stats,
	})
}

// =============================================================================
// GET /api/v1/admin/pilot-requests/:id
// Get a single pilot request with full details
// =============================================================================

func (h *AdminPilotHandler) GetPilotRequest(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		apierror.MissingField.Send(c)
		return
	}

	request, err := h.service.Get(id)
	if err != nil {
		if errors.Is(err, services.ErrAdminPilotNotFound) {
			apierror.PilotRequestNotFound.Send(c)
			return
		}
		apierror.FetchError.Send(c)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"request": request.ToResponse(),
	})
}

// =============================================================================
// PATCH /api/v1/admin/pilot-requests/:id
// Update a pilot request (mainly status)
// =============================================================================

func (h *AdminPilotHandler) UpdatePilotRequest(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		apierror.MissingField.Send(c)
		return
	}

	var req UpdatePilotStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apierror.InvalidData.Send(c)
		return
	}

	request, err := h.service.UpdateStatus(id, req.AdminStatus)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrAdminPilotNotFound):
			apierror.PilotRequestNotFound.Send(c)
		case errors.Is(err, services.ErrAdminInvalidAdminStatus):
			apierror.InvalidStatus.Send(c)
		default:
			apierror.UpdateError.Send(c)
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"request": request.ToResponse(),
		"message": "Status updated",
	})
}

// =============================================================================
// POST /api/v1/admin/pilot-requests/:id/notes
// Add a note to a pilot request
// =============================================================================

func (h *AdminPilotHandler) AddNote(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		apierror.MissingField.Send(c)
		return
	}

	// Get current user
	userVal, _ := c.Get("user")
	currentUser, ok := userVal.(*models.User)
	if !ok {
		apierror.NotAuthenticated.Send(c)
		return
	}

	var req AddNoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apierror.InvalidData.Send(c)
		return
	}

	request, err := h.service.AddNote(id, req.Content, currentUser.ID, currentUser.Name)
	if err != nil {
		if errors.Is(err, services.ErrAdminPilotNotFound) {
			apierror.PilotRequestNotFound.Send(c)
			return
		}
		apierror.UpdateError.Send(c)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"request": request.ToResponse(),
		"message": "Note added",
	})
}

// =============================================================================
// POST /api/v1/admin/pilot-requests/:id/convert
// Convert a pilot request to a recruiter account
// =============================================================================

func (h *AdminPilotHandler) ConvertToRecruiter(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		apierror.MissingField.Send(c)
		return
	}

	// Get current user (admin)
	userVal, _ := c.Get("user")
	currentUser, ok := userVal.(*models.User)
	if !ok {
		apierror.NotAuthenticated.Send(c)
		return
	}

	var req ConvertToPilotRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		// Allow empty body with defaults
		req.SendInvitation = true
	}

	result, err := h.service.ConvertToRecruiter(id, req.OrgName, req.SendInvitation, currentUser)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrAdminPilotNotFound):
			apierror.PilotRequestNotFound.Send(c)
		case errors.Is(err, services.ErrAdminPilotAlreadyConverted):
			apierror.AlreadyConverted.Send(c)
		case errors.Is(err, services.ErrAdminOrgNameRequired):
			apierror.MissingField.Send(c)
		default:
			apierror.CreateError.Send(c)
		}
		return
	}

	// Build response
	resp := ConvertResponse{
		Message: "Account created",
	}

	if result.Org != nil {
		resp.OrgID = result.Org.ID
	}

	if result.User != nil {
		resp.UserID = result.User.ID
	}

	if result.Invite != nil {
		resp.InviteID = result.Invite.ID
		if req.SendInvitation {
			resp.Message = "Account created. Invitation sent to " + result.Invite.Email
		}
	}

	c.JSON(http.StatusOK, resp)
}
