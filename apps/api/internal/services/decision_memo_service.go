package services

import (
	"encoding/json"
	"errors"
	"time"

	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/baaraco/baara/apps/api/internal/repositories"
	"github.com/baaraco/baara/pkg/logger"
	"github.com/baaraco/baara/pkg/models"
)

// DecisionMemo errors
var (
	ErrDecisionMemoNotFound   = errors.New("decision memo not found")
	ErrDecisionMemoAlreadySub = errors.New("decision memo already submitted")
	ErrDecisionMemoIncomplete = errors.New("decision memo incomplete")
	ErrCandidateNotFound      = errors.New("candidate not found")
	ErrInvalidDecision        = errors.New("invalid decision value")
	ErrMissingJustification   = errors.New("justification is required")
)

// DecisionMemoService handles business logic for decision memos
type DecisionMemoService struct {
	decisionMemoRepo *repositories.DecisionMemoRepository
	jobRepo          *repositories.JobRepository
	userRepo         *repositories.UserRepository
	proofProfileRepo *repositories.ProofProfileRepository
	attemptRepo      *repositories.AttemptRepository
}

// NewDecisionMemoService creates a new decision memo service
func NewDecisionMemoService(
	decisionMemoRepo *repositories.DecisionMemoRepository,
	jobRepo *repositories.JobRepository,
	userRepo *repositories.UserRepository,
	proofProfileRepo *repositories.ProofProfileRepository,
	attemptRepo *repositories.AttemptRepository,
) *DecisionMemoService {
	return &DecisionMemoService{
		decisionMemoRepo: decisionMemoRepo,
		jobRepo:          jobRepo,
		userRepo:         userRepo,
		proofProfileRepo: proofProfileRepo,
		attemptRepo:      attemptRepo,
	}
}

// DecisionMemoResult contains the decision memo along with related job and candidate info
type DecisionMemoResult struct {
	Memo      *models.DecisionMemo
	Job       *models.Job
	Candidate *models.User
}

// GetOrInit returns an existing decision memo or creates a draft if none exists
// Pre-populates from ProofProfile data when available
func (s *DecisionMemoService) GetOrInit(jobID, candidateID string, user *models.User) (*DecisionMemoResult, error) {
	// Verify job exists and user has access
	job, err := s.jobRepo.FindByIDWithOrg(jobID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrJobNotFound
		}
		return nil, err
	}

	if err := s.checkJobAccess(job, user); err != nil {
		return nil, err
	}

	// Verify candidate exists
	candidate, err := s.userRepo.FindByID(candidateID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrCandidateNotFound
		}
		return nil, err
	}

	// Try to find existing memo
	memo, err := s.decisionMemoRepo.FindByJobAndCandidate(jobID, candidateID)
	if err == nil {
		return &DecisionMemoResult{Memo: memo, Job: job, Candidate: candidate}, nil
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	// Create new draft memo
	memo = &models.DecisionMemo{
		JobID:                    jobID,
		CandidateID:              candidateID,
		RecruiterID:              user.ID,
		Decision:                 models.DecisionPending,
		PostInterviewEvaluations: json.RawMessage(`[]`),
		ConfirmedStrengths:       json.RawMessage(`[]`),
		IdentifiedRisks:          json.RawMessage(`[]`),
		NextSteps:                json.RawMessage(`{}`),
		Status:                   models.DecisionMemoDraft,
	}

	// Try to pre-populate from ProofProfile
	if err := s.populateFromProofProfile(memo, candidate.ID); err != nil {
		logger.Debug("Could not populate decision memo from proof profile",
			zap.String("job_id", jobID),
			zap.String("candidate_id", candidateID),
			zap.Error(err),
		)
	}

	if err := s.decisionMemoRepo.Create(memo); err != nil {
		return nil, err
	}

	logger.Info("Created new decision memo draft",
		zap.String("memo_id", memo.ID),
		zap.String("job_id", jobID),
		zap.String("candidate_id", candidateID),
		zap.String("recruiter_id", user.ID),
	)

	return &DecisionMemoResult{Memo: memo, Job: job, Candidate: candidate}, nil
}

// populateFromProofProfile pre-populates the decision memo with data from the candidate's proof profile
func (s *DecisionMemoService) populateFromProofProfile(memo *models.DecisionMemo, candidateID string) error {
	profile, err := s.proofProfileRepo.FindLatestByUserID(candidateID)
	if err != nil {
		return err
	}

	// Pre-populate confirmed strengths from profile strengths
	strengths := profile.GetStrengths()
	if len(strengths) > 0 {
		confirmedStrengths := make([]string, 0, len(strengths))
		for _, s := range strengths {
			confirmedStrengths = append(confirmedStrengths, s.CriterionName)
		}
		if err := memo.SetConfirmedStrengths(confirmedStrengths); err != nil {
			return err
		}
	}

	// Pre-populate post-interview evaluations from criteria summary
	criteriaSummary := profile.GetCriteriaSummary()
	if len(criteriaSummary) > 0 {
		evals := make([]models.PostInterviewEvaluation, 0, len(criteriaSummary))
		for _, cs := range criteriaSummary {
			evals = append(evals, models.PostInterviewEvaluation{
				CriterionName:      cs.Name,
				PreInterviewScore:  cs.Score,
				PostInterviewScore: 0, // To be filled by recruiter
				Notes:              "",
			})
		}
		if err := memo.SetPostInterviewEvaluations(evals); err != nil {
			return err
		}
	}

	return nil
}

// DecisionMemoUpdates represents the updates to apply to a decision memo
type DecisionMemoUpdates struct {
	Decision                 *models.DecisionType             `json:"decision,omitempty"`
	PostInterviewEvaluations []models.PostInterviewEvaluation `json:"post_interview_evaluations,omitempty"`
	ConfirmedStrengths       []string                         `json:"confirmed_strengths,omitempty"`
	IdentifiedRisks          []models.IdentifiedRisk          `json:"identified_risks,omitempty"`
	Justification            *string                          `json:"justification,omitempty"`
	NextSteps                map[string]string                `json:"next_steps,omitempty"`
}

// Save updates a decision memo with the provided changes
func (s *DecisionMemoService) Save(jobID, candidateID string, updates *DecisionMemoUpdates, user *models.User) (*models.DecisionMemo, error) {
	// Verify job exists and user has access
	job, err := s.jobRepo.FindByIDWithOrg(jobID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrJobNotFound
		}
		return nil, err
	}

	if err := s.checkJobAccess(job, user); err != nil {
		return nil, err
	}

	// Find existing memo
	memo, err := s.decisionMemoRepo.FindByJobAndCandidate(jobID, candidateID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrDecisionMemoNotFound
		}
		return nil, err
	}

	// Check if already submitted
	if memo.Status == models.DecisionMemoSubmitted {
		return nil, ErrDecisionMemoAlreadySub
	}

	// Apply updates
	if updates.Decision != nil {
		memo.Decision = *updates.Decision
	}

	if updates.PostInterviewEvaluations != nil {
		if err := memo.SetPostInterviewEvaluations(updates.PostInterviewEvaluations); err != nil {
			return nil, err
		}
	}

	if updates.ConfirmedStrengths != nil {
		if err := memo.SetConfirmedStrengths(updates.ConfirmedStrengths); err != nil {
			return nil, err
		}
	}

	if updates.IdentifiedRisks != nil {
		if err := memo.SetIdentifiedRisks(updates.IdentifiedRisks); err != nil {
			return nil, err
		}
	}

	if updates.Justification != nil {
		memo.Justification = *updates.Justification
	}

	if updates.NextSteps != nil {
		if err := memo.SetNextSteps(updates.NextSteps); err != nil {
			return nil, err
		}
	}

	if err := s.decisionMemoRepo.Update(memo); err != nil {
		return nil, err
	}

	logger.Debug("Updated decision memo",
		zap.String("memo_id", memo.ID),
		zap.String("job_id", jobID),
		zap.String("candidate_id", candidateID),
	)

	return memo, nil
}

// Submit validates and submits the decision memo, updating the attempt status based on decision
func (s *DecisionMemoService) Submit(jobID, candidateID string, user *models.User) (*models.DecisionMemo, error) {
	// Verify job exists and user has access
	job, err := s.jobRepo.FindByIDWithOrg(jobID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrJobNotFound
		}
		return nil, err
	}

	if err := s.checkJobAccess(job, user); err != nil {
		return nil, err
	}

	// Find existing memo
	memo, err := s.decisionMemoRepo.FindByJobAndCandidate(jobID, candidateID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrDecisionMemoNotFound
		}
		return nil, err
	}

	// Check if already submitted
	if memo.Status == models.DecisionMemoSubmitted {
		return nil, ErrDecisionMemoAlreadySub
	}

	// Validate decision memo
	if err := s.validateForSubmission(memo); err != nil {
		return nil, err
	}

	// Update memo status
	now := time.Now()
	memo.Status = models.DecisionMemoSubmitted
	memo.SubmittedAt = &now

	if err := s.decisionMemoRepo.Update(memo); err != nil {
		return nil, err
	}

	// Update attempt status based on decision
	if err := s.updateAttemptStatus(jobID, candidateID, memo); err != nil {
		logger.Error("Failed to update attempt status after decision memo submission",
			zap.String("memo_id", memo.ID),
			zap.Error(err),
		)
		// Don't fail the submission, just log the error
	}

	logger.Info("Submitted decision memo",
		zap.String("memo_id", memo.ID),
		zap.String("job_id", jobID),
		zap.String("candidate_id", candidateID),
		zap.String("decision", string(memo.Decision)),
	)

	return memo, nil
}

// validateForSubmission validates that a decision memo has all required fields
func (s *DecisionMemoService) validateForSubmission(memo *models.DecisionMemo) error {
	// Decision must not be pending
	if memo.Decision == models.DecisionPending {
		return ErrInvalidDecision
	}

	// Justification is required
	if memo.Justification == "" {
		return ErrMissingJustification
	}

	// Post-interview evaluations must have scores
	evals := memo.GetPostInterviewEvaluations()
	for _, eval := range evals {
		if eval.PostInterviewScore == 0 && eval.PreInterviewScore > 0 {
			// Allow 0 if pre-interview was also 0, but flag incomplete otherwise
			return ErrDecisionMemoIncomplete
		}
	}

	return nil
}

// updateAttemptStatus updates the candidate's attempt status based on the decision
func (s *DecisionMemoService) updateAttemptStatus(jobID, candidateID string, memo *models.DecisionMemo) error {
	// Find the attempt for this candidate and job
	attempt, err := s.attemptRepo.FindByJobAndCandidate(jobID, candidateID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("attempt not found for candidate")
		}
		return err
	}

	// Determine new status based on decision
	var newStatus models.WorkSampleAttemptStatus
	switch memo.Decision {
	case models.DecisionHire:
		newStatus = models.AttemptStatusHired
	case models.DecisionNoHire:
		newStatus = models.AttemptStatusRejected
	default:
		return nil // No status change for need_more_info or other decisions
	}

	attempt.Status = newStatus
	now := time.Now()
	attempt.ReviewedAt = &now

	if memo.Decision == models.DecisionNoHire {
		// Use feedback_to_send from NextSteps if available
		nextSteps := memo.GetNextSteps()
		if feedback, ok := nextSteps["feedback_to_send"]; ok && feedback != "" {
			attempt.RejectionReason = feedback
		} else {
			attempt.RejectionReason = memo.Justification
		}
	}

	return s.attemptRepo.Update(attempt)
}

// checkJobAccess verifies the user has access to the job
func (s *DecisionMemoService) checkJobAccess(job *models.Job, user *models.User) error {
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

// MarshalUpdates converts a map to DecisionMemoUpdates
func MarshalUpdates(data map[string]interface{}) (*DecisionMemoUpdates, error) {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return nil, err
	}

	var updates DecisionMemoUpdates
	if err := json.Unmarshal(jsonData, &updates); err != nil {
		return nil, err
	}

	return &updates, nil
}
