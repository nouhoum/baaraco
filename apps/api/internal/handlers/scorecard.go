package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/baaraco/baara/apps/api/internal/middleware"
	"github.com/baaraco/baara/pkg/ai"
	"github.com/baaraco/baara/pkg/apierror"
	"github.com/baaraco/baara/pkg/database"
	"github.com/baaraco/baara/pkg/models"
)

type ScorecardHandler struct {
	aiClient ai.Generator
}

func NewScorecardHandler() *ScorecardHandler {
	return &ScorecardHandler{
		aiClient: ai.NewClient(),
	}
}

// NewScorecardHandlerWithClient creates a handler with a custom AI client (for testing)
func NewScorecardHandlerWithClient(client ai.Generator) *ScorecardHandler {
	return &ScorecardHandler{
		aiClient: client,
	}
}

// =============================================================================
// Request/Response types
// =============================================================================

type UpdateScorecardRequest struct {
	Criteria []models.ScorecardCriterion `json:"criteria" binding:"required"`
}

// =============================================================================
// POST /api/v1/jobs/:id/generate-scorecard
// Generate evaluation criteria for a job using AI
// =============================================================================

func (h *ScorecardHandler) GenerateScorecard(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil || (user.Role != models.RoleRecruiter && user.Role != models.RoleAdmin) {
		apierror.AccessDenied.Send(c)
		return
	}

	jobID := c.Param("id")

	// Get job with org check
	var job models.Job
	if err := database.Db.First(&job, "id = ?", jobID).Error; err != nil {
		apierror.JobNotFound.Send(c)
		return
	}

	// Check org access (admin can access all)
	if user.Role != models.RoleAdmin && (user.OrgID == nil || !job.BelongsToOrg(*user.OrgID)) {
		apierror.AccessDenied.Send(c)
		return
	}

	// Check if AI client is configured
	if !h.aiClient.IsConfigured() {
		apierror.AIUnavailable.Send(c)
		return
	}

	// Build input for AI
	var stack []string
	if len(job.Stack) > 0 {
		_ = json.Unmarshal(job.Stack, &stack) //nolint:errcheck // best-effort, empty slice is acceptable fallback
	}
	var outcomes []string
	if len(job.ExpectedOutcomes) > 0 {
		_ = json.Unmarshal(job.ExpectedOutcomes, &outcomes) //nolint:errcheck // best-effort, empty slice is acceptable fallback
	}

	input := ai.ScorecardInput{
		Title:            job.Title,
		Team:             job.Team,
		Seniority:        string(job.Seniority),
		LocationType:     string(job.LocationType),
		ContractType:     string(job.ContractType),
		Stack:            stack,
		TeamSize:         string(job.TeamSize),
		ManagerInfo:      job.ManagerInfo,
		BusinessContext:  job.BusinessContext,
		MainProblem:      job.MainProblem,
		ExpectedOutcomes: outcomes,
		SuccessLooksLike: job.SuccessLooksLike,
		FailureLooksLike: job.FailureLooksLike,
	}

	// Generate criteria using AI
	criteria, err := h.aiClient.GenerateScorecard(input)
	if err != nil {
		apierror.AIError.Send(c)
		return
	}

	// Convert criteria to JSON
	criteriaJSON, err := json.Marshal(criteria)
	if err != nil {
		apierror.SerializationError.Send(c)
		return
	}

	now := time.Now()
	promptVersion := ai.GetScorecardPromptVersion()

	// Check if scorecard already exists for this job
	var scorecard models.Scorecard
	result := database.Db.Where("job_id = ?", jobID).First(&scorecard)

	if result.Error == nil {
		// Update existing scorecard
		scorecard.Criteria = criteriaJSON
		scorecard.GeneratedAt = &now
		scorecard.PromptVersion = promptVersion

		if err := database.Db.Save(&scorecard).Error; err != nil {
			apierror.UpdateError.Send(c)
			return
		}
	} else {
		// Create new scorecard
		scorecard = models.Scorecard{
			JobID:         jobID,
			Criteria:      criteriaJSON,
			GeneratedAt:   &now,
			PromptVersion: promptVersion,
		}

		if err := database.Db.Create(&scorecard).Error; err != nil {
			apierror.CreateError.Send(c)
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"scorecard": scorecard.ToResponse(),
		"message":   "Scorecard generated successfully",
	})
}

// =============================================================================
// GET /api/v1/jobs/:id/scorecard
// Get the scorecard for a job
// =============================================================================

func (h *ScorecardHandler) GetScorecard(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil || (user.Role != models.RoleRecruiter && user.Role != models.RoleAdmin) {
		apierror.AccessDenied.Send(c)
		return
	}

	jobID := c.Param("id")

	// Get job with org check
	var job models.Job
	if err := database.Db.First(&job, "id = ?", jobID).Error; err != nil {
		apierror.JobNotFound.Send(c)
		return
	}

	// Check org access (admin can access all)
	if user.Role != models.RoleAdmin && (user.OrgID == nil || !job.BelongsToOrg(*user.OrgID)) {
		apierror.AccessDenied.Send(c)
		return
	}

	// Get scorecard
	var scorecard models.Scorecard
	if err := database.Db.Where("job_id = ?", jobID).First(&scorecard).Error; err != nil {
		apierror.ScorecardNotFound.Send(c)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"scorecard": scorecard.ToResponse(),
	})
}

// =============================================================================
// PATCH /api/v1/jobs/:id/scorecard
// Update the scorecard for a job
// =============================================================================

func (h *ScorecardHandler) UpdateScorecard(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil || (user.Role != models.RoleRecruiter && user.Role != models.RoleAdmin) {
		apierror.AccessDenied.Send(c)
		return
	}

	jobID := c.Param("id")

	// Get job with org check
	var job models.Job
	if err := database.Db.First(&job, "id = ?", jobID).Error; err != nil {
		apierror.JobNotFound.Send(c)
		return
	}

	// Check org access (admin can access all)
	if user.Role != models.RoleAdmin && (user.OrgID == nil || !job.BelongsToOrg(*user.OrgID)) {
		apierror.AccessDenied.Send(c)
		return
	}

	var req UpdateScorecardRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apierror.InvalidData.Send(c)
		return
	}

	// Get existing scorecard
	var scorecard models.Scorecard
	if err := database.Db.Where("job_id = ?", jobID).First(&scorecard).Error; err != nil {
		apierror.ScorecardNotFound.Send(c)
		return
	}

	// Update criteria
	criteriaJSON, err := json.Marshal(req.Criteria)
	if err != nil {
		apierror.SerializationError.Send(c)
		return
	}

	scorecard.Criteria = criteriaJSON

	if err := database.Db.Save(&scorecard).Error; err != nil {
		apierror.UpdateError.Send(c)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"scorecard": scorecard.ToResponse(),
		"message":   "Scorecard updated",
	})
}
