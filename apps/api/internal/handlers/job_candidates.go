package handlers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/baaraco/baara/apps/api/internal/middleware"
	"github.com/baaraco/baara/apps/api/internal/services"
	"github.com/baaraco/baara/pkg/apierror"
	"github.com/baaraco/baara/pkg/models"
)

type JobCandidatesHandler struct {
	jobCandidatesService *services.JobCandidatesService
}

func NewJobCandidatesHandler(jobCandidatesService *services.JobCandidatesService) *JobCandidatesHandler {
	return &JobCandidatesHandler{
		jobCandidatesService: jobCandidatesService,
	}
}

// ListJobCandidates returns the list of candidates for a specific job
// GET /api/v1/jobs/:id/candidates
func (h *JobCandidatesHandler) ListJobCandidates(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		apierror.NotAuthenticated.Send(c)
		return
	}

	// Only recruiters and admins
	if user.Role != models.RoleRecruiter && user.Role != models.RoleAdmin {
		apierror.AccessDenied.Send(c)
		return
	}

	jobID := c.Param("id")

	// Parse query parameters
	statusFilter := c.Query("status")
	minScoreStr := c.Query("min_score")
	search := c.Query("search")
	sortBy := c.DefaultQuery("sort", "score_desc")
	pageStr := c.DefaultQuery("page", "1")
	perPageStr := c.DefaultQuery("per_page", "50")

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}
	perPage, err := strconv.Atoi(perPageStr)
	if err != nil || perPage < 1 || perPage > 100 {
		perPage = 50
	}

	var minScore int
	if minScoreStr != "" {
		if parsed, err := strconv.Atoi(minScoreStr); err == nil && parsed > 0 {
			minScore = parsed
		}
	}

	filters := services.CandidateFilters{
		Status:   statusFilter,
		MinScore: minScore,
		Search:   search,
		SortBy:   sortBy,
		Page:     page,
		PerPage:  perPage,
	}

	result, err := h.jobCandidatesService.ListCandidates(jobID, user, filters)
	if err != nil {
		if errors.Is(err, services.ErrJobNotFound) {
			apierror.JobNotFound.Send(c)
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
		"candidates": result.Candidates,
		"total":      result.Total,
		"page":       page,
		"per_page":   perPage,
		"job": gin.H{
			"id":     result.JobID,
			"title":  result.JobTitle,
			"status": result.JobStatus,
		},
		"stats": gin.H{
			"total":       result.Stats.Total,
			"submitted":   result.Stats.Submitted,
			"reviewed":    result.Stats.Reviewed,
			"shortlisted": result.Stats.Shortlisted,
			"rejected":    result.Stats.Rejected,
			"hired":       result.Stats.Hired,
		},
	})
}

// UpdateCandidateStatus updates a candidate's status for a job
// PATCH /api/v1/jobs/:id/candidates/:candidate_id
func (h *JobCandidatesHandler) UpdateCandidateStatus(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		apierror.NotAuthenticated.Send(c)
		return
	}

	// Only recruiters and admins
	if user.Role != models.RoleRecruiter && user.Role != models.RoleAdmin {
		apierror.AccessDenied.Send(c)
		return
	}

	jobID := c.Param("id")
	candidateID := c.Param("candidate_id")

	// Parse body
	var body struct {
		Status          string `json:"status" binding:"required"`
		RejectionReason string `json:"rejection_reason"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		apierror.InvalidData.Send(c)
		return
	}

	// Validate status (keep the same validation as the original handler)
	if body.Status != "shortlisted" && body.Status != "rejected" && body.Status != "hired" {
		apierror.InvalidStatus.Send(c)
		return
	}

	err := h.jobCandidatesService.UpdateCandidateStatus(jobID, candidateID, body.Status, body.RejectionReason, user)
	if err != nil {
		if errors.Is(err, services.ErrJobNotFound) {
			apierror.JobNotFound.Send(c)
			return
		}
		if errors.Is(err, services.ErrNoOrg) || errors.Is(err, services.ErrOrgMismatch) {
			apierror.AccessDenied.Send(c)
			return
		}
		if errors.Is(err, services.ErrInvalidCandidateStatus) {
			apierror.InvalidStatus.Send(c)
			return
		}
		if errors.Is(err, services.ErrJobCandidateNotFound) {
			apierror.AttemptNotFound.Send(c)
			return
		}
		apierror.UpdateError.Send(c)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Status updated",
		"status":  body.Status,
	})
}
