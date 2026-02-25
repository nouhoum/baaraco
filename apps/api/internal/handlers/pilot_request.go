package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/baaraco/baara/apps/api/internal/services"
	"github.com/baaraco/baara/pkg/apierror"
	"github.com/baaraco/baara/pkg/logger"
	"github.com/baaraco/baara/pkg/models"
	"github.com/baaraco/baara/pkg/redis"
)

type PilotRequestHandler struct {
	service   *services.PilotService
	queueName string
}

func NewPilotRequestHandler(service *services.PilotService, queueName string) *PilotRequestHandler {
	return &PilotRequestHandler{
		service:   service,
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

	// Validation
	validationErrors := make(map[string]string)
	if !emailRegex.MatchString(req.Email) {
		validationErrors["email"] = "Invalid email address"
	}
	if len(req.FirstName) < 2 {
		validationErrors["first_name"] = "First name is required"
	}
	if len(req.LastName) < 2 {
		validationErrors["last_name"] = "Last name is required"
	}
	if len(req.Company) < 2 {
		validationErrors["company"] = "Company is required"
	}
	if len(req.RoleToHire) == 0 {
		validationErrors["role_to_hire"] = "Role to hire is required"
	}

	if len(validationErrors) > 0 {
		apierror.ValidationFailed.SendWithDetails(c, validationErrors)
		return
	}

	input := services.CreatePilotInput{
		FirstName:  req.FirstName,
		LastName:   req.LastName,
		Email:      req.Email,
		Company:    req.Company,
		RoleToHire: req.RoleToHire,
		Locale:     req.Locale,
	}

	entry, err := h.service.CreatePartial(input)
	if err != nil {
		if errors.Is(err, services.ErrPilotMissingContactInfo) {
			apierror.InvalidData.Send(c)
			return
		}
		apierror.CreateError.Send(c)
		return
	}

	// Determine if this is an existing record or a newly created one
	if entry.Status == models.PilotStatusComplete {
		// Already completed
		c.JSON(http.StatusOK, PilotRequestResponse{
			ID:      entry.ID,
			Status:  string(entry.Status),
			Message: "You have already submitted a pilot request",
		})
		return
	}

	// Check if this was a pre-existing partial request (created more than a second ago)
	if time.Since(entry.CreatedAt) > time.Second {
		c.JSON(http.StatusOK, PilotRequestResponse{
			ID:      entry.ID,
			Status:  string(entry.Status),
			Message: "Request updated",
		})
		return
	}

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
	validationErrors := make(map[string]string)
	if len(req.Role) == 0 {
		validationErrors["role"] = "Your role is required"
	}
	if len(req.TeamSize) == 0 {
		validationErrors["team_size"] = "Team size is required"
	}
	if len(req.HiringTimeline) == 0 {
		validationErrors["hiring_timeline"] = "Hiring timeline is required"
	}
	if !req.ConsentGiven {
		validationErrors["consent_given"] = "You must accept to continue"
	}

	if len(validationErrors) > 0 {
		apierror.ValidationFailed.SendWithDetails(c, validationErrors)
		return
	}

	input := services.CompletePilotInput{
		Role:               req.Role,
		TeamSize:           req.TeamSize,
		HiringTimeline:     req.HiringTimeline,
		Website:            strings.TrimSpace(req.Website),
		ProductionContext:  req.ProductionContext,
		BaselineTimeToHire: req.BaselineTimeToHire,
		BaselineInterviews: req.BaselineInterviews,
		BaselinePainPoint:  strings.TrimSpace(req.BaselinePainPoint),
		JobLink:            strings.TrimSpace(req.JobLink),
		Message:            strings.TrimSpace(req.Message),
		ConsentGiven:       req.ConsentGiven,
	}

	entry, err := h.service.Complete(id, input)
	if err != nil {
		if errors.Is(err, services.ErrPilotRequestNotFound) {
			apierror.PilotRequestNotFound.Send(c)
			return
		}
		if errors.Is(err, services.ErrPilotAlreadyComplete) {
			// Already completed - return success with info
			existing, getErr := h.service.Get(id)
			if getErr != nil {
				apierror.FetchError.Send(c)
				return
			}
			c.JSON(http.StatusOK, PilotRequestResponse{
				ID:      existing.ID,
				Status:  string(existing.Status),
				Message: "Request already completed",
			})
			return
		}
		apierror.UpdateError.Send(c)
		return
	}

	// Queue notification
	h.queuePilotNotification(*entry)

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

	entry, err := h.service.Get(id)
	if err != nil {
		if errors.Is(err, services.ErrPilotRequestNotFound) {
			apierror.PilotRequestNotFound.Send(c)
			return
		}
		apierror.FetchError.Send(c)
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
