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

type InterviewKitHandler struct {
	interviewKitService *services.InterviewKitService
}

func NewInterviewKitHandler(interviewKitService *services.InterviewKitService) *InterviewKitHandler {
	return &InterviewKitHandler{
		interviewKitService: interviewKitService,
	}
}

// GetInterviewKitForCandidate returns the interview kit for a specific candidate in a job
// GET /api/v1/jobs/:id/candidates/:candidate_id/interview-kit
func (h *InterviewKitHandler) GetInterviewKitForCandidate(c *gin.Context) {
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

	result, err := h.interviewKitService.GetForCandidate(jobID, candidateID, user)
	if err != nil {
		if errors.Is(err, services.ErrJobNotFound) {
			apierror.JobNotFound.Send(c)
			return
		}
		if errors.Is(err, services.ErrNoOrg) || errors.Is(err, services.ErrOrgMismatch) {
			apierror.AccessDenied.Send(c)
			return
		}
		if errors.Is(err, services.ErrNoProofProfile) || errors.Is(err, services.ErrInterviewKitNotFound) {
			apierror.InterviewKitNotFound.SendWithDetails(c, map[string]string{
				"message": "The Interview Kit is being generated",
			})
			return
		}
		apierror.FetchError.Send(c)
		return
	}

	kit := result.Kit

	// Build candidate info
	candidateInfo := gin.H{
		"id":    kit.CandidateID,
		"name":  "",
		"email": "",
	}
	if kit.Candidate != nil {
		candidateInfo["name"] = kit.Candidate.Name
		candidateInfo["email"] = kit.Candidate.Email
		candidateInfo["avatar_url"] = kit.Candidate.AvatarURL
	}

	c.JSON(http.StatusOK, gin.H{
		"interview_kit": kit.ToResponse(),
		"candidate":     candidateInfo,
		"job": gin.H{
			"id":    result.JobID,
			"title": result.JobTitle,
		},
	})
}

// SaveInterviewKitNotes saves the recruiter's notes for an interview kit
// PATCH /api/v1/jobs/:id/candidates/:candidate_id/interview-kit/notes
func (h *InterviewKitHandler) SaveInterviewKitNotes(c *gin.Context) {
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
		Notes map[string]string `json:"notes" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		apierror.InvalidData.Send(c)
		return
	}

	mergedNotes, err := h.interviewKitService.SaveNotes(jobID, candidateID, body.Notes, user)
	if err != nil {
		if errors.Is(err, services.ErrJobNotFound) {
			apierror.JobNotFound.Send(c)
			return
		}
		if errors.Is(err, services.ErrNoOrg) || errors.Is(err, services.ErrOrgMismatch) {
			apierror.AccessDenied.Send(c)
			return
		}
		if errors.Is(err, services.ErrInterviewKitNotFound) {
			apierror.InterviewKitNotFound.Send(c)
			return
		}
		apierror.UpdateError.Send(c)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Notes saved",
		"notes":   mergedNotes,
	})
}
