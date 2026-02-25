package services

import (
	"errors"
	"time"

	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/baaraco/baara/apps/api/internal/repositories"
	"github.com/baaraco/baara/pkg/logger"
	"github.com/baaraco/baara/pkg/models"
)

// Job candidates errors
var (
	ErrJobCandidateNotFound   = errors.New("candidate not found for job")
	ErrInvalidCandidateStatus = errors.New("invalid candidate status")
)

// CandidateFilters contains filtering options for listing candidates
type CandidateFilters struct {
	Status   string
	MinScore int
	Search   string
	SortBy   string
	Page     int
	PerPage  int
}

// CandidateListItem represents a candidate in the list view
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

// CandidateStats contains statistics about candidates for a job
type CandidateStats struct {
	Total       int64 `json:"total"`
	Submitted   int64 `json:"submitted"`
	Reviewed    int64 `json:"reviewed"`
	Shortlisted int64 `json:"shortlisted"`
	Rejected    int64 `json:"rejected"`
	Hired       int64 `json:"hired"`
}

// CandidateListResult wraps the candidate list response with associated job info
type CandidateListResult struct {
	Candidates []CandidateListItem
	Total      int64
	Stats      CandidateStats
	JobID      string
	JobTitle   string
	JobStatus  string
}

// JobCandidatesService handles job candidates business logic
type JobCandidatesService struct {
	candidatesRepo *repositories.JobCandidatesRepository
	jobRepo        *repositories.JobRepository
}

// NewJobCandidatesService creates a new job candidates service
func NewJobCandidatesService(
	candidatesRepo *repositories.JobCandidatesRepository,
	jobRepo *repositories.JobRepository,
) *JobCandidatesService {
	return &JobCandidatesService{
		candidatesRepo: candidatesRepo,
		jobRepo:        jobRepo,
	}
}

// ListCandidates returns candidates for a job with filtering and pagination
func (s *JobCandidatesService) ListCandidates(
	jobID string,
	user *models.User,
	filters CandidateFilters,
) (*CandidateListResult, error) {
	// Verify job access
	job, err := s.jobRepo.FindByID(jobID)
	if err != nil {
		return nil, ErrJobNotFound
	}

	if user.OrgID == nil || !job.BelongsToOrg(*user.OrgID) {
		return nil, ErrOrgMismatch
	}

	// Set default pagination
	if filters.Page <= 0 {
		filters.Page = 1
	}
	if filters.PerPage <= 0 {
		filters.PerPage = 20
	}

	// Get stats before filtering
	repoStats := s.candidatesRepo.GetStats(jobID)
	stats := CandidateStats{
		Total:       repoStats.Total,
		Submitted:   repoStats.Submitted,
		Reviewed:    repoStats.Reviewed,
		Shortlisted: repoStats.Shortlisted,
		Rejected:    repoStats.Rejected,
		Hired:       repoStats.Hired,
	}

	// List candidates via repository
	rows, total, err := s.candidatesRepo.ListCandidates(jobID, repositories.JobCandidateListFilters{
		Status:   filters.Status,
		MinScore: filters.MinScore,
		Search:   filters.Search,
		SortBy:   filters.SortBy,
		Page:     filters.Page,
		PerPage:  filters.PerPage,
	})
	if err != nil {
		logger.Error("Failed to list candidates", zap.Error(err), zap.String("job_id", jobID))
		return nil, err
	}

	// Convert to response items
	items := make([]CandidateListItem, len(rows))
	for i, r := range rows {
		var submittedAt, reviewedAt *string
		if r.SubmittedAt != nil {
			formatted := r.SubmittedAt.Format(time.RFC3339)
			submittedAt = &formatted
		}
		if r.ReviewedAt != nil {
			formatted := r.ReviewedAt.Format(time.RFC3339)
			reviewedAt = &formatted
		}

		items[i] = CandidateListItem{
			CandidateID:    r.CandidateID,
			CandidateName:  r.CandidateName,
			CandidateEmail: r.CandidateEmail,
			AvatarURL:      r.AvatarURL,
			AttemptID:      r.AttemptID,
			Status:         r.Status,
			SubmittedAt:    submittedAt,
			ReviewedAt:     reviewedAt,
			GlobalScore:    r.GlobalScore,
			OneLiner:       r.OneLiner,
			Recommendation: r.Recommendation,
			EvaluationID:   r.EvaluationID,
			ProofProfileID: r.ProofProfileID,
		}
	}

	return &CandidateListResult{
		Candidates: items,
		Total:      total,
		Stats:      stats,
		JobID:      job.ID,
		JobTitle:   job.Title,
		JobStatus:  string(job.Status),
	}, nil
}

// UpdateCandidateStatus updates a candidate's status for a job
func (s *JobCandidatesService) UpdateCandidateStatus(
	jobID string,
	candidateID string,
	status string,
	rejectionReason string,
	user *models.User,
) error {
	// Verify job access
	job, err := s.jobRepo.FindByID(jobID)
	if err != nil {
		return ErrJobNotFound
	}

	if user.OrgID == nil || !job.BelongsToOrg(*user.OrgID) {
		return ErrOrgMismatch
	}

	// Validate status
	validStatuses := map[string]bool{
		string(models.AttemptStatusReviewed):    true,
		string(models.AttemptStatusShortlisted): true,
		string(models.AttemptStatusRejected):    true,
		string(models.AttemptStatusHired):       true,
	}

	if !validStatuses[status] {
		return ErrInvalidCandidateStatus
	}

	// Find the attempt
	attempt, err := s.candidatesRepo.FindAttemptByJobAndCandidate(jobID, candidateID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrJobCandidateNotFound
		}
		return err
	}

	// Build updates
	updates := map[string]interface{}{
		"status":     status,
		"updated_at": time.Now(),
	}

	if status == string(models.AttemptStatusRejected) && rejectionReason != "" {
		updates["rejection_reason"] = rejectionReason
	}

	if status == string(models.AttemptStatusReviewed) ||
		status == string(models.AttemptStatusShortlisted) ||
		status == string(models.AttemptStatusRejected) ||
		status == string(models.AttemptStatusHired) {
		now := time.Now()
		updates["reviewed_at"] = now
	}

	if err := s.candidatesRepo.UpdateAttemptStatus(attempt, updates); err != nil {
		logger.Error("Failed to update candidate status",
			zap.Error(err),
			zap.String("job_id", jobID),
			zap.String("candidate_id", candidateID),
		)
		return err
	}

	logger.Info("Candidate status updated",
		zap.String("job_id", jobID),
		zap.String("candidate_id", candidateID),
		zap.String("status", status),
		zap.String("updated_by", user.ID),
	)

	return nil
}
