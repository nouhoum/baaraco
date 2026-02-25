package handlers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/baaraco/baara/apps/api/internal/middleware"
	"github.com/baaraco/baara/apps/api/internal/services"
	"github.com/baaraco/baara/pkg/apierror"
	"github.com/baaraco/baara/pkg/models"
)

type EvaluationHandler struct {
	evaluationService *services.EvaluationHandlerService
}

func NewEvaluationHandler(evaluationService *services.EvaluationHandlerService) *EvaluationHandler {
	return &EvaluationHandler{evaluationService: evaluationService}
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

	evaluation, err := h.evaluationService.GetEvaluation(evaluationID, user)
	if err != nil {
		if errors.Is(err, services.ErrEvaluationNotFound) {
			apierror.EvaluationNotFound.Send(c)
			return
		}
		if errors.Is(err, services.ErrNoOrg) || errors.Is(err, services.ErrOrgMismatch) {
			apierror.AccessDenied.Send(c)
			return
		}
		apierror.FetchError.Send(c)
		return
	}

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

	evaluation, err := h.evaluationService.GetEvaluationByAttempt(attemptID, user)
	if err != nil {
		if errors.Is(err, services.ErrAttemptNotFound) {
			apierror.AttemptNotFound.Send(c)
			return
		}
		if errors.Is(err, services.ErrEvaluationNotFound) {
			apierror.ResourceNotAvailable.Send(c)
			return
		}
		if errors.Is(err, services.ErrNoOrg) || errors.Is(err, services.ErrOrgMismatch) {
			apierror.AccessDenied.Send(c)
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

	evaluations, err := h.evaluationService.ListEvaluationsForJob(jobID, user)
	if err != nil {
		if errors.Is(err, services.ErrJobNotFound) {
			apierror.JobNotFound.Send(c)
			return
		}
		if errors.Is(err, services.ErrNoOrg) || errors.Is(err, services.ErrOrgMismatch) {
			apierror.OrgMismatch.Send(c)
			return
		}
		apierror.FetchError.Send(c)
		return
	}

	// Convert to responses
	responses := make([]*models.EvaluationResponse, len(evaluations))
	for i := range evaluations {
		responses[i] = evaluations[i].ToResponse()
	}

	c.JSON(http.StatusOK, gin.H{
		"evaluations": responses,
		"total":       len(responses),
	})
}
