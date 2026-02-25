package repositories

import (
	"gorm.io/gorm"

	"github.com/baaraco/baara/pkg/models"
)

// DecisionMemoRepository handles database operations for decision memos
type DecisionMemoRepository struct {
	db *gorm.DB
}

// NewDecisionMemoRepository creates a new decision memo repository
func NewDecisionMemoRepository(db *gorm.DB) *DecisionMemoRepository {
	return &DecisionMemoRepository{db: db}
}

// FindByJobAndCandidate returns a decision memo by job ID and candidate ID
func (r *DecisionMemoRepository) FindByJobAndCandidate(jobID, candidateID string) (*models.DecisionMemo, error) {
	var memo models.DecisionMemo
	err := r.db.Where("job_id = ? AND candidate_id = ?", jobID, candidateID).First(&memo).Error
	if err != nil {
		return nil, err
	}
	return &memo, nil
}

// Create creates a new decision memo
func (r *DecisionMemoRepository) Create(memo *models.DecisionMemo) error {
	return r.db.Create(memo).Error
}

// Update updates a decision memo
func (r *DecisionMemoRepository) Update(memo *models.DecisionMemo) error {
	return r.db.Save(memo).Error
}
