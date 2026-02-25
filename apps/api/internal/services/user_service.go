package services

import (
	"time"

	"go.uber.org/zap"

	"github.com/baaraco/baara/apps/api/internal/repositories"
	"github.com/baaraco/baara/pkg/logger"
	"github.com/baaraco/baara/pkg/models"
)

// UserService handles user profile operations
type UserService struct {
	userRepo *repositories.UserRepository
}

// NewUserService creates a new user service
func NewUserService(userRepo *repositories.UserRepository) *UserService {
	return &UserService{userRepo: userRepo}
}

// GetProfile returns a user profile by ID with Org preloaded
func (s *UserService) GetProfile(userID string) (*models.User, error) {
	user, err := s.userRepo.FindByIDWithOrg(userID)
	if err != nil {
		return nil, ErrUserNotFound
	}

	return user, nil
}

// UpdateProfile updates a user's profile fields using a map of updates
func (s *UserService) UpdateProfile(userID string, updates map[string]interface{}) (*models.User, error) {
	// Check user exists
	_, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, ErrUserNotFound
	}

	// Validate role_type if provided
	if roleType, ok := updates["role_type"]; ok {
		if !isValidRoleType(roleType) {
			return nil, ErrInvalidRoleType
		}
	}

	// Apply updates directly via repository
	if err := s.userRepo.UpdateByID(userID, updates); err != nil {
		logger.Error("Failed to update user profile",
			zap.Error(err),
			zap.String("user_id", userID),
		)
		return nil, err
	}

	logger.Info("User profile updated",
		zap.String("user_id", userID),
	)

	// Reload user with Org
	return s.userRepo.FindByIDWithOrg(userID)
}

// CompleteOnboarding marks user onboarding as complete and updates profile
func (s *UserService) CompleteOnboarding(userID string, updates map[string]interface{}) (*models.User, error) {
	// Check user exists
	_, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, ErrUserNotFound
	}

	// Validate role_type if provided
	if roleType, ok := updates["role_type"]; ok {
		if !isValidRoleType(roleType) {
			return nil, ErrInvalidRoleType
		}
	}

	// Add onboarding completed timestamp
	updates["onboarding_completed_at"] = time.Now()

	// Apply updates directly via repository
	if err := s.userRepo.UpdateByID(userID, updates); err != nil {
		logger.Error("Failed to complete onboarding",
			zap.Error(err),
			zap.String("user_id", userID),
		)
		return nil, err
	}

	logger.Info("User onboarding completed",
		zap.String("user_id", userID),
	)

	// Reload user with Org
	return s.userRepo.FindByIDWithOrg(userID)
}

// isValidRoleType checks if the provided role type is valid
func isValidRoleType(value interface{}) bool {
	// Handle both string and models.RoleType
	var str string
	switch v := value.(type) {
	case string:
		str = v
	case models.RoleType:
		str = string(v)
	default:
		return false
	}

	switch models.RoleType(str) {
	case models.RoleTypeBackendGo,
		models.RoleTypeInfraPlatform,
		models.RoleTypeSRE,
		models.RoleTypeOther:
		return true
	default:
		return false
	}
}
