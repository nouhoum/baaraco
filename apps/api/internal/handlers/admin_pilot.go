package handlers

import (
	"net/http"
	"regexp"
	"strconv"
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

type AdminPilotHandler struct {
	emailService *auth.EmailService
}

func NewAdminPilotHandler(m mailer.Mailer) *AdminPilotHandler {
	return &AdminPilotHandler{
		emailService: auth.NewEmailService(m),
	}
}

// =============================================================================
// Request/Response types
// =============================================================================

type PilotRequestListResponse struct {
	Requests []*models.PilotRequestListItem `json:"requests"`
	Total    int64                          `json:"total"`
	Page     int                            `json:"page"`
	PerPage  int                            `json:"per_page"`
	Stats    *PilotRequestStats             `json:"stats"`
}

type PilotRequestStats struct {
	New          int64 `json:"new"`
	Contacted    int64 `json:"contacted"`
	InDiscussion int64 `json:"in_discussion"`
	Converted    int64 `json:"converted"`
	Rejected     int64 `json:"rejected"`
	Total        int64 `json:"total"`
}

type UpdatePilotStatusRequest struct {
	AdminStatus models.AdminStatus `json:"admin_status" binding:"required"`
}

type AddNoteRequest struct {
	Content string `json:"content" binding:"required,min=1"`
}

type ConvertToPilotRequest struct {
	OrgName        string `json:"org_name"`
	SendInvitation bool   `json:"send_invitation"`
}

type ConvertResponse struct {
	UserID   string `json:"user_id"`
	OrgID    string `json:"org_id"`
	InviteID string `json:"invite_id,omitempty"`
	Message  string `json:"message"`
}

// =============================================================================
// GET /api/v1/admin/pilot-requests
// List all pilot requests with filters
// =============================================================================

func (h *AdminPilotHandler) ListPilotRequests(c *gin.Context) {
	// Parse query params
	statusFilter := c.Query("status")
	search := strings.TrimSpace(c.Query("search"))
	pageStr := c.DefaultQuery("page", "1")
	perPageStr := c.DefaultQuery("per_page", "20")

	page, _ := strconv.Atoi(pageStr)
	if page < 1 {
		page = 1
	}
	perPage, _ := strconv.Atoi(perPageStr)
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}

	// Build query
	query := database.Db.Model(&models.PilotRequest{}).
		Where("status = ?", models.PilotStatusComplete) // Only show completed requests

	// Filter by admin status
	if statusFilter != "" && statusFilter != "all" {
		query = query.Where("admin_status = ?", statusFilter)
	}

	// Search
	if search != "" {
		searchPattern := "%" + strings.ToLower(search) + "%"
		query = query.Where(
			"LOWER(first_name) LIKE ? OR LOWER(last_name) LIKE ? OR LOWER(email) LIKE ? OR LOWER(company) LIKE ?",
			searchPattern, searchPattern, searchPattern, searchPattern,
		)
	}

	// Get total count
	var total int64
	query.Count(&total)

	// Get paginated results
	var requests []models.PilotRequest
	offset := (page - 1) * perPage
	if err := query.Order("created_at DESC").Offset(offset).Limit(perPage).Find(&requests).Error; err != nil {
		logger.Error("Failed to list pilot requests", zap.Error(err))
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: "Erreur lors du chargement des demandes",
		})
		return
	}

	// Convert to list items
	items := make([]*models.PilotRequestListItem, len(requests))
	for i, req := range requests {
		items[i] = req.ToListItem()
	}

	// Get stats
	stats := h.getStats()

	c.JSON(http.StatusOK, PilotRequestListResponse{
		Requests: items,
		Total:    total,
		Page:     page,
		PerPage:  perPage,
		Stats:    stats,
	})
}

// Helper to get stats
func (h *AdminPilotHandler) getStats() *PilotRequestStats {
	stats := &PilotRequestStats{}

	// Only count completed requests - each count needs a fresh query
	// because GORM's Where() modifies the query object cumulatively
	database.Db.Model(&models.PilotRequest{}).
		Where("status = ?", models.PilotStatusComplete).
		Where("admin_status = ?", models.AdminStatusNew).
		Count(&stats.New)

	database.Db.Model(&models.PilotRequest{}).
		Where("status = ?", models.PilotStatusComplete).
		Where("admin_status = ?", models.AdminStatusContacted).
		Count(&stats.Contacted)

	database.Db.Model(&models.PilotRequest{}).
		Where("status = ?", models.PilotStatusComplete).
		Where("admin_status = ?", models.AdminStatusInDiscussion).
		Count(&stats.InDiscussion)

	database.Db.Model(&models.PilotRequest{}).
		Where("status = ?", models.PilotStatusComplete).
		Where("admin_status = ?", models.AdminStatusConverted).
		Count(&stats.Converted)

	database.Db.Model(&models.PilotRequest{}).
		Where("status = ?", models.PilotStatusComplete).
		Where("admin_status = ?", models.AdminStatusRejected).
		Count(&stats.Rejected)

	database.Db.Model(&models.PilotRequest{}).
		Where("status = ?", models.PilotStatusComplete).
		Count(&stats.Total)

	return stats
}

// =============================================================================
// GET /api/v1/admin/pilot-requests/:id
// Get a single pilot request with full details
// =============================================================================

func (h *AdminPilotHandler) GetPilotRequest(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: "ID manquant",
		})
		return
	}

	var request models.PilotRequest
	if err := database.Db.Preload("ConvertedUser").First(&request, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{
			Error: "Demande non trouvée",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"request": request.ToResponse(),
	})
}

// =============================================================================
// PATCH /api/v1/admin/pilot-requests/:id
// Update a pilot request (mainly status)
// =============================================================================

func (h *AdminPilotHandler) UpdatePilotRequest(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: "ID manquant",
		})
		return
	}

	var req UpdatePilotStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: "Données invalides",
		})
		return
	}

	// Validate status
	validStatuses := map[models.AdminStatus]bool{
		models.AdminStatusNew:          true,
		models.AdminStatusContacted:    true,
		models.AdminStatusInDiscussion: true,
		models.AdminStatusConverted:    true,
		models.AdminStatusRejected:     true,
		models.AdminStatusArchived:     true,
	}
	if !validStatuses[req.AdminStatus] {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: "Statut invalide",
		})
		return
	}

	var request models.PilotRequest
	if err := database.Db.First(&request, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{
			Error: "Demande non trouvée",
		})
		return
	}

	// Update status
	request.AdminStatus = req.AdminStatus
	if err := database.Db.Save(&request).Error; err != nil {
		logger.Error("Failed to update pilot request", zap.Error(err))
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: "Erreur lors de la mise à jour",
		})
		return
	}

	logger.Info("Pilot request status updated",
		zap.String("id", request.ID),
		zap.String("admin_status", string(req.AdminStatus)),
	)

	c.JSON(http.StatusOK, gin.H{
		"request": request.ToResponse(),
		"message": "Statut mis à jour",
	})
}

// =============================================================================
// POST /api/v1/admin/pilot-requests/:id/notes
// Add a note to a pilot request
// =============================================================================

func (h *AdminPilotHandler) AddNote(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: "ID manquant",
		})
		return
	}

	// Get current user
	userVal, _ := c.Get("user")
	currentUser := userVal.(*models.User)

	var req AddNoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: "Contenu de la note requis",
		})
		return
	}

	var request models.PilotRequest
	if err := database.Db.First(&request, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{
			Error: "Demande non trouvée",
		})
		return
	}

	// Add note
	if err := request.AddNote(req.Content, currentUser.ID, currentUser.Name); err != nil {
		logger.Error("Failed to add note", zap.Error(err))
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: "Erreur lors de l'ajout de la note",
		})
		return
	}

	if err := database.Db.Save(&request).Error; err != nil {
		logger.Error("Failed to save pilot request with note", zap.Error(err))
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: "Erreur lors de la sauvegarde",
		})
		return
	}

	logger.Info("Note added to pilot request",
		zap.String("pilot_id", request.ID),
		zap.String("added_by", currentUser.ID),
	)

	c.JSON(http.StatusOK, gin.H{
		"request": request.ToResponse(),
		"message": "Note ajoutée",
	})
}

// =============================================================================
// POST /api/v1/admin/pilot-requests/:id/convert
// Convert a pilot request to a recruiter account
// =============================================================================

func (h *AdminPilotHandler) ConvertToRecruiter(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error: "ID manquant",
		})
		return
	}

	// Get current user (admin)
	userVal, _ := c.Get("user")
	currentUser := userVal.(*models.User)

	var req ConvertToPilotRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		// Allow empty body with defaults
		req.SendInvitation = true
	}

	var request models.PilotRequest
	if err := database.Db.First(&request, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{
			Error: "Demande non trouvée",
		})
		return
	}

	// Check if already converted
	if request.AdminStatus == models.AdminStatusConverted {
		c.JSON(http.StatusConflict, ErrorResponse{
			Error: "Cette demande a déjà été convertie",
		})
		return
	}

	// Check if user with this email already exists
	var existingUser models.User
	userExists := database.Db.Where("email = ?", request.Email).First(&existingUser).Error == nil

	if userExists {
		// User already exists - check their current status
		if existingUser.Role == models.RoleRecruiter && existingUser.OrgID != nil {
			c.JSON(http.StatusConflict, ErrorResponse{
				Error: "Cet utilisateur est déjà recruteur avec une organisation",
			})
			return
		}

		if existingUser.Role == models.RoleAdmin {
			c.JSON(http.StatusConflict, ErrorResponse{
				Error: "Cet utilisateur est un administrateur",
			})
			return
		}

		// User exists but is a candidate or recruiter without org - we can convert them
	}

	// Determine org name
	orgName := req.OrgName
	if orgName == "" {
		orgName = request.Company
	}

	// Generate slug from org name
	slug := generateSlug(orgName)

	// Check if org with this slug exists, if so, append a number
	var existingOrg models.Org
	baseSlug := slug
	counter := 1
	for database.Db.Where("slug = ?", slug).First(&existingOrg).Error == nil {
		slug = baseSlug + "-" + strconv.Itoa(counter)
		counter++
	}

	// Create organization
	org := models.Org{
		Name:    orgName,
		Slug:    slug,
		Plan:    models.OrgPlanPilot,
		Website: request.Website,
	}

	if err := database.Db.Create(&org).Error; err != nil {
		logger.Error("Failed to create org", zap.Error(err))
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error: "Erreur lors de la création de l'organisation",
		})
		return
	}

	var message string
	var inviteID string
	var userID string

	if userExists {
		// User already exists - update their role and org directly
		existingUser.Role = models.RoleRecruiter
		existingUser.OrgID = &org.ID

		if err := database.Db.Save(&existingUser).Error; err != nil {
			logger.Error("Failed to update existing user", zap.Error(err))
			c.JSON(http.StatusInternalServerError, ErrorResponse{
				Error: "Erreur lors de la mise à jour de l'utilisateur",
			})
			return
		}

		userID = existingUser.ID
		message = "Utilisateur existant converti en recruteur pour " + org.Name

		logger.Info("Existing user converted to recruiter",
			zap.String("user_id", existingUser.ID),
			zap.String("email", existingUser.Email),
			zap.String("org_id", org.ID),
		)
	} else {
		// User doesn't exist - create invite
		token, tokenHash, err := auth.GenerateToken()
		if err != nil {
			logger.Error("Failed to generate invite token", zap.Error(err))
			c.JSON(http.StatusInternalServerError, ErrorResponse{
				Error: "Erreur lors de la génération de l'invitation",
			})
			return
		}

		expiresAt := time.Now().Add(auth.InviteRecruiterDuration)
		invite := models.Invite{
			OrgID:     &org.ID,
			Email:     request.Email,
			Role:      models.RoleRecruiter,
			InvitedBy: &currentUser.ID,
			TokenHash: tokenHash,
			ExpiresAt: expiresAt,
		}

		if err := database.Db.Create(&invite).Error; err != nil {
			logger.Error("Failed to create invite", zap.Error(err))
			c.JSON(http.StatusInternalServerError, ErrorResponse{
				Error: "Erreur lors de la création de l'invitation",
			})
			return
		}

		// Send invitation email if requested
		if req.SendInvitation {
			if err := h.emailService.SendRecruiterInvite(request.Email, token, &org, request.Locale); err != nil {
				logger.Error("Failed to send invite email",
					zap.String("email", request.Email),
					zap.Error(err),
				)
				// Don't fail the request, just log the error
			} else {
				inviteID = invite.ID
				logger.Info("Recruiter invite email sent",
					zap.String("email", request.Email),
					zap.String("org", org.Name),
				)
			}
		}

		message = "Compte créé"
		if req.SendInvitation {
			message = "Compte créé. Invitation envoyée à " + request.Email
		}
	}

	// Update pilot request
	now := time.Now()
	request.AdminStatus = models.AdminStatusConverted
	request.ConvertedAt = &now

	// Add note about conversion
	noteText := "Compte recruteur créé pour " + org.Name
	if userExists {
		noteText = "Utilisateur existant converti en recruteur pour " + org.Name
	}
	request.AddNote(
		noteText,
		currentUser.ID,
		currentUser.Name,
	)

	if err := database.Db.Save(&request).Error; err != nil {
		logger.Error("Failed to update pilot request after conversion", zap.Error(err))
	}

	logger.Info("Pilot request converted to recruiter",
		zap.String("pilot_id", request.ID),
		zap.String("org_id", org.ID),
		zap.String("converted_by", currentUser.ID),
	)

	c.JSON(http.StatusOK, ConvertResponse{
		UserID:   userID,
		OrgID:    org.ID,
		InviteID: inviteID,
		Message:  message,
	})
}

// Helper to generate URL-friendly slug
func generateSlug(name string) string {
	// Convert to lowercase
	slug := strings.ToLower(name)

	// Replace spaces and special chars with hyphens
	reg := regexp.MustCompile(`[^a-z0-9]+`)
	slug = reg.ReplaceAllString(slug, "-")

	// Remove leading/trailing hyphens
	slug = strings.Trim(slug, "-")

	// Limit length
	if len(slug) > 50 {
		slug = slug[:50]
	}

	return slug
}
