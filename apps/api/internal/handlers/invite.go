package handlers

import (
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/baaraco/baara/pkg/auth"
	"github.com/baaraco/baara/pkg/database"
	"github.com/baaraco/baara/pkg/logger"
	"github.com/baaraco/baara/pkg/mailer"
	"github.com/baaraco/baara/pkg/models"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type InviteHandler struct {
	emailService *auth.EmailService
}

func NewInviteHandler(m mailer.Mailer) *InviteHandler {
	return &InviteHandler{
		emailService: auth.NewEmailService(m),
	}
}

// =============================================================================
// Request/Response types
// =============================================================================

type CreateInviteRequest struct {
	Email  string          `json:"email" binding:"required,email"`
	Role   models.UserRole `json:"role" binding:"required"`
	JobID  string          `json:"job_id"`  // For candidate invites
	Locale string          `json:"locale"`
}

type CreateInviteResponse struct {
	Success bool                   `json:"success"`
	Invite  *models.InviteResponse `json:"invite"`
}

type InviteInfoResponse struct {
	Email   string       `json:"email"`
	Role    string       `json:"role"`
	OrgName string       `json:"org_name,omitempty"`
	JobTitle string      `json:"job_title,omitempty"`
	Valid   bool         `json:"valid"`
}

type AcceptInviteRequest struct {
	Name string `json:"name" binding:"required,min=2"`
}

type AcceptInviteResponse struct {
	Success bool                 `json:"success"`
	User    *models.UserResponse `json:"user"`
}

// =============================================================================
// POST /api/v1/invites
// Creates an invitation (requires authentication)
// =============================================================================

func (h *InviteHandler) Create(c *gin.Context) {
	// Get current user from context (set by auth middleware)
	userVal, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error: "Non authentifié",
		})
		return
	}
	currentUser := userVal.(*models.User)

	var req CreateInviteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: "Données invalides",
		})
		return
	}

	// Normalize
	email := strings.TrimSpace(strings.ToLower(req.Email))
	locale := req.Locale
	if locale == "" {
		locale = "fr"
	}

	// Validate role
	if req.Role != models.RoleRecruiter && req.Role != models.RoleCandidate {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: "Rôle invalide. Utilisez 'recruiter' ou 'candidate'.",
		})
		return
	}

	// Check permissions
	// - Admin can invite anyone
	// - Recruiter can only invite candidates
	if currentUser.Role == models.RoleRecruiter && req.Role != models.RoleCandidate {
		c.JSON(http.StatusForbidden, ErrorResponse{
			Error: "Les recruteurs ne peuvent inviter que des candidats",
		})
		return
	}

	if currentUser.Role == models.RoleCandidate {
		c.JSON(http.StatusForbidden, ErrorResponse{
			Error: "Les candidats ne peuvent pas envoyer d'invitations",
		})
		return
	}

	// Check if user already exists and is active
	var existingUser models.User
	userExists := database.Db.Where("email = ?", email).First(&existingUser).Error == nil && existingUser.IsActive()

	if userExists {
		// For candidate invites with a job_id, allow re-inviting existing users
		// as long as they don't already have an attempt for this specific job
		if req.Role == models.RoleCandidate && req.JobID != "" {
			var existingAttempt models.WorkSampleAttempt
			if database.Db.Where("candidate_id = ? AND job_id = ?", existingUser.ID, req.JobID).First(&existingAttempt).Error == nil {
				c.JSON(http.StatusConflict, ErrorResponse{
					Error: "Ce candidat a déjà un work sample pour ce poste",
				})
				return
			}
		} else {
			// For non-candidate invites (recruiter), block if user already exists
			c.JSON(http.StatusConflict, ErrorResponse{
				Error: "Un utilisateur avec cet email existe déjà",
			})
			return
		}
	}

	// Check for existing pending invite for the same email + job combination
	var existingInvite models.Invite
	pendingQuery := database.Db.Where("email = ? AND accepted_at IS NULL AND expires_at > ?", email, time.Now())
	if req.Role == models.RoleCandidate && req.JobID != "" {
		pendingQuery = pendingQuery.Where("job_id = ?", req.JobID)
	}
	if pendingQuery.First(&existingInvite).Error == nil {
		c.JSON(http.StatusConflict, ErrorResponse{
			Error: "Une invitation est déjà en attente pour cet email",
		})
		return
	}

	// Generate token
	token, hash, err := auth.GenerateToken()
	if err != nil {
		logger.Error("Failed to generate invite token", zap.Error(err))
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: "Erreur lors de la création de l'invitation",
		})
		return
	}

	// Set expiry based on role
	var expiresAt time.Time
	if req.Role == models.RoleRecruiter {
		expiresAt = time.Now().Add(auth.InviteRecruiterDuration)
	} else {
		expiresAt = time.Now().Add(auth.InviteCandidateDuration)
	}

	// Create invite
	invite := models.Invite{
		OrgID:     currentUser.OrgID,
		Email:     email,
		Role:      req.Role,
		InvitedBy: &currentUser.ID,
		TokenHash: hash,
		ExpiresAt: expiresAt,
	}

	// Handle job ID for candidate invites
	var job *models.Job
	if req.Role == models.RoleCandidate && req.JobID != "" {
		var j models.Job
		if err := database.Db.Where("id = ?", req.JobID).First(&j).Error; err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{
				Error: "Offre d'emploi non trouvée",
			})
			return
		}
		invite.JobID = &req.JobID
		job = &j
	}

	if err := database.Db.Create(&invite).Error; err != nil {
		logger.Error("Failed to create invite", zap.Error(err))
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: "Erreur lors de la création de l'invitation",
		})
		return
	}

	// Load org for email
	var org *models.Org
	if currentUser.OrgID != nil {
		var o models.Org
		database.Db.Where("id = ?", *currentUser.OrgID).First(&o)
		org = &o
	}

	// Send invite email
	var emailErr error
	if req.Role == models.RoleRecruiter {
		emailErr = h.emailService.SendRecruiterInvite(email, token, org, locale)
	} else {
		emailErr = h.emailService.SendCandidateInvite(email, token, org, job, locale)
	}

	if emailErr != nil {
		logger.Error("Failed to send invite email", zap.Error(emailErr), zap.String("email", email))
	}

	logger.Info("Invite created",
		zap.String("invite_id", invite.ID),
		zap.String("email", email),
		zap.String("role", string(req.Role)),
		zap.String("invited_by", currentUser.ID),
	)

	c.JSON(http.StatusCreated, CreateInviteResponse{
		Success: true,
		Invite:  invite.ToResponse(),
	})
}

// =============================================================================
// GET /api/v1/invites/:token
// Gets invite information (public endpoint for accept page)
// =============================================================================

func (h *InviteHandler) GetInfo(c *gin.Context) {
	token := c.Param("token")
	if token == "" {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: "Token manquant",
		})
		return
	}

	// Hash and find invite
	tokenHash := auth.HashToken(token)
	var invite models.Invite
	result := database.Db.Preload("Org").Preload("Job").Where("token_hash = ?", tokenHash).First(&invite)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, InviteInfoResponse{
			Valid: false,
		})
		return
	}

	// Check validity
	if !invite.IsValid() {
		c.JSON(http.StatusOK, InviteInfoResponse{
			Valid: false,
		})
		return
	}

	response := InviteInfoResponse{
		Email: invite.Email,
		Role:  string(invite.Role),
		Valid: true,
	}

	if invite.Org != nil {
		response.OrgName = invite.Org.Name
	}

	if invite.Job != nil {
		response.JobTitle = invite.Job.Title
	}

	c.JSON(http.StatusOK, response)
}

// =============================================================================
// POST /api/v1/invites/:token/accept
// Accepts an invitation and creates user + session
// =============================================================================

func (h *InviteHandler) Accept(c *gin.Context) {
	token := c.Param("token")
	if token == "" {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: "Token manquant",
		})
		return
	}

	var req AcceptInviteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: "Nom requis (minimum 2 caractères)",
		})
		return
	}

	// Hash and find invite
	tokenHash := auth.HashToken(token)
	var invite models.Invite
	result := database.Db.Preload("Org").Where("token_hash = ?", tokenHash).First(&invite)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{
			Error: "Invitation non trouvée",
		})
		return
	}

	// Check validity
	if !invite.IsValid() {
		c.JSON(http.StatusGone, ErrorResponse{
			Error: "Cette invitation a expiré ou a déjà été utilisée",
		})
		return
	}

	now := time.Now()

	// Check if user already exists
	var user models.User
	result = database.Db.Where("email = ?", invite.Email).First(&user)

	if result.Error != nil {
		// Create new user
		user = models.User{
			Email:           invite.Email,
			Name:            strings.TrimSpace(req.Name),
			Role:            invite.Role,
			OrgID:           invite.OrgID,
			Status:          models.UserStatusActive,
			Locale:          "fr",
			EmailVerifiedAt: &now,
			LastLoginAt:     &now,
		}

		if err := database.Db.Create(&user).Error; err != nil {
			logger.Error("Failed to create user from invite", zap.Error(err))
			c.JSON(http.StatusInternalServerError, ErrorResponse{
				Error: "Erreur lors de la création du compte",
			})
			return
		}

		// Create identity
		identity := models.Identity{
			UserID:   user.ID,
			Provider: models.ProviderMagicLink,
			Email:    user.Email,
		}
		database.Db.Create(&identity)
	} else {
		// Update existing user
		user.Name = strings.TrimSpace(req.Name)
		user.Role = invite.Role
		user.OrgID = invite.OrgID
		user.Status = models.UserStatusActive
		user.EmailVerifiedAt = &now
		user.LastLoginAt = &now
		database.Db.Save(&user)
	}

	// Mark invite as accepted
	invite.AcceptedAt = &now
	database.Db.Save(&invite)

	// For candidate invites with a job, create a WorkSampleAttempt
	if invite.Role == models.RoleCandidate && invite.JobID != nil {
		var existingAttempt models.WorkSampleAttempt
		if database.Db.Where("candidate_id = ? AND job_id = ?", user.ID, *invite.JobID).First(&existingAttempt).Error != nil {
			attempt := models.WorkSampleAttempt{
				CandidateID: user.ID,
				JobID:       invite.JobID,
				Status:      models.AttemptStatusDraft,
				Answers:     []byte(`{}`),
			}
			if err := database.Db.Create(&attempt).Error; err != nil {
				logger.Error("Failed to create work sample attempt from invite",
					zap.Error(err),
					zap.String("user_id", user.ID),
					zap.String("job_id", *invite.JobID),
				)
			} else {
				logger.Info("Work sample attempt created from invite",
					zap.String("attempt_id", attempt.ID),
					zap.String("user_id", user.ID),
					zap.String("job_id", *invite.JobID),
				)
			}
		}
	}

	// Create session
	sessionToken, sessionHash, err := auth.GenerateToken()
	if err != nil {
		logger.Error("Failed to generate session token", zap.Error(err))
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: "Erreur lors de la création de la session",
		})
		return
	}

	session := models.Session{
		UserID:    user.ID,
		TokenHash: sessionHash,
		IPAddress: c.ClientIP(),
		UserAgent: c.Request.UserAgent(),
		ExpiresAt: time.Now().Add(auth.SessionDuration),
	}

	if err := database.Db.Create(&session).Error; err != nil {
		logger.Error("Failed to create session", zap.Error(err))
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: "Erreur lors de la création de la session",
		})
		return
	}

	// Set session cookie
	h.setSessionCookie(c, sessionToken)

	// Load org for response
	if user.OrgID != nil {
		database.Db.Where("id = ?", *user.OrgID).First(&user.Org)
	}

	logger.Info("Invite accepted",
		zap.String("invite_id", invite.ID),
		zap.String("user_id", user.ID),
		zap.String("email", user.Email),
		zap.String("role", string(user.Role)),
	)

	c.JSON(http.StatusOK, AcceptInviteResponse{
		Success: true,
		User:    user.ToResponse(),
	})
}

// =============================================================================
// Cookie helpers
// =============================================================================

func (h *InviteHandler) setSessionCookie(c *gin.Context, token string) {
	secure := os.Getenv("APP_ENV") == "production"
	maxAge := int(auth.SessionDuration.Seconds())

	c.SetCookie(
		auth.SessionCookieName,
		token,
		maxAge,
		"/",
		"",
		secure,
		true,
	)
	c.SetSameSite(http.SameSiteLaxMode)
}
