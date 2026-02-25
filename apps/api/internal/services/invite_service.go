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

var (
	ErrInviteNotFound        = errors.New("invite not found")
	ErrInviteExpired         = errors.New("invite expired")
	ErrAlreadyExists         = errors.New("user already exists")
	ErrDuplicateAttempt      = errors.New("candidate already has attempt for this job")
	ErrDuplicateInvite       = errors.New("pending invite already exists")
	ErrRecruiterCannotInvite = errors.New("recruiters can only invite candidates")
	ErrCandidateCannotInvite = errors.New("candidates cannot send invites")
)

// InviteInfo contains information about an invite for display
type InviteInfo struct {
	Email    string
	Role     string
	OrgName  string
	JobTitle string
	Valid    bool
}

// AcceptResult contains the result of accepting an invite
type AcceptResult struct {
	User         *models.User
	SessionToken string
}

// InviteService handles invitation business logic
type InviteService struct {
	inviteRepo   *repositories.InviteRepository
	userRepo     *repositories.UserRepository
	jobRepo      *repositories.JobRepository
	attemptRepo  *repositories.AttemptRepository
	sessionRepo  *repositories.SessionRepository
	identityRepo *repositories.IdentityRepository
	emailService *auth.EmailService
}

// NewInviteService creates a new invite service
func NewInviteService(
	inviteRepo *repositories.InviteRepository,
	userRepo *repositories.UserRepository,
	jobRepo *repositories.JobRepository,
	attemptRepo *repositories.AttemptRepository,
	sessionRepo *repositories.SessionRepository,
	identityRepo *repositories.IdentityRepository,
	m mailer.Mailer,
) *InviteService {
	return &InviteService{
		inviteRepo:   inviteRepo,
		userRepo:     userRepo,
		jobRepo:      jobRepo,
		attemptRepo:  attemptRepo,
		sessionRepo:  sessionRepo,
		identityRepo: identityRepo,
		emailService: auth.NewEmailService(m),
	}
}

// CreateInvite creates a new invitation and sends the invite email
func (s *InviteService) CreateInvite(currentUser *models.User, email string, role models.UserRole, jobID string, locale string) (*models.Invite, error) {
	if locale == "" {
		locale = "fr"
	}

	// Normalize email
	email = strings.ToLower(strings.TrimSpace(email))

	// Validate permissions based on current user role
	if currentUser.Role == models.RoleCandidate {
		return nil, ErrCandidateCannotInvite
	}

	if currentUser.Role == models.RoleRecruiter && role != models.RoleCandidate {
		return nil, ErrRecruiterCannotInvite
	}

	// Check if user already exists
	existingUser, err := s.userRepo.FindByEmail(email)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		logger.Error("Failed to look up user by email", zap.Error(err), zap.String("email", email))
		return nil, err
	}
	if existingUser != nil {
		// For candidate invites to a job, allow if they don't have a duplicate attempt
		if role == models.RoleCandidate && jobID != "" {
			// Check for existing attempt by job+candidate
			_, attemptErr := s.attemptRepo.FindByJobAndCandidate(jobID, existingUser.ID)
			if attemptErr == nil {
				return nil, ErrDuplicateAttempt
			}
			// Also check by role_type for cross-job deduplication
			job, err := s.jobRepo.FindByID(jobID)
			if err == nil && job.RoleType != "" {
				_, attemptErr := s.attemptRepo.FindActiveByUserAndRole(existingUser.ID, job.RoleType)
				if attemptErr == nil {
					return nil, ErrDuplicateAttempt
				}
			}
			// Candidate exists but no duplicate attempt — allow the invite
		} else {
			return nil, ErrAlreadyExists
		}
	}

	// Check for existing pending invite
	if role == models.RoleCandidate && jobID != "" {
		_, err := s.inviteRepo.FindPendingByEmailAndJob(email, jobID)
		if err == nil {
			return nil, ErrDuplicateInvite
		}
	} else {
		_, err := s.inviteRepo.FindPendingByEmail(email)
		if err == nil {
			return nil, ErrDuplicateInvite
		}
	}

	// Generate token
	token, hash, err := auth.GenerateToken()
	if err != nil {
		logger.Error("Failed to generate invite token", zap.Error(err))
		return nil, err
	}

	// Set expiration based on role
	var expiresAt time.Time
	if role == models.RoleCandidate {
		expiresAt = time.Now().Add(auth.InviteCandidateDuration)
	} else {
		expiresAt = time.Now().Add(auth.InviteRecruiterDuration)
	}

	// Create invite
	invite := &models.Invite{
		Email:     email,
		Role:      role,
		TokenHash: hash,
		ExpiresAt: expiresAt,
		InvitedBy: &currentUser.ID,
	}

	// Set org for recruiter invites
	if role == models.RoleRecruiter && currentUser.OrgID != nil {
		invite.OrgID = currentUser.OrgID
	}

	// Set job for candidate invites
	if role == models.RoleCandidate && jobID != "" {
		invite.JobID = &jobID
		// Get the job to find the org
		job, err := s.jobRepo.FindByIDWithOrg(jobID)
		if err == nil && job.OrgID != nil {
			invite.OrgID = job.OrgID
		}
	}

	if err := s.inviteRepo.Create(invite); err != nil {
		logger.Error("Failed to create invite", zap.Error(err), zap.String("email", email))
		return nil, err
	}

	// Send invite email
	switch role {
	case models.RoleRecruiter:
		if currentUser.Org != nil {
			if err := s.emailService.SendRecruiterInvite(email, token, currentUser.Org, locale); err != nil {
				logger.Error("Failed to send recruiter invite email", zap.Error(err), zap.String("email", email))
				// Don't fail the invite creation if email fails
			}
		}
	case models.RoleCandidate:
		var job *models.Job
		var org *models.Org
		if invite.JobID != nil {
			var jobErr error
			job, jobErr = s.jobRepo.FindByIDWithOrg(*invite.JobID)
			if jobErr != nil {
				logger.Warn("Failed to load job for invite email", zap.Error(jobErr), zap.String("job_id", *invite.JobID))
			}
			if job != nil {
				org = job.Org
			}
		}
		if err := s.emailService.SendCandidateInvite(email, token, org, job, locale); err != nil {
			logger.Error("Failed to send candidate invite email", zap.Error(err), zap.String("email", email))
			// Don't fail the invite creation if email fails
		}
	}

	logger.Info("Invite created",
		zap.String("invite_id", invite.ID),
		zap.String("email", email),
		zap.String("role", string(role)),
		zap.String("invited_by", currentUser.ID),
	)

	return invite, nil
}

// GetInviteInfo returns information about an invite for display
func (s *InviteService) GetInviteInfo(token string) (*InviteInfo, error) {
	tokenHash := auth.HashToken(token)

	invite, err := s.inviteRepo.FindByTokenHash(tokenHash)
	if err != nil {
		return nil, ErrInviteNotFound
	}

	info := &InviteInfo{
		Email: invite.Email,
		Role:  string(invite.Role),
		Valid: invite.IsValid(),
	}

	// Add org name if available
	if invite.Org != nil {
		info.OrgName = invite.Org.Name
	}

	// Add job title if available
	if invite.Job != nil {
		info.JobTitle = invite.Job.Title
	}

	return info, nil
}

// AcceptInvite accepts an invitation, creates the user, and returns a session
func (s *InviteService) AcceptInvite(token string, name string, clientIP string, userAgent string) (*AcceptResult, error) {
	tokenHash := auth.HashToken(token)

	// Find and validate invite
	invite, err := s.inviteRepo.FindByTokenHash(tokenHash)
	if err != nil {
		return nil, ErrInviteNotFound
	}

	if !invite.IsValid() {
		return nil, ErrInviteExpired
	}

	now := time.Now()

	// Check if user already exists
	existingUser, err := s.userRepo.FindByEmail(invite.Email)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		logger.Error("Failed to look up user by email", zap.Error(err), zap.String("email", invite.Email))
		return nil, err
	}

	var user *models.User

	if existingUser != nil {
		// Update existing user's profile
		if name != "" {
			existingUser.Name = name
		}
		if invite.OrgID != nil {
			existingUser.OrgID = invite.OrgID
		}
		existingUser.LastLoginAt = &now
		if err := s.userRepo.Update(existingUser); err != nil {
			logger.Error("Failed to update existing user from invite", zap.Error(err), zap.String("email", invite.Email))
			return nil, err
		}

		// Create attempt for candidate job invites
		if invite.Role == models.RoleCandidate && invite.JobID != nil {
			job, jobErr := s.jobRepo.FindByID(*invite.JobID)
			if jobErr == nil {
				attempt := &models.WorkSampleAttempt{
					CandidateID: existingUser.ID,
					JobID:       invite.JobID,
					Status:      models.WorkSampleAttemptStatus("draft"),
					RoleType:    job.RoleType,
				}
				if _, _, createErr := s.attemptRepo.Create(attempt); createErr != nil {
					logger.Error("Failed to create attempt for existing user",
						zap.Error(createErr),
						zap.String("user_id", existingUser.ID),
					)
				}
			}
		}

		user = existingUser
	} else {
		// Create new user
		user = &models.User{
			Email:           invite.Email,
			Name:            name,
			Role:            invite.Role,
			Status:          models.UserStatusActive,
			EmailVerifiedAt: &now,
			LastLoginAt:     &now,
			Locale:          "fr",
		}

		// Set org for recruiter invites
		if invite.Role == models.RoleRecruiter && invite.OrgID != nil {
			user.OrgID = invite.OrgID
		}

		if err := s.userRepo.Create(user); err != nil {
			logger.Error("Failed to create user from invite", zap.Error(err), zap.String("email", invite.Email))
			return nil, err
		}

		// Create identity for magiclink
		identity := &models.Identity{
			UserID:   user.ID,
			Provider: models.ProviderMagicLink,
			Email:    invite.Email,
		}

		if err := s.identityRepo.Create(identity); err != nil {
			logger.Error("Failed to create identity", zap.Error(err), zap.String("user_id", user.ID))
		}

		// Create attempt for candidate job invites
		if invite.Role == models.RoleCandidate && invite.JobID != nil {
			job, jobErr := s.jobRepo.FindByID(*invite.JobID)
			if jobErr == nil {
				attempt := &models.WorkSampleAttempt{
					CandidateID: user.ID,
					JobID:       invite.JobID,
					Status:      models.WorkSampleAttemptStatus("draft"),
					RoleType:    job.RoleType,
				}
				if _, _, createErr := s.attemptRepo.Create(attempt); createErr != nil {
					logger.Error("Failed to create attempt for new user",
						zap.Error(createErr),
						zap.String("user_id", user.ID),
					)
				}
			}
		}
	}

	// Mark invite as accepted
	invite.AcceptedAt = &now
	if err := s.inviteRepo.Update(invite); err != nil {
		logger.Error("Failed to mark invite as accepted", zap.Error(err), zap.String("invite_id", invite.ID))
	}

	// Create session
	sessionToken, sessionHash, err := auth.GenerateToken()
	if err != nil {
		logger.Error("Failed to generate session token", zap.Error(err))
		return nil, ErrSessionCreateErr
	}

	session := &models.Session{
		UserID:    user.ID,
		TokenHash: sessionHash,
		IPAddress: clientIP,
		UserAgent: userAgent,
		ExpiresAt: time.Now().Add(auth.SessionDuration),
	}

	if err := s.sessionRepo.Create(session); err != nil {
		logger.Error("Failed to create session", zap.Error(err))
		return nil, ErrSessionCreateErr
	}

	// Load org for response
	if user.OrgID != nil {
		userWithOrg, orgErr := s.userRepo.FindByIDWithOrg(user.ID)
		if orgErr != nil {
			logger.Warn("Failed to load user with org", zap.Error(orgErr), zap.String("user_id", user.ID))
		} else {
			user = userWithOrg
		}
	}

	logger.Info("Invite accepted",
		zap.String("user_id", user.ID),
		zap.String("email", user.Email),
		zap.String("role", string(user.Role)),
		zap.String("invite_id", invite.ID),
	)

	return &AcceptResult{
		User:         user,
		SessionToken: sessionToken,
	}, nil
}
