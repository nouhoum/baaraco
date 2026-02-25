package repositories

import (
	"gorm.io/gorm"

	"github.com/baaraco/baara/pkg/models"
)

// CandidateSignupRepository handles database operations for candidate signups
type CandidateSignupRepository struct {
	db *gorm.DB
}

// NewCandidateSignupRepository creates a new candidate signup repository
func NewCandidateSignupRepository(db *gorm.DB) *CandidateSignupRepository {
	return &CandidateSignupRepository{db: db}
}

// FindByEmail returns a candidate signup by email
func (r *CandidateSignupRepository) FindByEmail(email string) (*models.CandidateSignup, error) {
	var signup models.CandidateSignup
	err := r.db.Where("email = ?", email).First(&signup).Error
	if err != nil {
		return nil, err
	}
	return &signup, nil
}

// Create creates a new candidate signup
func (r *CandidateSignupRepository) Create(signup *models.CandidateSignup) error {
	return r.db.Create(signup).Error
}
