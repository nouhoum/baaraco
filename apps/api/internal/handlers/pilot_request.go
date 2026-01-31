package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/lib/pq"
	"go.uber.org/zap"

	"github.com/baaraco/baara/pkg/apierror"
	"github.com/baaraco/baara/pkg/database"
	"github.com/baaraco/baara/pkg/logger"
	"github.com/baaraco/baara/pkg/models"
	"github.com/baaraco/baara/pkg/redis"
)

type PilotRequestHandler struct {
	queueName string
}

func NewPilotRequestHandler(queueName string) *PilotRequestHandler {
	return &PilotRequestHandler{
		queueName: queueName,
	}
}

// Step 1 request - contact info
type CreatePilotRequestInput struct {
	FirstName  string `json:"first_name" binding:"required,min=2"`
	LastName   string `json:"last_name" binding:"required,min=2"`
	Email      string `json:"email" binding:"required,email"`
	Company    string `json:"company" binding:"required,min=2"`
	RoleToHire string `json:"role_to_hire" binding:"required"`
	Locale     string `json:"locale"`
}

// Step 2 request - hiring context
type CompletePilotRequestInput struct {
	Role               string   `json:"role" binding:"required"`
	TeamSize           string   `json:"team_size" binding:"required"`
	HiringTimeline     string   `json:"hiring_timeline" binding:"required"`
	Website            string   `json:"website"`
	ProductionContext  []string `json:"production_context"`
	BaselineTimeToHire *int     `json:"baseline_time_to_hire"`
	BaselineInterviews *int     `json:"baseline_interviews"`
	BaselinePainPoint  string   `json:"baseline_pain_point"`
	JobLink            string   `json:"job_link"`
	Message            string   `json:"message"`
	ConsentGiven       bool     `json:"consent_given" binding:"required"`
}

type PilotRequestResponse struct {
	ID      string `json:"id"`
	Status  string `json:"status"`
	Message string `json:"message"`
}

// CreatePilotRequest handles Step 1 - creates a partial pilot request
// POST /api/v1/pilot-requests
func (h *PilotRequestHandler) CreatePilotRequest(c *gin.Context) {
	var req CreatePilotRequestInput
	if err := c.ShouldBindJSON(&req); err != nil {
		apierror.InvalidData.Send(c)
		return
	}

	// Normalize
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	req.FirstName = strings.TrimSpace(req.FirstName)
	req.LastName = strings.TrimSpace(req.LastName)
	req.Company = strings.TrimSpace(req.Company)
	req.RoleToHire = strings.TrimSpace(req.RoleToHire)

	// Set default locale
	if req.Locale == "" {
		req.Locale = "fr"
	}

	// Validation
	errors := make(map[string]string)
	if !emailRegex.MatchString(req.Email) {
		errors["email"] = "Invalid email address"
	}
	if len(req.FirstName) < 2 {
		errors["first_name"] = "First name is required"
	}
	if len(req.LastName) < 2 {
		errors["last_name"] = "Last name is required"
	}
	if len(req.Company) < 2 {
		errors["company"] = "Company is required"
	}
	if len(req.RoleToHire) == 0 {
		errors["role_to_hire"] = "Role to hire is required"
	}

	if len(errors) > 0 {
		apierror.ValidationFailed.SendWithDetails(c, errors)
		return
	}

	// Check for existing request with same email (allow updating)
	var existing models.PilotRequest
	result := database.Db.Where("email = ?", req.Email).First(&existing)
	if result.Error == nil {
		// Update existing partial request
		if existing.Status == models.PilotStatusPartial {
			existing.FirstName = req.FirstName
			existing.LastName = req.LastName
			existing.Company = req.Company
			existing.RoleToHire = req.RoleToHire
			existing.Locale = req.Locale

			if err := database.Db.Save(&existing).Error; err != nil {
				logger.Error("Failed to update pilot request", zap.Error(err))
				apierror.UpdateError.Send(c)
				return
			}

			c.JSON(http.StatusOK, PilotRequestResponse{
				ID:      existing.ID,
				Status:  string(existing.Status),
				Message: "Request updated",
			})
			return
		}

		// Already completed
		c.JSON(http.StatusOK, PilotRequestResponse{
			ID:      existing.ID,
			Status:  string(existing.Status),
			Message: "You have already submitted a pilot request",
		})
		return
	}

	// Create new entry
	entry := models.PilotRequest{
		FirstName:  req.FirstName,
		LastName:   req.LastName,
		Email:      req.Email,
		Company:    req.Company,
		RoleToHire: req.RoleToHire,
		Locale:     req.Locale,
		Status:     models.PilotStatusPartial,
	}

	if err := database.Db.Create(&entry).Error; err != nil {
		logger.Error("Failed to create pilot request", zap.Error(err))
		apierror.CreateError.Send(c)
		return
	}

	logger.Info("Pilot request created (partial)",
		zap.String("id", entry.ID),
		zap.String("email", entry.Email),
		zap.String("company", entry.Company),
	)

	c.JSON(http.StatusCreated, PilotRequestResponse{
		ID:      entry.ID,
		Status:  string(entry.Status),
		Message: "Step 1 saved",
	})
}

// CompletePilotRequest handles Step 2 - completes the pilot request
// PATCH /api/v1/pilot-requests/:id
func (h *PilotRequestHandler) CompletePilotRequest(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		apierror.MissingField.Send(c)
		return
	}

	var req CompletePilotRequestInput
	if err := c.ShouldBindJSON(&req); err != nil {
		apierror.InvalidData.Send(c)
		return
	}

	// Validation
	errors := make(map[string]string)
	if len(req.Role) == 0 {
		errors["role"] = "Your role is required"
	}
	if len(req.TeamSize) == 0 {
		errors["team_size"] = "Team size is required"
	}
	if len(req.HiringTimeline) == 0 {
		errors["hiring_timeline"] = "Hiring timeline is required"
	}
	if !req.ConsentGiven {
		errors["consent_given"] = "You must accept to continue"
	}

	if len(errors) > 0 {
		apierror.ValidationFailed.SendWithDetails(c, errors)
		return
	}

	// Find the pilot request
	var entry models.PilotRequest
	if err := database.Db.First(&entry, "id = ?", id).Error; err != nil {
		apierror.PilotRequestNotFound.Send(c)
		return
	}

	// Check if already completed
	if entry.Status == models.PilotStatusComplete {
		c.JSON(http.StatusOK, PilotRequestResponse{
			ID:      entry.ID,
			Status:  string(entry.Status),
			Message: "Request already completed",
		})
		return
	}

	// Update with Step 2 data
	now := time.Now()
	entry.Role = req.Role
	entry.TeamSize = req.TeamSize
	entry.HiringTimeline = req.HiringTimeline
	entry.Website = strings.TrimSpace(req.Website)
	entry.ProductionContext = pq.StringArray(req.ProductionContext)
	entry.BaselineTimeToHire = req.BaselineTimeToHire
	entry.BaselineInterviews = req.BaselineInterviews
	entry.BaselinePainPoint = strings.TrimSpace(req.BaselinePainPoint)
	entry.JobLink = strings.TrimSpace(req.JobLink)
	entry.Message = strings.TrimSpace(req.Message)
	entry.ConsentGiven = req.ConsentGiven
	entry.Status = models.PilotStatusComplete
	entry.CompletedAt = &now

	if err := database.Db.Save(&entry).Error; err != nil {
		logger.Error("Failed to complete pilot request", zap.Error(err))
		apierror.UpdateError.Send(c)
		return
	}

	// Queue notification
	h.queuePilotNotification(entry)

	logger.Info("Pilot request completed",
		zap.String("id", entry.ID),
		zap.String("email", entry.Email),
		zap.String("company", entry.Company),
		zap.String("role_to_hire", entry.RoleToHire),
	)

	c.JSON(http.StatusOK, PilotRequestResponse{
		ID:      entry.ID,
		Status:  string(entry.Status),
		Message: "Pilot request submitted",
	})
}

// GetPilotRequest retrieves a pilot request by ID
// GET /api/v1/pilot-requests/:id
func (h *PilotRequestHandler) GetPilotRequest(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		apierror.MissingField.Send(c)
		return
	}

	var entry models.PilotRequest
	if err := database.Db.First(&entry, "id = ?", id).Error; err != nil {
		apierror.PilotRequestNotFound.Send(c)
		return
	}

	c.JSON(http.StatusOK, entry)
}

type PilotNotificationJob struct {
	Type       string `json:"type"`
	PilotID    string `json:"pilot_id"`
	Email      string `json:"email"`
	FirstName  string `json:"first_name"`
	LastName   string `json:"last_name"`
	Company    string `json:"company"`
	RoleToHire string `json:"role_to_hire"`
	Locale     string `json:"locale"`
}

func (h *PilotRequestHandler) queuePilotNotification(entry models.PilotRequest) {
	job := PilotNotificationJob{
		Type:       "pilot_complete",
		PilotID:    entry.ID,
		Email:      entry.Email,
		FirstName:  entry.FirstName,
		LastName:   entry.LastName,
		Company:    entry.Company,
		RoleToHire: entry.RoleToHire,
		Locale:     entry.Locale,
	}

	data, err := json.Marshal(job)
	if err != nil {
		logger.Error("Failed to marshal pilot notification job", zap.Error(err))
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := redis.Push(ctx, h.queueName, data); err != nil {
		logger.Error("Failed to queue pilot notification job", zap.Error(err))
	}

	logger.Info("Pilot notification queued",
		zap.String("pilot_id", entry.ID),
		zap.String("email", entry.Email),
	)
}
