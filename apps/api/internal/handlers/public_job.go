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

type PublicJobHandler struct {
	service *services.PublicJobService
}

func NewPublicJobHandler(service *services.PublicJobService) *PublicJobHandler {
	return &PublicJobHandler{service: service}
}

// =============================================================================
// GET /api/v1/public/jobs
// List public active jobs (no auth required)
// =============================================================================

func (h *PublicJobHandler) ListPublicJobs(c *gin.Context) {
	filters := make(map[string]string)

	if seniority := c.Query("seniority"); seniority != "" {
		filters["seniority"] = seniority
	}
	if locationType := c.Query("location_type"); locationType != "" {
		filters["location_type"] = locationType
	}
	if contractType := c.Query("contract_type"); contractType != "" {
		filters["contract_type"] = contractType
	}
	if search := c.Query("search"); search != "" {
		filters["search"] = search
	}

	jobs, total, err := h.service.ListPublicJobs(filters)
	if err != nil {
		apierror.FetchError.Send(c)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"jobs":  jobs,
		"total": total,
	})
}

// =============================================================================
// GET /api/v1/public/jobs/:slug
// Get a public job by slug (no auth required)
// =============================================================================

func (h *PublicJobHandler) GetPublicJob(c *gin.Context) {
	slug := c.Param("slug")

	job, err := h.service.GetPublicJob(slug)
	if err != nil {
		if errors.Is(err, services.ErrJobNotPublic) {
			apierror.JobNotFound.Send(c)
			return
		}
		apierror.FetchError.Send(c)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"job": job,
	})
}

// =============================================================================
// POST /api/v1/public/jobs/:slug/apply
// Apply to a public job (auth required — creates a WorkSampleAttempt)
// =============================================================================

func (h *PublicJobHandler) ApplyToJob(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		apierror.NotAuthenticated.Send(c)
		return
	}

	// Only candidates can apply
	if user.Role != models.RoleCandidate {
		apierror.AccessDenied.Send(c)
		return
	}

	slug := c.Param("slug")

	attempt, existing, err := h.service.ApplyToJob(slug, user)
	if err != nil {
		if errors.Is(err, services.ErrJobNotPublic) {
			apierror.JobNotFound.Send(c)
			return
		}
		if errors.Is(err, services.ErrWorkSampleNotReady) {
			apierror.ResourceNotAvailable.Send(c)
			return
		}
		apierror.CreateError.Send(c)
		return
	}

	if existing {
		c.JSON(http.StatusOK, gin.H{
			"attempt":  attempt,
			"existing": true,
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"attempt":  attempt,
		"existing": false,
	})
}

// =============================================================================
// GET /api/v1/public/jobs/:slug/my-application
// Check if the current candidate has already applied to a job (auth required)
// =============================================================================

func (h *PublicJobHandler) GetMyApplication(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		apierror.NotAuthenticated.Send(c)
		return
	}

	if user.Role != models.RoleCandidate {
		c.JSON(http.StatusOK, gin.H{"applied": false})
		return
	}

	slug := c.Param("slug")

	attempt, applied, err := h.service.GetMyApplication(slug, user)
	if err != nil {
		if errors.Is(err, services.ErrJobNotPublic) {
			apierror.JobNotFound.Send(c)
			return
		}
		apierror.FetchError.Send(c)
		return
	}

	if !applied {
		c.JSON(http.StatusOK, gin.H{"applied": false})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"applied": true,
		"attempt": gin.H{
			"id":       attempt.ID,
			"status":   attempt.Status,
			"progress": attempt.Progress,
		},
	})
}

// =============================================================================
// GET /api/v1/public/jobs/my-applications
// List all jobs the current candidate has applied to (auth required)
// =============================================================================

func (h *PublicJobHandler) GetMyApplications(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		apierror.NotAuthenticated.Send(c)
		return
	}

	if user.Role != models.RoleCandidate {
		c.JSON(http.StatusOK, gin.H{"applications": []gin.H{}})
		return
	}

	applications, err := h.service.GetMyApplications(user.ID)
	if err != nil {
		apierror.FetchError.Send(c)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"applications": applications,
	})
}
