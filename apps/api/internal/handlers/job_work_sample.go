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

type JobWorkSampleHandler struct {
	aiClient ai.Generator
}

func NewJobWorkSampleHandler() *JobWorkSampleHandler {
	return &JobWorkSampleHandler{
		aiClient: ai.NewClient(),
	}
}

// NewJobWorkSampleHandlerWithClient creates a handler with a custom AI client (for testing)
func NewJobWorkSampleHandlerWithClient(client ai.Generator) *JobWorkSampleHandler {
	return &JobWorkSampleHandler{
		aiClient: client,
	}
}

// =============================================================================
// Request/Response types
// =============================================================================

type UpdateJobWorkSampleRequest struct {
	IntroMessage string                     `json:"intro_message"`
	Rules        []string                   `json:"rules"`
	Sections     []models.WorkSampleSection `json:"sections" binding:"required"`
}

// =============================================================================
// POST /api/v1/jobs/:id/generate-work-sample
// Generate work sample scenarios for a job using AI
// =============================================================================

func (h *JobWorkSampleHandler) GenerateWorkSample(c *gin.Context) {
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

	// Check if scorecard exists - it's required for work sample generation
	var scorecard models.Scorecard
	if err := database.Db.Where("job_id = ?", jobID).First(&scorecard).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Un scorecard doit d'abord être généré pour ce poste"})
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

	input := ai.WorkSampleInput{
		Title:            job.Title,
		Team:             job.Team,
		Seniority:        string(job.Seniority),
		Stack:            stack,
		BusinessContext:  job.BusinessContext,
		MainProblem:      job.MainProblem,
		ExpectedOutcomes: outcomes,
		SuccessLooksLike: job.SuccessLooksLike,
		Criteria:         scorecard.GetCriteria(),
	}

	// Generate work sample using AI
	generated, err := h.aiClient.GenerateWorkSample(input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la génération du work sample: " + err.Error()})
		return
	}

	// Convert to JSON for storage
	sectionsJSON, err := json.Marshal(generated.Sections)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur de sérialisation des sections"})
		return
	}

	rulesJSON, err := json.Marshal(generated.Rules)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur de sérialisation des règles"})
		return
	}

	now := time.Now()
	promptVersion := ai.GetWorkSamplePromptVersion()

	// Check if work sample already exists for this job
	var workSample models.JobWorkSample
	result := database.Db.Where("job_id = ?", jobID).First(&workSample)

	if result.Error == nil {
		// Update existing work sample
		workSample.ScorecardID = &scorecard.ID
		workSample.IntroMessage = generated.IntroMessage
		workSample.Rules = rulesJSON
		workSample.Sections = sectionsJSON
		workSample.EstimatedTimeMinutes = generated.EstimatedTimeMinutes
		workSample.GeneratedAt = &now
		workSample.PromptVersion = promptVersion

		if err := database.Db.Save(&workSample).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la mise à jour du work sample"})
			return
		}
	} else {
		// Create new work sample
		workSample = models.JobWorkSample{
			JobID:                jobID,
			ScorecardID:          &scorecard.ID,
			IntroMessage:         generated.IntroMessage,
			Rules:                rulesJSON,
			Sections:             sectionsJSON,
			EstimatedTimeMinutes: generated.EstimatedTimeMinutes,
			GeneratedAt:          &now,
			PromptVersion:        promptVersion,
		}

		if err := database.Db.Create(&workSample).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la création du work sample"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"work_sample": workSample.ToResponse(),
		"message":     "Work sample généré avec succès",
	})
}

// =============================================================================
// GET /api/v1/jobs/:id/work-sample
// Get the work sample for a job
// =============================================================================

func (h *JobWorkSampleHandler) GetWorkSample(c *gin.Context) {
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

	// Get work sample
	var workSample models.JobWorkSample
	if err := database.Db.Where("job_id = ?", jobID).First(&workSample).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Work sample non trouvé"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"work_sample": workSample.ToResponse(),
	})
}

// =============================================================================
// PATCH /api/v1/jobs/:id/work-sample
// Update the work sample for a job
// =============================================================================

func (h *JobWorkSampleHandler) UpdateWorkSample(c *gin.Context) {
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

	var req UpdateJobWorkSampleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get existing work sample
	var workSample models.JobWorkSample
	if err := database.Db.Where("job_id = ?", jobID).First(&workSample).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Work sample non trouvé"})
		return
	}

	// Update fields
	if req.IntroMessage != "" {
		workSample.IntroMessage = req.IntroMessage
	}

	if req.Rules != nil {
		rulesJSON, err := json.Marshal(req.Rules)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur de sérialisation des règles"})
			return
		}
		workSample.Rules = rulesJSON
	}

	sectionsJSON, err := json.Marshal(req.Sections)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur de sérialisation des sections"})
		return
	}
	workSample.Sections = sectionsJSON

	// Recalculate estimated time
	var totalTime int
	for _, section := range req.Sections {
		totalTime += section.EstimatedTimeMinutes
	}
	workSample.EstimatedTimeMinutes = &totalTime

	if err := database.Db.Save(&workSample).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la mise à jour"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"work_sample": workSample.ToResponse(),
		"message":     "Work sample mis à jour",
	})
}
