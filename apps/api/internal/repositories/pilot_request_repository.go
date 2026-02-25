package repositories

import (
	"gorm.io/gorm"

	"github.com/baaraco/baara/pkg/models"
)

// PilotRequestRepository handles database operations for pilot requests
type PilotRequestRepository struct {
	db *gorm.DB
}

// NewPilotRequestRepository creates a new pilot request repository
func NewPilotRequestRepository(db *gorm.DB) *PilotRequestRepository {
	return &PilotRequestRepository{db: db}
}

// FindByID returns a pilot request by ID
func (r *PilotRequestRepository) FindByID(id string) (*models.PilotRequest, error) {
	var pr models.PilotRequest
	err := r.db.Where("id = ?", id).First(&pr).Error
	if err != nil {
		return nil, err
	}
	return &pr, nil
}

// FindByIDWithUser returns a pilot request by ID with ConvertedUser preloaded
func (r *PilotRequestRepository) FindByIDWithUser(id string) (*models.PilotRequest, error) {
	var pr models.PilotRequest
	err := r.db.Preload("ConvertedUser").Where("id = ?", id).First(&pr).Error
	if err != nil {
		return nil, err
	}
	return &pr, nil
}

// FindByEmail returns a pilot request by email
func (r *PilotRequestRepository) FindByEmail(email string) (*models.PilotRequest, error) {
	var pr models.PilotRequest
	err := r.db.Where("email = ?", email).First(&pr).Error
	if err != nil {
		return nil, err
	}
	return &pr, nil
}

// ListComplete returns complete pilot requests with filtering and pagination
func (r *PilotRequestRepository) ListComplete(status string, search string, page, perPage int) ([]models.PilotRequest, int64, error) {
	var requests []models.PilotRequest
	var total int64

	query := r.db.Model(&models.PilotRequest{}).Where("status = ?", models.PilotStatusComplete)

	if status != "" {
		query = query.Where("admin_status = ?", status)
	}

	if search != "" {
		searchPattern := "%" + search + "%"
		query = query.Where("email ILIKE ? OR first_name ILIKE ? OR last_name ILIKE ? OR company ILIKE ?",
			searchPattern, searchPattern, searchPattern, searchPattern)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * perPage
	err := query.Order("created_at DESC").Offset(offset).Limit(perPage).Find(&requests).Error
	if err != nil {
		return nil, 0, err
	}

	return requests, total, nil
}

// CountByAdminStatus returns the count of pilot requests with a given admin status
func (r *PilotRequestRepository) CountByAdminStatus(status models.AdminStatus) (int64, error) {
	var count int64
	err := r.db.Model(&models.PilotRequest{}).
		Where("status = ? AND admin_status = ?", models.PilotStatusComplete, status).
		Count(&count).Error
	return count, err
}

// Create creates a new pilot request
func (r *PilotRequestRepository) Create(pr *models.PilotRequest) error {
	return r.db.Create(pr).Error
}

// Update saves changes to an existing pilot request
func (r *PilotRequestRepository) Update(pr *models.PilotRequest) error {
	return r.db.Save(pr).Error
}
