package handlers

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/baaraco/baara/apps/api/internal/middleware"
	"github.com/baaraco/baara/apps/api/internal/services"
	"github.com/baaraco/baara/pkg/apierror"
	"github.com/baaraco/baara/pkg/models"
)

type UserHandler struct {
	userService *services.UserService
}

func NewUserHandler(userService *services.UserService) *UserHandler {
	return &UserHandler{userService: userService}
}

// UpdateProfileRequest is the request body for updating user profile
type UpdateProfileRequest struct {
	Name               *string                 `json:"name"`
	RoleType           *models.RoleType        `json:"role_type"`
	LinkedInURL        *string                 `json:"linkedin_url"`
	GithubUsername     *string                 `json:"github_username"`
	Locale             *string                 `json:"locale"`
	ResumeURL          *string                 `json:"resume_url"`
	ResumeOriginalName *string                 `json:"resume_original_name"`
	Bio                *string                 `json:"bio"`
	YearsOfExperience  *int                    `json:"years_of_experience"`
	CurrentCompany     *string                 `json:"current_company"`
	CurrentTitle       *string                 `json:"current_title"`
	Skills             *[]string               `json:"skills"`
	Location           *string                 `json:"location"`
	Education          *[]models.Education     `json:"education"`
	Certifications     *[]models.Certification `json:"certifications"`
	Languages          *[]models.Language      `json:"languages"`
	WebsiteURL         *string                 `json:"website_url"`
	Availability       *string                 `json:"availability"`
	RemotePreference   *string                 `json:"remote_preference"`
	OpenToRelocation   *bool                   `json:"open_to_relocation"`
	Experiences        *[]models.Experience    `json:"experiences"`
}

// CompleteOnboardingRequest is the request body for completing onboarding
type CompleteOnboardingRequest struct {
	Name               string                 `json:"name" binding:"required"`
	RoleType           models.RoleType        `json:"role_type" binding:"required"`
	LinkedInURL        string                 `json:"linkedin_url"`
	GithubUsername     string                 `json:"github_username"`
	ResumeURL          string                 `json:"resume_url"`
	ResumeOriginalName string                 `json:"resume_original_name"`
	Bio                string                 `json:"bio"`
	YearsOfExperience  *int                   `json:"years_of_experience"`
	CurrentCompany     string                 `json:"current_company"`
	CurrentTitle       string                 `json:"current_title"`
	Skills             []string               `json:"skills"`
	Location           string                 `json:"location"`
	Education          []models.Education     `json:"education"`
	Certifications     []models.Certification `json:"certifications"`
	Languages          []models.Language      `json:"languages"`
	WebsiteURL         string                 `json:"website_url"`
	Availability       string                 `json:"availability"`
	RemotePreference   string                 `json:"remote_preference"`
	OpenToRelocation   bool                   `json:"open_to_relocation"`
	Experiences        []models.Experience    `json:"experiences"`
}

// UpdateProfile updates the current user's profile
// PATCH /api/v1/users/me
func (h *UserHandler) UpdateProfile(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		apierror.NotAuthenticated.Send(c)
		return
	}

	var req UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apierror.InvalidData.Send(c)
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
	if req.ResumeURL != nil {
		updates["resume_url"] = *req.ResumeURL
	}
	if req.ResumeOriginalName != nil {
		updates["resume_original_name"] = *req.ResumeOriginalName
	}
	if req.Bio != nil {
		updates["bio"] = *req.Bio
	}
	if req.YearsOfExperience != nil {
		updates["years_of_experience"] = *req.YearsOfExperience
	}
	if req.CurrentCompany != nil {
		updates["current_company"] = *req.CurrentCompany
	}
	if req.CurrentTitle != nil {
		updates["current_title"] = *req.CurrentTitle
	}
	if req.Skills != nil {
		if skillsJSON, err := json.Marshal(*req.Skills); err == nil {
			updates["skills"] = skillsJSON
		}
	}
	if req.Location != nil {
		updates["location"] = *req.Location
	}
	if req.Education != nil {
		if eduJSON, err := json.Marshal(*req.Education); err == nil {
			updates["education"] = eduJSON
		}
	}
	if req.Certifications != nil {
		if certsJSON, err := json.Marshal(*req.Certifications); err == nil {
			updates["certifications"] = certsJSON
		}
	}
	if req.Languages != nil {
		if langsJSON, err := json.Marshal(*req.Languages); err == nil {
			updates["languages"] = langsJSON
		}
	}
	if req.WebsiteURL != nil {
		updates["website_url"] = *req.WebsiteURL
	}
	if req.Availability != nil {
		updates["availability"] = *req.Availability
	}
	if req.RemotePreference != nil {
		updates["remote_preference"] = *req.RemotePreference
	}
	if req.OpenToRelocation != nil {
		updates["open_to_relocation"] = *req.OpenToRelocation
	}
	if req.Experiences != nil {
		if expsJSON, err := json.Marshal(*req.Experiences); err == nil {
			updates["experiences"] = expsJSON
		}
	}

	if len(updates) == 0 {
		apierror.InvalidData.Send(c)
		return
	}

	updatedUser, err := h.userService.UpdateProfile(user.ID, updates)
	if err != nil {
		if errors.Is(err, services.ErrUserNotFound) {
			apierror.UserNotFound.Send(c)
			return
		}
		if errors.Is(err, services.ErrInvalidRoleType) {
			apierror.InvalidRole.Send(c)
			return
		}
		apierror.UpdateError.Send(c)
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
		apierror.NotAuthenticated.Send(c)
		return
	}

	var req CompleteOnboardingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apierror.InvalidData.Send(c)
		return
	}

	// Build updates map
	updates := map[string]interface{}{
		"name":            req.Name,
		"role_type":       req.RoleType,
		"linkedin_url":    req.LinkedInURL,
		"github_username": req.GithubUsername,
	}
	if req.ResumeURL != "" {
		updates["resume_url"] = req.ResumeURL
	}
	if req.ResumeOriginalName != "" {
		updates["resume_original_name"] = req.ResumeOriginalName
	}
	if req.Bio != "" {
		updates["bio"] = req.Bio
	}
	if req.YearsOfExperience != nil {
		updates["years_of_experience"] = *req.YearsOfExperience
	}
	if req.CurrentCompany != "" {
		updates["current_company"] = req.CurrentCompany
	}
	if req.CurrentTitle != "" {
		updates["current_title"] = req.CurrentTitle
	}
	if len(req.Skills) > 0 {
		if skillsJSON, err := json.Marshal(req.Skills); err == nil {
			updates["skills"] = skillsJSON
		}
	}
	if req.Location != "" {
		updates["location"] = req.Location
	}
	if len(req.Education) > 0 {
		if eduJSON, err := json.Marshal(req.Education); err == nil {
			updates["education"] = eduJSON
		}
	}
	if len(req.Certifications) > 0 {
		if certsJSON, err := json.Marshal(req.Certifications); err == nil {
			updates["certifications"] = certsJSON
		}
	}
	if len(req.Languages) > 0 {
		if langsJSON, err := json.Marshal(req.Languages); err == nil {
			updates["languages"] = langsJSON
		}
	}
	if req.WebsiteURL != "" {
		updates["website_url"] = req.WebsiteURL
	}
	if req.Availability != "" {
		updates["availability"] = req.Availability
	}
	if req.RemotePreference != "" {
		updates["remote_preference"] = req.RemotePreference
	}
	if req.OpenToRelocation {
		updates["open_to_relocation"] = req.OpenToRelocation
	}
	if len(req.Experiences) > 0 {
		if expsJSON, err := json.Marshal(req.Experiences); err == nil {
			updates["experiences"] = expsJSON
		}
	}

	updatedUser, err := h.userService.CompleteOnboarding(user.ID, updates)
	if err != nil {
		if errors.Is(err, services.ErrUserNotFound) {
			apierror.UserNotFound.Send(c)
			return
		}
		if errors.Is(err, services.ErrInvalidRoleType) {
			apierror.InvalidRole.Send(c)
			return
		}
		apierror.UpdateError.Send(c)
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
		apierror.NotAuthenticated.Send(c)
		return
	}

	fullUser, err := h.userService.GetProfile(user.ID)
	if err != nil {
		apierror.FetchError.Send(c)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user": fullUser.ToResponse(),
	})
}
