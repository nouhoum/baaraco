package services

import (
	"encoding/json"
	"errors"
	"time"

	"github.com/baaraco/baara/apps/api/internal/repositories"
	"github.com/baaraco/baara/pkg/models"
)

var (
	ErrJobNotFound           = errors.New("job not found")
	ErrNoOrg                 = errors.New("user has no organization")
	ErrOrgMismatch           = errors.New("job does not belong to user's organization")
	ErrMissingRequiredFields = errors.New("missing required fields for publishing")
)

type JobService struct {
	jobRepo       *repositories.JobRepository
	orgRepo       *repositories.OrgRepository
	scorecardRepo *repositories.ScorecardRepository
}

func NewJobService(
	jobRepo *repositories.JobRepository,
	orgRepo *repositories.OrgRepository,
	scorecardRepo *repositories.ScorecardRepository,
) *JobService {
	return &JobService{
		jobRepo:       jobRepo,
		orgRepo:       orgRepo,
		scorecardRepo: scorecardRepo,
	}
}

// CheckJobAccess verifies that the user has access to the job through their organization
func (s *JobService) CheckJobAccess(job *models.Job, user *models.User) error {
	if user.Role == models.RoleAdmin {
		return nil
	}
	if user.OrgID == nil {
		return ErrNoOrg
	}
	if !job.BelongsToOrg(*user.OrgID) {
		return ErrOrgMismatch
	}
	return nil
}

// GetJob returns a job by ID with access control
func (s *JobService) GetJob(id string, user *models.User) (*models.Job, error) {
	job, err := s.jobRepo.FindByIDWithOrg(id)
	if err != nil {
		return nil, ErrJobNotFound
	}

	if err := s.CheckJobAccess(job, user); err != nil {
		return nil, err
	}

	return job, nil
}

// ListJobs returns all jobs for an organization, optionally filtered by status
func (s *JobService) ListJobs(orgID string, status string) ([]models.Job, error) {
	return s.jobRepo.ListByOrgID(orgID, status)
}

// CreateJob creates a new job for the user's organization
func (s *JobService) CreateJob(job *models.Job, user *models.User) error {
	if user.OrgID == nil {
		return ErrNoOrg
	}

	job.OrgID = user.OrgID
	job.Status = models.JobStatusDraft
	job.CreatedBy = &user.ID

	return s.jobRepo.Create(job)
}

// UpdateJob applies partial updates to a job with access control
func (s *JobService) UpdateJob(id string, updates map[string]interface{}, user *models.User) (*models.Job, error) {
	job, err := s.jobRepo.FindByID(id)
	if err != nil {
		return nil, ErrJobNotFound
	}

	if err := s.CheckJobAccess(job, user); err != nil {
		return nil, err
	}

	// Remove fields that should not be updated directly
	delete(updates, "id")
	delete(updates, "org_id")
	delete(updates, "created_by")
	delete(updates, "created_at")
	delete(updates, "status") // Status changes should go through dedicated methods

	updates["updated_at"] = time.Now()

	if err := s.jobRepo.Updates(job, updates); err != nil {
		return nil, err
	}

	// Reload the job with relations
	return s.jobRepo.FindByIDWithOrg(id)
}

// PublishJob publishes a job, validating required fields and generating a slug if public
func (s *JobService) PublishJob(id string, isPublic bool, user *models.User) (*models.Job, error) {
	job, err := s.jobRepo.FindByIDWithOrg(id)
	if err != nil {
		return nil, ErrJobNotFound
	}

	if err := s.CheckJobAccess(job, user); err != nil {
		return nil, err
	}

	// Validate required fields for publishing
	if !s.hasRequiredFieldsForPublish(job) {
		return nil, ErrMissingRequiredFields
	}

	updates := map[string]interface{}{
		"status":     models.JobStatusActive,
		"is_public":  isPublic,
		"updated_at": time.Now(),
	}

	// Generate slug if making public and no slug exists
	if isPublic && job.Slug == "" {
		orgName := ""
		if job.Org != nil {
			orgName = job.Org.Name
		}
		updates["slug"] = job.GenerateSlug(orgName)
	}

	if err := s.jobRepo.Updates(job, updates); err != nil {
		return nil, err
	}

	// Reload the job with relations
	return s.jobRepo.FindByIDWithOrg(id)
}

// hasRequiredFieldsForPublish checks if a job has all required fields to be published
func (s *JobService) hasRequiredFieldsForPublish(job *models.Job) bool {
	// Title is required
	if job.Title == "" {
		return false
	}

	// Location type is required
	if job.LocationType == "" {
		return false
	}

	// Contract type is required
	if job.ContractType == "" {
		return false
	}

	// Seniority is required
	if job.Seniority == "" {
		return false
	}

	// Stack must have at least one item
	if len(job.Stack) == 0 {
		return false
	}
	var stack []string
	if err := json.Unmarshal(job.Stack, &stack); err != nil || len(stack) == 0 {
		return false
	}

	// Main problem is required
	if job.MainProblem == "" {
		return false
	}

	return true
}

// PauseJob pauses an active job
func (s *JobService) PauseJob(id string, user *models.User) (*models.Job, error) {
	job, err := s.jobRepo.FindByID(id)
	if err != nil {
		return nil, ErrJobNotFound
	}

	if err := s.CheckJobAccess(job, user); err != nil {
		return nil, err
	}

	updates := map[string]interface{}{
		"status":     models.JobStatusPaused,
		"updated_at": time.Now(),
	}

	if err := s.jobRepo.Updates(job, updates); err != nil {
		return nil, err
	}

	// Reload the job with relations
	return s.jobRepo.FindByIDWithOrg(id)
}

// CloseJob closes a job
func (s *JobService) CloseJob(id string, user *models.User) (*models.Job, error) {
	job, err := s.jobRepo.FindByID(id)
	if err != nil {
		return nil, ErrJobNotFound
	}

	if err := s.CheckJobAccess(job, user); err != nil {
		return nil, err
	}

	updates := map[string]interface{}{
		"status":     models.JobStatusClosed,
		"updated_at": time.Now(),
	}

	if err := s.jobRepo.Updates(job, updates); err != nil {
		return nil, err
	}

	// Reload the job with relations
	return s.jobRepo.FindByIDWithOrg(id)
}

// DeleteJob soft-deletes a job
func (s *JobService) DeleteJob(id string, user *models.User) error {
	job, err := s.jobRepo.FindByID(id)
	if err != nil {
		return ErrJobNotFound
	}

	if err := s.CheckJobAccess(job, user); err != nil {
		return err
	}

	return s.jobRepo.Delete(job)
}
