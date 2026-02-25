package repositories

import (
	"time"

	"gorm.io/gorm"

	"github.com/baaraco/baara/pkg/models"
)

// JobCandidateRow holds the raw result of the candidates list query.
type JobCandidateRow struct {
	CandidateID    string
	CandidateName  string
	CandidateEmail string
	AvatarURL      *string
	AttemptID      string
	Status         string
	SubmittedAt    *time.Time
	ReviewedAt     *time.Time
	GlobalScore    *int
	OneLiner       *string
	Recommendation *string
	EvaluationID   *string
	ProofProfileID *string
}

// JobCandidateStats holds per-status counts for a job.
type JobCandidateStats struct {
	Total       int64
	Submitted   int64
	Reviewed    int64
	Shortlisted int64
	Rejected    int64
	Hired       int64
}

// JobCandidateListFilters captures the query parameters for listing candidates.
type JobCandidateListFilters struct {
	Status   string
	MinScore int
	Search   string
	SortBy   string
	Page     int
	PerPage  int
}

// JobCandidatesRepository handles database operations for job candidate listings.
type JobCandidatesRepository struct {
	db *gorm.DB
}

// NewJobCandidatesRepository creates a new job candidates repository.
func NewJobCandidatesRepository(db *gorm.DB) *JobCandidatesRepository {
	return &JobCandidatesRepository{db: db}
}

// ListCandidates returns filtered, paginated candidate rows for a given job.
func (r *JobCandidatesRepository) ListCandidates(jobID string, filters JobCandidateListFilters) ([]JobCandidateRow, int64, error) {
	// Build base count query
	countQuery := r.db.Table("work_sample_attempts a").
		Joins("JOIN users u ON u.id = a.candidate_id").
		Where("a.job_id = ?", jobID).
		Where("a.deleted_at IS NULL")

	if filters.Status != "" {
		countQuery = countQuery.Where("a.status = ?", filters.Status)
	}
	if filters.Search != "" {
		searchPattern := "%" + filters.Search + "%"
		countQuery = countQuery.Where("u.name ILIKE ? OR u.email ILIKE ?", searchPattern, searchPattern)
	}
	if filters.MinScore > 0 {
		countQuery = countQuery.
			Joins("LEFT JOIN evaluations e ON e.attempt_id = a.id AND e.deleted_at IS NULL").
			Where("e.global_score >= ?", filters.MinScore)
	}

	var total int64
	if err := countQuery.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Build select query
	selectQuery := r.db.Table("work_sample_attempts a").
		Select(`
			u.id as candidate_id,
			u.name as candidate_name,
			u.email as candidate_email,
			u.avatar_url,
			a.id as attempt_id,
			a.status,
			a.submitted_at,
			a.reviewed_at,
			e.global_score,
			e.one_liner,
			e.recommendation,
			e.id as evaluation_id,
			pp.id as proof_profile_id
		`).
		Joins("JOIN users u ON u.id = a.candidate_id").
		Joins("LEFT JOIN evaluations e ON e.attempt_id = a.id AND e.deleted_at IS NULL").
		Joins("LEFT JOIN proof_profiles pp ON pp.user_id = u.id AND pp.deleted_at IS NULL").
		Where("a.job_id = ?", jobID).
		Where("a.deleted_at IS NULL")

	if filters.Status != "" {
		selectQuery = selectQuery.Where("a.status = ?", filters.Status)
	}
	if filters.Search != "" {
		searchPattern := "%" + filters.Search + "%"
		selectQuery = selectQuery.Where("u.name ILIKE ? OR u.email ILIKE ?", searchPattern, searchPattern)
	}
	if filters.MinScore > 0 {
		selectQuery = selectQuery.Where("e.global_score >= ?", filters.MinScore)
	}

	// Apply sorting
	switch filters.SortBy {
	case "score_desc":
		selectQuery = selectQuery.Order("e.global_score DESC NULLS LAST")
	case "score_asc":
		selectQuery = selectQuery.Order("e.global_score ASC NULLS LAST")
	case "submitted_asc":
		selectQuery = selectQuery.Order("a.submitted_at ASC NULLS LAST")
	case "name_asc":
		selectQuery = selectQuery.Order("u.name ASC")
	case "name_desc":
		selectQuery = selectQuery.Order("u.name DESC")
	default:
		selectQuery = selectQuery.Order("a.submitted_at DESC NULLS LAST")
	}

	// Apply pagination
	offset := (filters.Page - 1) * filters.PerPage
	selectQuery = selectQuery.Offset(offset).Limit(filters.PerPage)

	var rows []JobCandidateRow
	if err := selectQuery.Scan(&rows).Error; err != nil {
		return nil, 0, err
	}

	return rows, total, nil
}

// GetStats returns candidate statistics for a job.
func (r *JobCandidatesRepository) GetStats(jobID string) JobCandidateStats {
	var stats JobCandidateStats

	base := r.db.Table("work_sample_attempts").
		Where("job_id = ? AND deleted_at IS NULL", jobID)

	base.Count(&stats.Total)

	r.db.Table("work_sample_attempts").
		Where("job_id = ? AND deleted_at IS NULL AND status = ?", jobID, models.AttemptStatusSubmitted).
		Count(&stats.Submitted)

	r.db.Table("work_sample_attempts").
		Where("job_id = ? AND deleted_at IS NULL AND status = ?", jobID, models.AttemptStatusReviewed).
		Count(&stats.Reviewed)

	r.db.Table("work_sample_attempts").
		Where("job_id = ? AND deleted_at IS NULL AND status = ?", jobID, models.AttemptStatusShortlisted).
		Count(&stats.Shortlisted)

	r.db.Table("work_sample_attempts").
		Where("job_id = ? AND deleted_at IS NULL AND status = ?", jobID, models.AttemptStatusRejected).
		Count(&stats.Rejected)

	r.db.Table("work_sample_attempts").
		Where("job_id = ? AND deleted_at IS NULL AND status = ?", jobID, models.AttemptStatusHired).
		Count(&stats.Hired)

	return stats
}

// FindAttemptByJobAndCandidate returns the attempt for a specific job+candidate.
func (r *JobCandidatesRepository) FindAttemptByJobAndCandidate(jobID, candidateID string) (*models.WorkSampleAttempt, error) {
	var attempt models.WorkSampleAttempt
	err := r.db.Where("job_id = ? AND candidate_id = ? AND deleted_at IS NULL", jobID, candidateID).
		First(&attempt).Error
	if err != nil {
		return nil, err
	}
	return &attempt, nil
}

// UpdateAttemptStatus updates an attempt's status and related fields.
func (r *JobCandidatesRepository) UpdateAttemptStatus(attempt *models.WorkSampleAttempt, updates map[string]interface{}) error {
	return r.db.Model(attempt).Updates(updates).Error
}
