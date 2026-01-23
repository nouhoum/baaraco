package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/baaraco/baara/pkg/database"
	"github.com/baaraco/baara/pkg/logger"
	"github.com/baaraco/baara/pkg/models"
	"github.com/baaraco/baara/pkg/redis"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type WaitlistHandler struct {
	queueName string
}

func NewWaitlistHandler(queueName string) *WaitlistHandler {
	return &WaitlistHandler{
		queueName: queueName,
	}
}

type RecruiterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Name     string `json:"name" binding:"required,min=2"`
	Company  string `json:"company" binding:"required,min=2"`
	JobTitle string `json:"job_title"`
}

type CandidateRequest struct {
	Email        string `json:"email" binding:"required,email"`
	Name         string `json:"name" binding:"required,min=2"`
	LinkedInURL  string `json:"linkedin_url"`
	PortfolioURL string `json:"portfolio_url"`
}

type WaitlistResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	ID      string `json:"id,omitempty"`
}

type ErrorResponse struct {
	Error   string            `json:"error"`
	Details map[string]string `json:"details,omitempty"`
}

var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)

// RegisterRecruiter handles recruiter waitlist signup
// POST /public/waitlist/recruiter
func (h *WaitlistHandler) RegisterRecruiter(c *gin.Context) {
	var req RecruiterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: "Données invalides",
			Details: map[string]string{
				"validation": err.Error(),
			},
		})
		return
	}

	// Normalize
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	req.Name = strings.TrimSpace(req.Name)
	req.Company = strings.TrimSpace(req.Company)

	// Additional validation
	errors := make(map[string]string)
	if !emailRegex.MatchString(req.Email) {
		errors["email"] = "Adresse email invalide"
	}
	if len(req.Name) < 2 {
		errors["name"] = "Le nom est requis"
	}
	if len(req.Company) < 2 {
		errors["company"] = "Le nom de l'entreprise est requis"
	}

	if len(errors) > 0 {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Validation failed",
			Details: errors,
		})
		return
	}

	// Check if email already exists
	var existing models.WaitlistEntry
	result := database.DB.Where("email = ?", req.Email).First(&existing)
	if result.Error == nil {
		c.JSON(http.StatusOK, WaitlistResponse{
			Success: true,
			Message: "Vous êtes déjà inscrit sur notre liste d'attente !",
			ID:      existing.ID,
		})
		return
	}

	// Create entry
	entry := models.WaitlistEntry{
		Email:    req.Email,
		Name:     req.Name,
		Company:  req.Company,
		JobTitle: req.JobTitle,
		Type:     models.WaitlistRecruiter,
		Status:   models.StatusPending,
	}

	if err := database.DB.Create(&entry).Error; err != nil {
		logger.Error("Failed to create waitlist entry", zap.Error(err))
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: "Erreur lors de l'inscription",
		})
		return
	}

	// Queue welcome email
	h.queueWelcomeEmail(entry)

	logger.Info("Recruiter registered",
		zap.String("email", entry.Email),
		zap.String("company", entry.Company),
	)

	c.JSON(http.StatusCreated, WaitlistResponse{
		Success: true,
		Message: "Inscription réussie ! Nous vous contacterons bientôt.",
		ID:      entry.ID,
	})
}

// RegisterCandidate handles candidate waitlist signup
// POST /public/waitlist/candidate
func (h *WaitlistHandler) RegisterCandidate(c *gin.Context) {
	var req CandidateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: "Données invalides",
			Details: map[string]string{
				"validation": err.Error(),
			},
		})
		return
	}

	// Normalize
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	req.Name = strings.TrimSpace(req.Name)

	// Additional validation
	errors := make(map[string]string)
	if !emailRegex.MatchString(req.Email) {
		errors["email"] = "Adresse email invalide"
	}
	if len(req.Name) < 2 {
		errors["name"] = "Le nom est requis"
	}

	if len(errors) > 0 {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "Validation failed",
			Details: errors,
		})
		return
	}

	// Check if email already exists
	var existing models.WaitlistEntry
	result := database.DB.Where("email = ?", req.Email).First(&existing)
	if result.Error == nil {
		c.JSON(http.StatusOK, WaitlistResponse{
			Success: true,
			Message: "Vous êtes déjà inscrit sur notre liste d'attente !",
			ID:      existing.ID,
		})
		return
	}

	// Create entry
	entry := models.WaitlistEntry{
		Email:        req.Email,
		Name:         req.Name,
		LinkedInURL:  req.LinkedInURL,
		PortfolioURL: req.PortfolioURL,
		Type:         models.WaitlistCandidate,
		Status:       models.StatusPending,
	}

	if err := database.DB.Create(&entry).Error; err != nil {
		logger.Error("Failed to create waitlist entry", zap.Error(err))
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: "Erreur lors de l'inscription",
		})
		return
	}

	// Queue welcome email
	h.queueWelcomeEmail(entry)

	logger.Info("Candidate registered",
		zap.String("email", entry.Email),
	)

	c.JSON(http.StatusCreated, WaitlistResponse{
		Success: true,
		Message: "Inscription réussie ! Nous vous contacterons bientôt.",
		ID:      entry.ID,
	})
}

type EmailJob struct {
	Type      string `json:"type"`
	To        string `json:"to"`
	Name      string `json:"name"`
	EntryType string `json:"entry_type"`
}

func (h *WaitlistHandler) queueWelcomeEmail(entry models.WaitlistEntry) {
	job := EmailJob{
		Type:      "welcome",
		To:        entry.Email,
		Name:      entry.Name,
		EntryType: string(entry.Type),
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
