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

type AuthHandler struct {
	authService *services.AuthService
}

func NewAuthHandler(authService *services.AuthService) *AuthHandler {
	return &AuthHandler{
		authService: authService,
	}
}

// =============================================================================
// Request/Response types
// =============================================================================

type AuthStartRequest struct {
	Email  string `json:"email" binding:"required,email"`
	Locale string `json:"locale"`
}

type AuthStartResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}

type AuthExchangeRequest struct {
	Token string `json:"token" binding:"required"`
}

type AuthExchangeResponse struct {
	Success bool                 `json:"success"`
	User    *models.UserResponse `json:"user"`
}

type AuthMeResponse struct {
	User *models.UserResponse `json:"user"`
}

// =============================================================================
// POST /api/v1/auth/start
// Sends a magic link to the user's email
// =============================================================================

func (h *AuthHandler) Start(c *gin.Context) {
	var req AuthStartRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apierror.InvalidEmail.Send(c)
		return
	}

	// Normalize email
	email := strings.TrimSpace(strings.ToLower(req.Email))

	// Default locale
	locale := req.Locale
	if locale == "" {
		locale = "fr"
	}

	// Start auth flow (always returns success for anti-enumeration)
	h.authService.StartAuth(email, locale)

	c.JSON(http.StatusOK, AuthStartResponse{
		Success: true,
		Message: "If this email address exists in our system, you will receive a login link.",
	})
}

// =============================================================================
// POST /api/v1/auth/exchange
// Validates a magic link token and creates a session
// =============================================================================

func (h *AuthHandler) Exchange(c *gin.Context) {
	var req AuthExchangeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apierror.MissingField.Send(c)
		return
	}

	result, err := h.authService.Exchange(req.Token, c.ClientIP(), c.Request.UserAgent())
	if err != nil {
		switch {
		case errors.Is(err, services.ErrInvalidToken):
			apierror.InvalidToken.Send(c)
		case errors.Is(err, services.ErrUserNotFound):
			apierror.UserNotFound.Send(c)
		case errors.Is(err, services.ErrSessionCreateErr):
			apierror.SessionError.Send(c)
		default:
			apierror.InternalError.Send(c)
		}
		return
	}

	// Set session cookie
	h.setSessionCookie(c, result.SessionToken)

	c.JSON(http.StatusOK, AuthExchangeResponse{
		Success: true,
		User:    result.User.ToResponse(),
	})
}

// =============================================================================
// POST /api/v1/auth/logout
// Revokes the current session
// =============================================================================

func (h *AuthHandler) Logout(c *gin.Context) {
	sessionToken, err := c.Cookie(auth.SessionCookieName)
	if err == nil && sessionToken != "" {
		//nolint:errcheck // Logout errors are non-critical
		h.authService.Logout(sessionToken)
	}

	h.clearSessionCookie(c)

	c.JSON(http.StatusOK, gin.H{"success": true})
}

// =============================================================================
// GET /api/v1/auth/me
// Returns the current authenticated user
// =============================================================================

func (h *AuthHandler) Me(c *gin.Context) {
	sessionToken, err := c.Cookie(auth.SessionCookieName)
	if err != nil {
		apierror.NotAuthenticated.Send(c)
		return
	}

	user, err := h.authService.GetCurrentUser(sessionToken)
	if err != nil {
		h.clearSessionCookie(c)
		switch {
		case errors.Is(err, services.ErrSessionInvalid):
			apierror.SessionInvalid.Send(c)
		case errors.Is(err, services.ErrUserNotFound):
			apierror.UserNotFound.Send(c)
		case errors.Is(err, services.ErrAccountDisabled):
			apierror.AccountDisabled.Send(c)
		default:
			apierror.InternalError.Send(c)
		}
		return
	}

	c.JSON(http.StatusOK, AuthMeResponse{
		User: user.ToResponse(),
	})
}

// =============================================================================
// Cookie helpers
// =============================================================================

func (h *AuthHandler) setSessionCookie(c *gin.Context, token string) {
	secure := os.Getenv("APP_ENV") == "production"
	maxAge := int(auth.SessionDuration.Seconds())

	c.SetCookie(
		auth.SessionCookieName,
		token,
		maxAge,
		"/",
		"",     // domain - let browser figure it out
		secure, // secure in production
		true,   // httpOnly
	)
	c.SetSameSite(http.SameSiteLaxMode)
}

func (h *AuthHandler) clearSessionCookie(c *gin.Context) {
	secure := os.Getenv("APP_ENV") == "production"
	c.SetCookie(
		auth.SessionCookieName,
		"",
		-1,
		"/",
		"",
		secure,
		true,
	)
}
