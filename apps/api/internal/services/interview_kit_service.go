package services

import (
	"errors"

	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/baaraco/baara/apps/api/internal/repositories"
	"github.com/baaraco/baara/pkg/logger"
	"github.com/baaraco/baara/pkg/models"
)

// InterviewKit errors
var (
	ErrInterviewKitNotFound = errors.New("interview kit not found")
	ErrNoProofProfile       = errors.New("no proof profile exists for this candidate")
	ErrKitGenerationQueued  = errors.New("interview kit generation has been queued")
)

// InterviewKitResult wraps the interview kit with associated job info
type InterviewKitResult struct {
	Kit      *models.InterviewKit
	JobID    string
	JobTitle string
}

// InterviewKitService handles business logic for interview kits
type InterviewKitService struct {
	interviewKitRepo *repositories.InterviewKitRepository
	jobRepo          *repositories.JobRepository
	proofProfileRepo *repositories.ProofProfileRepository
}

// NewInterviewKitService creates a new interview kit service
func NewInterviewKitService(
	interviewKitRepo *repositories.InterviewKitRepository,
	jobRepo *repositories.JobRepository,
	proofProfileRepo *repositories.ProofProfileRepository,
) *InterviewKitService {
	return &InterviewKitService{
		interviewKitRepo: interviewKitRepo,
		jobRepo:          jobRepo,
		proofProfileRepo: proofProfileRepo,
	}
}

// GetForCandidate returns the interview kit for a candidate on a job
// If a proof profile exists but no kit, it auto-queues generation
func (s *InterviewKitService) GetForCandidate(jobID, candidateID string, user *models.User) (*InterviewKitResult, error) {
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

	result := &InterviewKitResult{
		JobID:    job.ID,
		JobTitle: job.Title,
	}

	// Try to find existing kit
	kit, err := s.interviewKitRepo.FindByJobAndCandidate(jobID, candidateID)
	if err == nil {
		result.Kit = kit
		return result, nil
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	// No kit exists - check if we have a proof profile
	profile, err := s.proofProfileRepo.FindLatestByUserID(candidateID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNoProofProfile
		}
		return nil, err
	}

	// Profile exists but no kit - queue generation
	logger.Info("Queueing interview kit generation",
		zap.String("job_id", jobID),
		zap.String("candidate_id", candidateID),
		zap.String("profile_id", profile.ID),
	)

	// Create placeholder kit to indicate generation is pending
	placeholderKit := &models.InterviewKit{
		ProofProfileID: profile.ID,
		CandidateID:    candidateID,
		JobID:          &jobID,
	}

	if err := s.interviewKitRepo.Create(placeholderKit); err != nil {
		return nil, err
	}

	// TODO: Queue actual generation via background job/worker
	// For now, return the placeholder kit
	result.Kit = placeholderKit
	return result, nil
}

// SaveNotes saves interviewer notes on an interview kit and returns the merged notes
func (s *InterviewKitService) SaveNotes(jobID, candidateID string, notes map[string]string, user *models.User) (map[string]string, error) {
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

	// Find existing kit
	kit, err := s.interviewKitRepo.FindByJobAndCandidate(jobID, candidateID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrInterviewKitNotFound
		}
		return nil, err
	}

	// Merge notes with existing notes
	existingNotes := kit.GetNotes()
	for key, value := range notes {
		existingNotes[key] = value
	}

	if err := kit.SetNotes(existingNotes); err != nil {
		return nil, err
	}

	if err := s.interviewKitRepo.Update(kit); err != nil {
		return nil, err
	}

	logger.Debug("Saved interview kit notes",
		zap.String("kit_id", kit.ID),
		zap.String("job_id", jobID),
		zap.String("candidate_id", candidateID),
		zap.Int("num_notes", len(notes)),
	)

	return existingNotes, nil
}

// checkJobAccess verifies the user has access to the job
func (s *InterviewKitService) checkJobAccess(job *models.Job, user *models.User) error {
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
