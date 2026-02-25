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

type DecisionMemoHandler struct {
	service *services.DecisionMemoService
}

func NewDecisionMemoHandler(service *services.DecisionMemoService) *DecisionMemoHandler {
	return &DecisionMemoHandler{service: service}
}

// GetOrInitDecisionMemo returns the decision memo for a candidate, creating a draft if none exists
// GET /api/v1/jobs/:id/candidates/:candidate_id/decision-memo
func (h *DecisionMemoHandler) GetOrInitDecisionMemo(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		apierror.NotAuthenticated.Send(c)
		return
	}

	if user.Role != models.RoleRecruiter && user.Role != models.RoleAdmin {
		apierror.AccessDenied.Send(c)
		return
	}

	jobID := c.Param("id")
	candidateID := c.Param("candidate_id")

	result, err := h.service.GetOrInit(jobID, candidateID, user)
	if err != nil {
		mapDecisionMemoError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"decision_memo": result.Memo.ToResponse(),
		"candidate": gin.H{
			"id":         result.Candidate.ID,
			"name":       result.Candidate.Name,
			"email":      result.Candidate.Email,
			"avatar_url": result.Candidate.AvatarURL,
		},
		"job": gin.H{
			"id":    result.Job.ID,
			"title": result.Job.Title,
		},
	})
}

// SaveDecisionMemo saves draft updates to a decision memo
// PATCH /api/v1/jobs/:id/candidates/:candidate_id/decision-memo
func (h *DecisionMemoHandler) SaveDecisionMemo(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		apierror.NotAuthenticated.Send(c)
		return
	}

	if user.Role != models.RoleRecruiter && user.Role != models.RoleAdmin {
		apierror.AccessDenied.Send(c)
		return
	}

	jobID := c.Param("id")
	candidateID := c.Param("candidate_id")

	var updates services.DecisionMemoUpdates
	if err := c.ShouldBindJSON(&updates); err != nil {
		apierror.InvalidData.Send(c)
		return
	}

	memo, err := h.service.Save(jobID, candidateID, &updates, user)
	if err != nil {
		mapDecisionMemoError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       "Decision Memo saved",
		"decision_memo": memo.ToResponse(),
	})
}

// SubmitDecisionMemo finalizes a decision memo and triggers post-submission actions
// POST /api/v1/jobs/:id/candidates/:candidate_id/decision-memo/submit
func (h *DecisionMemoHandler) SubmitDecisionMemo(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		apierror.NotAuthenticated.Send(c)
		return
	}

	if user.Role != models.RoleRecruiter && user.Role != models.RoleAdmin {
		apierror.AccessDenied.Send(c)
		return
	}

	jobID := c.Param("id")
	candidateID := c.Param("candidate_id")

	memo, err := h.service.Submit(jobID, candidateID, user)
	if err != nil {
		mapDecisionMemoError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       "Decision Memo submitted",
		"decision_memo": memo.ToResponse(),
	})
}

// mapDecisionMemoError maps service-layer errors to the appropriate apierror responses.
func mapDecisionMemoError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, services.ErrJobNotFound):
		apierror.JobNotFound.Send(c)
	case errors.Is(err, services.ErrCandidateNotFound):
		apierror.CandidateNotFound.Send(c)
	case errors.Is(err, services.ErrDecisionMemoNotFound):
		apierror.DecisionMemoNotFound.Send(c)
	case errors.Is(err, services.ErrDecisionMemoAlreadySub):
		apierror.AlreadySubmitted.Send(c)
	case errors.Is(err, services.ErrInvalidDecision):
		apierror.DecisionRequired.Send(c)
	case errors.Is(err, services.ErrMissingJustification):
		apierror.JustificationRequired.Send(c)
	case errors.Is(err, services.ErrDecisionMemoIncomplete):
		apierror.MissingRequiredFields.Send(c)
	case errors.Is(err, services.ErrNoOrg) || errors.Is(err, services.ErrOrgMismatch):
		apierror.AccessDenied.Send(c)
	default:
		apierror.FetchError.Send(c)
	}
}
