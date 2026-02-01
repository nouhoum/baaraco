package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/baaraco/baara/apps/api/internal/middleware"
	"github.com/baaraco/baara/pkg/apierror"
	"github.com/baaraco/baara/pkg/database"
	"github.com/baaraco/baara/pkg/models"
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
		apierror.NotAuthenticated.Send(c)
		return
	}

	evaluationID := c.Param("id")

	var evaluation models.Evaluation
	if err := database.Db.Preload("Job").First(&evaluation, "id = ?", evaluationID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			apierror.EvaluationNotFound.Send(c)
			return
		}
		apierror.FetchError.Send(c)
		return
	}

	// Check access rights
	// - Candidate can only see their own evaluation
	// - Recruiter/Admin can see evaluations for their org's jobs
	switch user.Role {
	case models.RoleCandidate:
		if evaluation.CandidateID != user.ID {
			apierror.AccessDenied.Send(c)
			return
		}
	case models.RoleRecruiter:
		// Load job to check org
		var job models.Job
		if err := database.Db.First(&job, "id = ?", evaluation.JobID).Error; err != nil {
			apierror.AccessDenied.Send(c)
			return
		}
		if user.OrgID == nil || !job.BelongsToOrg(*user.OrgID) {
			apierror.OrgMismatch.Send(c)
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
		apierror.NotAuthenticated.Send(c)
		return
	}

	attemptID := c.Param("id")

	// First load the attempt to check ownership
	var attempt models.WorkSampleAttempt
	if err := database.Db.First(&attempt, "id = ?", attemptID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			apierror.AttemptNotFound.Send(c)
			return
		}
		apierror.FetchError.Send(c)
		return
	}

	// Check access
	if user.Role == models.RoleCandidate {
		if attempt.CandidateID != user.ID {
			apierror.AccessDenied.Send(c)
			return
		}
	} else if user.Role == models.RoleRecruiter && attempt.JobID != nil {
		var job models.Job
		if err := database.Db.First(&job, "id = ?", *attempt.JobID).Error; err != nil {
			apierror.AccessDenied.Send(c)
			return
		}
		if user.OrgID == nil || !job.BelongsToOrg(*user.OrgID) {
			apierror.OrgMismatch.Send(c)
			return
		}
	}

	// Load evaluation for this attempt
	var evaluation models.Evaluation
	if err := database.Db.Where("attempt_id = ?", attemptID).First(&evaluation).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// Evaluation not ready yet
			apierror.ResourceNotAvailable.Send(c)
			return
		}
		apierror.FetchError.Send(c)
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
		apierror.NotAuthenticated.Send(c)
		return
	}

	// Only recruiters and admins can list evaluations
	if user.Role != models.RoleRecruiter && user.Role != models.RoleAdmin {
		apierror.RoleRequired.Send(c)
		return
	}

	jobID := c.Param("id")

	// Load job to check org
	var job models.Job
	if err := database.Db.First(&job, "id = ?", jobID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			apierror.JobNotFound.Send(c)
			return
		}
		apierror.FetchError.Send(c)
		return
	}

	// Check org access for recruiters
	if user.Role == models.RoleRecruiter {
		if user.OrgID == nil || !job.BelongsToOrg(*user.OrgID) {
			apierror.OrgMismatch.Send(c)
			return
		}
	}

	// Load evaluations
	var evaluations []models.Evaluation
	if err := database.Db.Preload("Candidate").Where("job_id = ?", jobID).Order("created_at DESC").Find(&evaluations).Error; err != nil {
		apierror.FetchError.Send(c)
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
