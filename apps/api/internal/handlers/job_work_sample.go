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

type JobWorkSampleHandler struct {
	workSampleService *services.JobWorkSampleService
}

func NewJobWorkSampleHandler(workSampleService *services.JobWorkSampleService) *JobWorkSampleHandler {
	return &JobWorkSampleHandler{
		workSampleService: workSampleService,
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
		apierror.AccessDenied.Send(c)
		return
	}

	jobID := c.Param("id")

	workSample, err := h.workSampleService.Generate(jobID, user)
	if err != nil {
		if errors.Is(err, services.ErrJobNotFound) {
			apierror.JobNotFound.Send(c)
			return
		}
		if errors.Is(err, services.ErrNoOrg) || errors.Is(err, services.ErrOrgMismatch) {
			apierror.AccessDenied.Send(c)
			return
		}
		if errors.Is(err, services.ErrNoScorecard) {
			apierror.NoScorecard.Send(c)
			return
		}
		if errors.Is(err, services.ErrAIUnavailable) {
			apierror.AIUnavailable.Send(c)
			return
		}
		apierror.AIError.Send(c)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"work_sample": workSample.ToResponse(),
		"message":     "Work sample generated successfully",
	})
}

// =============================================================================
// GET /api/v1/jobs/:id/work-sample
// Get the work sample for a job
// =============================================================================

func (h *JobWorkSampleHandler) GetWorkSample(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil || (user.Role != models.RoleRecruiter && user.Role != models.RoleAdmin) {
		apierror.AccessDenied.Send(c)
		return
	}

	jobID := c.Param("id")

	workSample, err := h.workSampleService.Get(jobID, user)
	if err != nil {
		if errors.Is(err, services.ErrJobNotFound) {
			apierror.JobNotFound.Send(c)
			return
		}
		if errors.Is(err, services.ErrNoOrg) || errors.Is(err, services.ErrOrgMismatch) {
			apierror.AccessDenied.Send(c)
			return
		}
		if errors.Is(err, services.ErrWorkSampleNotFound) {
			apierror.WorkSampleNotFound.Send(c)
			return
		}
		apierror.FetchError.Send(c)
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
		apierror.AccessDenied.Send(c)
		return
	}

	jobID := c.Param("id")

	var req UpdateJobWorkSampleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apierror.InvalidData.Send(c)
		return
	}

	workSample, err := h.workSampleService.Update(jobID, req.IntroMessage, req.Rules, req.Sections, user)
	if err != nil {
		if errors.Is(err, services.ErrJobNotFound) {
			apierror.JobNotFound.Send(c)
			return
		}
		if errors.Is(err, services.ErrNoOrg) || errors.Is(err, services.ErrOrgMismatch) {
			apierror.AccessDenied.Send(c)
			return
		}
		if errors.Is(err, services.ErrWorkSampleNotFound) {
			apierror.WorkSampleNotFound.Send(c)
			return
		}
		apierror.UpdateError.Send(c)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"work_sample": workSample.ToResponse(),
		"message":     "Work sample updated",
	})
}
