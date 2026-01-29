package handlers

import (
	"net/http"

	"github.com/baaraco/baara/apps/api/internal/middleware"
	"github.com/baaraco/baara/pkg/database"
	"github.com/baaraco/baara/pkg/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ProofProfileHandler struct{}

func NewProofProfileHandler() *ProofProfileHandler {
	return &ProofProfileHandler{}
}

// GetProofProfile returns a proof profile by ID
// GET /api/v1/proof-profiles/:id
func (h *ProofProfileHandler) GetProofProfile(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Non authentifié"})
		return
	}

	profileID := c.Param("id")

	var profile models.ProofProfile
	if err := database.Db.Preload("Job").First(&profile, "id = ?", profileID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Proof Profile non trouvé"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération"})
		return
	}

	// Check access rights
	if user.Role == models.RoleCandidate {
		if profile.CandidateID != user.ID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Accès non autorisé"})
			return
		}
	} else if user.Role == models.RoleRecruiter {
		var job models.Job
		if err := database.Db.First(&job, "id = ?", profile.JobID).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "Accès non autorisé"})
			return
		}
		if user.OrgID == nil || *user.OrgID != job.OrgID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Accès non autorisé"})
			return
		}
	}
	// Admin has full access

	c.JSON(http.StatusOK, gin.H{
		"proof_profile": profile.ToResponse(),
	})
}

// GetProofProfileByEvaluation returns a proof profile for a specific evaluation
// GET /api/v1/evaluations/:id/proof-profile
func (h *ProofProfileHandler) GetProofProfileByEvaluation(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Non authentifié"})
		return
	}

	evaluationID := c.Param("id")

	// Load the evaluation to check access
	var evaluation models.Evaluation
	if err := database.Db.First(&evaluation, "id = ?", evaluationID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Évaluation non trouvée"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération"})
		return
	}

	// Check access
	if user.Role == models.RoleCandidate {
		if evaluation.CandidateID != user.ID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Accès non autorisé"})
			return
		}
	} else if user.Role == models.RoleRecruiter {
		var job models.Job
		if err := database.Db.First(&job, "id = ?", evaluation.JobID).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "Accès non autorisé"})
			return
		}
		if user.OrgID == nil || *user.OrgID != job.OrgID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Accès non autorisé"})
			return
		}
	}

	// Load proof profile
	var profile models.ProofProfile
	if err := database.Db.Where("evaluation_id = ?", evaluationID).First(&profile).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "Proof Profile non disponible",
				"message": "Le Proof Profile est en cours de génération",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"proof_profile": profile.ToResponse(),
	})
}

// GetProofProfileByCandidate returns the proof profile for the authenticated candidate
// GET /api/v1/proof-profiles/me
func (h *ProofProfileHandler) GetMyProofProfile(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Non authentifié"})
		return
	}

	if user.Role != models.RoleCandidate {
		c.JSON(http.StatusForbidden, gin.H{"error": "Réservé aux candidats"})
		return
	}

	// Get the most recent proof profile for this candidate
	var profile models.ProofProfile
	if err := database.Db.Where("candidate_id = ?", user.ID).Order("created_at DESC").First(&profile).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "Proof Profile non disponible",
				"message": "Aucun Proof Profile n'a encore été généré",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"proof_profile": profile.ToResponse(),
	})
}

// GetProofProfileForCandidate returns the proof profile for a specific candidate in a job
// GET /api/v1/jobs/:id/candidates/:candidate_id/proof-profile
func (h *ProofProfileHandler) GetProofProfileForCandidate(c *gin.Context) {
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

	// Load proof profile for this candidate and job
	var profile models.ProofProfile
	if err := database.Db.Preload("Candidate").
		Where("job_id = ? AND candidate_id = ?", jobID, candidateID).
		First(&profile).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "Proof Profile non trouvé",
				"message": "Aucun Proof Profile pour ce candidat",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération"})
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

	c.JSON(http.StatusOK, gin.H{
		"proof_profile": profile.ToResponse(),
		"candidate":     candidateInfo,
		"job": gin.H{
			"id":    job.ID,
			"title": job.Title,
		},
	})
}

// ListProofProfilesForJob returns all proof profiles for a job
// GET /api/v1/jobs/:id/proof-profiles
func (h *ProofProfileHandler) ListProofProfilesForJob(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Non authentifié"})
		return
	}

	// Only recruiters and admins can list proof profiles
	if user.Role != models.RoleRecruiter && user.Role != models.RoleAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Accès non autorisé"})
		return
	}

	jobID := c.Param("id")

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

	// Load proof profiles
	var profiles []models.ProofProfile
	if err := database.Db.Preload("Candidate").Where("job_id = ?", jobID).Order("global_score DESC").Find(&profiles).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération"})
		return
	}

	// Convert to responses
	responses := make([]*models.ProofProfileResponse, len(profiles))
	for i, p := range profiles {
		responses[i] = p.ToResponse()
	}

	c.JSON(http.StatusOK, gin.H{
		"proof_profiles": responses,
		"total":          len(responses),
	})
}
