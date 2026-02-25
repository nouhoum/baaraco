package repositories

import (
	"gorm.io/gorm"

	"github.com/baaraco/baara/pkg/models"
)

// InterviewKitRepository handles database operations for interview kits
type InterviewKitRepository struct {
	db *gorm.DB
}

// NewInterviewKitRepository creates a new interview kit repository
func NewInterviewKitRepository(db *gorm.DB) *InterviewKitRepository {
	return &InterviewKitRepository{db: db}
}

// FindByJobAndCandidate returns an interview kit by job ID and candidate ID
func (r *InterviewKitRepository) FindByJobAndCandidate(jobID, candidateID string) (*models.InterviewKit, error) {
	var kit models.InterviewKit
	err := r.db.Preload("Candidate").
		Where("job_id = ? AND candidate_id = ?", jobID, candidateID).
		First(&kit).Error
	if err != nil {
		return nil, err
	}
	return &kit, nil
}

// Create creates a new interview kit
func (r *InterviewKitRepository) Create(kit *models.InterviewKit) error {
	return r.db.Create(kit).Error
}

// Update updates an interview kit
func (r *InterviewKitRepository) Update(kit *models.InterviewKit) error {
	return r.db.Save(kit).Error
}
