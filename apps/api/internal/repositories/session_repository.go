package repositories

import (
	"time"

	"gorm.io/gorm"

	"github.com/baaraco/baara/pkg/models"
)

// SessionRepository handles database operations for sessions
type SessionRepository struct {
	db *gorm.DB
}

// NewSessionRepository creates a new session repository
func NewSessionRepository(db *gorm.DB) *SessionRepository {
	return &SessionRepository{db: db}
}

// FindByTokenHash returns a session by token hash
func (r *SessionRepository) FindByTokenHash(tokenHash string) (*models.Session, error) {
	var session models.Session
	err := r.db.Where("token_hash = ?", tokenHash).First(&session).Error
	if err != nil {
		return nil, err
	}
	return &session, nil
}

// Create creates a new session
func (r *SessionRepository) Create(session *models.Session) error {
	return r.db.Create(session).Error
}

// Revoke marks a session as revoked
func (r *SessionRepository) Revoke(session *models.Session) error {
	now := time.Now()
	session.RevokedAt = &now
	return r.db.Save(session).Error
}
