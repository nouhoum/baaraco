package repositories

import (
	"gorm.io/gorm"

	"github.com/baaraco/baara/pkg/models"
)

type EvaluationRepository struct {
	db *gorm.DB
}

func NewEvaluationRepository(db *gorm.DB) *EvaluationRepository {
	return &EvaluationRepository{db: db}
}

func (r *EvaluationRepository) FindByID(id string) (*models.Evaluation, error) {
	var evaluation models.Evaluation
	err := r.db.Preload("Job").Where("id = ?", id).First(&evaluation).Error
	if err != nil {
		return nil, err
	}
	return &evaluation, nil
}

func (r *EvaluationRepository) FindByAttemptID(attemptID string) (*models.Evaluation, error) {
	var evaluation models.Evaluation
	err := r.db.Where("attempt_id = ?", attemptID).First(&evaluation).Error
	if err != nil {
		return nil, err
	}
	return &evaluation, nil
}

func (r *EvaluationRepository) ListByJobID(jobID string) ([]models.Evaluation, error) {
	var evaluations []models.Evaluation
	err := r.db.Preload("Candidate").Where("job_id = ?", jobID).Order("created_at DESC").Find(&evaluations).Error
	if err != nil {
		return nil, err
	}
	return evaluations, nil
}

func (r *EvaluationRepository) Create(eval *models.Evaluation) error {
	return r.db.Create(eval).Error
}
