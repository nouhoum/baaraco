package repositories

import (
	"gorm.io/gorm"

	"github.com/baaraco/baara/pkg/models"
)

// FormatRequestRepository handles database operations for format requests
type FormatRequestRepository struct {
	db *gorm.DB
}

// NewFormatRequestRepository creates a new format request repository
func NewFormatRequestRepository(db *gorm.DB) *FormatRequestRepository {
	return &FormatRequestRepository{db: db}
}

// FindByID returns a format request by ID
func (r *FormatRequestRepository) FindByID(id string) (*models.FormatRequest, error) {
	var fr models.FormatRequest
	err := r.db.Where("id = ?", id).First(&fr).Error
	if err != nil {
		return nil, err
	}
	return &fr, nil
}

// FindByIDWithAssociations returns a format request by ID with associations preloaded
func (r *FormatRequestRepository) FindByIDWithAssociations(id string) (*models.FormatRequest, error) {
	var fr models.FormatRequest
	err := r.db.Preload("Candidate").Preload("Reviewer").Preload("Attempt").
		Where("id = ?", id).First(&fr).Error
	if err != nil {
		return nil, err
	}
	return &fr, nil
}

// FindByAttemptID returns a format request by attempt ID
func (r *FormatRequestRepository) FindByAttemptID(attemptID string) (*models.FormatRequest, error) {
	var fr models.FormatRequest
	err := r.db.Where("attempt_id = ?", attemptID).First(&fr).Error
	if err != nil {
		return nil, err
	}
	return &fr, nil
}

// FindPendingByAttemptID returns a pending format request by attempt ID
func (r *FormatRequestRepository) FindPendingByAttemptID(attemptID string) (*models.FormatRequest, error) {
	var fr models.FormatRequest
	err := r.db.Where("attempt_id = ? AND status = ?", attemptID, "pending").First(&fr).Error
	if err != nil {
		return nil, err
	}
	return &fr, nil
}

// List returns format requests filtered by status with associations preloaded
func (r *FormatRequestRepository) List(status string) ([]models.FormatRequest, error) {
	var requests []models.FormatRequest
	query := r.db.Preload("Candidate").Preload("Attempt")
	if status != "" {
		query = query.Where("status = ?", status)
	}
	err := query.Find(&requests).Error
	return requests, err
}

// CountPending returns the count of pending format requests
func (r *FormatRequestRepository) CountPending() (int64, error) {
	var count int64
	err := r.db.Model(&models.FormatRequest{}).Where("status = ?", "pending").Count(&count).Error
	return count, err
}

// Create creates a new format request
func (r *FormatRequestRepository) Create(fr *models.FormatRequest) error {
	return r.db.Create(fr).Error
}

// Update saves changes to an existing format request
func (r *FormatRequestRepository) Update(fr *models.FormatRequest) error {
	return r.db.Save(fr).Error
}

// Updates applies partial updates to a format request
func (r *FormatRequestRepository) Updates(fr *models.FormatRequest, updates map[string]interface{}) error {
	return r.db.Model(fr).Updates(updates).Error
}
