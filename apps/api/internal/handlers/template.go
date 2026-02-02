package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/baaraco/baara/apps/api/internal/middleware"
	"github.com/baaraco/baara/pkg/apierror"
	"github.com/baaraco/baara/pkg/database"
	"github.com/baaraco/baara/pkg/models"
)

type TemplateHandler struct{}

func NewTemplateHandler() *TemplateHandler {
	return &TemplateHandler{}
}

// TemplateResponse is a lightweight response for template listings
type TemplateResponse struct {
	ID                   string `json:"id"`
	RoleType             string `json:"role_type"`
	Title                string `json:"title"`
	Description          string `json:"description,omitempty"`
	EstimatedTimeMinutes *int   `json:"estimated_time_minutes,omitempty"`
	CriteriaCount        int    `json:"criteria_count"`
}

// validRoleTypes lists the allowed role types for templates
var validRoleTypes = map[string]bool{
	"backend_go":     true,
	"sre":            true,
	"infra_platform": true,
}

// =============================================================================
// GET /api/v1/templates
// List all available evaluation templates (public)
// =============================================================================

func (h *TemplateHandler) ListTemplates(c *gin.Context) {
	var templates []models.EvaluationTemplate
	if err := database.Db.Where("is_active = ?", true).
		Order("role_type ASC").
		Find(&templates).Error; err != nil {
		apierror.FetchError.Send(c)
		return
	}

	responses := make([]TemplateResponse, 0, len(templates))
	for _, tmpl := range templates {
		responses = append(responses, TemplateResponse{
			ID:                   tmpl.ID,
			RoleType:             tmpl.RoleType,
			Title:                tmpl.Title,
			Description:          tmpl.Description,
			EstimatedTimeMinutes: tmpl.EstimatedTimeMinutes,
			CriteriaCount:        len(tmpl.GetCriteria()),
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"templates": responses,
		"total":     len(responses),
	})
}

// =============================================================================
// GET /api/v1/templates/:role_type
// Get a specific template by role type (public)
// =============================================================================

func (h *TemplateHandler) GetTemplate(c *gin.Context) {
	roleType := c.Param("role_type")

	if !validRoleTypes[roleType] {
		apierror.InvalidRoleType.Send(c)
		return
	}

	var tmpl models.EvaluationTemplate
	if err := database.Db.Where("role_type = ? AND is_active = ?", roleType, true).
		First(&tmpl).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			apierror.TemplateNotFound.Send(c)
			return
		}
		apierror.FetchError.Send(c)
		return
	}

	resp := tmpl.ToResponse()

	c.JSON(http.StatusOK, gin.H{
		"template": TemplateResponse{
			ID:                   tmpl.ID,
			RoleType:             tmpl.RoleType,
			Title:                tmpl.Title,
			Description:          tmpl.Description,
			EstimatedTimeMinutes: tmpl.EstimatedTimeMinutes,
			CriteriaCount:        len(resp.Criteria),
		},
		"criteria": resp.Criteria,
		"sections": resp.Sections,
	})
}

// =============================================================================
// POST /api/v1/templates/:role_type/start
// Start an autonomous evaluation from a template (auth required)
// Creates a work sample attempt linked to the evaluation template
// =============================================================================

func (h *TemplateHandler) StartEvaluation(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		apierror.NotAuthenticated.Send(c)
		return
	}

	if user.Role != models.RoleCandidate {
		apierror.RoleRequired.Send(c)
		return
	}

	roleType := c.Param("role_type")

	if !validRoleTypes[roleType] {
		apierror.InvalidRoleType.Send(c)
		return
	}

	// Find the evaluation template
	var tmpl models.EvaluationTemplate
	if err := database.Db.Where("role_type = ? AND is_active = ?", roleType, true).
		First(&tmpl).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			apierror.TemplateNotFound.Send(c)
			return
		}
		apierror.FetchError.Send(c)
		return
	}

	// Check for cooldown: find most recent submitted attempt for this role
	var lastAttempt models.WorkSampleAttempt
	err := database.Db.Where("candidate_id = ? AND role_type = ?", user.ID, roleType).
		Where("status IN ?", []string{"submitted", "reviewed"}).
		Order("submitted_at DESC").
		First(&lastAttempt).Error

	if err == nil && lastAttempt.SubmittedAt != nil {
		cooldownDays := tmpl.CooldownDays
		if cooldownDays == 0 {
			cooldownDays = 90
		}
		cooldownEnd := lastAttempt.SubmittedAt.Add(time.Duration(cooldownDays) * 24 * time.Hour)
		if time.Now().Before(cooldownEnd) {
			remaining := int(time.Until(cooldownEnd).Hours() / 24)
			apierror.CooldownActive.SendWithDetails(c, map[string]string{
				"cooldown_end":   cooldownEnd.Format(time.RFC3339),
				"remaining_days": fmt.Sprintf("%d", remaining),
			})
			return
		}
	}

	// Check for existing in-progress attempt for this role
	var existingAttempt models.WorkSampleAttempt
	err = database.Db.Where("candidate_id = ? AND role_type = ?", user.ID, roleType).
		Where("status IN ?", []string{"draft", "in_progress", "interviewing"}).
		First(&existingAttempt).Error

	if err == nil {
		c.JSON(http.StatusOK, gin.H{
			"attempt":  existingAttempt.ToResponse(),
			"message":  "Existing attempt found",
			"existing": true,
		})
		return
	}

	// Create new attempt linked to evaluation template
	attempt := models.WorkSampleAttempt{
		CandidateID:          user.ID,
		EvaluationTemplateID: &tmpl.ID,
		RoleType:             roleType,
		InterviewMode:        "conversation",
		Status:               models.AttemptStatusDraft,
		Progress:             0,
	}
	if err := attempt.SetAnswers(make(map[string]string)); err != nil {
		apierror.CreateError.Send(c)
		return
	}

	if err := database.Db.Create(&attempt).Error; err != nil {
		apierror.CreateError.Send(c)
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"attempt":  attempt.ToResponse(),
		"message":  "Evaluation started",
		"existing": false,
	})
}

// =============================================================================
// GET /api/v1/proof-profiles/public/:slug
// Get a public proof profile by slug (no auth required)
// =============================================================================

func (h *TemplateHandler) GetPublicProofProfile(c *gin.Context) {
	slug := c.Param("slug")

	var profile models.ProofProfile
	if err := database.Db.Preload("Job").Preload("EvaluationTemplate").
		Where("public_slug = ? AND is_public = ?", slug, true).
		First(&profile).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			apierror.ProofProfileNotFound.Send(c)
			return
		}
		apierror.FetchError.Send(c)
		return
	}

	// Get role type from job or evaluation template
	roleType := ""
	if profile.Job != nil {
		roleType = profile.Job.RoleType
	} else if profile.EvaluationTemplate != nil {
		roleType = profile.EvaluationTemplate.RoleType
	}

	c.JSON(http.StatusOK, gin.H{
		"proof_profile": profile.ToPublicResponse(roleType),
	})
}

// =============================================================================
// PATCH /api/v1/proof-profiles/me/visibility
// Toggle proof profile public visibility (auth required)
// =============================================================================

func (h *TemplateHandler) UpdateProofProfileVisibility(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		apierror.NotAuthenticated.Send(c)
		return
	}

	if user.Role != models.RoleCandidate {
		apierror.RoleRequired.Send(c)
		return
	}

	var req struct {
		IsPublic bool `json:"is_public"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		apierror.InvalidData.Send(c)
		return
	}

	// Get the most recent proof profile
	var profile models.ProofProfile
	if err := database.Db.Where("candidate_id = ?", user.ID).
		Order("created_at DESC").
		First(&profile).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			apierror.ProofProfileNotFound.Send(c)
			return
		}
		apierror.FetchError.Send(c)
		return
	}

	updates := map[string]interface{}{
		"is_public": req.IsPublic,
	}

	// Generate slug if making public and no slug exists
	if req.IsPublic && profile.PublicSlug == "" {
		slug, err := generatePublicSlug()
		if err != nil {
			apierror.InternalError.Send(c)
			return
		}
		updates["public_slug"] = slug
	}

	if err := database.Db.Model(&profile).Updates(updates).Error; err != nil {
		apierror.UpdateError.Send(c)
		return
	}

	// Reload
	database.Db.First(&profile, "id = ?", profile.ID)

	c.JSON(http.StatusOK, gin.H{
		"proof_profile": profile.ToResponse(),
		"message":       "Visibility updated",
	})
}

// generateSlug generates a random URL-safe slug
func generatePublicSlug() (string, error) {
	bytes := make([]byte, 12)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}
