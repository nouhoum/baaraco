package services

import (
	"encoding/json"
	"errors"
	"time"

	"github.com/baaraco/baara/apps/api/internal/repositories"
	"github.com/baaraco/baara/pkg/ai"
	"github.com/baaraco/baara/pkg/models"
)

var (
	ErrScorecardNotFound = errors.New("scorecard not found")
	ErrAIUnavailable     = errors.New("AI service unavailable")
)

type ScorecardService struct {
	scorecardRepo *repositories.ScorecardRepository
	jobRepo       *repositories.JobRepository
	aiClient      ai.Generator
}

func NewScorecardService(
	scorecardRepo *repositories.ScorecardRepository,
	jobRepo *repositories.JobRepository,
	aiClient ai.Generator,
) *ScorecardService {
	return &ScorecardService{
		scorecardRepo: scorecardRepo,
		jobRepo:       jobRepo,
		aiClient:      aiClient,
	}
}

// Get returns a scorecard by job ID with access control
func (s *ScorecardService) Get(jobID string, user *models.User) (*models.Scorecard, error) {
	// Verify job exists and user has access
	job, err := s.jobRepo.FindByID(jobID)
	if err != nil {
		return nil, ErrJobNotFound
	}

	if err := s.checkJobAccess(job, user); err != nil {
		return nil, err
	}

	scorecard, err := s.scorecardRepo.FindByJobID(jobID)
	if err != nil {
		return nil, ErrScorecardNotFound
	}

	return scorecard, nil
}

// Generate creates a new scorecard for a job using AI
func (s *ScorecardService) Generate(jobID string, user *models.User) (*models.Scorecard, error) {
	// Verify job exists and user has access
	job, err := s.jobRepo.FindByID(jobID)
	if err != nil {
		return nil, ErrJobNotFound
	}

	if err := s.checkJobAccess(job, user); err != nil {
		return nil, err
	}

	// Check if AI client is available
	if !s.aiClient.IsConfigured() {
		return nil, ErrAIUnavailable
	}

	// Build AI input from job fields
	input := s.buildScorecardInput(job)

	// Generate scorecard criteria using AI
	criteria, err := s.aiClient.GenerateScorecard(input)
	if err != nil {
		return nil, err
	}

	// Check if scorecard already exists for this job
	existingScorecard, err := s.scorecardRepo.FindByJobID(jobID)
	if err == nil && existingScorecard != nil {
		// Update existing scorecard
		if err := existingScorecard.SetCriteria(criteria); err != nil {
			return nil, err
		}
		now := time.Now()
		existingScorecard.GeneratedAt = &now
		existingScorecard.PromptVersion = ai.GetScorecardPromptVersion()
		existingScorecard.UpdatedAt = now

		if err := s.scorecardRepo.Update(existingScorecard); err != nil {
			return nil, err
		}
		return existingScorecard, nil
	}

	// Create new scorecard
	now := time.Now()
	scorecard := &models.Scorecard{
		JobID:         jobID,
		GeneratedAt:   &now,
		PromptVersion: ai.GetScorecardPromptVersion(),
	}

	if err := scorecard.SetCriteria(criteria); err != nil {
		return nil, err
	}

	if err := s.scorecardRepo.Create(scorecard); err != nil {
		return nil, err
	}

	return scorecard, nil
}

// Update updates the criteria for an existing scorecard
func (s *ScorecardService) Update(jobID string, criteria []models.ScorecardCriterion, user *models.User) (*models.Scorecard, error) {
	// Verify job exists and user has access
	job, err := s.jobRepo.FindByID(jobID)
	if err != nil {
		return nil, ErrJobNotFound
	}

	if err := s.checkJobAccess(job, user); err != nil {
		return nil, err
	}

	// Get existing scorecard
	scorecard, err := s.scorecardRepo.FindByJobID(jobID)
	if err != nil {
		return nil, ErrScorecardNotFound
	}

	// Update criteria
	if err := scorecard.SetCriteria(criteria); err != nil {
		return nil, err
	}
	scorecard.UpdatedAt = time.Now()

	if err := s.scorecardRepo.Update(scorecard); err != nil {
		return nil, err
	}

	return scorecard, nil
}

// checkJobAccess verifies that the user has access to the job through their organization
func (s *ScorecardService) checkJobAccess(job *models.Job, user *models.User) error {
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

// buildScorecardInput constructs the AI input from job fields
func (s *ScorecardService) buildScorecardInput(job *models.Job) ai.ScorecardInput {
	input := ai.ScorecardInput{
		Title:            job.Title,
		Team:             job.Team,
		Seniority:        string(job.Seniority),
		LocationType:     string(job.LocationType),
		ContractType:     string(job.ContractType),
		TeamSize:         string(job.TeamSize),
		ManagerInfo:      job.ManagerInfo,
		BusinessContext:  job.BusinessContext,
		MainProblem:      job.MainProblem,
		SuccessLooksLike: job.SuccessLooksLike,
		FailureLooksLike: job.FailureLooksLike,
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
