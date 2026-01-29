package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/baaraco/baara/apps/api/internal/middleware"
	"github.com/baaraco/baara/pkg/database"
	"github.com/baaraco/baara/pkg/logger"
	"github.com/baaraco/baara/pkg/models"
	"github.com/baaraco/baara/pkg/queue"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"gorm.io/gorm"
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
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Non authentifié"})
		return
	}

	// Only recruiters and admins
	if user.Role != models.RoleRecruiter && user.Role != models.RoleAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Accès non autorisé"})
		return
	}

	jobID := c.Param("id")
	candidateID := c.Param("candidate_id")

	// Load job to check org
	var job models.Job
	if err := database.Db.First(&job, "id = ?", jobID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Poste non trouvé"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération"})
		return
	}

	// Check org access for recruiters
	if user.Role == models.RoleRecruiter {
		if user.OrgID == nil || *user.OrgID != job.OrgID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Accès non autorisé"})
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
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "Interview Kit non trouvé",
				"message": "L'Interview Kit est en cours de génération",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération"})
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
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Non authentifié"})
		return
	}

	// Only recruiters and admins
	if user.Role != models.RoleRecruiter && user.Role != models.RoleAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Accès non autorisé"})
		return
	}

	jobID := c.Param("id")
	candidateID := c.Param("candidate_id")

	// Load job to check org
	var job models.Job
	if err := database.Db.First(&job, "id = ?", jobID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Poste non trouvé"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération"})
		return
	}

	// Check org access for recruiters
	if user.Role == models.RoleRecruiter {
		if user.OrgID == nil || *user.OrgID != job.OrgID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Accès non autorisé"})
			return
		}
	}

	// Parse body
	var body struct {
		Notes map[string]string `json:"notes" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Données invalides"})
		return
	}

	// Load interview kit
	var kit models.InterviewKit
	if err := database.Db.Where("job_id = ? AND candidate_id = ?", jobID, candidateID).
		First(&kit).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Interview Kit non trouvé"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération"})
		return
	}

	// Merge notes
	existingNotes := kit.GetNotes()
	for key, value := range body.Notes {
		existingNotes[key] = value
	}

	notesJSON, err := json.Marshal(existingNotes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la sauvegarde"})
		return
	}
	kit.Notes = notesJSON

	if err := database.Db.Save(&kit).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la sauvegarde"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Notes sauvegardées",
		"notes":   existingNotes,
	})
}
