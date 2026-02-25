package services

import (
	"errors"
	"time"

	"go.uber.org/zap"

	"github.com/baaraco/baara/apps/api/internal/repositories"
	"github.com/baaraco/baara/pkg/auth"
	"github.com/baaraco/baara/pkg/logger"
	"github.com/baaraco/baara/pkg/mailer"
	"github.com/baaraco/baara/pkg/models"
)

var (
	ErrFormatRequestNotFound = errors.New("format request not found")
	ErrAlreadyProcessed      = errors.New("request already processed")
)

// FormatRequestService handles business logic for format requests
type FormatRequestService struct {
	formatRequestRepo *repositories.FormatRequestRepository
	emailService      *auth.EmailService
}

// NewFormatRequestService creates a new format request service
func NewFormatRequestService(
	formatRequestRepo *repositories.FormatRequestRepository,
	m mailer.Mailer,
) *FormatRequestService {
	return &FormatRequestService{
		formatRequestRepo: formatRequestRepo,
		emailService:      auth.NewEmailService(m),
	}
}

// List returns format requests filtered by status
func (s *FormatRequestService) List(status string) ([]models.FormatRequest, error) {
	return s.formatRequestRepo.List(status)
}

// Get returns a format request by ID with access control for candidates
func (s *FormatRequestService) Get(id string, user *models.User) (*models.FormatRequest, error) {
	request, err := s.formatRequestRepo.FindByIDWithAssociations(id)
	if err != nil {
		return nil, ErrFormatRequestNotFound
	}

	// Access control: candidates can only access their own requests
	if user.Role == models.RoleCandidate {
		if request.CandidateID == nil || *request.CandidateID != user.ID {
			return nil, ErrFormatRequestNotFound
		}
	}

	return request, nil
}

// Respond processes a format request response and sends email notification
func (s *FormatRequestService) Respond(
	id string,
	reviewerID string,
	status models.FormatRequestStatus,
	responseMessage string,
) (*models.FormatRequest, error) {
	request, err := s.formatRequestRepo.FindByIDWithAssociations(id)
	if err != nil {
		return nil, ErrFormatRequestNotFound
	}

	// Check if already processed
	if request.Status != models.FormatRequestStatusPending {
		return nil, ErrAlreadyProcessed
	}

	// Update the request
	now := time.Now()
	updates := map[string]interface{}{
		"status":           status,
		"response_message": responseMessage,
		"reviewed_by":      reviewerID,
		"reviewed_at":      now,
	}

	if err := s.formatRequestRepo.Updates(request, updates); err != nil {
		return nil, err
	}

	// Apply updates to the request object for return
	request.Status = status
	request.ResponseMessage = responseMessage
	request.ReviewedBy = &reviewerID
	request.ReviewedAt = &now

	// Send email notification to the candidate
	if request.Candidate != nil && request.Candidate.Email != "" {
		approved := status == models.FormatRequestStatusApproved
		locale := request.Candidate.Locale
		if locale == "" {
			locale = "fr"
		}

		if err := s.emailService.SendFormatRequestResponse(
			request.Candidate.Email,
			approved,
			responseMessage,
			locale,
		); err != nil {
			logger.Error("Failed to send format request response email",
				zap.Error(err),
				zap.String("request_id", id),
				zap.String("candidate_email", request.Candidate.Email),
			)
			// Don't fail the operation if email fails
		} else {
			logger.Info("Format request response email sent",
				zap.String("request_id", id),
				zap.String("candidate_email", request.Candidate.Email),
				zap.Bool("approved", approved),
			)
		}
	}

	return request, nil
}

// GetPendingCount returns the count of pending format requests
func (s *FormatRequestService) GetPendingCount() (int64, error) {
	return s.formatRequestRepo.CountPending()
}
