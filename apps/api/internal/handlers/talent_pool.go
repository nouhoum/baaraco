package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/baaraco/baara/apps/api/internal/middleware"
	"github.com/baaraco/baara/pkg/apierror"
	"github.com/baaraco/baara/pkg/database"
	"github.com/baaraco/baara/pkg/models"
)

type TalentPoolHandler struct{}

func NewTalentPoolHandler() *TalentPoolHandler {
	return &TalentPoolHandler{}
}

// TalentPoolItem is the response item for a candidate in the talent pool
type TalentPoolItem struct {
	// Candidate info
	CandidateID    string  `json:"candidate_id"`
	CandidateName  string  `json:"candidate_name"`
	AvatarURL      *string `json:"avatar_url,omitempty"`
	RoleType       string  `json:"role_type,omitempty"`
	LinkedInURL    *string `json:"linkedin_url,omitempty"`
	GithubUsername *string `json:"github_username,omitempty"`

	// Enriched candidate info
	Bio               *string         `json:"bio,omitempty"`
	YearsOfExperience *int            `json:"years_of_experience,omitempty"`
	CurrentCompany    *string         `json:"current_company,omitempty"`
	CurrentTitle      *string         `json:"current_title,omitempty"`
	Skills            json.RawMessage `json:"skills,omitempty"`
	Location          *string         `json:"location,omitempty"`
	Certifications    json.RawMessage `json:"certifications,omitempty"`
	Languages         json.RawMessage `json:"languages,omitempty"`
	Availability      *string         `json:"availability,omitempty"`
	RemotePreference  *string         `json:"remote_preference,omitempty"`
	OpenToRelocation  *bool           `json:"open_to_relocation,omitempty"`
	Experiences       json.RawMessage `json:"experiences,omitempty"`

	// Proof profile summary
	ProofProfileID  string          `json:"proof_profile_id"`
	PublicSlug      string          `json:"public_slug"`
	GlobalScore     int             `json:"global_score"`
	ScoreLabel      string          `json:"score_label"`
	Percentile      int             `json:"percentile"`
	OneLiner        string          `json:"one_liner"`
	CriteriaSummary json.RawMessage `json:"criteria_summary"`
	Strengths       json.RawMessage `json:"strengths"`
	GeneratedAt     *string         `json:"generated_at,omitempty"`
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
	search := c.Query("search")
	sortBy := c.DefaultQuery("sort", "score_desc")
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

	// Build query
	query := database.Db.
		Table("proof_profiles").
		Select(`
			proof_profiles.id as proof_profile_id,
			proof_profiles.public_slug,
			proof_profiles.global_score,
			proof_profiles.score_label,
			proof_profiles.percentile,
			proof_profiles.one_liner,
			proof_profiles.criteria_summary,
			proof_profiles.strengths,
			proof_profiles.generated_at,
			users.id as candidate_id,
			users.name as candidate_name,
			users.avatar_url,
			users.role_type,
			users.linkedin_url,
			users.github_username,
			users.bio,
			users.years_of_experience,
			users.current_company,
			users.current_title,
			users.skills,
			users.location,
			users.certifications,
			users.languages,
			users.availability,
			users.remote_preference,
			users.open_to_relocation,
			users.experiences
		`).
		Joins("JOIN users ON users.id = proof_profiles.candidate_id").
		Where("proof_profiles.is_public = ?", true)

	// Apply role_type filter
	if roleType != "" {
		query = query.Where("users.role_type = ?", roleType)
	}

	// Apply min_score filter
	if minScoreStr != "" {
		minScore, err := strconv.Atoi(minScoreStr)
		if err == nil && minScore > 0 {
			query = query.Where("proof_profiles.global_score >= ?", minScore)
		}
	}

	// Apply search filter (name only)
	if search != "" {
		searchPattern := "%" + search + "%"
		query = query.Where("users.name ILIKE ?", searchPattern)
	}

	// Count total before pagination
	var total int64
	countQuery := *query
	countQuery.Count(&total)

	// Apply sorting
	switch sortBy {
	case "score_desc":
		query = query.Order("proof_profiles.global_score DESC")
	case "score_asc":
		query = query.Order("proof_profiles.global_score ASC")
	case "date_desc":
		query = query.Order("proof_profiles.generated_at DESC NULLS LAST")
	case "date_asc":
		query = query.Order("proof_profiles.generated_at ASC NULLS LAST")
	case "name_asc":
		query = query.Order("users.name ASC")
	case "name_desc":
		query = query.Order("users.name DESC")
	default:
		query = query.Order("proof_profiles.global_score DESC")
	}

	// Apply pagination
	offset := (page - 1) * perPage
	query = query.Offset(offset).Limit(perPage)

	// Execute query
	type talentPoolRow struct {
		ProofProfileID string          `gorm:"column:proof_profile_id"`
		PublicSlug     string          `gorm:"column:public_slug"`
		GlobalScore    int             `gorm:"column:global_score"`
		ScoreLabel     string          `gorm:"column:score_label"`
		Percentile     int             `gorm:"column:percentile"`
		OneLiner       string          `gorm:"column:one_liner"`
		CriteriaSummary json.RawMessage `gorm:"column:criteria_summary"`
		Strengths      json.RawMessage `gorm:"column:strengths"`
		GeneratedAt    *string         `gorm:"column:generated_at"`
		CandidateID    string          `gorm:"column:candidate_id"`
		CandidateName  string          `gorm:"column:candidate_name"`
		AvatarURL      *string         `gorm:"column:avatar_url"`
		RoleType       string          `gorm:"column:role_type"`
		LinkedInURL       *string         `gorm:"column:linkedin_url"`
		GithubUsername    *string         `gorm:"column:github_username"`
		Bio               *string         `gorm:"column:bio"`
		YearsOfExperience *int            `gorm:"column:years_of_experience"`
		CurrentCompany    *string         `gorm:"column:current_company"`
		CurrentTitle      *string         `gorm:"column:current_title"`
		Skills            json.RawMessage `gorm:"column:skills"`
		Location          *string         `gorm:"column:location"`
		Certifications    json.RawMessage `gorm:"column:certifications"`
		Languages         json.RawMessage `gorm:"column:languages"`
		Availability      *string         `gorm:"column:availability"`
		RemotePreference  *string         `gorm:"column:remote_preference"`
		OpenToRelocation  *bool           `gorm:"column:open_to_relocation"`
		Experiences       json.RawMessage `gorm:"column:experiences"`
	}

	var rows []talentPoolRow
	if err := query.Find(&rows).Error; err != nil {
		apierror.FetchError.Send(c)
		return
	}

	// Convert to response
	profiles := make([]TalentPoolItem, len(rows))
	for i, row := range rows {
		profiles[i] = TalentPoolItem{
			CandidateID:     row.CandidateID,
			CandidateName:   row.CandidateName,
			AvatarURL:       row.AvatarURL,
			RoleType:        row.RoleType,
			LinkedInURL:     row.LinkedInURL,
			GithubUsername:    row.GithubUsername,
			Bio:               row.Bio,
			YearsOfExperience: row.YearsOfExperience,
			CurrentCompany:    row.CurrentCompany,
			CurrentTitle:      row.CurrentTitle,
			Skills:            row.Skills,
			Location:          row.Location,
			Certifications:    row.Certifications,
			Languages:         row.Languages,
			Availability:      row.Availability,
			RemotePreference:  row.RemotePreference,
			OpenToRelocation:  row.OpenToRelocation,
			Experiences:       row.Experiences,
			ProofProfileID:    row.ProofProfileID,
			PublicSlug:      row.PublicSlug,
			GlobalScore:     row.GlobalScore,
			ScoreLabel:      row.ScoreLabel,
			Percentile:      row.Percentile,
			OneLiner:        row.OneLiner,
			CriteriaSummary: row.CriteriaSummary,
			Strengths:       row.Strengths,
			GeneratedAt:     row.GeneratedAt,
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"profiles": profiles,
		"total":    total,
		"page":     page,
		"per_page": perPage,
	})
}
