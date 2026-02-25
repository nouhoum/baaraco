package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/baaraco/baara/apps/api/internal/middleware"
	"github.com/baaraco/baara/apps/api/internal/services"
	"github.com/baaraco/baara/pkg/apierror"
	"github.com/baaraco/baara/pkg/models"
)

// FlexibleDate handles both date-only ("2026-03-27") and full datetime ("2006-01-02T15:04:05Z") formats
type FlexibleDate struct {
	time.Time
}

func (fd *FlexibleDate) UnmarshalJSON(data []byte) error {
	// Remove quotes
	str := strings.Trim(string(data), `"`)
	if str == "" || str == "null" {
		return nil
	}

	// Try date-only format first (YYYY-MM-DD)
	if len(str) == 10 && strings.Count(str, "-") == 2 {
		t, err := time.Parse("2006-01-02", str)
		if err == nil {
			fd.Time = t
			return nil
		}
	}

	// Try RFC3339 format
	t, err := time.Parse(time.RFC3339, str)
	if err == nil {
		fd.Time = t
		return nil
	}

	// Try RFC3339Nano format
	t, err = time.Parse(time.RFC3339Nano, str)
	if err == nil {
		fd.Time = t
		return nil
	}

	return err
}

type JobHandler struct {
	jobService *services.JobService
}

func NewJobHandler(jobService *services.JobService) *JobHandler {
	return &JobHandler{jobService: jobService}
}

// =============================================================================
// Request/Response types
// =============================================================================

type CreateJobRequest struct {
	// Section 1: Le poste
	Title        string                `json:"title" binding:"required"`
	Team         string                `json:"team"`
	LocationType models.LocationType   `json:"location_type"`
	LocationCity string                `json:"location_city"`
	ContractType models.ContractType   `json:"contract_type"`
	Seniority    models.SeniorityLevel `json:"seniority"`

	// Section 2: Le contexte
	Stack           []string        `json:"stack"`
	TeamSize        models.TeamSize `json:"team_size"`
	ManagerInfo     string          `json:"manager_info"`
	BusinessContext string          `json:"business_context"`

	// Section 3: Les outcomes
	MainProblem      string   `json:"main_problem"`
	ExpectedOutcomes []string `json:"expected_outcomes"`
	SuccessLooksLike string   `json:"success_looks_like"`
	FailureLooksLike string   `json:"failure_looks_like"`

	// Section 4: Logistique
	SalaryMin *int           `json:"salary_min"`
	SalaryMax *int           `json:"salary_max"`
	StartDate *FlexibleDate  `json:"start_date"`
	Urgency   models.Urgency `json:"urgency"`
}

type UpdateJobRequest struct {
	// Section 1: Le poste
	Title        *string                `json:"title"`
	Team         *string                `json:"team"`
	LocationType *models.LocationType   `json:"location_type"`
	LocationCity *string                `json:"location_city"`
	ContractType *models.ContractType   `json:"contract_type"`
	Seniority    *models.SeniorityLevel `json:"seniority"`

	// Section 2: Le contexte
	Stack           []string         `json:"stack"`
	TeamSize        *models.TeamSize `json:"team_size"`
	ManagerInfo     *string          `json:"manager_info"`
	BusinessContext *string          `json:"business_context"`

	// Section 3: Les outcomes
	MainProblem      *string  `json:"main_problem"`
	ExpectedOutcomes []string `json:"expected_outcomes"`
	SuccessLooksLike *string  `json:"success_looks_like"`
	FailureLooksLike *string  `json:"failure_looks_like"`

	// Section 4: Logistique
	SalaryMin *int            `json:"salary_min"`
	SalaryMax *int            `json:"salary_max"`
	StartDate *FlexibleDate   `json:"start_date"`
	Urgency   *models.Urgency `json:"urgency"`

	// Visibility
	IsPublic *bool `json:"is_public"`
}

// =============================================================================
// POST /api/v1/jobs
// Create a new job (status: draft)
// =============================================================================

func (h *JobHandler) CreateJob(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		apierror.NotAuthenticated.Send(c)
		return
	}

	// Only recruiters and admins can create jobs
	if user.Role != models.RoleRecruiter && user.Role != models.RoleAdmin {
		apierror.RoleRequired.Send(c)
		return
	}

	// Recruiters must have an org
	if user.OrgID == nil {
		apierror.NoOrg.Send(c)
		return
	}

	var req CreateJobRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apierror.InvalidData.Send(c)
		return
	}

	// Convert arrays to JSON
	stackJSON, err := json.Marshal(req.Stack)
	if err != nil {
		apierror.InvalidData.Send(c)
		return
	}
	outcomesJSON, err := json.Marshal(req.ExpectedOutcomes)
	if err != nil {
		apierror.InvalidData.Send(c)
		return
	}

	// Convert FlexibleDate to *time.Time
	var startDate *time.Time
	if req.StartDate != nil && !req.StartDate.IsZero() {
		startDate = &req.StartDate.Time
	}

	job := &models.Job{
		Title:            req.Title,
		Team:             req.Team,
		LocationType:     req.LocationType,
		LocationCity:     req.LocationCity,
		ContractType:     req.ContractType,
		Seniority:        req.Seniority,
		Stack:            stackJSON,
		TeamSize:         req.TeamSize,
		ManagerInfo:      req.ManagerInfo,
		BusinessContext:  req.BusinessContext,
		MainProblem:      req.MainProblem,
		ExpectedOutcomes: outcomesJSON,
		SuccessLooksLike: req.SuccessLooksLike,
		FailureLooksLike: req.FailureLooksLike,
		SalaryMin:        req.SalaryMin,
		SalaryMax:        req.SalaryMax,
		StartDate:        startDate,
		Urgency:          req.Urgency,
	}

	if err := h.jobService.CreateJob(job, user); err != nil {
		if errors.Is(err, services.ErrNoOrg) {
			apierror.NoOrg.Send(c)
			return
		}
		apierror.CreateError.Send(c)
		return
	}

	// Get job with associations
	jobWithOrg, err := h.jobService.GetJob(job.ID, user)
	if err != nil {
		// Job was created, just return without associations
		c.JSON(http.StatusCreated, gin.H{
			"job":     job.ToResponse(),
			"message": "Job created successfully",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"job":     jobWithOrg.ToResponse(),
		"message": "Job created successfully",
	})
}

// =============================================================================
// GET /api/v1/jobs/:id
// Get a specific job
// =============================================================================

func (h *JobHandler) GetJob(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		apierror.NotAuthenticated.Send(c)
		return
	}

	jobID := c.Param("id")

	job, err := h.jobService.GetJob(jobID, user)
	if err != nil {
		if errors.Is(err, services.ErrJobNotFound) {
			apierror.JobNotFound.Send(c)
			return
		}
		if errors.Is(err, services.ErrOrgMismatch) || errors.Is(err, services.ErrNoOrg) {
			apierror.AccessDenied.Send(c)
			return
		}
		apierror.FetchError.Send(c)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"job": job.ToResponse(),
	})
}

// =============================================================================
// PATCH /api/v1/jobs/:id
// Update a job
// =============================================================================

func (h *JobHandler) UpdateJob(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		apierror.NotAuthenticated.Send(c)
		return
	}

	// Only recruiters and admins can update jobs
	if user.Role != models.RoleRecruiter && user.Role != models.RoleAdmin {
		apierror.AccessDenied.Send(c)
		return
	}

	jobID := c.Param("id")

	var req UpdateJobRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apierror.InvalidData.Send(c)
		return
	}

	// Build updates map
	updates := make(map[string]interface{})

	if req.Title != nil {
		updates["title"] = *req.Title
	}
	if req.Team != nil {
		updates["team"] = *req.Team
	}
	if req.LocationType != nil {
		updates["location_type"] = *req.LocationType
	}
	if req.LocationCity != nil {
		updates["location_city"] = *req.LocationCity
	}
	if req.ContractType != nil {
		updates["contract_type"] = *req.ContractType
	}
	if req.Seniority != nil {
		updates["seniority"] = *req.Seniority
	}
	if req.Stack != nil {
		stackJSON, err := json.Marshal(req.Stack)
		if err != nil {
			apierror.InvalidData.Send(c)
			return
		}
		updates["stack"] = stackJSON
	}
	if req.TeamSize != nil {
		updates["team_size"] = *req.TeamSize
	}
	if req.ManagerInfo != nil {
		updates["manager_info"] = *req.ManagerInfo
	}
	if req.BusinessContext != nil {
		updates["business_context"] = *req.BusinessContext
	}
	if req.MainProblem != nil {
		updates["main_problem"] = *req.MainProblem
	}
	if req.ExpectedOutcomes != nil {
		outcomesJSON, err := json.Marshal(req.ExpectedOutcomes)
		if err != nil {
			apierror.InvalidData.Send(c)
			return
		}
		updates["expected_outcomes"] = outcomesJSON
	}
	if req.SuccessLooksLike != nil {
		updates["success_looks_like"] = *req.SuccessLooksLike
	}
	if req.FailureLooksLike != nil {
		updates["failure_looks_like"] = *req.FailureLooksLike
	}
	if req.SalaryMin != nil {
		updates["salary_min"] = *req.SalaryMin
	}
	if req.SalaryMax != nil {
		updates["salary_max"] = *req.SalaryMax
	}
	if req.StartDate != nil && !req.StartDate.IsZero() {
		updates["start_date"] = req.StartDate.Time
	}
	if req.Urgency != nil {
		updates["urgency"] = *req.Urgency
	}
	if req.IsPublic != nil {
		updates["is_public"] = *req.IsPublic
	}

	job, err := h.jobService.UpdateJob(jobID, updates, user)
	if err != nil {
		if errors.Is(err, services.ErrJobNotFound) {
			apierror.JobNotFound.Send(c)
			return
		}
		if errors.Is(err, services.ErrOrgMismatch) || errors.Is(err, services.ErrNoOrg) {
			apierror.AccessDenied.Send(c)
			return
		}
		apierror.UpdateError.Send(c)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"job": job.ToResponse(),
	})
}

// =============================================================================
// GET /api/v1/jobs
// List jobs for the current org
// =============================================================================

func (h *JobHandler) ListJobs(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		apierror.NotAuthenticated.Send(c)
		return
	}

	// Only recruiters and admins can list jobs
	if user.Role != models.RoleRecruiter && user.Role != models.RoleAdmin {
		apierror.AccessDenied.Send(c)
		return
	}

	if user.OrgID == nil {
		apierror.NoOrg.Send(c)
		return
	}

	// Query params
	status := c.Query("status")

	jobs, err := h.jobService.ListJobs(*user.OrgID, status)
	if err != nil {
		apierror.FetchError.Send(c)
		return
	}

	// Convert to list response
	responses := make([]*models.JobListResponse, len(jobs))
	for i := range jobs {
		responses[i] = jobs[i].ToListResponse()
	}

	c.JSON(http.StatusOK, gin.H{
		"jobs":  responses,
		"total": len(responses),
	})
}

// =============================================================================
// POST /api/v1/jobs/:id/publish
// Publish a job (status: active)
// =============================================================================

func (h *JobHandler) PublishJob(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		apierror.NotAuthenticated.Send(c)
		return
	}

	// Only recruiters and admins can publish jobs
	if user.Role != models.RoleRecruiter && user.Role != models.RoleAdmin {
		apierror.AccessDenied.Send(c)
		return
	}

	jobID := c.Param("id")

	// Accept optional body for is_public flag
	var publishReq struct {
		IsPublic *bool `json:"is_public"`
	}
	// Body is optional — ignore bind errors (e.g. empty body)
	_ = c.ShouldBindJSON(&publishReq) //nolint:errcheck

	isPublic := publishReq.IsPublic != nil && *publishReq.IsPublic

	job, err := h.jobService.PublishJob(jobID, isPublic, user)
	if err != nil {
		if errors.Is(err, services.ErrJobNotFound) {
			apierror.JobNotFound.Send(c)
			return
		}
		if errors.Is(err, services.ErrOrgMismatch) || errors.Is(err, services.ErrNoOrg) {
			apierror.AccessDenied.Send(c)
			return
		}
		if errors.Is(err, services.ErrMissingRequiredFields) {
			apierror.MissingRequiredFields.Send(c)
			return
		}
		apierror.UpdateError.Send(c)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"job":     job.ToResponse(),
		"message": "Job published successfully",
	})
}

// =============================================================================
// DELETE /api/v1/jobs/:id
// Soft delete a job
// =============================================================================

func (h *JobHandler) DeleteJob(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		apierror.NotAuthenticated.Send(c)
		return
	}

	// Only recruiters and admins can delete jobs
	if user.Role != models.RoleRecruiter && user.Role != models.RoleAdmin {
		apierror.AccessDenied.Send(c)
		return
	}

	jobID := c.Param("id")

	err := h.jobService.DeleteJob(jobID, user)
	if err != nil {
		if errors.Is(err, services.ErrJobNotFound) {
			apierror.JobNotFound.Send(c)
			return
		}
		if errors.Is(err, services.ErrOrgMismatch) || errors.Is(err, services.ErrNoOrg) {
			apierror.AccessDenied.Send(c)
			return
		}
		apierror.DeleteError.Send(c)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Job deleted successfully",
	})
}

// =============================================================================
// POST /api/v1/jobs/:id/pause
// Pause a job (status: paused)
// =============================================================================

func (h *JobHandler) PauseJob(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		apierror.NotAuthenticated.Send(c)
		return
	}

	if user.Role != models.RoleRecruiter && user.Role != models.RoleAdmin {
		apierror.AccessDenied.Send(c)
		return
	}

	jobID := c.Param("id")

	job, err := h.jobService.PauseJob(jobID, user)
	if err != nil {
		if errors.Is(err, services.ErrJobNotFound) {
			apierror.JobNotFound.Send(c)
			return
		}
		if errors.Is(err, services.ErrOrgMismatch) || errors.Is(err, services.ErrNoOrg) {
			apierror.AccessDenied.Send(c)
			return
		}
		apierror.UpdateError.Send(c)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"job":     job.ToResponse(),
		"message": "Job paused",
	})
}

// =============================================================================
// POST /api/v1/jobs/:id/close
// Close a job (status: closed)
// =============================================================================

func (h *JobHandler) CloseJob(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		apierror.NotAuthenticated.Send(c)
		return
	}

	if user.Role != models.RoleRecruiter && user.Role != models.RoleAdmin {
		apierror.AccessDenied.Send(c)
		return
	}

	jobID := c.Param("id")

	job, err := h.jobService.CloseJob(jobID, user)
	if err != nil {
		if errors.Is(err, services.ErrJobNotFound) {
			apierror.JobNotFound.Send(c)
			return
		}
		if errors.Is(err, services.ErrOrgMismatch) || errors.Is(err, services.ErrNoOrg) {
			apierror.AccessDenied.Send(c)
			return
		}
		apierror.UpdateError.Send(c)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"job":     job.ToResponse(),
		"message": "Job closed",
	})
}
