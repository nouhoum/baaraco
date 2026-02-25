package repositories

import (
	"strings"

	"gorm.io/gorm"

	"github.com/baaraco/baara/pkg/models"
)

// AttemptRepository handles database operations for work sample attempts
type AttemptRepository struct {
	db *gorm.DB
}

// NewAttemptRepository creates a new attempt repository
func NewAttemptRepository(db *gorm.DB) *AttemptRepository {
	return &AttemptRepository{db: db}
}

// FindActiveByUserAndRole returns an active (draft/in_progress/interviewing) attempt
// for a given user and role type
func (r *AttemptRepository) FindActiveByUserAndRole(userID, roleType string) (*models.WorkSampleAttempt, error) {
	var attempt models.WorkSampleAttempt
	err := r.db.Where("candidate_id = ? AND role_type = ?", userID, roleType).
		Where("status IN ?", []string{"draft", "in_progress", "interviewing"}).
		First(&attempt).Error
	if err != nil {
		return nil, err
	}
	return &attempt, nil
}

// FindLastSubmittedByUserAndRole returns the most recent submitted/reviewed attempt
// for a given user and role type
func (r *AttemptRepository) FindLastSubmittedByUserAndRole(userID, roleType string) (*models.WorkSampleAttempt, error) {
	var attempt models.WorkSampleAttempt
	err := r.db.Where("candidate_id = ? AND role_type = ?", userID, roleType).
		Where("status IN ?", []string{"submitted", "reviewed"}).
		Order("submitted_at DESC").
		First(&attempt).Error
	if err != nil {
		return nil, err
	}
	return &attempt, nil
}

// Create creates a new work sample attempt
// Returns the existing attempt if a unique constraint violation occurs (race condition)
func (r *AttemptRepository) Create(attempt *models.WorkSampleAttempt) (*models.WorkSampleAttempt, bool, error) {
	if err := r.db.Create(attempt).Error; err != nil {
		// Check if it's a unique constraint violation (race condition)
		if strings.Contains(err.Error(), "unique") || strings.Contains(err.Error(), "duplicate") {
			// Re-fetch the existing attempt
			existing, fetchErr := r.FindActiveByUserAndRole(attempt.CandidateID, attempt.RoleType)
			if fetchErr == nil {
				return existing, true, nil
			}
		}
		return nil, false, err
	}
	return attempt, false, nil
}

// FindByID returns an attempt by ID
func (r *AttemptRepository) FindByID(id string) (*models.WorkSampleAttempt, error) {
	var attempt models.WorkSampleAttempt
	err := r.db.First(&attempt, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &attempt, nil
}

// FindByUserID returns all attempts for a user
func (r *AttemptRepository) FindByUserID(userID string) ([]models.WorkSampleAttempt, error) {
	var attempts []models.WorkSampleAttempt
	err := r.db.Where("candidate_id = ?", userID).
		Order("created_at DESC").
		Find(&attempts).Error
	return attempts, err
}

// FindByJobAndCandidate returns an attempt for a specific job and candidate
func (r *AttemptRepository) FindByJobAndCandidate(jobID, candidateID string) (*models.WorkSampleAttempt, error) {
	var attempt models.WorkSampleAttempt
	err := r.db.Where("job_id = ? AND candidate_id = ?", jobID, candidateID).
		Order("created_at DESC").
		First(&attempt).Error
	if err != nil {
		return nil, err
	}
	return &attempt, nil
}

// Update updates an attempt
func (r *AttemptRepository) Update(attempt *models.WorkSampleAttempt) error {
	return r.db.Save(attempt).Error
}
