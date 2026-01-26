package bootstrap

import (
	"strings"

	"github.com/baaraco/baara/apps/api/internal/config"
	"github.com/baaraco/baara/pkg/database"
	"github.com/baaraco/baara/pkg/logger"
	"github.com/baaraco/baara/pkg/models"
	"go.uber.org/zap"
)

// Admin creates the first admin user if BOOTSTRAP_ADMIN_EMAIL is set
// and no admin exists in the database. This is idempotent.
func Admin(cfg *config.Config) error {
	// Skip if no bootstrap email configured
	email := strings.TrimSpace(cfg.BootstrapAdminEmail)
	if email == "" {
		logger.Debug("No BOOTSTRAP_ADMIN_EMAIL set, skipping admin bootstrap")
		return nil
	}

	// Normalize email
	email = strings.ToLower(email)

	// Check if any admin already exists
	var adminCount int64
	if err := database.Db.Model(&models.User{}).Where("role = ?", models.RoleAdmin).Count(&adminCount).Error; err != nil {
		logger.Error("Failed to check for existing admins", zap.Error(err))
		return err
	}

	if adminCount > 0 {
		logger.Debug("Admin user(s) already exist, skipping bootstrap",
			zap.Int64("admin_count", adminCount),
		)
		return nil
	}

	// Check if this email already exists (but not as admin)
	var existingUser models.User
	result := database.Db.Where("email = ?", email).First(&existingUser)
	if result.Error == nil {
		// User exists, promote to admin
		existingUser.Role = models.RoleAdmin
		if err := database.Db.Save(&existingUser).Error; err != nil {
			logger.Error("Failed to promote existing user to admin", zap.Error(err))
			return err
		}
		logger.Info("Promoted existing user to admin",
			zap.String("email", email),
			zap.String("user_id", existingUser.ID),
		)
		return nil
	}

	// Create new admin user
	name := strings.TrimSpace(cfg.BootstrapAdminName)
	if name == "" {
		name = "Admin"
	}

	admin := models.User{
		Email: email,
		Name:  name,
		Role:  models.RoleAdmin,
	}

	if err := database.Db.Create(&admin).Error; err != nil {
		logger.Error("Failed to create bootstrap admin", zap.Error(err))
		return err
	}

	logger.Info("Bootstrap admin created successfully",
		zap.String("email", email),
		zap.String("name", name),
		zap.String("user_id", admin.ID),
	)

	return nil
}
