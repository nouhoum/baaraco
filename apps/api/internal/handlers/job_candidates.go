package handlers

import (
	"net/http"
	"strconv"

	"github.com/baaraco/baara/apps/api/internal/middleware"
	"github.com/baaraco/baara/pkg/database"
	"github.com/baaraco/baara/pkg/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type JobCandidatesHandler struct{}

func NewJobCandidatesHandler() *JobCandidatesHandler {
	return &JobCandidatesHandler{}
}

// CandidateListItem is the response item for a candidate in the job dashboard
type CandidateListItem struct {
	CandidateID    string  `json:"candidate_id"`
	CandidateName  string  `json:"candidate_name"`
	CandidateEmail string  `json:"candidate_email"`
	AvatarURL      *string `json:"avatar_url,omitempty"`
	AttemptID      string  `json:"attempt_id"`
	Status         string  `json:"status"`
	SubmittedAt    *string `json:"submitted_at,omitempty"`
	ReviewedAt     *string `json:"reviewed_at,omitempty"`
	GlobalScore    *int    `json:"global_score,omitempty"`
	OneLiner       *string `json:"one_liner,omitempty"`
	Recommendation *string `json:"recommendation,omitempty"`
	ProofProfileID *string `json:"proof_profile_id,omitempty"`
	EvaluationID   *string `json:"evaluation_id,omitempty"`
}

// ListJobCandidates returns the list of candidates for a specific job
// GET /api/v1/jobs/:id/candidates
func (h *JobCandidatesHandler) ListJobCandidates(c *gin.Context) {
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

	// Parse query parameters
	statusFilter := c.Query("status")
	minScoreStr := c.Query("min_score")
	search := c.Query("search")
	sortBy := c.DefaultQuery("sort", "score_desc")
	pageStr := c.DefaultQuery("page", "1")
	perPageStr := c.DefaultQuery("per_page", "50")

	page, _ := strconv.Atoi(pageStr)
	perPage, _ := strconv.Atoi(perPageStr)
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 50
	}

	// Build query: get attempts for this job that have been at least submitted
	query := database.Db.
		Table("work_sample_attempts").
		Select(`
			work_sample_attempts.id as attempt_id,
			work_sample_attempts.candidate_id,
			work_sample_attempts.status,
			work_sample_attempts.submitted_at,
			work_sample_attempts.reviewed_at,
			users.name as candidate_name,
			users.email as candidate_email,
			users.avatar_url,
			evaluations.id as evaluation_id,
			evaluations.global_score,
			evaluations.recommendation,
			proof_profiles.id as proof_profile_id,
			proof_profiles.one_liner
		`).
		Joins("JOIN users ON users.id = work_sample_attempts.candidate_id").
		Joins("LEFT JOIN evaluations ON evaluations.attempt_id = work_sample_attempts.id").
		Joins("LEFT JOIN proof_profiles ON proof_profiles.evaluation_id = evaluations.id").
		Where("work_sample_attempts.job_id = ?", jobID).
		Where("work_sample_attempts.status IN ?", []string{"submitted", "reviewed", "shortlisted", "rejected"}).
		Where("work_sample_attempts.deleted_at IS NULL")

	// Apply status filter
	if statusFilter != "" && statusFilter != "all" {
		query = query.Where("work_sample_attempts.status = ?", statusFilter)
	}

	// Apply min_score filter
	if minScoreStr != "" {
		minScore, err := strconv.Atoi(minScoreStr)
		if err == nil && minScore > 0 {
			query = query.Where("evaluations.global_score >= ?", minScore)
		}
	}

	// Apply search filter
	if search != "" {
		searchPattern := "%" + search + "%"
		query = query.Where("(users.name ILIKE ? OR users.email ILIKE ?)", searchPattern, searchPattern)
	}

	// Count total before pagination
	var total int64
	countQuery := *query
	countQuery.Count(&total)

	// Apply sorting
	switch sortBy {
	case "score_desc":
		query = query.Order("COALESCE(evaluations.global_score, 0) DESC")
	case "score_asc":
		query = query.Order("COALESCE(evaluations.global_score, 0) ASC")
	case "date_desc":
		query = query.Order("work_sample_attempts.submitted_at DESC")
	case "date_asc":
		query = query.Order("work_sample_attempts.submitted_at ASC")
	case "name_asc":
		query = query.Order("users.name ASC")
	case "name_desc":
		query = query.Order("users.name DESC")
	default:
		query = query.Order("COALESCE(evaluations.global_score, 0) DESC")
	}

	// Apply pagination
	offset := (page - 1) * perPage
	query = query.Offset(offset).Limit(perPage)

	// Execute query
	type candidateRow struct {
		AttemptID      string  `gorm:"column:attempt_id"`
		CandidateID    string  `gorm:"column:candidate_id"`
		Status         string  `gorm:"column:status"`
		SubmittedAt    *string `gorm:"column:submitted_at"`
		ReviewedAt     *string `gorm:"column:reviewed_at"`
		CandidateName  string  `gorm:"column:candidate_name"`
		CandidateEmail string  `gorm:"column:candidate_email"`
		AvatarURL      *string `gorm:"column:avatar_url"`
		EvaluationID   *string `gorm:"column:evaluation_id"`
		GlobalScore    *int    `gorm:"column:global_score"`
		Recommendation *string `gorm:"column:recommendation"`
		ProofProfileID *string `gorm:"column:proof_profile_id"`
		OneLiner       *string `gorm:"column:one_liner"`
	}

	var rows []candidateRow
	if err := query.Find(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération des candidats"})
		return
	}

	// Convert to response
	candidates := make([]CandidateListItem, len(rows))
	for i, row := range rows {
		candidates[i] = CandidateListItem{
			CandidateID:    row.CandidateID,
			CandidateName:  row.CandidateName,
			CandidateEmail: row.CandidateEmail,
			AvatarURL:      row.AvatarURL,
			AttemptID:      row.AttemptID,
			Status:         row.Status,
			SubmittedAt:    row.SubmittedAt,
			ReviewedAt:     row.ReviewedAt,
			GlobalScore:    row.GlobalScore,
			OneLiner:       row.OneLiner,
			Recommendation: row.Recommendation,
			ProofProfileID: row.ProofProfileID,
			EvaluationID:   row.EvaluationID,
		}
	}

	// Compute stats
	var stats struct {
		Total       int64 `gorm:"column:total"`
		Submitted   int64 `gorm:"column:submitted"`
		Reviewed    int64 `gorm:"column:reviewed"`
		Shortlisted int64 `gorm:"column:shortlisted"`
		Rejected    int64 `gorm:"column:rejected"`
	}
	database.Db.
		Table("work_sample_attempts").
		Select(`
			COUNT(*) as total,
			SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as submitted,
			SUM(CASE WHEN status = 'reviewed' THEN 1 ELSE 0 END) as reviewed,
			SUM(CASE WHEN status = 'shortlisted' THEN 1 ELSE 0 END) as shortlisted,
			SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
		`).
		Where("job_id = ?", jobID).
		Where("status IN ?", []string{"submitted", "reviewed", "shortlisted", "rejected"}).
		Where("deleted_at IS NULL").
		Scan(&stats)

	c.JSON(http.StatusOK, gin.H{
		"candidates": candidates,
		"total":      total,
		"page":       page,
		"per_page":   perPage,
		"job": gin.H{
			"id":     job.ID,
			"title":  job.Title,
			"status": job.Status,
		},
		"stats": gin.H{
			"total":       stats.Total,
			"submitted":   stats.Submitted,
			"reviewed":    stats.Reviewed,
			"shortlisted": stats.Shortlisted,
			"rejected":    stats.Rejected,
		},
	})
}

// UpdateCandidateStatus updates a candidate's status for a job
// PATCH /api/v1/jobs/:id/candidates/:candidate_id
func (h *JobCandidatesHandler) UpdateCandidateStatus(c *gin.Context) {
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
		Status          string `json:"status" binding:"required"`
		RejectionReason string `json:"rejection_reason"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Données invalides"})
		return
	}

	// Validate status
	if body.Status != "shortlisted" && body.Status != "rejected" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Statut invalide. Valeurs acceptées : shortlisted, rejected"})
		return
	}

	// Find the attempt for this candidate and job
	var attempt models.WorkSampleAttempt
	if err := database.Db.Where("candidate_id = ? AND job_id = ?", candidateID, jobID).
		Where("status IN ?", []string{"reviewed", "shortlisted", "rejected"}).
		First(&attempt).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Candidat non trouvé pour ce poste"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération"})
		return
	}

	// Update status
	attempt.Status = models.WorkSampleAttemptStatus(body.Status)
	if body.Status == "rejected" {
		attempt.RejectionReason = body.RejectionReason
	}

	if err := database.Db.Save(&attempt).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la mise à jour"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Statut mis à jour",
		"status":  attempt.Status,
	})
}
