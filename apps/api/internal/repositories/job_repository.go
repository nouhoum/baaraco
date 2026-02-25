package repositories

import (
	"gorm.io/gorm"

	"github.com/baaraco/baara/pkg/models"
)

// JobRepository handles database operations for jobs
type JobRepository struct {
	db *gorm.DB
}

// NewJobRepository creates a new job repository
func NewJobRepository(db *gorm.DB) *JobRepository {
	return &JobRepository{db: db}
}

// FindByID returns a job by ID
func (r *JobRepository) FindByID(id string) (*models.Job, error) {
	var job models.Job
	err := r.db.Where("id = ?", id).First(&job).Error
	if err != nil {
		return nil, err
	}
	return &job, nil
}

// FindByIDWithOrg returns a job by ID with Org and Creator preloaded
func (r *JobRepository) FindByIDWithOrg(id string) (*models.Job, error) {
	var job models.Job
	err := r.db.Preload("Org").Preload("Creator").Where("id = ?", id).First(&job).Error
	if err != nil {
		return nil, err
	}
	return &job, nil
}

// FindBySlugPublic returns a public active job by slug
func (r *JobRepository) FindBySlugPublic(slug string) (*models.Job, error) {
	var job models.Job
	err := r.db.Preload("Org").
		Where("slug = ? AND is_public = ? AND status = ?", slug, true, models.JobStatusActive).
		First(&job).Error
	if err != nil {
		return nil, err
	}
	return &job, nil
}

// ListByOrgID returns all jobs for an org, optionally filtered by status
func (r *JobRepository) ListByOrgID(orgID string, status string) ([]models.Job, error) {
	var jobs []models.Job
	query := r.db.Where("org_id = ?", orgID)
	if status != "" {
		query = query.Where("status = ?", status)
	}
	err := query.Order("created_at DESC").Find(&jobs).Error
	return jobs, err
}

// ListPublicActive returns public active jobs with pagination and filters
func (r *JobRepository) ListPublicActive(filters map[string]string) ([]models.Job, int64, error) {
	var jobs []models.Job
	var total int64

	query := r.db.Model(&models.Job{}).
		Where("is_public = ? AND status = ?", true, models.JobStatusActive)

	// Apply filters
	if locationType := filters["location_type"]; locationType != "" {
		query = query.Where("location_type = ?", locationType)
	}
	if contractType := filters["contract_type"]; contractType != "" {
		query = query.Where("contract_type = ?", contractType)
	}
	if seniority := filters["seniority"]; seniority != "" {
		query = query.Where("seniority = ?", seniority)
	}

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Fetch with preload
	err := query.Preload("Org").Order("created_at DESC").Find(&jobs).Error
	return jobs, total, err
}

// Create creates a new job
func (r *JobRepository) Create(job *models.Job) error {
	return r.db.Create(job).Error
}

// Update saves changes to an existing job
func (r *JobRepository) Update(job *models.Job) error {
	return r.db.Save(job).Error
}

// Updates applies partial updates to a job
func (r *JobRepository) Updates(job *models.Job, updates map[string]interface{}) error {
	return r.db.Model(job).Updates(updates).Error
}

// Delete soft-deletes a job
func (r *JobRepository) Delete(job *models.Job) error {
	return r.db.Delete(job).Error
}
