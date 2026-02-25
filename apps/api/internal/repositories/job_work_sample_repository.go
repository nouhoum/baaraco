package repositories

import (
	"gorm.io/gorm"

	"github.com/baaraco/baara/pkg/models"
)

// JobWorkSampleRepository handles database operations for job work samples
type JobWorkSampleRepository struct {
	db *gorm.DB
}

// NewJobWorkSampleRepository creates a new job work sample repository
func NewJobWorkSampleRepository(db *gorm.DB) *JobWorkSampleRepository {
	return &JobWorkSampleRepository{db: db}
}

// FindByJobID returns a job work sample by job ID
func (r *JobWorkSampleRepository) FindByJobID(jobID string) (*models.JobWorkSample, error) {
	var workSample models.JobWorkSample
	err := r.db.Where("job_id = ?", jobID).First(&workSample).Error
	if err != nil {
		return nil, err
	}
	return &workSample, nil
}

// Create creates a new job work sample
func (r *JobWorkSampleRepository) Create(workSample *models.JobWorkSample) error {
	return r.db.Create(workSample).Error
}

// Update saves changes to an existing job work sample
func (r *JobWorkSampleRepository) Update(workSample *models.JobWorkSample) error {
	return r.db.Save(workSample).Error
}
