package services

import (
	"errors"

	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/baaraco/baara/apps/api/internal/repositories"
	"github.com/baaraco/baara/pkg/logger"
	"github.com/baaraco/baara/pkg/models"
)

// Candidate signup errors
var (
	ErrCandidateSignupNotFound = errors.New("candidate signup not found")
	ErrInvalidSignupEmail      = errors.New("invalid signup email")
)

// CandidateSignupService handles candidate signup business logic
type CandidateSignupService struct {
	signupRepo *repositories.CandidateSignupRepository
}

// NewCandidateSignupService creates a new candidate signup service
func NewCandidateSignupService(
	signupRepo *repositories.CandidateSignupRepository,
) *CandidateSignupService {
	return &CandidateSignupService{
		signupRepo: signupRepo,
	}
}

// Create creates a new candidate signup or returns existing if email already exists
func (s *CandidateSignupService) Create(
	email string,
	name string,
	linkedInURL string,
	portfolioURL string,
	locale string,
) (*models.CandidateSignup, error) {
	// Validate email
	if email == "" {
		return nil, ErrInvalidSignupEmail
	}

	// Set default locale
	if locale == "" {
		locale = "fr"
	}

	// Check if signup already exists for this email
	existing, err := s.signupRepo.FindByEmail(email)
	if err == nil && existing != nil {
		// Return existing signup
		logger.Info("Returning existing candidate signup",
			zap.String("signup_id", existing.ID),
			zap.String("email", email),
		)
		return existing, nil
	}

	// Only proceed if the error is "not found"
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		logger.Error("Failed to check existing signup",
			zap.Error(err),
			zap.String("email", email),
		)
		return nil, err
	}

	// Create new signup
	signup := &models.CandidateSignup{
		Email:        email,
		Name:         name,
		LinkedInURL:  linkedInURL,
		PortfolioURL: portfolioURL,
		Locale:       locale,
		Status:       models.CandidateStatusPending,
	}

	if err := s.signupRepo.Create(signup); err != nil {
		logger.Error("Failed to create candidate signup",
			zap.Error(err),
			zap.String("email", email),
		)
		return nil, err
	}

	logger.Info("Candidate signup created",
		zap.String("signup_id", signup.ID),
		zap.String("email", email),
		zap.String("name", name),
	)

	return signup, nil
}
