package services

import (
	"errors"
	"time"

	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/baaraco/baara/apps/api/internal/repositories"
	"github.com/baaraco/baara/pkg/auth"
	"github.com/baaraco/baara/pkg/logger"
	"github.com/baaraco/baara/pkg/mailer"
	"github.com/baaraco/baara/pkg/models"
)

// Auth errors
var (
	ErrUserNotFound     = errors.New("user not found")
	ErrInvalidToken     = errors.New("invalid or expired token")
	ErrSessionInvalid   = errors.New("session invalid")
	ErrAccountDisabled  = errors.New("account disabled")
	ErrSessionCreateErr = errors.New("failed to create session")
)

// ExchangeResult contains the result of token exchange
type ExchangeResult struct {
	User         *models.User
	SessionToken string
	IsNewUser    bool
}

// AuthService handles authentication business logic
type AuthService struct {
	userRepo       *repositories.UserRepository
	sessionRepo    *repositories.SessionRepository
	loginTokenRepo *repositories.LoginTokenRepository
	identityRepo   *repositories.IdentityRepository
	emailService   *auth.EmailService
}

// NewAuthService creates a new auth service
func NewAuthService(
	userRepo *repositories.UserRepository,
	sessionRepo *repositories.SessionRepository,
	loginTokenRepo *repositories.LoginTokenRepository,
	identityRepo *repositories.IdentityRepository,
	m mailer.Mailer,
) *AuthService {
	return &AuthService{
		userRepo:       userRepo,
		sessionRepo:    sessionRepo,
		loginTokenRepo: loginTokenRepo,
		identityRepo:   identityRepo,
		emailService:   auth.NewEmailService(m),
	}
}

// StartAuth initiates the authentication flow by sending a magic link
// Returns true if the magic link was sent (for logging purposes)
func (s *AuthService) StartAuth(email, locale string) bool {
	if locale == "" {
		locale = "fr"
	}

	// Look up user by email
	user, err := s.userRepo.FindByEmail(email)
	if err == nil {
		// User exists
		// Check if non-candidate with pending status (can't login yet)
		if user.Role != models.RoleCandidate && user.Status == models.UserStatusPending {
			logger.Debug("Login attempt for pending non-candidate user",
				zap.String("email", email),
				zap.String("role", string(user.Role)),
			)
			return false
		}

		// User exists and can login - send magic link
		if err := s.sendMagicLink(email, false, locale); err != nil {
			logger.Error("Failed to send magic link", zap.Error(err), zap.String("email", email))
			return false
		}
		return true
	}

	// User does not exist - create new candidate user
	newUser := &models.User{
		Email:  email,
		Role:   models.RoleCandidate,
		Status: models.UserStatusPending,
		Locale: locale,
	}

	if err := s.userRepo.Create(newUser); err != nil {
		logger.Error("Failed to create user", zap.Error(err), zap.String("email", email))
		return false
	}

	// Create identity for magiclink
	identity := &models.Identity{
		UserID:   newUser.ID,
		Provider: models.ProviderMagicLink,
		Email:    email,
	}

	if err := s.identityRepo.Create(identity); err != nil {
		logger.Error("Failed to create identity", zap.Error(err), zap.String("user_id", newUser.ID))
	}

	// Send welcome email (is_new_user = true)
	if err := s.sendMagicLink(email, true, locale); err != nil {
		logger.Error("Failed to send welcome email", zap.Error(err), zap.String("email", email))
		return false
	}

	logger.Info("New candidate user created",
		zap.String("user_id", newUser.ID),
		zap.String("email", email),
	)

	return true
}

func (s *AuthService) sendMagicLink(email string, isNewUser bool, locale string) error {
	// Generate token
	token, hash, err := auth.GenerateToken()
	if err != nil {
		return err
	}

	// Save to database
	loginToken := &models.LoginToken{
		Email:     email,
		TokenHash: hash,
		IsNewUser: isNewUser,
		ExpiresAt: time.Now().Add(auth.MagicLinkDuration),
	}

	if err := s.loginTokenRepo.Create(loginToken); err != nil {
		return err
	}

	// Send email
	return s.emailService.SendMagicLink(email, token, isNewUser, locale)
}

// Exchange validates a magic link token and creates a session
func (s *AuthService) Exchange(token, clientIP, userAgent string) (*ExchangeResult, error) {
	// Hash the provided token
	tokenHash := auth.HashToken(token)

	// Find the login token
	loginToken, err := s.loginTokenRepo.FindByTokenHash(tokenHash)
	if err != nil {
		return nil, ErrInvalidToken
	}

	// Check if token is valid
	if !loginToken.IsValid() {
		return nil, ErrInvalidToken
	}

	// Mark token as consumed
	if consumeErr := s.loginTokenRepo.Consume(loginToken); consumeErr != nil {
		logger.Error("Failed to consume login token", zap.Error(consumeErr))
	}

	// Find user by email
	user, err := s.userRepo.FindByEmailWithOrg(loginToken.Email)
	if err != nil {
		return nil, ErrUserNotFound
	}

	// Activate user if pending
	now := time.Now()
	if user.Status == models.UserStatusPending {
		user.Status = models.UserStatusActive
		user.EmailVerifiedAt = &now
	}
	user.LastLoginAt = &now

	if updateErr := s.userRepo.Update(user); updateErr != nil {
		logger.Error("Failed to update user", zap.Error(updateErr))
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

	logger.Info("User logged in",
		zap.String("user_id", user.ID),
		zap.String("email", user.Email),
		zap.Bool("new_user", loginToken.IsNewUser),
	)

	return &ExchangeResult{
		User:         user,
		SessionToken: sessionToken,
		IsNewUser:    loginToken.IsNewUser,
	}, nil
}

// Logout revokes a session
func (s *AuthService) Logout(sessionToken string) error {
	tokenHash := auth.HashToken(sessionToken)

	session, err := s.sessionRepo.FindByTokenHash(tokenHash)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil // Session not found, nothing to do
		}
		return err
	}

	if !session.IsValid() {
		return nil // Already invalid
	}

	if err := s.sessionRepo.Revoke(session); err != nil {
		return err
	}

	logger.Info("User logged out",
		zap.String("user_id", session.UserID),
		zap.String("session_id", session.ID),
	)

	return nil
}

// GetCurrentUser returns the user associated with a session token
func (s *AuthService) GetCurrentUser(sessionToken string) (*models.User, error) {
	tokenHash := auth.HashToken(sessionToken)

	session, err := s.sessionRepo.FindByTokenHash(tokenHash)
	if err != nil {
		return nil, ErrSessionInvalid
	}

	if !session.IsValid() {
		return nil, ErrSessionInvalid
	}

	user, err := s.userRepo.FindByIDWithOrg(session.UserID)
	if err != nil {
		return nil, ErrUserNotFound
	}

	if !user.IsActive() {
		return nil, ErrAccountDisabled
	}

	return user, nil
}
