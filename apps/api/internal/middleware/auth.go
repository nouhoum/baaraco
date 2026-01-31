package middleware

import (
	"github.com/gin-gonic/gin"

	"github.com/baaraco/baara/pkg/apierror"
	"github.com/baaraco/baara/pkg/auth"
	"github.com/baaraco/baara/pkg/database"
	"github.com/baaraco/baara/pkg/models"
)

// RequireAuth middleware checks for a valid session and loads the user
// On success, it sets "user" and "session" in the context
func RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get session token from cookie
		sessionToken, err := c.Cookie(auth.SessionCookieName)
		if err != nil {
			apierror.NotAuthenticated.Abort(c)
			return
		}

		// Hash and find session
		tokenHash := auth.HashToken(sessionToken)
		var session models.Session
		result := database.Db.Where("token_hash = ?", tokenHash).First(&session)
		if result.Error != nil || !session.IsValid() {
			clearSessionCookie(c)
			apierror.SessionInvalid.Abort(c)
			return
		}

		// Get user with org
		var user models.User
		result = database.Db.Preload("Org").Where("id = ?", session.UserID).First(&user)
		if result.Error != nil {
			clearSessionCookie(c)
			apierror.UserNotFound.Abort(c)
			return
		}

		// Check user is active
		if !user.IsActive() {
			clearSessionCookie(c)
			apierror.AccountDisabled.Abort(c)
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
			apierror.NotAuthenticated.Abort(c)
			return
		}

		user, ok := userVal.(*models.User)
		if !ok {
			apierror.NotAuthenticated.Abort(c)
			return
		}

		// Check if user has one of the required roles
		hasRole := false
		for _, role := range roles {
			if user.Role == role {
				hasRole = true
				break
			}
		}

		if !hasRole {
			apierror.AccessDenied.Abort(c)
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
	user, ok := userVal.(*models.User)
	if !ok {
		return nil
	}
	return user
}

// GetCurrentSession extracts the session from context (nil if not authenticated)
func GetCurrentSession(c *gin.Context) *models.Session {
	sessionVal, exists := c.Get("session")
	if !exists {
		return nil
	}
	session, ok := sessionVal.(*models.Session)
	if !ok {
		return nil
	}
	return session
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
