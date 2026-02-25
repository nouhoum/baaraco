package services

import (
	"errors"
	"time"

	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/baaraco/baara/apps/api/internal/repositories"
	"github.com/baaraco/baara/pkg/logger"
	"github.com/baaraco/baara/pkg/models"
)

// Pilot request errors
var (
	ErrPilotRequestNotFound    = errors.New("pilot request not found")
	ErrPilotAlreadyComplete    = errors.New("pilot request already completed")
	ErrPilotInvalidStatus      = errors.New("invalid pilot request status")
	ErrPilotMissingContactInfo = errors.New("missing required contact information")
)

// CreatePilotInput contains the input for creating a partial pilot request (step 1)
type CreatePilotInput struct {
	FirstName  string `json:"first_name"`
	LastName   string `json:"last_name"`
	Email      string `json:"email"`
	Company    string `json:"company"`
	RoleToHire string `json:"role_to_hire"`
	Locale     string `json:"locale"`
}

// CompletePilotInput contains the input for completing a pilot request (step 2)
type CompletePilotInput struct {
	Role               string   `json:"role"`
	TeamSize           string   `json:"team_size"`
	HiringTimeline     string   `json:"hiring_timeline"`
	Website            string   `json:"website"`
	ProductionContext  []string `json:"production_context"`
	BaselineTimeToHire *int     `json:"baseline_time_to_hire"`
	BaselineInterviews *int     `json:"baseline_interviews"`
	BaselinePainPoint  string   `json:"baseline_pain_point"`
	JobLink            string   `json:"job_link"`
	Message            string   `json:"message"`
	ConsentGiven       bool     `json:"consent_given"`
}

// PilotService handles pilot request business logic for public endpoints
type PilotService struct {
	pilotRepo *repositories.PilotRequestRepository
}

// NewPilotService creates a new pilot service
func NewPilotService(
	pilotRepo *repositories.PilotRequestRepository,
) *PilotService {
	return &PilotService{
		pilotRepo: pilotRepo,
	}
}

// CreatePartial creates a partial pilot request (step 1)
func (s *PilotService) CreatePartial(input CreatePilotInput) (*models.PilotRequest, error) {
	// Validate required fields
	if input.FirstName == "" || input.LastName == "" || input.Email == "" ||
		input.Company == "" || input.RoleToHire == "" {
		return nil, ErrPilotMissingContactInfo
	}

	// Set default locale
	locale := input.Locale
	if locale == "" {
		locale = "fr"
	}

	// Check if a pilot request already exists for this email
	existing, err := s.pilotRepo.FindByEmail(input.Email)
	if err == nil && existing != nil {
		// Return existing if it's still partial
		if existing.Status == models.PilotStatusPartial {
			logger.Info("Returning existing partial pilot request",
				zap.String("pilot_id", existing.ID),
				zap.String("email", input.Email),
			)
			return existing, nil
		}
		// Already completed - update contact info and return
		existing.FirstName = input.FirstName
		existing.LastName = input.LastName
		existing.Company = input.Company
		existing.RoleToHire = input.RoleToHire
		if err := s.pilotRepo.Update(existing); err != nil {
			logger.Error("Failed to update existing pilot request",
				zap.Error(err),
				zap.String("email", input.Email),
			)
		}
		return existing, nil
	}

	// Create new pilot request
	pr := &models.PilotRequest{
		FirstName:   input.FirstName,
		LastName:    input.LastName,
		Email:       input.Email,
		Company:     input.Company,
		RoleToHire:  input.RoleToHire,
		Locale:      locale,
		Status:      models.PilotStatusPartial,
		AdminStatus: models.AdminStatusNew,
	}

	if err := s.pilotRepo.Create(pr); err != nil {
		logger.Error("Failed to create pilot request",
			zap.Error(err),
			zap.String("email", input.Email),
		)
		return nil, err
	}

	logger.Info("Partial pilot request created",
		zap.String("pilot_id", pr.ID),
		zap.String("email", input.Email),
		zap.String("company", input.Company),
	)

	return pr, nil
}

// Complete completes a pilot request with step 2 data
func (s *PilotService) Complete(id string, input CompletePilotInput) (*models.PilotRequest, error) {
	pr, err := s.pilotRepo.FindByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrPilotRequestNotFound
		}
		return nil, err
	}

	// Check if already completed
	if pr.Status == models.PilotStatusComplete {
		return nil, ErrPilotAlreadyComplete
	}

	// Update with step 2 data
	pr.Role = input.Role
	pr.TeamSize = input.TeamSize
	pr.HiringTimeline = input.HiringTimeline
	pr.Website = input.Website
	pr.ProductionContext = input.ProductionContext
	pr.BaselineTimeToHire = input.BaselineTimeToHire
	pr.BaselineInterviews = input.BaselineInterviews
	pr.BaselinePainPoint = input.BaselinePainPoint
	pr.JobLink = input.JobLink
	pr.Message = input.Message
	pr.ConsentGiven = input.ConsentGiven

	// Mark as complete
	now := time.Now()
	pr.Status = models.PilotStatusComplete
	pr.CompletedAt = &now

	if err := s.pilotRepo.Update(pr); err != nil {
		logger.Error("Failed to complete pilot request",
			zap.Error(err),
			zap.String("pilot_id", id),
		)
		return nil, err
	}

	logger.Info("Pilot request completed",
		zap.String("pilot_id", id),
		zap.String("email", pr.Email),
		zap.String("company", pr.Company),
	)

	return pr, nil
}

// Get returns a pilot request by ID
func (s *PilotService) Get(id string) (*models.PilotRequest, error) {
	pr, err := s.pilotRepo.FindByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrPilotRequestNotFound
		}
		return nil, err
	}

	return pr, nil
}
