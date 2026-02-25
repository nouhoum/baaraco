package services

import (
	"errors"

	"gorm.io/gorm"

	"github.com/baaraco/baara/apps/api/internal/repositories"
	"github.com/baaraco/baara/pkg/models"
)

var (
	ErrEvaluationNotFound = errors.New("evaluation not found")
)

// EvaluationHandlerService handles evaluation display operations
type EvaluationHandlerService struct {
	evaluationRepo *repositories.EvaluationRepository
	jobRepo        *repositories.JobRepository
	attemptRepo    *repositories.AttemptRepository
}

// NewEvaluationHandlerService creates a new evaluation handler service
func NewEvaluationHandlerService(
	evaluationRepo *repositories.EvaluationRepository,
	jobRepo *repositories.JobRepository,
	attemptRepo *repositories.AttemptRepository,
) *EvaluationHandlerService {
	return &EvaluationHandlerService{
		evaluationRepo: evaluationRepo,
		jobRepo:        jobRepo,
		attemptRepo:    attemptRepo,
	}
}

// GetEvaluation returns an evaluation by ID with access control
func (s *EvaluationHandlerService) GetEvaluation(id string, user *models.User) (*models.Evaluation, error) {
	evaluation, err := s.evaluationRepo.FindByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrEvaluationNotFound
		}
		return nil, err
	}

	if err := s.checkEvaluationAccess(evaluation, user); err != nil {
		return nil, err
	}

	return evaluation, nil
}

// GetEvaluationByAttempt returns an evaluation by attempt ID with access control
func (s *EvaluationHandlerService) GetEvaluationByAttempt(attemptID string, user *models.User) (*models.Evaluation, error) {
	// First verify the attempt exists and user has access to it
	attempt, err := s.attemptRepo.FindByID(attemptID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAttemptNotFound
		}
		return nil, err
	}

	// Check attempt access - user must be the candidate or have org access through job
	if err := s.checkAttemptAccess(attempt, user); err != nil {
		return nil, err
	}

	evaluation, err := s.evaluationRepo.FindByAttemptID(attemptID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrEvaluationNotFound
		}
		return nil, err
	}

	return evaluation, nil
}

// ListEvaluationsForJob returns all evaluations for a job with access control
func (s *EvaluationHandlerService) ListEvaluationsForJob(jobID string, user *models.User) ([]models.Evaluation, error) {
	// First verify the job exists and user has access
	job, err := s.jobRepo.FindByID(jobID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrJobNotFound
		}
		return nil, err
	}

	if err := s.checkJobAccess(job, user); err != nil {
		return nil, err
	}

	return s.evaluationRepo.ListByJobID(jobID)
}

// checkEvaluationAccess verifies that the user has access to the evaluation
func (s *EvaluationHandlerService) checkEvaluationAccess(evaluation *models.Evaluation, user *models.User) error {
	// Admin can access any evaluation
	if user.Role == models.RoleAdmin {
		return nil
	}

	// Candidate can access their own evaluation
	if evaluation.CandidateID == user.ID {
		return nil
	}

	// Org members can access evaluations for their jobs
	if evaluation.JobID != nil {
		job, err := s.jobRepo.FindByID(*evaluation.JobID)
		if err != nil {
			return ErrEvaluationNotFound
		}
		if err := s.checkJobAccess(job, user); err != nil {
			return err
		}
		return nil
	}

	return ErrOrgMismatch
}

// checkAttemptAccess verifies that the user has access to the attempt
func (s *EvaluationHandlerService) checkAttemptAccess(attempt *models.WorkSampleAttempt, user *models.User) error {
	// Admin can access any attempt
	if user.Role == models.RoleAdmin {
		return nil
	}

	// Candidate can access their own attempt
	if attempt.CandidateID == user.ID {
		return nil
	}

	// Org members can access attempts for their jobs
	if attempt.JobID != nil {
		job, err := s.jobRepo.FindByID(*attempt.JobID)
		if err != nil {
			return ErrAttemptNotFound
		}
		if err := s.checkJobAccess(job, user); err != nil {
			return err
		}
		return nil
	}

	return ErrOrgMismatch
}

// checkJobAccess verifies that the user has access to the job through their organization
func (s *EvaluationHandlerService) checkJobAccess(job *models.Job, user *models.User) error {
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
