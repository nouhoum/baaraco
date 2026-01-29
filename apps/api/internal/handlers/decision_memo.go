package handlers

import (
	"net/http"
	"time"

	"github.com/baaraco/baara/apps/api/internal/middleware"
	"github.com/baaraco/baara/pkg/database"
	"github.com/baaraco/baara/pkg/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type DecisionMemoHandler struct{}

func NewDecisionMemoHandler() *DecisionMemoHandler {
	return &DecisionMemoHandler{}
}

// GetOrInitDecisionMemo returns the decision memo for a candidate, creating a draft if none exists
// GET /api/v1/jobs/:id/candidates/:candidate_id/decision-memo
func (h *DecisionMemoHandler) GetOrInitDecisionMemo(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Non authentifié"})
		return
	}

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

	if user.Role == models.RoleRecruiter {
		if user.OrgID == nil || *user.OrgID != job.OrgID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Accès non autorisé"})
			return
		}
	}

	// Load candidate info
	var candidate models.User
	if err := database.Db.First(&candidate, "id = ?", candidateID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Candidat non trouvé"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération"})
		return
	}

	// Try to find existing memo
	var memo models.DecisionMemo
	if err := database.Db.Where("job_id = ? AND candidate_id = ?", jobID, candidateID).
		First(&memo).Error; err != nil {
		if err != gorm.ErrRecordNotFound {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération"})
			return
		}

		// Create a new draft pre-populated from ProofProfile
		memo = models.DecisionMemo{
			JobID:                    jobID,
			CandidateID:              candidateID,
			RecruiterID:              user.ID,
			Decision:                 models.DecisionPending,
			Status:                   models.DecisionMemoDraft,
			PostInterviewEvaluations: []byte(`[]`),
			ConfirmedStrengths:       []byte(`[]`),
			IdentifiedRisks:          []byte(`[]`),
			NextSteps:                []byte(`{}`),
		}

		// Try to pre-populate from ProofProfile
		var profile models.ProofProfile
		if dbErr := database.Db.Where("job_id = ? AND candidate_id = ?", jobID, candidateID).
			First(&profile).Error; dbErr == nil {
			// Pre-populate post-interview evaluations from criteria summary
			criteriaSummary := profile.GetCriteriaSummary()
			if len(criteriaSummary) > 0 {
				evals := make([]models.PostInterviewEvaluation, len(criteriaSummary))
				for i, cs := range criteriaSummary {
					evals[i] = models.PostInterviewEvaluation{
						CriterionName:      cs.Name,
						PreInterviewScore:  cs.Score,
						PostInterviewScore: 0,
						Notes:              "",
					}
				}
				memo.SetPostInterviewEvaluations(evals)
			}

			// Pre-populate confirmed strengths from proof profile strengths
			strengths := profile.GetStrengths()
			if len(strengths) > 0 {
				names := make([]string, len(strengths))
				for i, s := range strengths {
					names[i] = s.CriterionName
				}
				memo.SetConfirmedStrengths(names)
			}
		}

		if err := database.Db.Create(&memo).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la création"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"decision_memo": memo.ToResponse(),
		"candidate": gin.H{
			"id":         candidate.ID,
			"name":       candidate.Name,
			"email":      candidate.Email,
			"avatar_url": candidate.AvatarURL,
		},
		"job": gin.H{
			"id":    job.ID,
			"title": job.Title,
		},
	})
}

// SaveDecisionMemo saves draft updates to a decision memo
// PATCH /api/v1/jobs/:id/candidates/:candidate_id/decision-memo
func (h *DecisionMemoHandler) SaveDecisionMemo(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Non authentifié"})
		return
	}

	if user.Role != models.RoleRecruiter && user.Role != models.RoleAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Accès non autorisé"})
		return
	}

	jobID := c.Param("id")
	candidateID := c.Param("candidate_id")

	var job models.Job
	if err := database.Db.First(&job, "id = ?", jobID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Poste non trouvé"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération"})
		return
	}

	if user.Role == models.RoleRecruiter {
		if user.OrgID == nil || *user.OrgID != job.OrgID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Accès non autorisé"})
			return
		}
	}

	// Load memo
	var memo models.DecisionMemo
	if err := database.Db.Where("job_id = ? AND candidate_id = ?", jobID, candidateID).
		First(&memo).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Decision Memo non trouvé"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération"})
		return
	}

	if memo.Status == models.DecisionMemoSubmitted {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Le Decision Memo a déjà été soumis"})
		return
	}

	// Parse body (partial update)
	var body struct {
		Decision                 *string                          `json:"decision"`
		PostInterviewEvaluations *[]models.PostInterviewEvaluation `json:"post_interview_evaluations"`
		ConfirmedStrengths       *[]string                        `json:"confirmed_strengths"`
		IdentifiedRisks          *[]models.IdentifiedRisk         `json:"identified_risks"`
		Justification            *string                          `json:"justification"`
		NextSteps                *map[string]string               `json:"next_steps"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Données invalides"})
		return
	}

	if body.Decision != nil {
		memo.Decision = models.DecisionType(*body.Decision)
	}
	if body.PostInterviewEvaluations != nil {
		memo.SetPostInterviewEvaluations(*body.PostInterviewEvaluations)
	}
	if body.ConfirmedStrengths != nil {
		memo.SetConfirmedStrengths(*body.ConfirmedStrengths)
	}
	if body.IdentifiedRisks != nil {
		memo.SetIdentifiedRisks(*body.IdentifiedRisks)
	}
	if body.Justification != nil {
		memo.Justification = *body.Justification
	}
	if body.NextSteps != nil {
		memo.SetNextSteps(*body.NextSteps)
	}

	if err := database.Db.Save(&memo).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la sauvegarde"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       "Decision Memo sauvegardé",
		"decision_memo": memo.ToResponse(),
	})
}

// SubmitDecisionMemo finalizes a decision memo and triggers post-submission actions
// POST /api/v1/jobs/:id/candidates/:candidate_id/decision-memo/submit
func (h *DecisionMemoHandler) SubmitDecisionMemo(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Non authentifié"})
		return
	}

	if user.Role != models.RoleRecruiter && user.Role != models.RoleAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Accès non autorisé"})
		return
	}

	jobID := c.Param("id")
	candidateID := c.Param("candidate_id")

	var job models.Job
	if err := database.Db.First(&job, "id = ?", jobID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Poste non trouvé"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération"})
		return
	}

	if user.Role == models.RoleRecruiter {
		if user.OrgID == nil || *user.OrgID != job.OrgID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Accès non autorisé"})
			return
		}
	}

	// Load memo
	var memo models.DecisionMemo
	if err := database.Db.Where("job_id = ? AND candidate_id = ?", jobID, candidateID).
		First(&memo).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Decision Memo non trouvé"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération"})
		return
	}

	if memo.Status == models.DecisionMemoSubmitted {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Le Decision Memo a déjà été soumis"})
		return
	}

	// Validate required fields
	if memo.Decision == models.DecisionPending {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Veuillez sélectionner une décision"})
		return
	}
	if memo.Justification == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Veuillez renseigner la justification"})
		return
	}

	// Submit
	now := time.Now()
	memo.Status = models.DecisionMemoSubmitted
	memo.SubmittedAt = &now

	// Transaction: save memo + update candidate status
	tx := database.Db.Begin()

	if err := tx.Save(&memo).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la soumission"})
		return
	}

	// Update candidate status based on decision
	if memo.Decision == models.DecisionHire || memo.Decision == models.DecisionNoHire {
		var attempt models.WorkSampleAttempt
		if err := tx.Where("candidate_id = ? AND job_id = ? AND deleted_at IS NULL", candidateID, jobID).
			First(&attempt).Error; err == nil {
			if memo.Decision == models.DecisionHire {
				attempt.Status = models.AttemptStatusHired
			} else {
				attempt.Status = models.AttemptStatusRejected
				// Use feedback from next_steps if available
				ns := memo.GetNextSteps()
				if feedback, ok := ns["feedback_to_send"]; ok && feedback != "" {
					attempt.RejectionReason = feedback
				}
			}
			if err := tx.Save(&attempt).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la mise à jour du statut"})
				return
			}
		}
	}

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{
		"message":       "Decision Memo soumis",
		"decision_memo": memo.ToResponse(),
	})
}
