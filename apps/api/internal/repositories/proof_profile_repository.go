package repositories

import (
	"gorm.io/gorm"

	"github.com/baaraco/baara/pkg/models"
)

// ProofProfileRepository handles database operations for proof profiles
type ProofProfileRepository struct {
	db *gorm.DB
}

// NewProofProfileRepository creates a new proof profile repository
func NewProofProfileRepository(db *gorm.DB) *ProofProfileRepository {
	return &ProofProfileRepository{db: db}
}

// FindByPublicSlug returns a public proof profile by slug
func (r *ProofProfileRepository) FindByPublicSlug(slug string) (*models.ProofProfile, error) {
	var profile models.ProofProfile
	err := r.db.Preload("Job").Preload("EvaluationTemplate").
		Where("public_slug = ? AND is_public = ?", slug, true).
		First(&profile).Error
	if err != nil {
		return nil, err
	}
	return &profile, nil
}

// FindLatestByUserID returns the most recent proof profile for a user
func (r *ProofProfileRepository) FindLatestByUserID(userID string) (*models.ProofProfile, error) {
	var profile models.ProofProfile
	err := r.db.Where("candidate_id = ?", userID).
		Order("created_at DESC").
		First(&profile).Error
	if err != nil {
		return nil, err
	}
	return &profile, nil
}

// FindByUserID returns all proof profiles for a user
func (r *ProofProfileRepository) FindByUserID(userID string) ([]models.ProofProfile, error) {
	var profiles []models.ProofProfile
	err := r.db.Where("candidate_id = ?", userID).
		Order("created_at DESC").
		Find(&profiles).Error
	return profiles, err
}

// Update updates a proof profile
func (r *ProofProfileRepository) Update(profile *models.ProofProfile, updates map[string]interface{}) error {
	return r.db.Model(profile).Updates(updates).Error
}

// FindByID returns a proof profile by its ID
func (r *ProofProfileRepository) FindByID(id string) (*models.ProofProfile, error) {
	var profile models.ProofProfile
	err := r.db.Where("id = ?", id).First(&profile).Error
	if err != nil {
		return nil, err
	}
	return &profile, nil
}

// FindByJobID returns all proof profiles for a given job
func (r *ProofProfileRepository) FindByJobID(jobID string) ([]models.ProofProfile, error) {
	var profiles []models.ProofProfile
	err := r.db.Where("job_id = ?", jobID).
		Order("global_score DESC").
		Find(&profiles).Error
	return profiles, err
}

// Reload reloads a proof profile from the database
func (r *ProofProfileRepository) Reload(profile *models.ProofProfile) error {
	return r.db.First(profile, "id = ?", profile.ID).Error
}
