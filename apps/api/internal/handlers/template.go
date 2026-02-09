package handlers

import (
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/baaraco/baara/apps/api/internal/middleware"
	"github.com/baaraco/baara/apps/api/internal/services"
	"github.com/baaraco/baara/pkg/apierror"
	"github.com/baaraco/baara/pkg/models"
)

type TemplateHandler struct {
	evaluationService *services.EvaluationService
}

func NewTemplateHandler(evaluationService *services.EvaluationService) *TemplateHandler {
	return &TemplateHandler{
		evaluationService: evaluationService,
	}
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

// =============================================================================
// GET /api/v1/templates
// List all available evaluation templates (public)
// =============================================================================

func (h *TemplateHandler) ListTemplates(c *gin.Context) {
	templates, err := h.evaluationService.ListTemplates()
	if err != nil {
		apierror.FetchError.Send(c)
		return
	}

	responses := make([]TemplateResponse, 0, len(templates))
	for _, tmpl := range templates {
		responses = append(responses, TemplateResponse{
			ID:                   tmpl.ID,
			RoleType:             tmpl.RoleType,
			Title:                tmpl.Title,
			Description:          tmpl.Description,
			EstimatedTimeMinutes: tmpl.EstimatedTimeMinutes,
			CriteriaCount:        len(tmpl.GetCriteria()),
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"templates": responses,
		"total":     len(responses),
	})
}

// =============================================================================
// GET /api/v1/templates/:role_type
// Get a specific template by role type (public)
// =============================================================================

func (h *TemplateHandler) GetTemplate(c *gin.Context) {
	roleType := c.Param("role_type")

	tmpl, err := h.evaluationService.GetTemplate(roleType)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrInvalidRoleType):
			apierror.InvalidRoleType.Send(c)
		case errors.Is(err, services.ErrTemplateNotFound):
			apierror.TemplateNotFound.Send(c)
		default:
			apierror.FetchError.Send(c)
		}
		return
	}

	resp := tmpl.ToResponse()

	c.JSON(http.StatusOK, gin.H{
		"template": TemplateResponse{
			ID:                   tmpl.ID,
			RoleType:             tmpl.RoleType,
			Title:                tmpl.Title,
			Description:          tmpl.Description,
			EstimatedTimeMinutes: tmpl.EstimatedTimeMinutes,
			CriteriaCount:        len(resp.Criteria),
		},
		"criteria": resp.Criteria,
		"sections": resp.Sections,
	})
}

// =============================================================================
// POST /api/v1/templates/:role_type/start
// Start an autonomous evaluation from a template (auth required)
// Creates a work sample attempt linked to the evaluation template
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

	result, cooldownInfo, err := h.evaluationService.StartEvaluation(user.ID, roleType)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrInvalidRoleType):
			apierror.InvalidRoleType.Send(c)
		case errors.Is(err, services.ErrTemplateNotFound):
			apierror.TemplateNotFound.Send(c)
		case errors.Is(err, services.ErrCooldownActive):
			apierror.CooldownActive.SendWithDetails(c, map[string]string{
				"cooldown_end":   cooldownInfo.CooldownEnd.Format(time.RFC3339),
				"remaining_days": fmt.Sprintf("%d", cooldownInfo.RemainingDays),
			})
		default:
			apierror.CreateError.Send(c)
		}
		return
	}

	status := http.StatusCreated
	message := "Evaluation started"
	if result.Existing {
		status = http.StatusOK
		message = "Existing attempt found"
	}

	c.JSON(status, gin.H{
		"attempt":  result.Attempt.ToResponse(),
		"message":  message,
		"existing": result.Existing,
	})
}

// =============================================================================
// GET /api/v1/proof-profiles/public/:slug
// Get a public proof profile by slug (no auth required)
// =============================================================================

func (h *TemplateHandler) GetPublicProofProfile(c *gin.Context) {
	slug := c.Param("slug")

	profile, roleType, err := h.evaluationService.GetPublicProofProfile(slug)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrProfileNotFound):
			apierror.ProofProfileNotFound.Send(c)
		default:
			apierror.FetchError.Send(c)
		}
		return
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

	profile, err := h.evaluationService.UpdateProofProfileVisibility(user.ID, req.IsPublic)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrProfileNotFound):
			apierror.ProofProfileNotFound.Send(c)
		default:
			apierror.UpdateError.Send(c)
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"proof_profile": profile.ToResponse(),
		"message":       "Visibility updated",
	})
}
