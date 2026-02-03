package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/baaraco/baara/apps/api/internal/middleware"
	"github.com/baaraco/baara/pkg/apierror"
	"github.com/baaraco/baara/pkg/database"
	"github.com/baaraco/baara/pkg/models"
)

type PublicJobHandler struct{}

func NewPublicJobHandler() *PublicJobHandler {
	return &PublicJobHandler{}
}

// =============================================================================
// GET /api/v1/public/jobs
// List public active jobs (no auth required)
// =============================================================================

func (h *PublicJobHandler) ListPublicJobs(c *gin.Context) {
	query := database.Db.
		Where("is_public = ? AND status = ?", true, models.JobStatusActive).
		Preload("Org")

	// Filters
	if seniority := c.Query("seniority"); seniority != "" {
		query = query.Where("seniority = ?", seniority)
	}
	if locationType := c.Query("location_type"); locationType != "" {
		query = query.Where("location_type = ?", locationType)
	}
	if contractType := c.Query("contract_type"); contractType != "" {
		query = query.Where("contract_type = ?", contractType)
	}
	if search := strings.TrimSpace(c.Query("search")); search != "" {
		query = query.Where("title ILIKE ?", "%"+search+"%")
	}

	var total int64
	query.Model(&models.Job{}).Count(&total)

	var jobs []models.Job
	if err := query.Order("created_at DESC").Limit(200).Find(&jobs).Error; err != nil {
		apierror.FetchError.Send(c)
		return
	}

	responses := make([]*models.PublicJobListItem, len(jobs))
	for i, job := range jobs {
		responses[i] = job.ToPublicListItem()
	}

	c.JSON(http.StatusOK, gin.H{
		"jobs":  responses,
		"total": total,
	})
}

// =============================================================================
// GET /api/v1/public/jobs/:slug
// Get a public job by slug (no auth required)
// =============================================================================

func (h *PublicJobHandler) GetPublicJob(c *gin.Context) {
	slug := c.Param("slug")

	var job models.Job
	err := database.Db.
		Where("slug = ? AND is_public = ? AND status = ?", slug, true, models.JobStatusActive).
		Preload("Org").
		First(&job).Error
	if err == gorm.ErrRecordNotFound {
		apierror.JobNotFound.Send(c)
		return
	}
	if err != nil {
		apierror.FetchError.Send(c)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"job": job.ToPublicDetailResponse(),
	})
}

// =============================================================================
// POST /api/v1/public/jobs/:slug/apply
// Apply to a public job (auth required — creates a WorkSampleAttempt)
// =============================================================================

func (h *PublicJobHandler) ApplyToJob(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		apierror.NotAuthenticated.Send(c)
		return
	}

	// Only candidates can apply
	if user.Role != models.RoleCandidate {
		apierror.AccessDenied.Send(c)
		return
	}

	slug := c.Param("slug")

	var job models.Job
	err := database.Db.
		Where("slug = ? AND is_public = ? AND status = ?", slug, true, models.JobStatusActive).
		First(&job).Error
	if err == gorm.ErrRecordNotFound {
		apierror.JobNotFound.Send(c)
		return
	}
	if err != nil {
		apierror.FetchError.Send(c)
		return
	}

	// Check for existing attempt
	var existingAttempt models.WorkSampleAttempt
	err = database.Db.
		Where("candidate_id = ? AND job_id = ?", user.ID, job.ID).
		First(&existingAttempt).Error
	if err == nil {
		// Already applied — return the existing attempt
		c.JSON(http.StatusOK, gin.H{
			"attempt":  existingAttempt,
			"existing": true,
		})
		return
	}

	// Find the job's work sample to link to the attempt
	var workSample models.JobWorkSample
	err = database.Db.Where("job_id = ?", job.ID).First(&workSample).Error
	if err == gorm.ErrRecordNotFound {
		// Job has no work sample yet — cannot apply
		apierror.ResourceNotAvailable.Send(c)
		return
	}
	if err != nil {
		apierror.FetchError.Send(c)
		return
	}

	// Create work sample attempt
	attempt := models.WorkSampleAttempt{
		CandidateID: user.ID,
		JobID:       &job.ID,
		Status:      models.AttemptStatusDraft,
	}

	if err := database.Db.Create(&attempt).Error; err != nil {
		apierror.CreateError.Send(c)
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"attempt":  attempt,
		"existing": false,
	})
}

// =============================================================================
// GET /api/v1/public/jobs/:slug/my-application
// Check if the current candidate has already applied to a job (auth required)
// =============================================================================

func (h *PublicJobHandler) GetMyApplication(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		apierror.NotAuthenticated.Send(c)
		return
	}

	if user.Role != models.RoleCandidate {
		c.JSON(http.StatusOK, gin.H{"applied": false})
		return
	}

	slug := c.Param("slug")

	var job models.Job
	err := database.Db.
		Where("slug = ? AND is_public = ? AND status = ?", slug, true, models.JobStatusActive).
		First(&job).Error
	if err == gorm.ErrRecordNotFound {
		apierror.JobNotFound.Send(c)
		return
	}
	if err != nil {
		apierror.FetchError.Send(c)
		return
	}

	var attempt models.WorkSampleAttempt
	err = database.Db.
		Where("candidate_id = ? AND job_id = ?", user.ID, job.ID).
		First(&attempt).Error
	if err == gorm.ErrRecordNotFound {
		c.JSON(http.StatusOK, gin.H{"applied": false})
		return
	}
	if err != nil {
		apierror.FetchError.Send(c)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"applied": true,
		"attempt": gin.H{
			"id":       attempt.ID,
			"status":   attempt.Status,
			"progress": attempt.Progress,
		},
	})
}

// =============================================================================
// GET /api/v1/public/jobs/my-applications
// List all jobs the current candidate has applied to (auth required)
// =============================================================================

func (h *PublicJobHandler) GetMyApplications(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		apierror.NotAuthenticated.Send(c)
		return
	}

	if user.Role != models.RoleCandidate {
		c.JSON(http.StatusOK, gin.H{"applications": []gin.H{}})
		return
	}

	var attempts []models.WorkSampleAttempt
	err := database.Db.
		Where("candidate_id = ? AND job_id IS NOT NULL", user.ID).
		Find(&attempts).Error
	if err != nil {
		apierror.FetchError.Send(c)
		return
	}

	// Collect job IDs and build lookup
	jobIDs := make([]string, 0, len(attempts))
	for _, a := range attempts {
		if a.JobID != nil {
			jobIDs = append(jobIDs, *a.JobID)
		}
	}

	var jobs []models.Job
	if len(jobIDs) > 0 {
		database.Db.Where("id IN ?", jobIDs).Preload("Org").Find(&jobs)
	}

	jobByID := make(map[string]*models.Job, len(jobs))
	for i := range jobs {
		jobByID[jobs[i].ID] = &jobs[i]
	}

	applications := make([]gin.H, 0, len(attempts))
	for _, a := range attempts {
		app := gin.H{
			"attempt_id":   a.ID,
			"status":       a.Status,
			"progress":     a.Progress,
			"submitted_at": a.SubmittedAt,
			"created_at":   a.CreatedAt,
		}
		if a.JobID != nil {
			if j, ok := jobByID[*a.JobID]; ok {
				app["job_id"] = j.ID
				app["job_slug"] = j.Slug
				app["job_title"] = j.Title
				app["job_team"] = j.Team
				app["job_seniority"] = j.Seniority
				app["job_location_type"] = j.LocationType
				app["job_contract_type"] = j.ContractType
				if j.Org != nil {
					app["org_name"] = j.Org.Name
				}
			}
		}
		applications = append(applications, app)
	}

	c.JSON(http.StatusOK, gin.H{
		"applications": applications,
	})
}
