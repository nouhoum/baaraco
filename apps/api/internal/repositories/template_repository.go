package repositories

import (
	"gorm.io/gorm"

	"github.com/baaraco/baara/pkg/models"
)

// TemplateRepository handles database operations for evaluation templates
type TemplateRepository struct {
	db *gorm.DB
}

// NewTemplateRepository creates a new template repository
func NewTemplateRepository(db *gorm.DB) *TemplateRepository {
	return &TemplateRepository{db: db}
}

// FindAllActive returns all active evaluation templates ordered by role type
func (r *TemplateRepository) FindAllActive() ([]models.EvaluationTemplate, error) {
	var templates []models.EvaluationTemplate
	err := r.db.Where("is_active = ?", true).
		Order("role_type ASC").
		Find(&templates).Error
	return templates, err
}

// FindByRoleType returns an active template by role type
func (r *TemplateRepository) FindByRoleType(roleType string) (*models.EvaluationTemplate, error) {
	var template models.EvaluationTemplate
	err := r.db.Where("role_type = ? AND is_active = ?", roleType, true).
		First(&template).Error
	if err != nil {
		return nil, err
	}
	return &template, nil
}
