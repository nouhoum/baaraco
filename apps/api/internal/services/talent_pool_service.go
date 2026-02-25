package services

import (
	"github.com/baaraco/baara/apps/api/internal/repositories"
)

// TalentPoolService handles talent pool queries
type TalentPoolService struct {
	repo *repositories.TalentPoolRepository
}

// NewTalentPoolService creates a new talent pool service
func NewTalentPoolService(repo *repositories.TalentPoolRepository) *TalentPoolService {
	return &TalentPoolService{repo: repo}
}

// List returns a filtered and paginated list of talent pool items
func (s *TalentPoolService) List(filters repositories.TalentPoolFilters) ([]repositories.TalentPoolItem, int64, error) {
	return s.repo.List(filters)
}
