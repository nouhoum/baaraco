package services

import (
	"errors"

	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/baaraco/baara/apps/api/internal/repositories"
	"github.com/baaraco/baara/pkg/logger"
	"github.com/baaraco/baara/pkg/models"
)

// ProofProfile handler errors
var (
	ErrProofProfileNotFound = errors.New("proof profile not found")
	ErrProofProfileNoAccess = errors.New("no access to proof profile")
)

// ProofProfileRole represents the relationship between a user and a proof profile
type ProofProfileRole string

const (
	ProofProfileRoleOwner     ProofProfileRole = "owner"
	ProofProfileRoleRecruiter ProofProfileRole = "recruiter"
	ProofProfileRoleViewer    ProofProfileRole = "viewer"
)

// ProofProfileWithRole represents a proof profile with the user's role
type ProofProfileWithRole struct {
	ProofProfile *models.ProofProfile `json:"proof_profile"`
	Role         ProofProfileRole     `json:"role"`
	JobTitle     string               `json:"job_title,omitempty"`
}

// ProofProfileHandlerService handles access control and retrieval of proof profiles
type ProofProfileHandlerService struct {
	proofProfileRepo *repositories.ProofProfileRepository
	jobRepo          *repositories.JobRepository
	evaluationRepo   *repositories.EvaluationRepository
}

// NewProofProfileHandlerService creates a new proof profile handler service
func NewProofProfileHandlerService(
	proofProfileRepo *repositories.ProofProfileRepository,
	jobRepo *repositories.JobRepository,
	evaluationRepo *repositories.EvaluationRepository,
) *ProofProfileHandlerService {
	return &ProofProfileHandlerService{
		proofProfileRepo: proofProfileRepo,
		jobRepo:          jobRepo,
		evaluationRepo:   evaluationRepo,
	}
}

// GetByID returns a proof profile by ID with access control
func (s *ProofProfileHandlerService) GetByID(id string, user *models.User) (*models.ProofProfile, error) {
	profile, err := s.findProfileByID(id)
	if err != nil {
		return nil, err
	}

	// Check access
	if !s.hasAccess(profile, user) {
		return nil, ErrProofProfileNoAccess
	}

	return profile, nil
}

// GetByEvaluation returns the proof profile for an evaluation
func (s *ProofProfileHandlerService) GetByEvaluation(evaluationID string, user *models.User) (*models.ProofProfile, error) {
	// Find the evaluation first
	evaluation, err := s.evaluationRepo.FindByID(evaluationID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrEvaluationNotFound
		}
		return nil, err
	}

	// Candidates can only access their own evaluations
	if user.Role == models.RoleCandidate && evaluation.CandidateID != user.ID {
		return nil, ErrProofProfileNoAccess
	}

	// Find the profile by evaluation ID
	profiles, err := s.proofProfileRepo.FindByUserID(evaluation.CandidateID)
	if err != nil {
		return nil, err
	}

	// Find the profile matching this evaluation
	for _, profile := range profiles {
		if profile.EvaluationID == evaluationID {
			if !s.hasAccess(&profile, user) {
				return nil, ErrProofProfileNoAccess
			}
			return &profile, nil
		}
	}

	return nil, ErrProofProfileNotFound
}

// GetMine returns the user's own proof profile (latest)
func (s *ProofProfileHandlerService) GetMine(userID string) (*models.ProofProfile, error) {
	profile, err := s.proofProfileRepo.FindLatestByUserID(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrProofProfileNotFound
		}
		return nil, err
	}

	return profile, nil
}

// GetAll returns all proof profiles accessible by the user with their roles
func (s *ProofProfileHandlerService) GetAll(userID string) ([]ProofProfileWithRole, error) {
	// Get user's own profiles
	ownProfiles, err := s.proofProfileRepo.FindByUserID(userID)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	result := make([]ProofProfileWithRole, 0, len(ownProfiles))

	for i := range ownProfiles {
		profile := &ownProfiles[i]
		jobTitle := ""
		if profile.Job != nil {
			jobTitle = profile.Job.Title
		}

		result = append(result, ProofProfileWithRole{
			ProofProfile: profile,
			Role:         ProofProfileRoleOwner,
			JobTitle:     jobTitle,
		})
	}

	// Note: In a full implementation, we would also fetch profiles
	// the user can access as a recruiter (through their org's jobs)
	// This would require additional queries and is marked for future expansion

	logger.Debug("Retrieved proof profiles for user",
		zap.String("user_id", userID),
		zap.Int("count", len(result)),
	)

	return result, nil
}

// GetForCandidate returns the proof profile for a candidate on a specific job
func (s *ProofProfileHandlerService) GetForCandidate(jobID, candidateID string, user *models.User) (*models.ProofProfile, error) {
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

	// Find candidate's profiles and look for one matching this job
	profiles, err := s.proofProfileRepo.FindByUserID(candidateID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrProofProfileNotFound
		}
		return nil, err
	}

	// First, try to find a profile specific to this job
	for i := range profiles {
		if profiles[i].JobID != nil && *profiles[i].JobID == jobID {
			return &profiles[i], nil
		}
	}

	// If no job-specific profile, return the latest profile for matching role type
	for i := range profiles {
		// Check if role type matches (profiles may have been created for the same role type)
		if profiles[i].Job != nil && profiles[i].Job.RoleType == job.RoleType {
			return &profiles[i], nil
		}
	}

	// Return the latest profile if any exist
	if len(profiles) > 0 {
		return &profiles[0], nil
	}

	return nil, ErrProofProfileNotFound
}

// ListForJob returns all proof profiles for candidates who applied to a job
func (s *ProofProfileHandlerService) ListForJob(jobID string, user *models.User) ([]models.ProofProfile, error) {
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

	profiles, err := s.proofProfileRepo.FindByJobID(jobID)
	if err != nil {
		return nil, err
	}

	return profiles, nil
}

// findProfileByID is a helper to find a profile by ID
func (s *ProofProfileHandlerService) findProfileByID(id string) (*models.ProofProfile, error) {
	profile, err := s.proofProfileRepo.FindByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrProofProfileNotFound
		}
		return nil, err
	}
	return profile, nil
}

// hasAccess checks if a user has access to a proof profile
func (s *ProofProfileHandlerService) hasAccess(profile *models.ProofProfile, user *models.User) bool {
	// Owner always has access
	if profile.CandidateID == user.ID {
		return true
	}

	// Public profiles are accessible to everyone
	if profile.IsPublic {
		return true
	}

	// Admins have full access
	if user.Role == models.RoleAdmin {
		return true
	}

	// Recruiters can access profiles for candidates who applied to their org's jobs
	if user.Role == models.RoleRecruiter {
		if profile.JobID != nil && user.OrgID != nil {
			job, err := s.jobRepo.FindByID(*profile.JobID)
			if err == nil && job.BelongsToOrg(*user.OrgID) {
				return true
			}
		}
	}

	return false
}

// checkJobAccess verifies the user has access to the job
func (s *ProofProfileHandlerService) checkJobAccess(job *models.Job, user *models.User) error {
	// Admins have full access
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
