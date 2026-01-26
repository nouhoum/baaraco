package handlers

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/baaraco/baara/apps/api/internal/middleware"
	"github.com/baaraco/baara/pkg/database"
	"github.com/baaraco/baara/pkg/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
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

type JobHandler struct{}

func NewJobHandler() *JobHandler {
	return &JobHandler{}
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
}

// =============================================================================
// POST /api/v1/jobs
// Create a new job (status: draft)
// =============================================================================

func (h *JobHandler) CreateJob(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Non authentifié"})
		return
	}

	// Only recruiters and admins can create jobs
	if user.Role != models.RoleRecruiter && user.Role != models.RoleAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Seuls les recruteurs peuvent créer des postes"})
		return
	}

	// Recruiters must have an org
	if user.OrgID == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Vous devez appartenir à une organisation pour créer un poste"})
		return
	}

	var req CreateJobRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Convert arrays to JSON
	stackJSON, _ := json.Marshal(req.Stack)
	outcomesJSON, _ := json.Marshal(req.ExpectedOutcomes)

	// Convert FlexibleDate to *time.Time
	var startDate *time.Time
	if req.StartDate != nil && !req.StartDate.IsZero() {
		startDate = &req.StartDate.Time
	}

	job := models.Job{
		OrgID:            *user.OrgID,
		Status:           models.JobStatusDraft,
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
		CreatedBy:        &user.ID,
	}

	if err := database.Db.Create(&job).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la création du poste"})
		return
	}

	// Reload with associations
	database.Db.Preload("Org").Preload("Creator").First(&job, "id = ?", job.ID)

	c.JSON(http.StatusCreated, gin.H{
		"job":     job.ToResponse(),
		"message": "Poste créé avec succès",
	})
}

// =============================================================================
// GET /api/v1/jobs/:id
// Get a specific job
// =============================================================================

func (h *JobHandler) GetJob(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Non authentifié"})
		return
	}

	jobID := c.Param("id")

	var job models.Job
	err := database.Db.Preload("Org").Preload("Creator").First(&job, "id = ?", jobID).Error
	if err == gorm.ErrRecordNotFound {
		c.JSON(http.StatusNotFound, gin.H{"error": "Poste non trouvé"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération du poste"})
		return
	}

	// Check access: recruiters/admins can only see jobs from their org
	if user.Role == models.RoleRecruiter || user.Role == models.RoleAdmin {
		if user.OrgID == nil || *user.OrgID != job.OrgID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Accès refusé"})
			return
		}
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
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Non authentifié"})
		return
	}

	// Only recruiters and admins can update jobs
	if user.Role != models.RoleRecruiter && user.Role != models.RoleAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Accès refusé"})
		return
	}

	jobID := c.Param("id")

	var job models.Job
	err := database.Db.First(&job, "id = ?", jobID).Error
	if err == gorm.ErrRecordNotFound {
		c.JSON(http.StatusNotFound, gin.H{"error": "Poste non trouvé"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération du poste"})
		return
	}

	// Check org access
	if user.OrgID == nil || *user.OrgID != job.OrgID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Accès refusé"})
		return
	}

	var req UpdateJobRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
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
		stackJSON, _ := json.Marshal(req.Stack)
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
		outcomesJSON, _ := json.Marshal(req.ExpectedOutcomes)
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

	if len(updates) > 0 {
		if err := database.Db.Model(&job).Updates(updates).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la mise à jour du poste"})
			return
		}
	}

	// Reload with associations
	database.Db.Preload("Org").Preload("Creator").First(&job, "id = ?", jobID)

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
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Non authentifié"})
		return
	}

	// Only recruiters and admins can list jobs
	if user.Role != models.RoleRecruiter && user.Role != models.RoleAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Accès refusé"})
		return
	}

	if user.OrgID == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Vous devez appartenir à une organisation"})
		return
	}

	// Query params
	status := c.Query("status")

	query := database.Db.Where("org_id = ?", *user.OrgID)

	if status != "" {
		query = query.Where("status = ?", status)
	}

	var jobs []models.Job
	if err := query.Order("created_at DESC").Find(&jobs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération des postes"})
		return
	}

	// Convert to list response
	responses := make([]*models.JobListResponse, len(jobs))
	for i, job := range jobs {
		responses[i] = job.ToListResponse()
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
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Non authentifié"})
		return
	}

	// Only recruiters and admins can publish jobs
	if user.Role != models.RoleRecruiter && user.Role != models.RoleAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Accès refusé"})
		return
	}

	jobID := c.Param("id")

	var job models.Job
	err := database.Db.First(&job, "id = ?", jobID).Error
	if err == gorm.ErrRecordNotFound {
		c.JSON(http.StatusNotFound, gin.H{"error": "Poste non trouvé"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération du poste"})
		return
	}

	// Check org access
	if user.OrgID == nil || *user.OrgID != job.OrgID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Accès refusé"})
		return
	}

	// Validate required fields before publishing
	var missingFields []string
	if job.Title == "" {
		missingFields = append(missingFields, "title")
	}
	if job.BusinessContext == "" {
		missingFields = append(missingFields, "business_context")
	}
	if job.MainProblem == "" {
		missingFields = append(missingFields, "main_problem")
	}
	if job.SuccessLooksLike == "" {
		missingFields = append(missingFields, "success_looks_like")
	}

	if len(missingFields) > 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":          "Veuillez remplir tous les champs requis avant de publier",
			"missing_fields": missingFields,
		})
		return
	}

	// Update status to active
	if err := database.Db.Model(&job).Update("status", models.JobStatusActive).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la publication du poste"})
		return
	}

	// Reload with associations
	database.Db.Preload("Org").Preload("Creator").First(&job, "id = ?", jobID)

	c.JSON(http.StatusOK, gin.H{
		"job":     job.ToResponse(),
		"message": "Poste publié avec succès",
	})
}

// =============================================================================
// DELETE /api/v1/jobs/:id
// Soft delete a job
// =============================================================================

func (h *JobHandler) DeleteJob(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Non authentifié"})
		return
	}

	// Only recruiters and admins can delete jobs
	if user.Role != models.RoleRecruiter && user.Role != models.RoleAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Accès refusé"})
		return
	}

	jobID := c.Param("id")

	var job models.Job
	err := database.Db.First(&job, "id = ?", jobID).Error
	if err == gorm.ErrRecordNotFound {
		c.JSON(http.StatusNotFound, gin.H{"error": "Poste non trouvé"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération du poste"})
		return
	}

	// Check org access
	if user.OrgID == nil || *user.OrgID != job.OrgID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Accès refusé"})
		return
	}

	// Soft delete
	if err := database.Db.Delete(&job).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la suppression du poste"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Poste supprimé avec succès",
	})
}

// =============================================================================
// POST /api/v1/jobs/:id/pause
// Pause a job (status: paused)
// =============================================================================

func (h *JobHandler) PauseJob(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Non authentifié"})
		return
	}

	if user.Role != models.RoleRecruiter && user.Role != models.RoleAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Accès refusé"})
		return
	}

	jobID := c.Param("id")

	var job models.Job
	err := database.Db.First(&job, "id = ?", jobID).Error
	if err == gorm.ErrRecordNotFound {
		c.JSON(http.StatusNotFound, gin.H{"error": "Poste non trouvé"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération du poste"})
		return
	}

	if user.OrgID == nil || *user.OrgID != job.OrgID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Accès refusé"})
		return
	}

	if err := database.Db.Model(&job).Update("status", models.JobStatusPaused).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la mise en pause du poste"})
		return
	}

	database.Db.Preload("Org").Preload("Creator").First(&job, "id = ?", jobID)

	c.JSON(http.StatusOK, gin.H{
		"job":     job.ToResponse(),
		"message": "Poste mis en pause",
	})
}

// =============================================================================
// POST /api/v1/jobs/:id/close
// Close a job (status: closed)
// =============================================================================

func (h *JobHandler) CloseJob(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Non authentifié"})
		return
	}

	if user.Role != models.RoleRecruiter && user.Role != models.RoleAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Accès refusé"})
		return
	}

	jobID := c.Param("id")

	var job models.Job
	err := database.Db.First(&job, "id = ?", jobID).Error
	if err == gorm.ErrRecordNotFound {
		c.JSON(http.StatusNotFound, gin.H{"error": "Poste non trouvé"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la récupération du poste"})
		return
	}

	if user.OrgID == nil || *user.OrgID != job.OrgID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Accès refusé"})
		return
	}

	if err := database.Db.Model(&job).Update("status", models.JobStatusClosed).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors de la fermeture du poste"})
		return
	}

	database.Db.Preload("Org").Preload("Creator").First(&job, "id = ?", jobID)

	c.JSON(http.StatusOK, gin.H{
		"job":     job.ToResponse(),
		"message": "Poste fermé",
	})
}
