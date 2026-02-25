package repositories

import (
	"gorm.io/gorm"

	"github.com/baaraco/baara/pkg/models"
)

// InterviewSessionRepository handles database operations for interview sessions
type InterviewSessionRepository struct {
	db *gorm.DB
}

// NewInterviewSessionRepository creates a new interview session repository
func NewInterviewSessionRepository(db *gorm.DB) *InterviewSessionRepository {
	return &InterviewSessionRepository{db: db}
}

// FindByAttemptID returns an interview session by attempt ID
func (r *InterviewSessionRepository) FindByAttemptID(attemptID string) (*models.InterviewSession, error) {
	var session models.InterviewSession
	err := r.db.Where("attempt_id = ?", attemptID).First(&session).Error
	if err != nil {
		return nil, err
	}
	return &session, nil
}

// Create creates a new interview session
func (r *InterviewSessionRepository) Create(session *models.InterviewSession) error {
	return r.db.Create(session).Error
}

// Update updates an interview session
func (r *InterviewSessionRepository) Update(session *models.InterviewSession) error {
	return r.db.Save(session).Error
}
