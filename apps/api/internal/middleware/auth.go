package middleware

import (
	"net/http"

	"github.com/baaraco/baara/pkg/auth"
	"github.com/baaraco/baara/pkg/database"
	"github.com/baaraco/baara/pkg/models"
	"github.com/gin-gonic/gin"
)

// AuthErrorResponse is the standard error response for auth failures
type AuthErrorResponse struct {
	Error string `json:"error"`
}

// RequireAuth middleware checks for a valid session and loads the user
// On success, it sets "user" and "session" in the context
func RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get session token from cookie
		sessionToken, err := c.Cookie(auth.SessionCookieName)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, AuthErrorResponse{
				Error: "Non authentifié",
			})
			return
		}

		// Hash and find session
		tokenHash := auth.HashToken(sessionToken)
		var session models.Session
		result := database.Db.Where("token_hash = ?", tokenHash).First(&session)
		if result.Error != nil || !session.IsValid() {
			clearSessionCookie(c)
			c.AbortWithStatusJSON(http.StatusUnauthorized, AuthErrorResponse{
				Error: "Session invalide ou expirée",
			})
			return
		}

		// Get user with org
		var user models.User
		result = database.Db.Preload("Org").Where("id = ?", session.UserID).First(&user)
		if result.Error != nil {
			clearSessionCookie(c)
			c.AbortWithStatusJSON(http.StatusUnauthorized, AuthErrorResponse{
				Error: "Utilisateur non trouvé",
			})
			return
		}

		// Check user is active
		if !user.IsActive() {
			clearSessionCookie(c)
			c.AbortWithStatusJSON(http.StatusUnauthorized, AuthErrorResponse{
				Error: "Compte désactivé",
			})
			return
		}

		// Set user and session in context
		c.Set("user", &user)
		c.Set("session", &session)

		c.Next()
	}
}

// RequireRole middleware checks that the authenticated user has one of the required roles
// Must be used AFTER RequireAuth
func RequireRole(roles ...models.UserRole) gin.HandlerFunc {
	return func(c *gin.Context) {
		userVal, exists := c.Get("user")
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, AuthErrorResponse{
				Error: "Non authentifié",
			})
			return
		}

		user := userVal.(*models.User)

		// Check if user has one of the required roles
		hasRole := false
		for _, role := range roles {
			if user.Role == role {
				hasRole = true
				break
			}
		}

		if !hasRole {
			c.AbortWithStatusJSON(http.StatusForbidden, AuthErrorResponse{
				Error: "Accès non autorisé",
			})
			return
		}

		c.Next()
	}
}

// RequireAdmin is a convenience middleware that requires the admin role
func RequireAdmin() gin.HandlerFunc {
	return RequireRole(models.RoleAdmin)
}

// RequireRecruiterOrAdmin is a convenience middleware for recruiter-level access
func RequireRecruiterOrAdmin() gin.HandlerFunc {
	return RequireRole(models.RoleAdmin, models.RoleRecruiter)
}

// OptionalAuth middleware loads user if session exists, but doesn't require it
// Useful for endpoints that behave differently for authenticated users
func OptionalAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get session token from cookie
		sessionToken, err := c.Cookie(auth.SessionCookieName)
		if err != nil {
			c.Next()
			return
		}

		// Hash and find session
		tokenHash := auth.HashToken(sessionToken)
		var session models.Session
		result := database.Db.Where("token_hash = ?", tokenHash).First(&session)
		if result.Error != nil || !session.IsValid() {
			c.Next()
			return
		}

		// Get user with org
		var user models.User
		result = database.Db.Preload("Org").Where("id = ?", session.UserID).First(&user)
		if result.Error != nil || !user.IsActive() {
			c.Next()
			return
		}

		// Set user and session in context
		c.Set("user", &user)
		c.Set("session", &session)

		c.Next()
	}
}

// GetCurrentUser extracts the user from context (nil if not authenticated)
func GetCurrentUser(c *gin.Context) *models.User {
	userVal, exists := c.Get("user")
	if !exists {
		return nil
	}
	return userVal.(*models.User)
}

// GetCurrentSession extracts the session from context (nil if not authenticated)
func GetCurrentSession(c *gin.Context) *models.Session {
	sessionVal, exists := c.Get("session")
	if !exists {
		return nil
	}
	return sessionVal.(*models.Session)
}

// Helper to clear session cookie
func clearSessionCookie(c *gin.Context) {
	c.SetCookie(
		auth.SessionCookieName,
		"",
		-1,
		"/",
		"",
		false,
		true,
	)
}
