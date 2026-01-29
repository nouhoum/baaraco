package handlers

import (
	"net/http"

	"github.com/baaraco/baara/apps/api/internal/middleware"
	"github.com/baaraco/baara/pkg/database"
	"github.com/baaraco/baara/pkg/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type EvaluationHandler struct{}

func NewEvaluationHandler() *EvaluationHandler {
	return &EvaluationHandler{}
}

// GetEvaluation returns an evaluation by ID
// GET /api/v1/evaluations/:id
func (h *EvaluationHandler) GetEvaluation(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Non authentifié"})
		return
	}

	evaluationID := c.Param("id")

	var evaluation models.Evaluation
	if err := database.Db.Preload("Job").First(&evaluation, "id = ?", evaluationID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Évaluation non trouvée"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération"})
		return
	}

	// Check access rights
	// - Candidate can only see their own evaluation
	// - Recruiter/Admin can see evaluations for their org's jobs
	if user.Role == models.RoleCandidate {
		if evaluation.CandidateID != user.ID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Accès non autorisé"})
			return
		}
	} else if user.Role == models.RoleRecruiter {
		// Load job to check org
		var job models.Job
		if err := database.Db.First(&job, "id = ?", evaluation.JobID).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "Accès non autorisé"})
			return
		}
		if user.OrgID == nil || *user.OrgID != job.OrgID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Accès non autorisé"})
			return
		}
	}
	// Admin has full access

	c.JSON(http.StatusOK, gin.H{
		"evaluation": evaluation.ToResponse(),
	})
}

// GetEvaluationByAttempt returns an evaluation for a specific attempt
// GET /api/v1/work-sample-attempts/:id/evaluation
func (h *EvaluationHandler) GetEvaluationByAttempt(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Non authentifié"})
		return
	}

	attemptID := c.Param("id")

	// First load the attempt to check ownership
	var attempt models.WorkSampleAttempt
	if err := database.Db.First(&attempt, "id = ?", attemptID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Tentative non trouvée"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération"})
		return
	}

	// Check access
	if user.Role == models.RoleCandidate {
		if attempt.CandidateID != user.ID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Accès non autorisé"})
			return
		}
	} else if user.Role == models.RoleRecruiter && attempt.JobID != nil {
		var job models.Job
		if err := database.Db.First(&job, "id = ?", *attempt.JobID).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "Accès non autorisé"})
			return
		}
		if user.OrgID == nil || *user.OrgID != job.OrgID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Accès non autorisé"})
			return
		}
	}

	// Load evaluation for this attempt
	var evaluation models.Evaluation
	if err := database.Db.Where("attempt_id = ?", attemptID).First(&evaluation).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// Evaluation not ready yet
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "Évaluation non disponible",
				"message": "L'évaluation est en cours de génération",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"evaluation": evaluation.ToResponse(),
	})
}

// ListEvaluationsForJob returns all evaluations for a job
// GET /api/v1/jobs/:id/evaluations
func (h *EvaluationHandler) ListEvaluationsForJob(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Non authentifié"})
		return
	}

	// Only recruiters and admins can list evaluations
	if user.Role != models.RoleRecruiter && user.Role != models.RoleAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Accès non autorisé"})
		return
	}

	jobID := c.Param("id")

	// Load job to check org
	var job models.Job
	if err := database.Db.First(&job, "id = ?", jobID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Poste non trouvé"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération"})
		return
	}

	// Check org access for recruiters
	if user.Role == models.RoleRecruiter {
		if user.OrgID == nil || *user.OrgID != job.OrgID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Accès non autorisé"})
			return
		}
	}

	// Load evaluations
	var evaluations []models.Evaluation
	if err := database.Db.Preload("Candidate").Where("job_id = ?", jobID).Order("created_at DESC").Find(&evaluations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération"})
		return
	}

	// Convert to responses
	responses := make([]*models.EvaluationResponse, len(evaluations))
	for i, eval := range evaluations {
		responses[i] = eval.ToResponse()
	}

	c.JSON(http.StatusOK, gin.H{
		"evaluations": responses,
		"total":       len(responses),
	})
}
