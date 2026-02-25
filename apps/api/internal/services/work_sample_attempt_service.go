package services

import (
	"errors"
	"time"

	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/baaraco/baara/apps/api/internal/repositories"
	"github.com/baaraco/baara/pkg/logger"
	"github.com/baaraco/baara/pkg/models"
	"github.com/baaraco/baara/pkg/queue"
)

// Work sample attempt service errors
var (
	ErrAttemptNotFound  = errors.New("attempt not found")
	ErrNotOwner         = errors.New("not the owner of this attempt")
	ErrNotEditable      = errors.New("attempt is not editable")
	ErrAlreadySubmitted = errors.New("attempt already submitted")
	ErrNoContent        = errors.New("no content to submit")
	ErrDuplicateRequest = errors.New("duplicate format request")
)

// AttemptWithMeta contains an attempt with associated metadata
type AttemptWithMeta struct {
	Attempt       *models.WorkSampleAttempt
	FormatRequest *models.FormatRequest
	WorkSample    *models.JobWorkSampleResponse
	RoleType      string
	JobTitle      string
}

// WorkSampleAttemptService handles work sample attempt business logic
type WorkSampleAttemptService struct {
	attemptRepo       *repositories.AttemptRepository
	formatRequestRepo *repositories.FormatRequestRepository
	jobRepo           *repositories.JobRepository
	jobWorkSampleRepo *repositories.JobWorkSampleRepository
	templateRepo      *repositories.TemplateRepository
}

// NewWorkSampleAttemptService creates a new work sample attempt service
func NewWorkSampleAttemptService(
	attemptRepo *repositories.AttemptRepository,
	formatRequestRepo *repositories.FormatRequestRepository,
	jobRepo *repositories.JobRepository,
	jobWorkSampleRepo *repositories.JobWorkSampleRepository,
	templateRepo *repositories.TemplateRepository,
) *WorkSampleAttemptService {
	return &WorkSampleAttemptService{
		attemptRepo:       attemptRepo,
		formatRequestRepo: formatRequestRepo,
		jobRepo:           jobRepo,
		jobWorkSampleRepo: jobWorkSampleRepo,
		templateRepo:      templateRepo,
	}
}

// GetMyAttempt returns the current user's active attempt with metadata
func (s *WorkSampleAttemptService) GetMyAttempt(userID string) (*AttemptWithMeta, error) {
	attempts, err := s.attemptRepo.FindByUserID(userID)
	if err != nil {
		return nil, err
	}

	if len(attempts) == 0 {
		return nil, ErrAttemptNotFound
	}

	// Get the most recent attempt (they're ordered by created_at DESC)
	attempt := &attempts[0]

	return s.buildAttemptWithMeta(attempt)
}

// GetAttempt returns an attempt by ID with access control
func (s *WorkSampleAttemptService) GetAttempt(attemptID string, user *models.User) (*AttemptWithMeta, error) {
	attempt, err := s.attemptRepo.FindByID(attemptID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAttemptNotFound
		}
		return nil, err
	}

	// Access control: must be the owner or an admin/recruiter
	if attempt.CandidateID != user.ID && user.Role == models.RoleCandidate {
		return nil, ErrNotOwner
	}

	return s.buildAttemptWithMeta(attempt)
}

// GetMyAttempts returns all attempts for a candidate
func (s *WorkSampleAttemptService) GetMyAttempts(userID string) ([]AttemptWithMeta, error) {
	attempts, err := s.attemptRepo.FindByUserID(userID)
	if err != nil {
		return nil, err
	}

	result := make([]AttemptWithMeta, 0, len(attempts))
	for i := range attempts {
		meta, err := s.buildAttemptWithMeta(&attempts[i])
		if err != nil {
			// Log error but continue with other attempts
			logger.Error("Failed to build attempt metadata",
				zap.Error(err),
				zap.String("attempt_id", attempts[i].ID),
			)
			continue
		}
		result = append(result, *meta)
	}

	return result, nil
}

// SaveAttempt saves a candidate's work sample answers
func (s *WorkSampleAttemptService) SaveAttempt(attemptID string, userID string, answers map[string]string, progress int) (*models.WorkSampleAttempt, error) {
	attempt, err := s.attemptRepo.FindByID(attemptID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAttemptNotFound
		}
		return nil, err
	}

	// Verify ownership
	if attempt.CandidateID != userID {
		return nil, ErrNotOwner
	}

	// Check if editable
	if !attempt.IsEditable() {
		return nil, ErrNotEditable
	}

	// Update answers
	if err := attempt.SetAnswers(answers); err != nil {
		return nil, err
	}

	// Update progress
	attempt.Progress = progress

	// Update status to in_progress if still draft
	if attempt.Status == models.AttemptStatusDraft {
		attempt.Status = models.AttemptStatusInProgress
	}

	// Set last saved timestamp
	now := time.Now()
	attempt.LastSavedAt = &now

	if err := s.attemptRepo.Update(attempt); err != nil {
		logger.Error("Failed to save attempt",
			zap.Error(err),
			zap.String("attempt_id", attemptID),
			zap.String("user_id", userID),
		)
		return nil, err
	}

	logger.Info("Attempt saved",
		zap.String("attempt_id", attemptID),
		zap.String("user_id", userID),
		zap.Int("progress", progress),
	)

	return attempt, nil
}

// SubmitAttempt submits an attempt for evaluation
func (s *WorkSampleAttemptService) SubmitAttempt(attemptID string, user *models.User) (*models.WorkSampleAttempt, error) {
	attempt, err := s.attemptRepo.FindByID(attemptID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAttemptNotFound
		}
		return nil, err
	}

	// Verify ownership
	if attempt.CandidateID != user.ID {
		return nil, ErrNotOwner
	}

	// Check if already submitted
	if attempt.IsSubmitted() {
		return nil, ErrAlreadySubmitted
	}

	// Check if editable (must be in draft, in_progress, or interviewing)
	if !attempt.IsEditable() {
		return nil, ErrNotEditable
	}

	// Check that there is content to submit
	answers, err := attempt.GetAnswers()
	if err != nil {
		return nil, err
	}
	if len(answers) == 0 {
		return nil, ErrNoContent
	}

	// Update status to submitted
	attempt.Status = models.AttemptStatusSubmitted
	now := time.Now()
	attempt.SubmittedAt = &now
	attempt.Progress = 100

	if err := s.attemptRepo.Update(attempt); err != nil {
		logger.Error("Failed to submit attempt",
			zap.Error(err),
			zap.String("attempt_id", attemptID),
			zap.String("user_id", user.ID),
		)
		return nil, err
	}

	// Queue the evaluation job
	if err := queue.QueueEvaluateWorkSample(attemptID); err != nil {
		logger.Error("Failed to queue evaluation",
			zap.Error(err),
			zap.String("attempt_id", attemptID),
		)
		// Don't fail the submission, the evaluation can be retried
	}

	logger.Info("Attempt submitted",
		zap.String("attempt_id", attemptID),
		zap.String("user_id", user.ID),
	)

	return attempt, nil
}

// RequestAlternativeFormat creates a request for an alternative format
func (s *WorkSampleAttemptService) RequestAlternativeFormat(attemptID string, userID string, reason, preferredFormat, comment string) (*models.FormatRequest, error) {
	attempt, err := s.attemptRepo.FindByID(attemptID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAttemptNotFound
		}
		return nil, err
	}

	// Verify ownership
	if attempt.CandidateID != userID {
		return nil, ErrNotOwner
	}

	// Check if there's already a pending request for this attempt
	existingRequest, err := s.formatRequestRepo.FindPendingByAttemptID(attemptID)
	if err == nil && existingRequest != nil {
		return nil, ErrDuplicateRequest
	}
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	// Create the format request
	formatRequest := &models.FormatRequest{
		AttemptID:       attemptID,
		CandidateID:     &userID,
		Reason:          models.FormatRequestReason(reason),
		PreferredFormat: models.FormatRequestPreference(preferredFormat),
		Comment:         comment,
		Status:          models.FormatRequestStatusPending,
	}

	if err := s.formatRequestRepo.Create(formatRequest); err != nil {
		logger.Error("Failed to create format request",
			zap.Error(err),
			zap.String("attempt_id", attemptID),
			zap.String("user_id", userID),
		)
		return nil, err
	}

	logger.Info("Format request created",
		zap.String("request_id", formatRequest.ID),
		zap.String("attempt_id", attemptID),
		zap.String("user_id", userID),
		zap.String("reason", reason),
	)

	return formatRequest, nil
}

// buildAttemptWithMeta builds an AttemptWithMeta from an attempt
func (s *WorkSampleAttemptService) buildAttemptWithMeta(attempt *models.WorkSampleAttempt) (*AttemptWithMeta, error) {
	meta := &AttemptWithMeta{
		Attempt:  attempt,
		RoleType: attempt.RoleType,
	}

	// Try to get the format request (may not exist)
	formatRequest, err := s.formatRequestRepo.FindByAttemptID(attempt.ID)
	if err == nil {
		meta.FormatRequest = formatRequest
	}

	// If there's a job, get job info and work sample
	if attempt.JobID != nil {
		job, err := s.jobRepo.FindByID(*attempt.JobID)
		if err == nil {
			meta.JobTitle = job.Title
			if job.RoleType != "" {
				meta.RoleType = job.RoleType
			}

			// Get work sample for this job
			workSample, err := s.jobWorkSampleRepo.FindByJobID(*attempt.JobID)
			if err == nil {
				meta.WorkSample = workSample.ToResponse()
			}
		}
	}

	return meta, nil
}
