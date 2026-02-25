package repositories

import (
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"

	"github.com/baaraco/baara/pkg/models"
)

// TalentPoolFilters contains the filter options for talent pool queries.
type TalentPoolFilters struct {
	OrgID           string
	MinScore        *int
	MaxScore        *int
	Recommendation  *models.EvaluationRecommendation
	RoleType        string
	AttemptStatus   *models.WorkSampleAttemptStatus
	EvaluatedAfter  *time.Time
	EvaluatedBefore *time.Time
	StrongIn        []string
	WeakIn          []string
	Limit           int
	Offset          int
	SortBy          string
	SortOrder       string
}

// TalentPoolItem represents a single item in the talent pool list.
type TalentPoolItem struct {
	CandidateID       string                          `json:"candidate_id"`
	CandidateName     string                          `json:"candidate_name"`
	CandidateEmail    string                          `json:"candidate_email"`
	CandidateLocation string                          `json:"candidate_location,omitempty"`
	ProofProfileID    string                          `json:"proof_profile_id"`
	GlobalScore       int                             `json:"global_score"`
	ScoreLabel        string                          `json:"score_label"`
	Percentile        int                             `json:"percentile"`
	Recommendation    models.EvaluationRecommendation `json:"recommendation"`
	OneLiner          string                          `json:"one_liner"`
	AttemptID         string                          `json:"attempt_id"`
	AttemptStatus     models.WorkSampleAttemptStatus  `json:"attempt_status"`
	RoleType          string                          `json:"role_type"`
	JobID             *string                         `json:"job_id,omitempty"`
	JobTitle          *string                         `json:"job_title,omitempty"`
	EvaluatedAt       *time.Time                      `json:"evaluated_at,omitempty"`
	SubmittedAt       *time.Time                      `json:"submitted_at,omitempty"`
}

// TalentPoolRepository handles database operations for talent pool queries.
type TalentPoolRepository struct {
	db *gorm.DB
}

// NewTalentPoolRepository creates a new talent pool repository.
func NewTalentPoolRepository(db *gorm.DB) *TalentPoolRepository {
	return &TalentPoolRepository{db: db}
}

// List returns a filtered and paginated list of talent pool items.
func (r *TalentPoolRepository) List(filters TalentPoolFilters) ([]TalentPoolItem, int64, error) {
	// Set defaults
	if filters.Limit <= 0 {
		filters.Limit = 20
	}
	if filters.Limit > 100 {
		filters.Limit = 100
	}
	if filters.SortBy == "" {
		filters.SortBy = "score"
	}
	if filters.SortOrder == "" {
		filters.SortOrder = "desc"
	}

	// Build base query
	query := r.db.Table("proof_profiles pp").
		Select(`
			pp.id as proof_profile_id,
			pp.candidate_id,
			pp.global_score,
			pp.score_label,
			pp.percentile,
			pp.recommendation,
			pp.one_liner,
			pp.generated_at as evaluated_at,
			u.name as candidate_name,
			u.email as candidate_email,
			u.location as candidate_location,
			wsa.id as attempt_id,
			wsa.status as attempt_status,
			wsa.role_type,
			wsa.submitted_at,
			j.id as job_id,
			j.title as job_title
		`).
		Joins("INNER JOIN users u ON u.id = pp.candidate_id").
		Joins("INNER JOIN work_sample_attempts wsa ON wsa.id = pp.attempt_id").
		Joins("LEFT JOIN jobs j ON j.id = pp.job_id")

	// Apply filters
	query = r.applyFilters(query, filters)

	// Count total
	var total int64
	countQuery := r.db.Table("(?) as subquery", query)
	if err := countQuery.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply sorting
	sortColumn := r.getSortColumn(filters.SortBy)
	sortOrder := "DESC"
	if strings.ToLower(filters.SortOrder) == "asc" {
		sortOrder = "ASC"
	}
	query = query.Order(fmt.Sprintf("%s %s", sortColumn, sortOrder))

	// Apply pagination
	query = query.Limit(filters.Limit).Offset(filters.Offset)

	// Execute
	var items []TalentPoolItem
	if err := query.Scan(&items).Error; err != nil {
		return nil, 0, err
	}

	return items, total, nil
}

func (r *TalentPoolRepository) applyFilters(query *gorm.DB, filters TalentPoolFilters) *gorm.DB {
	if filters.OrgID != "" {
		query = query.Where("(j.org_id = ? OR EXISTS (SELECT 1 FROM jobs j2 WHERE j2.org_id = ? AND j2.role_type = wsa.role_type))",
			filters.OrgID, filters.OrgID)
	}

	if filters.MinScore != nil {
		query = query.Where("pp.global_score >= ?", *filters.MinScore)
	}
	if filters.MaxScore != nil {
		query = query.Where("pp.global_score <= ?", *filters.MaxScore)
	}

	if filters.Recommendation != nil {
		query = query.Where("pp.recommendation = ?", string(*filters.Recommendation))
	}

	if filters.RoleType != "" {
		query = query.Where("wsa.role_type = ?", filters.RoleType)
	}

	if filters.AttemptStatus != nil {
		query = query.Where("wsa.status = ?", string(*filters.AttemptStatus))
	}

	if filters.EvaluatedAfter != nil {
		query = query.Where("pp.generated_at >= ?", filters.EvaluatedAfter)
	}
	if filters.EvaluatedBefore != nil {
		query = query.Where("pp.generated_at <= ?", filters.EvaluatedBefore)
	}

	if len(filters.StrongIn) > 0 {
		for _, criterion := range filters.StrongIn {
			query = query.Where(`
				EXISTS (
					SELECT 1 FROM jsonb_array_elements(pp.criteria_summary) AS cs
					WHERE cs->>'name' = ? AND (cs->>'score')::int >= 80
				)
			`, criterion)
		}
	}

	if len(filters.WeakIn) > 0 {
		for _, criterion := range filters.WeakIn {
			query = query.Where(`
				EXISTS (
					SELECT 1 FROM jsonb_array_elements(pp.criteria_summary) AS cs
					WHERE cs->>'name' = ? AND (cs->>'score')::int < 60
				)
			`, criterion)
		}
	}

	return query
}

func (r *TalentPoolRepository) getSortColumn(sortBy string) string {
	switch sortBy {
	case "score":
		return "pp.global_score"
	case "created_at", "date":
		return "pp.created_at"
	case "name":
		return "u.name"
	case "evaluated_at":
		return "pp.generated_at"
	case "submitted_at":
		return "wsa.submitted_at"
	default:
		return "pp.global_score"
	}
}
