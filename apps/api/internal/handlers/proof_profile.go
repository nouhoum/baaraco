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

type ProofProfileHandler struct {
	service *services.ProofProfileHandlerService
}

func NewProofProfileHandler(service *services.ProofProfileHandlerService) *ProofProfileHandler {
	return &ProofProfileHandler{service: service}
}

// GetProofProfile returns a proof profile by ID
// GET /api/v1/proof-profiles/:id
func (h *ProofProfileHandler) GetProofProfile(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		apierror.NotAuthenticated.Send(c)
		return
	}

	profileID := c.Param("id")

	profile, err := h.service.GetByID(profileID, user)
	if err != nil {
		if errors.Is(err, services.ErrProofProfileNotFound) {
			apierror.ProofProfileNotFound.Send(c)
			return
		}
		if errors.Is(err, services.ErrProofProfileNoAccess) {
			apierror.AccessDenied.Send(c)
			return
		}
		apierror.FetchError.Send(c)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"proof_profile": profile.ToResponse(),
	})
}

// GetProofProfileByEvaluation returns a proof profile for a specific evaluation
// GET /api/v1/evaluations/:id/proof-profile
func (h *ProofProfileHandler) GetProofProfileByEvaluation(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		apierror.NotAuthenticated.Send(c)
		return
	}

	evaluationID := c.Param("id")

	profile, err := h.service.GetByEvaluation(evaluationID, user)
	if err != nil {
		if errors.Is(err, services.ErrEvaluationNotFound) {
			apierror.EvaluationNotFound.Send(c)
			return
		}
		if errors.Is(err, services.ErrProofProfileNotFound) {
			apierror.ResourceNotAvailable.Send(c)
			return
		}
		if errors.Is(err, services.ErrProofProfileNoAccess) {
			apierror.AccessDenied.Send(c)
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
		"proof_profile": profile.ToResponse(),
	})
}

// GetMyProofProfile returns the proof profile for the authenticated candidate
// GET /api/v1/proof-profiles/me
func (h *ProofProfileHandler) GetMyProofProfile(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		apierror.NotAuthenticated.Send(c)
		return
	}

	if user.Role != models.RoleCandidate {
		apierror.RoleRequired.Send(c)
		return
	}

	profile, err := h.service.GetMine(user.ID)
	if err != nil {
		if errors.Is(err, services.ErrProofProfileNotFound) {
			apierror.ResourceNotAvailable.Send(c)
			return
		}
		apierror.FetchError.Send(c)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"proof_profile": profile.ToResponse(),
	})
}

// GetMyProofProfiles returns all proof profiles for the authenticated candidate
// GET /api/v1/proof-profiles/mine
func (h *ProofProfileHandler) GetMyProofProfiles(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		apierror.NotAuthenticated.Send(c)
		return
	}

	if user.Role != models.RoleCandidate {
		apierror.RoleRequired.Send(c)
		return
	}

	profilesWithRole, err := h.service.GetAll(user.ID)
	if err != nil {
		apierror.FetchError.Send(c)
		return
	}

	type profileWithRole struct {
		Profile  *models.ProofProfileResponse `json:"profile"`
		RoleType string                       `json:"role_type"`
		JobTitle string                       `json:"job_title,omitempty"`
	}

	results := make([]profileWithRole, 0, len(profilesWithRole))
	for _, pwr := range profilesWithRole {
		roleType := ""
		jobTitle := pwr.JobTitle
		if pwr.ProofProfile.Job != nil {
			roleType = pwr.ProofProfile.Job.RoleType
		}
		// Fallback to attempt's role_type if job didn't provide one
		if roleType == "" && pwr.ProofProfile.Attempt != nil && pwr.ProofProfile.Attempt.RoleType != "" {
			roleType = pwr.ProofProfile.Attempt.RoleType
		}
		results = append(results, profileWithRole{
			Profile:  pwr.ProofProfile.ToResponse(),
			RoleType: roleType,
			JobTitle: jobTitle,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"proof_profiles": results,
		"total":          len(results),
	})
}

// GetProofProfileForCandidate returns the proof profile for a specific candidate in a job
// GET /api/v1/jobs/:id/candidates/:candidate_id/proof-profile
func (h *ProofProfileHandler) GetProofProfileForCandidate(c *gin.Context) {
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

	profile, err := h.service.GetForCandidate(jobID, candidateID, user)
	if err != nil {
		if errors.Is(err, services.ErrJobNotFound) {
			apierror.JobNotFound.Send(c)
			return
		}
		if errors.Is(err, services.ErrProofProfileNotFound) {
			apierror.ProofProfileNotFound.Send(c)
			return
		}
		if errors.Is(err, services.ErrNoOrg) || errors.Is(err, services.ErrOrgMismatch) {
			apierror.AccessDenied.Send(c)
			return
		}
		apierror.FetchError.Send(c)
		return
	}

	// Build candidate info
	candidateInfo := gin.H{
		"id":    profile.CandidateID,
		"name":  "",
		"email": "",
	}
	if profile.Candidate != nil {
		candidateInfo["name"] = profile.Candidate.Name
		candidateInfo["email"] = profile.Candidate.Email
		candidateInfo["avatar_url"] = profile.Candidate.AvatarURL
	}

	// Build job info from the profile's associated job
	jobInfo := gin.H{
		"id":    jobID,
		"title": "",
	}
	if profile.Job != nil {
		jobInfo["id"] = profile.Job.ID
		jobInfo["title"] = profile.Job.Title
	}

	c.JSON(http.StatusOK, gin.H{
		"proof_profile": profile.ToResponse(),
		"candidate":     candidateInfo,
		"job":           jobInfo,
	})
}

// ListProofProfilesForJob returns all proof profiles for a job
// GET /api/v1/jobs/:id/proof-profiles
func (h *ProofProfileHandler) ListProofProfilesForJob(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		apierror.NotAuthenticated.Send(c)
		return
	}

	// Only recruiters and admins can list proof profiles
	if user.Role != models.RoleRecruiter && user.Role != models.RoleAdmin {
		apierror.AccessDenied.Send(c)
		return
	}

	jobID := c.Param("id")

	profiles, err := h.service.ListForJob(jobID, user)
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

	// Convert to responses
	responses := make([]*models.ProofProfileResponse, len(profiles))
	for i := range profiles {
		responses[i] = profiles[i].ToResponse()
	}

	c.JSON(http.StatusOK, gin.H{
		"proof_profiles": responses,
		"total":          len(responses),
	})
}
