package repositories

import (
	"gorm.io/gorm"

	"github.com/baaraco/baara/pkg/models"
)

// ScorecardRepository handles database operations for scorecards
type ScorecardRepository struct {
	db *gorm.DB
}

// NewScorecardRepository creates a new scorecard repository
func NewScorecardRepository(db *gorm.DB) *ScorecardRepository {
	return &ScorecardRepository{db: db}
}

// FindByJobID returns a scorecard by job ID
func (r *ScorecardRepository) FindByJobID(jobID string) (*models.Scorecard, error) {
	var scorecard models.Scorecard
	err := r.db.Where("job_id = ?", jobID).First(&scorecard).Error
	if err != nil {
		return nil, err
	}
	return &scorecard, nil
}

// Create creates a new scorecard
func (r *ScorecardRepository) Create(scorecard *models.Scorecard) error {
	return r.db.Create(scorecard).Error
}

// Update saves changes to an existing scorecard
func (r *ScorecardRepository) Update(scorecard *models.Scorecard) error {
	return r.db.Save(scorecard).Error
}
