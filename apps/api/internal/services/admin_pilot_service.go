package services

import (
	"errors"
	"strings"
	"time"

	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/baaraco/baara/apps/api/internal/repositories"
	"github.com/baaraco/baara/pkg/auth"
	"github.com/baaraco/baara/pkg/logger"
	"github.com/baaraco/baara/pkg/mailer"
	"github.com/baaraco/baara/pkg/models"
)

// Admin pilot service errors
var (
	ErrAdminPilotNotFound         = errors.New("pilot request not found")
	ErrAdminPilotAlreadyConverted = errors.New("pilot request already converted")
	ErrAdminInvalidAdminStatus    = errors.New("invalid admin status")
	ErrAdminOrgNameRequired       = errors.New("organization name is required")
)

// AdminPilotFilters contains filtering options for listing pilot requests
type AdminPilotFilters struct {
	Status  string
	Search  string
	Page    int
	PerPage int
}

// PilotRequestStats contains statistics about pilot requests
type PilotRequestStats struct {
	New          int64 `json:"new"`
	Contacted    int64 `json:"contacted"`
	InDiscussion int64 `json:"in_discussion"`
	Converted    int64 `json:"converted"`
	Rejected     int64 `json:"rejected"`
	Archived     int64 `json:"archived"`
}

// ConvertResult contains the result of converting a pilot to a recruiter
type ConvertResult struct {
	User   *models.User   `json:"user"`
	Org    *models.Org    `json:"org"`
	Invite *models.Invite `json:"invite,omitempty"`
}

// AdminPilotService handles admin pilot request business logic
type AdminPilotService struct {
	pilotRepo    *repositories.PilotRequestRepository
	userRepo     *repositories.UserRepository
	orgRepo      *repositories.OrgRepository
	inviteRepo   *repositories.InviteRepository
	sessionRepo  *repositories.SessionRepository
	identityRepo *repositories.IdentityRepository
	emailService *auth.EmailService
}

// NewAdminPilotService creates a new admin pilot service
func NewAdminPilotService(
	pilotRepo *repositories.PilotRequestRepository,
	userRepo *repositories.UserRepository,
	orgRepo *repositories.OrgRepository,
	inviteRepo *repositories.InviteRepository,
	sessionRepo *repositories.SessionRepository,
	identityRepo *repositories.IdentityRepository,
	m mailer.Mailer,
) *AdminPilotService {
	return &AdminPilotService{
		pilotRepo:    pilotRepo,
		userRepo:     userRepo,
		orgRepo:      orgRepo,
		inviteRepo:   inviteRepo,
		sessionRepo:  sessionRepo,
		identityRepo: identityRepo,
		emailService: auth.NewEmailService(m),
	}
}

// List returns pilot requests with filtering and pagination
func (s *AdminPilotService) List(filters AdminPilotFilters) ([]models.PilotRequest, int64, *PilotRequestStats, error) {
	// Set default pagination
	if filters.Page <= 0 {
		filters.Page = 1
	}
	if filters.PerPage <= 0 {
		filters.PerPage = 20
	}

	// Get paginated list
	requests, total, err := s.pilotRepo.ListComplete(filters.Status, filters.Search, filters.Page, filters.PerPage)
	if err != nil {
		logger.Error("Failed to list pilot requests", zap.Error(err))
		return nil, 0, nil, err
	}

	// Get stats
	stats := s.getStats()

	return requests, total, stats, nil
}

// getStats returns statistics about pilot requests by admin status
func (s *AdminPilotService) getStats() *PilotRequestStats {
	stats := &PilotRequestStats{}

	if count, err := s.pilotRepo.CountByAdminStatus(models.AdminStatusNew); err == nil {
		stats.New = count
	}
	if count, err := s.pilotRepo.CountByAdminStatus(models.AdminStatusContacted); err == nil {
		stats.Contacted = count
	}
	if count, err := s.pilotRepo.CountByAdminStatus(models.AdminStatusInDiscussion); err == nil {
		stats.InDiscussion = count
	}
	if count, err := s.pilotRepo.CountByAdminStatus(models.AdminStatusConverted); err == nil {
		stats.Converted = count
	}
	if count, err := s.pilotRepo.CountByAdminStatus(models.AdminStatusRejected); err == nil {
		stats.Rejected = count
	}
	if count, err := s.pilotRepo.CountByAdminStatus(models.AdminStatusArchived); err == nil {
		stats.Archived = count
	}

	return stats
}

// Get returns a pilot request by ID with user preloaded
func (s *AdminPilotService) Get(id string) (*models.PilotRequest, error) {
	pr, err := s.pilotRepo.FindByIDWithUser(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAdminPilotNotFound
		}
		return nil, err
	}

	return pr, nil
}

// UpdateStatus updates the admin status of a pilot request
func (s *AdminPilotService) UpdateStatus(id string, status models.AdminStatus) (*models.PilotRequest, error) {
	pr, err := s.pilotRepo.FindByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAdminPilotNotFound
		}
		return nil, err
	}

	// Validate status
	validStatuses := map[models.AdminStatus]bool{
		models.AdminStatusNew:          true,
		models.AdminStatusContacted:    true,
		models.AdminStatusInDiscussion: true,
		models.AdminStatusConverted:    true,
		models.AdminStatusRejected:     true,
		models.AdminStatusArchived:     true,
	}

	if !validStatuses[status] {
		return nil, ErrAdminInvalidAdminStatus
	}

	pr.AdminStatus = status

	if err := s.pilotRepo.Update(pr); err != nil {
		logger.Error("Failed to update pilot request status",
			zap.Error(err),
			zap.String("pilot_id", id),
			zap.String("status", string(status)),
		)
		return nil, err
	}

	logger.Info("Pilot request status updated",
		zap.String("pilot_id", id),
		zap.String("status", string(status)),
	)

	return pr, nil
}

// AddNote adds a note to a pilot request
func (s *AdminPilotService) AddNote(id string, content string, userID string, userName string) (*models.PilotRequest, error) {
	pr, err := s.pilotRepo.FindByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAdminPilotNotFound
		}
		return nil, err
	}

	// Add note using model method
	if err := pr.AddNote(content, userID, userName); err != nil {
		logger.Error("Failed to add note to pilot request",
			zap.Error(err),
			zap.String("pilot_id", id),
		)
		return nil, err
	}

	if err := s.pilotRepo.Update(pr); err != nil {
		logger.Error("Failed to save pilot request with note",
			zap.Error(err),
			zap.String("pilot_id", id),
		)
		return nil, err
	}

	logger.Info("Note added to pilot request",
		zap.String("pilot_id", id),
		zap.String("user_id", userID),
	)

	return pr, nil
}

// ConvertToRecruiter converts a pilot request to a recruiter user with an organization
func (s *AdminPilotService) ConvertToRecruiter(
	id string,
	orgName string,
	sendInvitation bool,
	currentUser *models.User,
) (*ConvertResult, error) {
	pr, err := s.pilotRepo.FindByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAdminPilotNotFound
		}
		return nil, err
	}

	// Check if already converted
	if pr.ConvertedUserID != nil {
		return nil, ErrAdminPilotAlreadyConverted
	}

	// Determine org name
	if orgName == "" {
		if pr.Company != "" {
			orgName = pr.Company
		} else {
			return nil, ErrAdminOrgNameRequired
		}
	}

	// Generate org slug
	slug := generateOrgSlug(orgName)

	// Create organization
	org := &models.Org{
		Name: orgName,
		Slug: slug,
		Plan: models.OrgPlanPilot,
	}

	if pr.Website != "" {
		org.Website = pr.Website
	}

	if err := s.orgRepo.Create(org); err != nil {
		logger.Error("Failed to create org for pilot conversion",
			zap.Error(err),
			zap.String("pilot_id", id),
		)
		return nil, err
	}

	result := &ConvertResult{
		Org: org,
	}

	if sendInvitation {
		// Create invite instead of user
		invite, err := s.createInvite(pr, org, currentUser)
		if err != nil {
			logger.Error("Failed to create invite for pilot conversion",
				zap.Error(err),
				zap.String("pilot_id", id),
			)
			return nil, err
		}
		result.Invite = invite
	} else {
		// Create user directly
		user, err := s.createUser(pr, org)
		if err != nil {
			logger.Error("Failed to create user for pilot conversion",
				zap.Error(err),
				zap.String("pilot_id", id),
			)
			return nil, err
		}
		result.User = user
	}

	// Update pilot request
	now := time.Now()
	pr.AdminStatus = models.AdminStatusConverted
	pr.ConvertedAt = &now

	if result.User != nil {
		pr.ConvertedUserID = &result.User.ID
	}

	if err := s.pilotRepo.Update(pr); err != nil {
		logger.Error("Failed to update pilot request after conversion",
			zap.Error(err),
			zap.String("pilot_id", id),
		)
		return nil, err
	}

	logger.Info("Pilot request converted to recruiter",
		zap.String("pilot_id", id),
		zap.String("org_id", org.ID),
		zap.Bool("invitation_sent", sendInvitation),
	)

	return result, nil
}

// createUser creates a recruiter user from a pilot request
func (s *AdminPilotService) createUser(pr *models.PilotRequest, org *models.Org) (*models.User, error) {
	now := time.Now()
	fullName := strings.TrimSpace(pr.FirstName + " " + pr.LastName)

	user := &models.User{
		Email:           pr.Email,
		Name:            fullName,
		Role:            models.RoleRecruiter,
		OrgID:           &org.ID,
		Status:          models.UserStatusActive,
		Locale:          pr.Locale,
		EmailVerifiedAt: &now,
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, err
	}

	// Create identity for magiclink
	identity := &models.Identity{
		UserID:   user.ID,
		Provider: models.ProviderMagicLink,
		Email:    pr.Email,
	}

	if err := s.identityRepo.Create(identity); err != nil {
		logger.Error("Failed to create identity for converted user",
			zap.Error(err),
			zap.String("user_id", user.ID),
		)
	}

	return user, nil
}

// createInvite creates an invite for a pilot request
func (s *AdminPilotService) createInvite(pr *models.PilotRequest, org *models.Org, invitedBy *models.User) (*models.Invite, error) {
	// Generate token
	token, hash, err := auth.GenerateToken()
	if err != nil {
		return nil, err
	}

	invite := &models.Invite{
		Email:     pr.Email,
		Role:      models.RoleRecruiter,
		OrgID:     &org.ID,
		TokenHash: hash,
		ExpiresAt: time.Now().Add(auth.InviteRecruiterDuration),
	}

	if invitedBy != nil {
		invite.InvitedBy = &invitedBy.ID
	}

	if err := s.inviteRepo.Create(invite); err != nil {
		return nil, err
	}

	// Send invite email
	if err := s.emailService.SendRecruiterInvite(pr.Email, token, org, pr.Locale); err != nil {
		logger.Error("Failed to send recruiter invite email",
			zap.Error(err),
			zap.String("email", pr.Email),
		)
		// Don't fail the conversion if email fails
	}

	return invite, nil
}

// generateOrgSlug creates a URL-safe slug from an org name
func generateOrgSlug(name string) string {
	slug := strings.ToLower(name)
	slug = strings.ReplaceAll(slug, " ", "-")
	// Remove special characters
	var result strings.Builder
	for _, r := range slug {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' {
			result.WriteRune(r)
		}
	}
	slug = result.String()
	// Clean up multiple hyphens
	for strings.Contains(slug, "--") {
		slug = strings.ReplaceAll(slug, "--", "-")
	}
	slug = strings.Trim(slug, "-")

	// Add random suffix for uniqueness
	suffix := auth.GenerateSlug("")
	if suffix != "" {
		slug = slug + "-" + suffix
	}

	return slug
}
