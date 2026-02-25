package services

import (
	"encoding/json"
	"errors"
	"time"

	"gorm.io/gorm"

	"github.com/baaraco/baara/apps/api/internal/repositories"
	"github.com/baaraco/baara/pkg/ai"
	"github.com/baaraco/baara/pkg/models"
)

var (
	ErrWorkSampleNotFound = errors.New("work sample not found")
	ErrNoScorecard        = errors.New("scorecard required before generating work sample")
)

// JobWorkSampleService handles work sample generation and management for jobs
type JobWorkSampleService struct {
	workSampleRepo *repositories.JobWorkSampleRepository
	jobRepo        *repositories.JobRepository
	scorecardRepo  *repositories.ScorecardRepository
	aiClient       ai.Generator
}

// NewJobWorkSampleService creates a new job work sample service
func NewJobWorkSampleService(
	workSampleRepo *repositories.JobWorkSampleRepository,
	jobRepo *repositories.JobRepository,
	scorecardRepo *repositories.ScorecardRepository,
	aiClient ai.Generator,
) *JobWorkSampleService {
	return &JobWorkSampleService{
		workSampleRepo: workSampleRepo,
		jobRepo:        jobRepo,
		scorecardRepo:  scorecardRepo,
		aiClient:       aiClient,
	}
}

// checkJobAccess verifies that the user has access to the job through their organization
func (s *JobWorkSampleService) checkJobAccess(job *models.Job, user *models.User) error {
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

// Get returns a work sample by job ID with access control
func (s *JobWorkSampleService) Get(jobID string, user *models.User) (*models.JobWorkSample, error) {
	// First check job access
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

	// Get the work sample
	workSample, err := s.workSampleRepo.FindByJobID(jobID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrWorkSampleNotFound
		}
		return nil, err
	}

	return workSample, nil
}

// Generate creates a new work sample for a job using AI
// Requires an existing scorecard for the job
func (s *JobWorkSampleService) Generate(jobID string, user *models.User) (*models.JobWorkSample, error) {
	// First check job access
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

	// Check if AI client is available
	if !s.aiClient.IsConfigured() {
		return nil, ErrAIUnavailable
	}

	// Get the scorecard - required for generation
	scorecard, err := s.scorecardRepo.FindByJobID(jobID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNoScorecard
		}
		return nil, err
	}

	// Build AI input from job and scorecard data
	input := s.buildWorkSampleInput(job, scorecard)

	// Generate using AI
	response, err := s.aiClient.GenerateWorkSample(input)
	if err != nil {
		return nil, err
	}

	// Check if work sample already exists
	existingWorkSample, err := s.workSampleRepo.FindByJobID(jobID)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	now := time.Now()

	if existingWorkSample != nil {
		// Update existing work sample
		existingWorkSample.ScorecardID = &scorecard.ID
		existingWorkSample.IntroMessage = response.IntroMessage
		if err := existingWorkSample.SetRules(response.Rules); err != nil {
			return nil, err
		}
		if err := existingWorkSample.SetSections(response.Sections); err != nil {
			return nil, err
		}
		existingWorkSample.EstimatedTimeMinutes = response.EstimatedTimeMinutes
		existingWorkSample.GeneratedAt = &now
		existingWorkSample.PromptVersion = ai.GetWorkSamplePromptVersion()
		existingWorkSample.UpdatedAt = now

		if err := s.workSampleRepo.Update(existingWorkSample); err != nil {
			return nil, err
		}

		return existingWorkSample, nil
	}

	// Create new work sample
	workSample := &models.JobWorkSample{
		JobID:                jobID,
		ScorecardID:          &scorecard.ID,
		IntroMessage:         response.IntroMessage,
		EstimatedTimeMinutes: response.EstimatedTimeMinutes,
		GeneratedAt:          &now,
		PromptVersion:        ai.GetWorkSamplePromptVersion(),
	}

	if err := workSample.SetRules(response.Rules); err != nil {
		return nil, err
	}
	if err := workSample.SetSections(response.Sections); err != nil {
		return nil, err
	}

	if err := s.workSampleRepo.Create(workSample); err != nil {
		return nil, err
	}

	return workSample, nil
}

// Update modifies an existing work sample with manual changes
func (s *JobWorkSampleService) Update(
	jobID string,
	introMessage string,
	rules []string,
	sections []models.WorkSampleSection,
	user *models.User,
) (*models.JobWorkSample, error) {
	// First check job access
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

	// Get existing work sample
	workSample, err := s.workSampleRepo.FindByJobID(jobID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrWorkSampleNotFound
		}
		return nil, err
	}

	// Update fields
	workSample.IntroMessage = introMessage
	if err := workSample.SetRules(rules); err != nil {
		return nil, err
	}
	if err := workSample.SetSections(sections); err != nil {
		return nil, err
	}

	// Recalculate estimated time from sections
	totalTime := 0
	for _, section := range sections {
		totalTime += section.EstimatedTimeMinutes
	}
	workSample.EstimatedTimeMinutes = &totalTime
	workSample.UpdatedAt = time.Now()

	if err := s.workSampleRepo.Update(workSample); err != nil {
		return nil, err
	}

	return workSample, nil
}

// buildWorkSampleInput creates the AI input from job and scorecard data
func (s *JobWorkSampleService) buildWorkSampleInput(job *models.Job, scorecard *models.Scorecard) ai.WorkSampleInput {
	input := ai.WorkSampleInput{
		Title:            job.Title,
		Team:             job.Team,
		Seniority:        string(job.Seniority),
		BusinessContext:  job.BusinessContext,
		MainProblem:      job.MainProblem,
		SuccessLooksLike: job.SuccessLooksLike,
		Criteria:         scorecard.GetCriteria(),
	}

	// Parse stack from JSON
	if len(job.Stack) > 0 {
		var stack []string
		if err := json.Unmarshal(job.Stack, &stack); err == nil {
			input.Stack = stack
		}
	}

	// Parse expected outcomes from JSON
	if len(job.ExpectedOutcomes) > 0 {
		var outcomes []string
		if err := json.Unmarshal(job.ExpectedOutcomes, &outcomes); err == nil {
			input.ExpectedOutcomes = outcomes
		}
	}

	return input
}
