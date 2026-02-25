package handlers

import (
	"errors"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/baaraco/baara/apps/api/internal/services"
	"github.com/baaraco/baara/pkg/apierror"
	"github.com/baaraco/baara/pkg/auth"
	"github.com/baaraco/baara/pkg/models"
)

type InviteHandler struct {
	inviteService *services.InviteService
}

func NewInviteHandler(inviteService *services.InviteService) *InviteHandler {
	return &InviteHandler{
		inviteService: inviteService,
	}
}

// =============================================================================
// Request/Response types
// =============================================================================

type CreateInviteRequest struct {
	Email  string          `json:"email" binding:"required,email"`
	Role   models.UserRole `json:"role" binding:"required"`
	JobID  string          `json:"job_id"` // For candidate invites
	Locale string          `json:"locale"`
}

type CreateInviteResponse struct {
	Success bool                   `json:"success"`
	Invite  *models.InviteResponse `json:"invite"`
}

type InviteInfoResponse struct {
	Email    string `json:"email"`
	Role     string `json:"role"`
	OrgName  string `json:"org_name,omitempty"`
	JobTitle string `json:"job_title,omitempty"`
	Valid    bool   `json:"valid"`
}

type AcceptInviteRequest struct {
	Name string `json:"name" binding:"required,min=2"`
}

type AcceptInviteResponse struct {
	Success bool                 `json:"success"`
	User    *models.UserResponse `json:"user"`
}

// =============================================================================
// POST /api/v1/invites
// Creates an invitation (requires authentication)
// =============================================================================

func (h *InviteHandler) Create(c *gin.Context) {
	// Get current user from context (set by auth middleware)
	userVal, exists := c.Get("user")
	if !exists {
		apierror.NotAuthenticated.Send(c)
		return
	}
	currentUser, ok := userVal.(*models.User)
	if !ok {
		apierror.NotAuthenticated.Send(c)
		return
	}

	var req CreateInviteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apierror.InvalidData.Send(c)
		return
	}

	// Validate role
	if req.Role != models.RoleRecruiter && req.Role != models.RoleCandidate {
		apierror.InvalidRole.Send(c)
		return
	}

	email := strings.TrimSpace(strings.ToLower(req.Email))

	invite, err := h.inviteService.CreateInvite(currentUser, email, req.Role, req.JobID, req.Locale)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrCandidateCannotInvite):
			apierror.CandidateCannotInvite.Send(c)
		case errors.Is(err, services.ErrRecruiterCannotInvite):
			apierror.RecruiterCannotInvite.Send(c)
		case errors.Is(err, services.ErrDuplicateAttempt):
			apierror.DuplicateAttempt.Send(c)
		case errors.Is(err, services.ErrAlreadyExists):
			apierror.AlreadyExists.Send(c)
		case errors.Is(err, services.ErrDuplicateInvite):
			apierror.AlreadyExists.Send(c)
		default:
			apierror.CreateError.Send(c)
		}
		return
	}

	c.JSON(http.StatusCreated, CreateInviteResponse{
		Success: true,
		Invite:  invite.ToResponse(),
	})
}

// =============================================================================
// GET /api/v1/invites/:token
// Gets invite information (public endpoint for accept page)
// =============================================================================

func (h *InviteHandler) GetInfo(c *gin.Context) {
	token := c.Param("token")
	if token == "" {
		apierror.MissingField.Send(c)
		return
	}

	info, err := h.inviteService.GetInviteInfo(token)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrInviteNotFound):
			apierror.InviteNotFound.Send(c)
		default:
			apierror.InternalError.Send(c)
		}
		return
	}

	// If the invite is not valid, return minimal response
	if !info.Valid {
		c.JSON(http.StatusOK, InviteInfoResponse{
			Valid: false,
		})
		return
	}

	c.JSON(http.StatusOK, InviteInfoResponse{
		Email:    info.Email,
		Role:     info.Role,
		OrgName:  info.OrgName,
		JobTitle: info.JobTitle,
		Valid:    true,
	})
}

// =============================================================================
// POST /api/v1/invites/:token/accept
// Accepts an invitation and creates user + session
// =============================================================================

func (h *InviteHandler) Accept(c *gin.Context) {
	token := c.Param("token")
	if token == "" {
		apierror.MissingField.Send(c)
		return
	}

	var req AcceptInviteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apierror.InvalidName.Send(c)
		return
	}

	result, err := h.inviteService.AcceptInvite(token, strings.TrimSpace(req.Name), c.ClientIP(), c.Request.UserAgent())
	if err != nil {
		switch {
		case errors.Is(err, services.ErrInviteNotFound):
			apierror.InviteNotFound.Send(c)
		case errors.Is(err, services.ErrInviteExpired):
			apierror.InviteExpired.Send(c)
		case errors.Is(err, services.ErrAlreadyExists):
			apierror.AlreadyExists.Send(c)
		case errors.Is(err, services.ErrSessionCreateErr):
			apierror.SessionError.Send(c)
		default:
			apierror.CreateError.Send(c)
		}
		return
	}

	// Set session cookie
	h.setSessionCookie(c, result.SessionToken)

	c.JSON(http.StatusOK, AcceptInviteResponse{
		Success: true,
		User:    result.User.ToResponse(),
	})
}

// =============================================================================
// Cookie helpers
// =============================================================================

func (h *InviteHandler) setSessionCookie(c *gin.Context, token string) {
	secure := os.Getenv("APP_ENV") == "production"
	maxAge := int(auth.SessionDuration.Seconds())

	c.SetCookie(
		auth.SessionCookieName,
		token,
		maxAge,
		"/",
		"",
		secure,
		true,
	)
	c.SetSameSite(http.SameSiteLaxMode)
}
