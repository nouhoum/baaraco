package repositories

import (
	"gorm.io/gorm"

	"github.com/baaraco/baara/pkg/models"
)

// OrgRepository handles database operations for orgs
type OrgRepository struct {
	db *gorm.DB
}

// NewOrgRepository creates a new org repository
func NewOrgRepository(db *gorm.DB) *OrgRepository {
	return &OrgRepository{db: db}
}

// FindByID returns an org by ID
func (r *OrgRepository) FindByID(id string) (*models.Org, error) {
	var org models.Org
	err := r.db.Where("id = ?", id).First(&org).Error
	if err != nil {
		return nil, err
	}
	return &org, nil
}

// FindBySlug returns an org by slug
func (r *OrgRepository) FindBySlug(slug string) (*models.Org, error) {
	var org models.Org
	err := r.db.Where("slug = ?", slug).First(&org).Error
	if err != nil {
		return nil, err
	}
	return &org, nil
}

// Create creates a new org
func (r *OrgRepository) Create(org *models.Org) error {
	return r.db.Create(org).Error
}

// Update saves changes to an existing org
func (r *OrgRepository) Update(org *models.Org) error {
	return r.db.Save(org).Error
}
