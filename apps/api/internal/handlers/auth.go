package handlers

import (
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/baaraco/baara/pkg/apierror"
	"github.com/baaraco/baara/pkg/auth"
	"github.com/baaraco/baara/pkg/database"
	"github.com/baaraco/baara/pkg/logger"
	"github.com/baaraco/baara/pkg/mailer"
	"github.com/baaraco/baara/pkg/models"
)

type AuthHandler struct {
	emailService *auth.EmailService
}

func NewAuthHandler(m mailer.Mailer) *AuthHandler {
	return &AuthHandler{
		emailService: auth.NewEmailService(m),
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

	// Anti-enumeration: always return 200 with the same message
	successResponse := AuthStartResponse{
		Success: true,
		Message: "If this email address exists in our system, you will receive a login link.",
	}

	// Look up user by email
	var user models.User
	result := database.Db.Where("email = ?", email).First(&user)

	if result.Error == nil {
		// User exists
		// Check if non-candidate with pending status (can't login yet)
		if user.Role != models.RoleCandidate && user.Status == models.UserStatusPending {
			// Pending recruiter/admin - can't login until activated via invite
			logger.Debug("Login attempt for pending non-candidate user",
				zap.String("email", email),
				zap.String("role", string(user.Role)),
			)
			c.JSON(http.StatusOK, successResponse)
			return
		}

		// User exists and can login - send magic link
		if err := h.sendMagicLink(email, false, locale); err != nil {
			logger.Error("Failed to send magic link", zap.Error(err), zap.String("email", email))
		}

		c.JSON(http.StatusOK, successResponse)
		return
	}

	// User does not exist - create new candidate user
	newUser := models.User{
		Email:  email,
		Role:   models.RoleCandidate,
		Status: models.UserStatusPending,
		Locale: locale,
	}

	if err := database.Db.Create(&newUser).Error; err != nil {
		logger.Error("Failed to create user", zap.Error(err), zap.String("email", email))
		c.JSON(http.StatusOK, successResponse)
		return
	}

	// Create identity for magiclink
	identity := models.Identity{
		UserID:   newUser.ID,
		Provider: models.ProviderMagicLink,
		Email:    email,
	}

	if err := database.Db.Create(&identity).Error; err != nil {
		logger.Error("Failed to create identity", zap.Error(err), zap.String("user_id", newUser.ID))
	}

	// Send welcome email (is_new_user = true)
	if err := h.sendMagicLink(email, true, locale); err != nil {
		logger.Error("Failed to send welcome email", zap.Error(err), zap.String("email", email))
	}

	logger.Info("New candidate user created",
		zap.String("user_id", newUser.ID),
		zap.String("email", email),
	)

	c.JSON(http.StatusOK, successResponse)
}

func (h *AuthHandler) sendMagicLink(email string, isNewUser bool, locale string) error {
	// Generate token
	token, hash, err := auth.GenerateToken()
	if err != nil {
		return err
	}

	// Save to database
	loginToken := models.LoginToken{
		Email:     email,
		TokenHash: hash,
		IsNewUser: isNewUser,
		ExpiresAt: time.Now().Add(auth.MagicLinkDuration),
	}

	if err := database.Db.Create(&loginToken).Error; err != nil {
		return err
	}

	// Send email
	return h.emailService.SendMagicLink(email, token, isNewUser, locale)
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

	// Hash the provided token
	tokenHash := auth.HashToken(req.Token)

	// Find the login token
	var loginToken models.LoginToken
	result := database.Db.Where("token_hash = ?", tokenHash).First(&loginToken)
	if result.Error != nil {
		apierror.InvalidToken.Send(c)
		return
	}

	// Check if token is valid
	if !loginToken.IsValid() {
		apierror.InvalidToken.Send(c)
		return
	}

	// Mark token as consumed
	now := time.Now()
	loginToken.ConsumedAt = &now
	database.Db.Save(&loginToken)

	// Find user by email
	var user models.User
	result = database.Db.Preload("Org").Where("email = ?", loginToken.Email).First(&user)
	if result.Error != nil {
		apierror.UserNotFound.Send(c)
		return
	}

	// Activate user if pending
	if user.Status == models.UserStatusPending {
		user.Status = models.UserStatusActive
		user.EmailVerifiedAt = &now
	}
	user.LastLoginAt = &now
	database.Db.Save(&user)

	// Create session
	sessionToken, sessionHash, err := auth.GenerateToken()
	if err != nil {
		logger.Error("Failed to generate session token", zap.Error(err))
		apierror.SessionError.Send(c)
		return
	}

	session := models.Session{
		UserID:    user.ID,
		TokenHash: sessionHash,
		IPAddress: c.ClientIP(),
		UserAgent: c.Request.UserAgent(),
		ExpiresAt: time.Now().Add(auth.SessionDuration),
	}

	if err := database.Db.Create(&session).Error; err != nil {
		logger.Error("Failed to create session", zap.Error(err))
		apierror.SessionError.Send(c)
		return
	}

	// Set session cookie
	h.setSessionCookie(c, sessionToken)

	logger.Info("User logged in",
		zap.String("user_id", user.ID),
		zap.String("email", user.Email),
		zap.Bool("new_user", loginToken.IsNewUser),
	)

	c.JSON(http.StatusOK, AuthExchangeResponse{
		Success: true,
		User:    user.ToResponse(),
	})
}

// =============================================================================
// POST /api/v1/auth/logout
// Revokes the current session
// =============================================================================

func (h *AuthHandler) Logout(c *gin.Context) {
	// Get session token from cookie
	sessionToken, err := c.Cookie(auth.SessionCookieName)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"success": true})
		return
	}

	// Hash and find session
	tokenHash := auth.HashToken(sessionToken)
	var session models.Session
	result := database.Db.Where("token_hash = ?", tokenHash).First(&session)

	if result.Error == nil && session.IsValid() {
		// Revoke session
		now := time.Now()
		session.RevokedAt = &now
		database.Db.Save(&session)

		logger.Info("User logged out",
			zap.String("user_id", session.UserID),
			zap.String("session_id", session.ID),
		)
	}

	// Clear cookie
	h.clearSessionCookie(c)

	c.JSON(http.StatusOK, gin.H{"success": true})
}

// =============================================================================
// GET /api/v1/auth/me
// Returns the current authenticated user
// =============================================================================

func (h *AuthHandler) Me(c *gin.Context) {
	// Get session token from cookie
	sessionToken, err := c.Cookie(auth.SessionCookieName)
	if err != nil {
		apierror.NotAuthenticated.Send(c)
		return
	}

	// Hash and find session
	tokenHash := auth.HashToken(sessionToken)
	var session models.Session
	result := database.Db.Where("token_hash = ?", tokenHash).First(&session)
	if result.Error != nil || !session.IsValid() {
		h.clearSessionCookie(c)
		apierror.SessionInvalid.Send(c)
		return
	}

	// Get user with org
	var user models.User
	result = database.Db.Preload("Org").Where("id = ?", session.UserID).First(&user)
	if result.Error != nil {
		h.clearSessionCookie(c)
		apierror.UserNotFound.Send(c)
		return
	}

	// Check user is active
	if !user.IsActive() {
		h.clearSessionCookie(c)
		apierror.AccountDisabled.Send(c)
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
