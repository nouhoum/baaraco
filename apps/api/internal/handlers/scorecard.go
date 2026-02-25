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

type ScorecardHandler struct {
	scorecardService *services.ScorecardService
}

func NewScorecardHandler(scorecardService *services.ScorecardService) *ScorecardHandler {
	return &ScorecardHandler{
		scorecardService: scorecardService,
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

	scorecard, err := h.scorecardService.Generate(jobID, user)
	if err != nil {
		if errors.Is(err, services.ErrJobNotFound) {
			apierror.JobNotFound.Send(c)
			return
		}
		if errors.Is(err, services.ErrNoOrg) || errors.Is(err, services.ErrOrgMismatch) {
			apierror.AccessDenied.Send(c)
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

	scorecard, err := h.scorecardService.Get(jobID, user)
	if err != nil {
		if errors.Is(err, services.ErrJobNotFound) {
			apierror.JobNotFound.Send(c)
			return
		}
		if errors.Is(err, services.ErrNoOrg) || errors.Is(err, services.ErrOrgMismatch) {
			apierror.AccessDenied.Send(c)
			return
		}
		if errors.Is(err, services.ErrScorecardNotFound) {
			apierror.ScorecardNotFound.Send(c)
			return
		}
		apierror.FetchError.Send(c)
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

	var req UpdateScorecardRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apierror.InvalidData.Send(c)
		return
	}

	scorecard, err := h.scorecardService.Update(jobID, req.Criteria, user)
	if err != nil {
		if errors.Is(err, services.ErrJobNotFound) {
			apierror.JobNotFound.Send(c)
			return
		}
		if errors.Is(err, services.ErrNoOrg) || errors.Is(err, services.ErrOrgMismatch) {
			apierror.AccessDenied.Send(c)
			return
		}
		if errors.Is(err, services.ErrScorecardNotFound) {
			apierror.ScorecardNotFound.Send(c)
			return
		}
		apierror.UpdateError.Send(c)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"scorecard": scorecard.ToResponse(),
		"message":   "Scorecard updated",
	})
}
