package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/baaraco/baara/apps/api/internal/middleware"
	"github.com/baaraco/baara/apps/api/internal/repositories"
	"github.com/baaraco/baara/apps/api/internal/services"
	"github.com/baaraco/baara/pkg/apierror"
	"github.com/baaraco/baara/pkg/models"
)

type TalentPoolHandler struct {
	service *services.TalentPoolService
}

func NewTalentPoolHandler(service *services.TalentPoolService) *TalentPoolHandler {
	return &TalentPoolHandler{
		service: service,
	}
}

// ListTalentPool returns all public proof profiles for recruiter sourcing
// GET /api/v1/talent-pool
func (h *TalentPoolHandler) ListTalentPool(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		apierror.NotAuthenticated.Send(c)
		return
	}

	if user.Role != models.RoleRecruiter && user.Role != models.RoleAdmin {
		apierror.AccessDenied.Send(c)
		return
	}

	// Parse query parameters
	roleType := c.Query("role_type")
	minScoreStr := c.Query("min_score")
	sortBy := c.DefaultQuery("sort", "score")
	sortOrder := c.DefaultQuery("sort_order", "desc")
	pageStr := c.DefaultQuery("page", "1")
	perPageStr := c.DefaultQuery("per_page", "20")

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}
	perPage, err := strconv.Atoi(perPageStr)
	if err != nil || perPage < 1 || perPage > 50 {
		perPage = 20
	}

	offset := (page - 1) * perPage

	// Build filters
	filters := repositories.TalentPoolFilters{
		RoleType:  roleType,
		Limit:     perPage,
		Offset:    offset,
		SortBy:    sortBy,
		SortOrder: sortOrder,
	}

	// Apply min_score filter
	if minScoreStr != "" {
		minScore, err := strconv.Atoi(minScoreStr)
		if err == nil && minScore > 0 {
			filters.MinScore = &minScore
		}
	}

	profiles, total, err := h.service.List(filters)
	if err != nil {
		apierror.FetchError.Send(c)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"profiles": profiles,
		"total":    total,
		"page":     page,
		"per_page": perPage,
	})
}
