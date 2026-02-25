package repositories

import (
	"gorm.io/gorm"

	"github.com/baaraco/baara/pkg/models"
)

// EvalConfigRepository handles loading evaluation configuration from the database.
type EvalConfigRepository struct {
	db *gorm.DB
}

// NewEvalConfigRepository creates a new eval config repository.
func NewEvalConfigRepository(db *gorm.DB) *EvalConfigRepository {
	return &EvalConfigRepository{db: db}
}

// Resolve loads the evaluation configuration for an attempt.
func (r *EvalConfigRepository) Resolve(attempt *models.WorkSampleAttempt) (*models.EvalConfig, error) {
	return models.ResolveEvalConfig(r.db, attempt)
}
