package repositories

import (
	"gorm.io/gorm"

	"github.com/baaraco/baara/pkg/models"
)

// IdentityRepository handles database operations for identities
type IdentityRepository struct {
	db *gorm.DB
}

// NewIdentityRepository creates a new identity repository
func NewIdentityRepository(db *gorm.DB) *IdentityRepository {
	return &IdentityRepository{db: db}
}

// Create creates a new identity
func (r *IdentityRepository) Create(identity *models.Identity) error {
	return r.db.Create(identity).Error
}

// FindByUserIDAndProvider returns an identity by user ID and provider
func (r *IdentityRepository) FindByUserIDAndProvider(userID string, provider models.AuthProvider) (*models.Identity, error) {
	var identity models.Identity
	err := r.db.Where("user_id = ? AND provider = ?", userID, provider).First(&identity).Error
	if err != nil {
		return nil, err
	}
	return &identity, nil
}
