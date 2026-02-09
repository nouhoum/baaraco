package repositories

import (
	"time"

	"gorm.io/gorm"

	"github.com/baaraco/baara/pkg/models"
)

// LoginTokenRepository handles database operations for login tokens
type LoginTokenRepository struct {
	db *gorm.DB
}

// NewLoginTokenRepository creates a new login token repository
func NewLoginTokenRepository(db *gorm.DB) *LoginTokenRepository {
	return &LoginTokenRepository{db: db}
}

// FindByTokenHash returns a login token by token hash
func (r *LoginTokenRepository) FindByTokenHash(tokenHash string) (*models.LoginToken, error) {
	var token models.LoginToken
	err := r.db.Where("token_hash = ?", tokenHash).First(&token).Error
	if err != nil {
		return nil, err
	}
	return &token, nil
}

// Create creates a new login token
func (r *LoginTokenRepository) Create(token *models.LoginToken) error {
	return r.db.Create(token).Error
}

// Consume marks a login token as consumed
func (r *LoginTokenRepository) Consume(token *models.LoginToken) error {
	now := time.Now()
	token.ConsumedAt = &now
	return r.db.Save(token).Error
}
