package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/baaraco/baara/pkg/apierror"
	"github.com/baaraco/baara/pkg/database"
	"github.com/baaraco/baara/pkg/logger"
	"github.com/baaraco/baara/pkg/models"
	"github.com/baaraco/baara/pkg/redis"
)

var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)

type CandidateSignupHandler struct {
	queueName string
}

func NewCandidateSignupHandler(queueName string) *CandidateSignupHandler {
	return &CandidateSignupHandler{
		queueName: queueName,
	}
}

type CandidateSignupRequest struct {
	Email        string `json:"email" binding:"required,email"`
	Name         string `json:"name" binding:"required,min=2"`
	LinkedInURL  string `json:"linkedin_url"`
	PortfolioURL string `json:"portfolio_url"`
	Locale       string `json:"locale"`
}

type CandidateSignupResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	ID      string `json:"id,omitempty"`
}

// CreateSignup handles candidate signup
// POST /api/v1/candidate-signups
func (h *CandidateSignupHandler) CreateSignup(c *gin.Context) {
	var req CandidateSignupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apierror.InvalidData.Send(c)
		return
	}

	// Normalize
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	req.Name = strings.TrimSpace(req.Name)

	// Set default locale
	if req.Locale == "" {
		req.Locale = "fr"
	}

	// Validation
	errors := make(map[string]string)
	if !emailRegex.MatchString(req.Email) {
		errors["email"] = "Invalid email address"
	}
	if len(req.Name) < 2 {
		errors["name"] = "Name is required"
	}

	if len(errors) > 0 {
		apierror.ValidationFailed.SendWithDetails(c, errors)
		return
	}

	// Check if email already exists
	var existing models.CandidateSignup
	result := database.Db.Where("email = ?", req.Email).First(&existing)
	if result.Error == nil {
		c.JSON(http.StatusOK, CandidateSignupResponse{
			Success: true,
			Message: "You are already registered.",
			ID:      existing.ID,
		})
		return
	}

	// Create entry
	entry := models.CandidateSignup{
		Email:        req.Email,
		Name:         req.Name,
		LinkedInURL:  req.LinkedInURL,
		PortfolioURL: req.PortfolioURL,
		Locale:       req.Locale,
		Status:       models.CandidateStatusPending,
	}

	if err := database.Db.Create(&entry).Error; err != nil {
		logger.Error("Failed to create candidate signup", zap.Error(err))
		apierror.CreateError.Send(c)
		return
	}

	// Queue welcome email
	h.queueWelcomeEmail(entry)

	logger.Info("Candidate signed up",
		zap.String("id", entry.ID),
		zap.String("email", entry.Email),
	)

	c.JSON(http.StatusCreated, CandidateSignupResponse{
		Success: true,
		Message: "Registration successful. We will contact you soon.",
		ID:      entry.ID,
	})
}

type CandidateEmailJob struct {
	Type   string `json:"type"`
	To     string `json:"to"`
	Name   string `json:"name"`
	Locale string `json:"locale"`
}

func (h *CandidateSignupHandler) queueWelcomeEmail(entry models.CandidateSignup) {
	job := CandidateEmailJob{
		Type:   "candidate_welcome",
		To:     entry.Email,
		Name:   entry.Name,
		Locale: entry.Locale,
	}

	data, err := json.Marshal(job)
	if err != nil {
		logger.Error("Failed to marshal email job", zap.Error(err))
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := redis.Push(ctx, h.queueName, data); err != nil {
		logger.Error("Failed to queue email job", zap.Error(err))
	}
}
