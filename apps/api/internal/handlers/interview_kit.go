package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/baaraco/baara/apps/api/internal/middleware"
	"github.com/baaraco/baara/pkg/apierror"
	"github.com/baaraco/baara/pkg/database"
	"github.com/baaraco/baara/pkg/logger"
	"github.com/baaraco/baara/pkg/models"
	"github.com/baaraco/baara/pkg/queue"
)

type InterviewKitHandler struct{}

func NewInterviewKitHandler() *InterviewKitHandler {
	return &InterviewKitHandler{}
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
		if user.OrgID == nil || *user.OrgID != job.OrgID {
			apierror.AccessDenied.Send(c)
			return
		}
	}

	// Load interview kit for this candidate and job
	var kit models.InterviewKit
	if err := database.Db.Preload("Candidate").
		Where("job_id = ? AND candidate_id = ?", jobID, candidateID).
		First(&kit).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// Try to auto-trigger generation if a proof profile exists
			var profile models.ProofProfile
			if dbErr := database.Db.Where("job_id = ? AND candidate_id = ?", jobID, candidateID).
				First(&profile).Error; dbErr == nil {
				// Proof profile exists, queue interview kit generation
				if qErr := queue.QueueGenerateInterviewKit(profile.ID); qErr != nil {
					logger.Error("Failed to queue interview kit generation",
						zap.String("proof_profile_id", profile.ID),
						zap.Error(qErr),
					)
				} else {
					logger.Info("Auto-queued interview kit generation",
						zap.String("proof_profile_id", profile.ID),
					)
				}
			}
			apierror.InterviewKitNotFound.SendWithDetails(c, map[string]string{
				"message": "The Interview Kit is being generated",
			})
			return
		}
		apierror.FetchError.Send(c)
		return
	}

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
			"id":    job.ID,
			"title": job.Title,
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
		if user.OrgID == nil || *user.OrgID != job.OrgID {
			apierror.AccessDenied.Send(c)
			return
		}
	}

	// Parse body
	var body struct {
		Notes map[string]string `json:"notes" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		apierror.InvalidData.Send(c)
		return
	}

	// Load interview kit
	var kit models.InterviewKit
	if err := database.Db.Where("job_id = ? AND candidate_id = ?", jobID, candidateID).
		First(&kit).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			apierror.InterviewKitNotFound.Send(c)
			return
		}
		apierror.FetchError.Send(c)
		return
	}

	// Merge notes
	existingNotes := kit.GetNotes()
	for key, value := range body.Notes {
		existingNotes[key] = value
	}

	notesJSON, err := json.Marshal(existingNotes)
	if err != nil {
		apierror.UpdateError.Send(c)
		return
	}
	kit.Notes = notesJSON

	if err := database.Db.Save(&kit).Error; err != nil {
		apierror.UpdateError.Send(c)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Notes saved",
		"notes":   existingNotes,
	})
}
