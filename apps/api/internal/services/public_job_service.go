package services

import (
	"errors"

	"gorm.io/gorm"

	"github.com/baaraco/baara/apps/api/internal/repositories"
	"github.com/baaraco/baara/pkg/models"
)

var (
	ErrJobNotPublic       = errors.New("job not public or not active")
	ErrWorkSampleNotReady = errors.New("work sample not ready for this job")
	ErrAlreadyApplied     = errors.New("already applied to this job")
)

// ApplicationInfo contains information about a job application
type ApplicationInfo struct {
	AttemptID       string  `json:"attempt_id"`
	Status          string  `json:"status"`
	Progress        int     `json:"progress"`
	SubmittedAt     *string `json:"submitted_at,omitempty"`
	CreatedAt       string  `json:"created_at"`
	JobID           string  `json:"job_id"`
	JobSlug         string  `json:"job_slug"`
	JobTitle        string  `json:"job_title"`
	JobTeam         string  `json:"job_team,omitempty"`
	JobSeniority    string  `json:"job_seniority,omitempty"`
	JobLocationType string  `json:"job_location_type,omitempty"`
	JobContractType string  `json:"job_contract_type,omitempty"`
	OrgName         string  `json:"org_name,omitempty"`
}

// PublicJobService handles public job board operations
type PublicJobService struct {
	jobRepo           *repositories.JobRepository
	attemptRepo       *repositories.AttemptRepository
	jobWorkSampleRepo *repositories.JobWorkSampleRepository
}

// NewPublicJobService creates a new public job service
func NewPublicJobService(
	jobRepo *repositories.JobRepository,
	attemptRepo *repositories.AttemptRepository,
	jobWorkSampleRepo *repositories.JobWorkSampleRepository,
) *PublicJobService {
	return &PublicJobService{
		jobRepo:           jobRepo,
		attemptRepo:       attemptRepo,
		jobWorkSampleRepo: jobWorkSampleRepo,
	}
}

// ListPublicJobs returns all public active jobs with optional filters
func (s *PublicJobService) ListPublicJobs(filters map[string]string) ([]*models.PublicJobListItem, int64, error) {
	jobs, total, err := s.jobRepo.ListPublicActive(filters)
	if err != nil {
		return nil, 0, err
	}

	items := make([]*models.PublicJobListItem, 0, len(jobs))
	for i := range jobs {
		items = append(items, jobs[i].ToPublicListItem())
	}

	return items, total, nil
}

// GetPublicJob returns a public job by slug
func (s *PublicJobService) GetPublicJob(slug string) (*models.PublicJobDetailResponse, error) {
	job, err := s.jobRepo.FindBySlugPublic(slug)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrJobNotPublic
		}
		return nil, err
	}

	return job.ToPublicDetailResponse(), nil
}

// ApplyToJob creates an application (work sample attempt) for a job
// Returns the attempt and a boolean indicating if it was an existing attempt
func (s *PublicJobService) ApplyToJob(slug string, user *models.User) (*models.WorkSampleAttempt, bool, error) {
	// Get the public job
	job, err := s.jobRepo.FindBySlugPublic(slug)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, false, ErrJobNotPublic
		}
		return nil, false, err
	}

	// Check if work sample is ready for this job
	workSample, err := s.jobWorkSampleRepo.FindByJobID(job.ID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, false, ErrWorkSampleNotReady
		}
		return nil, false, err
	}

	// Verify work sample has been generated (has sections)
	if workSample.GeneratedAt == nil {
		return nil, false, ErrWorkSampleNotReady
	}

	// Check if user already has an active attempt for this job
	attempts, err := s.attemptRepo.FindByUserID(user.ID)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, false, err
	}

	// Look for existing attempt for this job
	for i := range attempts {
		if attempts[i].JobID != nil && *attempts[i].JobID == job.ID {
			return &attempts[i], true, nil
		}
	}

	// Create new attempt
	attempt := &models.WorkSampleAttempt{
		CandidateID: user.ID,
		JobID:       &job.ID,
		Status:      models.AttemptStatusDraft,
		RoleType:    job.RoleType,
	}

	createdAttempt, wasExisting, err := s.attemptRepo.Create(attempt)
	if err != nil {
		return nil, false, err
	}

	return createdAttempt, wasExisting, nil
}

// GetMyApplication returns the user's application for a specific job
// Returns the attempt and a boolean indicating if the user has applied
func (s *PublicJobService) GetMyApplication(slug string, user *models.User) (*models.WorkSampleAttempt, bool, error) {
	// Get the public job
	job, err := s.jobRepo.FindBySlugPublic(slug)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, false, ErrJobNotPublic
		}
		return nil, false, err
	}

	// Find user's attempts for this job
	attempts, err := s.attemptRepo.FindByUserID(user.ID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, false, nil
		}
		return nil, false, err
	}

	// Look for attempt for this job
	for i := range attempts {
		if attempts[i].JobID != nil && *attempts[i].JobID == job.ID {
			return &attempts[i], true, nil
		}
	}

	return nil, false, nil
}

// GetMyApplications returns all job applications for a user
func (s *PublicJobService) GetMyApplications(userID string) ([]ApplicationInfo, error) {
	attempts, err := s.attemptRepo.FindByUserID(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return []ApplicationInfo{}, nil
		}
		return nil, err
	}

	applications := make([]ApplicationInfo, 0, len(attempts))
	for i := range attempts {
		attempt := &attempts[i]

		// Skip attempts without a job
		if attempt.JobID == nil {
			continue
		}

		// Get job details
		job, err := s.jobRepo.FindByIDWithOrg(*attempt.JobID)
		if err != nil {
			// Skip if job not found (deleted)
			continue
		}

		info := ApplicationInfo{
			AttemptID:       attempt.ID,
			Status:          string(attempt.Status),
			Progress:        attempt.Progress,
			CreatedAt:       attempt.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			JobID:           job.ID,
			JobSlug:         job.Slug,
			JobTitle:        job.Title,
			JobTeam:         job.Team,
			JobSeniority:    string(job.Seniority),
			JobLocationType: string(job.LocationType),
			JobContractType: string(job.ContractType),
		}

		if attempt.SubmittedAt != nil {
			submittedAt := attempt.SubmittedAt.Format("2006-01-02T15:04:05Z07:00")
			info.SubmittedAt = &submittedAt
		}

		if job.Org != nil {
			info.OrgName = job.Org.Name
		}

		applications = append(applications, info)
	}

	return applications, nil
}
