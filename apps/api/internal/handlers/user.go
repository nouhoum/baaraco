package handlers

import (
	"net/http"
	"time"

	"github.com/baaraco/baara/apps/api/internal/middleware"
	"github.com/baaraco/baara/pkg/database"
	"github.com/baaraco/baara/pkg/models"
	"github.com/gin-gonic/gin"
)

type UserHandler struct{}

func NewUserHandler() *UserHandler {
	return &UserHandler{}
}

// UpdateProfileRequest is the request body for updating user profile
type UpdateProfileRequest struct {
	Name           *string          `json:"name"`
	RoleType       *models.RoleType `json:"role_type"`
	LinkedInURL    *string          `json:"linkedin_url"`
	GithubUsername *string          `json:"github_username"`
	Locale         *string          `json:"locale"`
}

// CompleteOnboardingRequest is the request body for completing onboarding
type CompleteOnboardingRequest struct {
	Name           string          `json:"name" binding:"required"`
	RoleType       models.RoleType `json:"role_type" binding:"required"`
	LinkedInURL    string          `json:"linkedin_url"`
	GithubUsername string          `json:"github_username"`
}

// UpdateProfile updates the current user's profile
// PATCH /api/v1/users/me
func (h *UserHandler) UpdateProfile(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	var req UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Build updates map
	updates := make(map[string]interface{})

	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.RoleType != nil {
		updates["role_type"] = *req.RoleType
	}
	if req.LinkedInURL != nil {
		updates["linkedin_url"] = *req.LinkedInURL
	}
	if req.GithubUsername != nil {
		updates["github_username"] = *req.GithubUsername
	}
	if req.Locale != nil {
		updates["locale"] = *req.Locale
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No fields to update"})
		return
	}

	// Update user
	if err := database.Db.Model(&models.User{}).Where("id = ?", user.ID).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	// Reload user to return updated data
	var updatedUser models.User
	if err := database.Db.Preload("Org").First(&updatedUser, "id = ?", user.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reload user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user": updatedUser.ToResponse(),
	})
}

// CompleteOnboarding marks the user's onboarding as complete
// POST /api/v1/users/me/onboarding
func (h *UserHandler) CompleteOnboarding(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	var req CompleteOnboardingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate role_type
	validRoleTypes := map[models.RoleType]bool{
		models.RoleTypeBackendGo:     true,
		models.RoleTypeInfraPlatform: true,
		models.RoleTypeSRE:           true,
		models.RoleTypeOther:         true,
	}
	if !validRoleTypes[req.RoleType] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role_type"})
		return
	}

	// Update user with onboarding data
	now := time.Now()
	updates := map[string]interface{}{
		"name":                    req.Name,
		"role_type":               req.RoleType,
		"linkedin_url":            req.LinkedInURL,
		"github_username":         req.GithubUsername,
		"onboarding_completed_at": now,
	}

	if err := database.Db.Model(&models.User{}).Where("id = ?", user.ID).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to complete onboarding"})
		return
	}

	// Reload user to return updated data
	var updatedUser models.User
	if err := database.Db.Preload("Org").First(&updatedUser, "id = ?", user.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reload user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user":    updatedUser.ToResponse(),
		"message": "Onboarding completed successfully",
	})
}

// GetProfile returns the current user's profile
// GET /api/v1/users/me
func (h *UserHandler) GetProfile(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	// Reload with associations
	var fullUser models.User
	if err := database.Db.Preload("Org").First(&fullUser, "id = ?", user.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user": fullUser.ToResponse(),
	})
}
