package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/baaraco/baara/apps/api/internal/middleware"
	"github.com/baaraco/baara/pkg/ai"
	"github.com/baaraco/baara/pkg/database"
	"github.com/baaraco/baara/pkg/models"
	"github.com/gin-gonic/gin"
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
		c.JSON(http.StatusForbidden, gin.H{"error": "Accès non autorisé"})
		return
	}

	jobID := c.Param("id")

	// Get job with org check
	var job models.Job
	if err := database.Db.First(&job, "id = ?", jobID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Poste non trouvé"})
		return
	}

	// Check org access (admin can access all)
	if user.Role != models.RoleAdmin && (user.OrgID == nil || *user.OrgID != job.OrgID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Accès non autorisé à ce poste"})
		return
	}

	// Check if AI client is configured
	if !h.aiClient.IsConfigured() {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Service IA non configuré"})
		return
	}

	// Build input for AI
	var stack []string
	if len(job.Stack) > 0 {
		json.Unmarshal(job.Stack, &stack)
	}
	var outcomes []string
	if len(job.ExpectedOutcomes) > 0 {
		json.Unmarshal(job.ExpectedOutcomes, &outcomes)
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la génération des critères: " + err.Error()})
		return
	}

	// Convert criteria to JSON
	criteriaJSON, err := json.Marshal(criteria)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur de sérialisation"})
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
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la mise à jour du scorecard"})
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
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la création du scorecard"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"scorecard": scorecard.ToResponse(),
		"message":   "Scorecard généré avec succès",
	})
}

// =============================================================================
// GET /api/v1/jobs/:id/scorecard
// Get the scorecard for a job
// =============================================================================

func (h *ScorecardHandler) GetScorecard(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil || (user.Role != models.RoleRecruiter && user.Role != models.RoleAdmin) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Accès non autorisé"})
		return
	}

	jobID := c.Param("id")

	// Get job with org check
	var job models.Job
	if err := database.Db.First(&job, "id = ?", jobID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Poste non trouvé"})
		return
	}

	// Check org access (admin can access all)
	if user.Role != models.RoleAdmin && (user.OrgID == nil || *user.OrgID != job.OrgID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Accès non autorisé à ce poste"})
		return
	}

	// Get scorecard
	var scorecard models.Scorecard
	if err := database.Db.Where("job_id = ?", jobID).First(&scorecard).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Scorecard non trouvé"})
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
		c.JSON(http.StatusForbidden, gin.H{"error": "Accès non autorisé"})
		return
	}

	jobID := c.Param("id")

	// Get job with org check
	var job models.Job
	if err := database.Db.First(&job, "id = ?", jobID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Poste non trouvé"})
		return
	}

	// Check org access (admin can access all)
	if user.Role != models.RoleAdmin && (user.OrgID == nil || *user.OrgID != job.OrgID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Accès non autorisé à ce poste"})
		return
	}

	var req UpdateScorecardRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get existing scorecard
	var scorecard models.Scorecard
	if err := database.Db.Where("job_id = ?", jobID).First(&scorecard).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Scorecard non trouvé"})
		return
	}

	// Update criteria
	criteriaJSON, err := json.Marshal(req.Criteria)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur de sérialisation"})
		return
	}

	scorecard.Criteria = criteriaJSON

	if err := database.Db.Save(&scorecard).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la mise à jour"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"scorecard": scorecard.ToResponse(),
		"message":   "Scorecard mis à jour",
	})
}
