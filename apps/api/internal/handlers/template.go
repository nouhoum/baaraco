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
	"backend_go":      true,
	"sre":             true,
	"infra_platform":  true,
}

// =============================================================================
// GET /api/v1/templates
// List all available evaluation templates (public)
// =============================================================================

func (h *TemplateHandler) ListTemplates(c *gin.Context) {
	var jobs []models.Job
	if err := database.Db.Where("is_template = ?", true).
		Where("status = ?", models.JobStatusActive).
		Order("role_type ASC").
		Find(&jobs).Error; err != nil {
		apierror.FetchError.Send(c)
		return
	}

	templates := make([]TemplateResponse, 0, len(jobs))
	for _, job := range jobs {
		// Count criteria from scorecard
		criteriaCount := 0
		var scorecard models.Scorecard
		if err := database.Db.Where("job_id = ?", job.ID).First(&scorecard).Error; err == nil {
			criteriaCount = len(scorecard.GetCriteria())
		}

		// Get estimated time from work sample
		var estimatedTime *int
		var ws models.JobWorkSample
		if err := database.Db.Where("job_id = ?", job.ID).First(&ws).Error; err == nil {
			estimatedTime = ws.EstimatedTimeMinutes
		}

		templates = append(templates, TemplateResponse{
			ID:                   job.ID,
			RoleType:             job.RoleType,
			Title:                job.Title,
			Description:          job.Description,
			EstimatedTimeMinutes: estimatedTime,
			CriteriaCount:        criteriaCount,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"templates": templates,
		"total":     len(templates),
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

	var job models.Job
	if err := database.Db.Where("is_template = ? AND role_type = ? AND status = ?",
		true, roleType, models.JobStatusActive).
		First(&job).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			apierror.TemplateNotFound.Send(c)
			return
		}
		apierror.FetchError.Send(c)
		return
	}

	// Load scorecard
	var scorecard *models.ScorecardResponse
	var sc models.Scorecard
	if err := database.Db.Where("job_id = ?", job.ID).First(&sc).Error; err == nil {
		scorecard = sc.ToResponse()
	}

	// Load work sample (without detailed rubrics for public)
	var workSample *models.JobWorkSampleResponse
	var ws models.JobWorkSample
	if err := database.Db.Where("job_id = ?", job.ID).First(&ws).Error; err == nil {
		workSample = ws.ToResponse()
	}

	c.JSON(http.StatusOK, gin.H{
		"template": TemplateResponse{
			ID:                   job.ID,
			RoleType:             job.RoleType,
			Title:                job.Title,
			Description:          job.Description,
			EstimatedTimeMinutes: func() *int { if workSample != nil { return workSample.EstimatedTimeMinutes }; return nil }(),
			CriteriaCount: func() int {
				if scorecard != nil {
					return len(scorecard.Criteria)
				}
				return 0
			}(),
		},
		"scorecard":   scorecard,
		"work_sample": workSample,
	})
}

// =============================================================================
// POST /api/v1/templates/:role_type/start
// Start an autonomous evaluation from a template (auth required)
// Creates a work sample attempt linked to the template job
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

	// Find the template job
	var templateJob models.Job
	if err := database.Db.Where("is_template = ? AND role_type = ? AND status = ?",
		true, roleType, models.JobStatusActive).
		First(&templateJob).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			apierror.TemplateNotFound.Send(c)
			return
		}
		apierror.FetchError.Send(c)
		return
	}

	// Check for cooldown: find most recent submitted attempt for this role
	var lastAttempt models.WorkSampleAttempt
	err := database.Db.Joins("JOIN jobs ON jobs.id = work_sample_attempts.job_id").
		Where("work_sample_attempts.candidate_id = ?", user.ID).
		Where("jobs.role_type = ?", roleType).
		Where("work_sample_attempts.status IN ?", []string{"submitted", "reviewed"}).
		Order("work_sample_attempts.submitted_at DESC").
		First(&lastAttempt).Error

	if err == nil && lastAttempt.SubmittedAt != nil {
		cooldownEnd := lastAttempt.SubmittedAt.Add(90 * 24 * time.Hour)
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
	err = database.Db.Joins("JOIN jobs ON jobs.id = work_sample_attempts.job_id").
		Where("work_sample_attempts.candidate_id = ?", user.ID).
		Where("jobs.role_type = ?", roleType).
		Where("work_sample_attempts.status IN ?", []string{"draft", "in_progress"}).
		First(&existingAttempt).Error

	if err == nil {
		// Return existing in-progress attempt
		var workSampleResponse *models.JobWorkSampleResponse
		if existingAttempt.JobID != nil {
			var jws models.JobWorkSample
			if err := database.Db.Where("job_id = ?", *existingAttempt.JobID).First(&jws).Error; err == nil {
				workSampleResponse = jws.ToResponse()
			}
		}

		c.JSON(http.StatusOK, gin.H{
			"attempt":     existingAttempt.ToResponse(),
			"work_sample": workSampleResponse,
			"message":     "Existing attempt found",
			"existing":    true,
		})
		return
	}

	// Create new attempt
	attempt := models.WorkSampleAttempt{
		CandidateID: user.ID,
		JobID:       &templateJob.ID,
		Status:      models.AttemptStatusDraft,
		Progress:    0,
	}
	if err := attempt.SetAnswers(make(map[string]string)); err != nil {
		apierror.CreateError.Send(c)
		return
	}

	if err := database.Db.Create(&attempt).Error; err != nil {
		apierror.CreateError.Send(c)
		return
	}

	// Load the work sample for this template
	var workSampleResponse *models.JobWorkSampleResponse
	var jws models.JobWorkSample
	if err := database.Db.Where("job_id = ?", templateJob.ID).First(&jws).Error; err == nil {
		workSampleResponse = jws.ToResponse()
	}

	c.JSON(http.StatusCreated, gin.H{
		"attempt":     attempt.ToResponse(),
		"work_sample": workSampleResponse,
		"message":     "Evaluation started",
		"existing":    false,
	})
}

// =============================================================================
// GET /api/v1/proof-profiles/public/:slug
// Get a public proof profile by slug (no auth required)
// =============================================================================

func (h *TemplateHandler) GetPublicProofProfile(c *gin.Context) {
	slug := c.Param("slug")

	var profile models.ProofProfile
	if err := database.Db.Preload("Job").
		Where("public_slug = ? AND is_public = ?", slug, true).
		First(&profile).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			apierror.ProofProfileNotFound.Send(c)
			return
		}
		apierror.FetchError.Send(c)
		return
	}

	// Get role type from associated job
	roleType := ""
	if profile.Job != nil {
		roleType = profile.Job.RoleType
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
