package models

import (
	"encoding/json"
	"time"

	"github.com/lib/pq"
	"gorm.io/gorm"
)

type PilotRequestStatus string

const (
	PilotStatusPartial  PilotRequestStatus = "partial"
	PilotStatusComplete PilotRequestStatus = "complete"
)

// AdminStatus represents the internal tracking status for pilot requests
type AdminStatus string

const (
	AdminStatusNew          AdminStatus = "new"
	AdminStatusContacted    AdminStatus = "contacted"
	AdminStatusInDiscussion AdminStatus = "in_discussion"
	AdminStatusConverted    AdminStatus = "converted"
	AdminStatusRejected     AdminStatus = "rejected"
	AdminStatusArchived     AdminStatus = "archived"
)

// PilotNote represents an internal note on a pilot request
type PilotNote struct {
	Content   string    `json:"content"`
	CreatedBy string    `json:"created_by"`
	AuthorName string   `json:"author_name,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

// PilotRequest represents a pilot program request with 2-step data collection
type PilotRequest struct {
	ID string `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`

	// Step 1: Contact info (required)
	FirstName  string `gorm:"not null" json:"first_name"`
	LastName   string `gorm:"not null" json:"last_name"`
	Email      string `gorm:"not null" json:"email"`
	Company    string `gorm:"not null" json:"company"`
	RoleToHire string `gorm:"not null" json:"role_to_hire"`
	Locale     string `gorm:"default:'fr'" json:"locale"`

	// Step 2: Hiring context (optional until completed)
	Role               string         `json:"role,omitempty"`
	TeamSize           string         `json:"team_size,omitempty"`
	HiringTimeline     string         `json:"hiring_timeline,omitempty"`
	Website            string         `json:"website,omitempty"`
	ProductionContext  pq.StringArray `gorm:"type:text[]" json:"production_context,omitempty"`
	BaselineTimeToHire *int           `json:"baseline_time_to_hire,omitempty"`
	BaselineInterviews *int           `json:"baseline_interviews,omitempty"`
	BaselinePainPoint  string         `json:"baseline_pain_point,omitempty"`
	JobLink            string         `json:"job_link,omitempty"`
	Message            string         `json:"message,omitempty"`
	ConsentGiven       bool           `gorm:"default:false" json:"consent_given"`

	// Status tracking
	Status      PilotRequestStatus `gorm:"type:varchar(20);not null;default:'partial'" json:"status"`
	CompletedAt *time.Time         `json:"completed_at,omitempty"`

	// Admin tracking
	AdminStatus      AdminStatus     `gorm:"type:varchar(20);default:'new'" json:"admin_status"`
	Notes            json.RawMessage `gorm:"type:jsonb;default:'[]'" json:"notes"`
	ConvertedUserID  *string         `gorm:"type:uuid" json:"converted_user_id,omitempty"`
	ConvertedUser    *User           `gorm:"foreignKey:ConvertedUserID" json:"converted_user,omitempty"`
	ConvertedAt      *time.Time      `json:"converted_at,omitempty"`

	// Timestamps
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (PilotRequest) TableName() string {
	return "pilot_requests"
}

// GetNotes parses the notes JSON into a slice of PilotNote
func (p *PilotRequest) GetNotes() []PilotNote {
	var notes []PilotNote
	if p.Notes != nil {
		json.Unmarshal(p.Notes, &notes)
	}
	return notes
}

// SetNotes converts a slice of PilotNote to JSON
func (p *PilotRequest) SetNotes(notes []PilotNote) error {
	data, err := json.Marshal(notes)
	if err != nil {
		return err
	}
	p.Notes = data
	return nil
}

// AddNote adds a new note to the pilot request
func (p *PilotRequest) AddNote(content, createdBy, authorName string) error {
	notes := p.GetNotes()
	notes = append(notes, PilotNote{
		Content:    content,
		CreatedBy:  createdBy,
		AuthorName: authorName,
		CreatedAt:  time.Now(),
	})
	return p.SetNotes(notes)
}

// PilotRequestResponse is the API response for a pilot request
type PilotRequestResponse struct {
	ID                 string             `json:"id"`
	FirstName          string             `json:"first_name"`
	LastName           string             `json:"last_name"`
	Email              string             `json:"email"`
	Company            string             `json:"company"`
	RoleToHire         string             `json:"role_to_hire"`
	Locale             string             `json:"locale"`
	Role               string             `json:"role,omitempty"`
	TeamSize           string             `json:"team_size,omitempty"`
	HiringTimeline     string             `json:"hiring_timeline,omitempty"`
	Website            string             `json:"website,omitempty"`
	ProductionContext  []string           `json:"production_context,omitempty"`
	BaselineTimeToHire *int               `json:"baseline_time_to_hire,omitempty"`
	BaselineInterviews *int               `json:"baseline_interviews,omitempty"`
	BaselinePainPoint  string             `json:"baseline_pain_point,omitempty"`
	JobLink            string             `json:"job_link,omitempty"`
	Message            string             `json:"message,omitempty"`
	Status             PilotRequestStatus `json:"status"`
	AdminStatus        AdminStatus        `json:"admin_status"`
	Notes              []PilotNote        `json:"notes"`
	ConvertedUserID    *string            `json:"converted_user_id,omitempty"`
	ConvertedAt        *time.Time         `json:"converted_at,omitempty"`
	CompletedAt        *time.Time         `json:"completed_at,omitempty"`
	CreatedAt          time.Time          `json:"created_at"`
	UpdatedAt          time.Time          `json:"updated_at"`
}

// ToResponse converts a PilotRequest to its API response
func (p *PilotRequest) ToResponse() *PilotRequestResponse {
	return &PilotRequestResponse{
		ID:                 p.ID,
		FirstName:          p.FirstName,
		LastName:           p.LastName,
		Email:              p.Email,
		Company:            p.Company,
		RoleToHire:         p.RoleToHire,
		Locale:             p.Locale,
		Role:               p.Role,
		TeamSize:           p.TeamSize,
		HiringTimeline:     p.HiringTimeline,
		Website:            p.Website,
		ProductionContext:  p.ProductionContext,
		BaselineTimeToHire: p.BaselineTimeToHire,
		BaselineInterviews: p.BaselineInterviews,
		BaselinePainPoint:  p.BaselinePainPoint,
		JobLink:            p.JobLink,
		Message:            p.Message,
		Status:             p.Status,
		AdminStatus:        p.AdminStatus,
		Notes:              p.GetNotes(),
		ConvertedUserID:    p.ConvertedUserID,
		ConvertedAt:        p.ConvertedAt,
		CompletedAt:        p.CompletedAt,
		CreatedAt:          p.CreatedAt,
		UpdatedAt:          p.UpdatedAt,
	}
}

// PilotRequestListItem is a condensed version for list views
type PilotRequestListItem struct {
	ID          string      `json:"id"`
	FirstName   string      `json:"first_name"`
	LastName    string      `json:"last_name"`
	Email       string      `json:"email"`
	Company     string      `json:"company"`
	RoleToHire  string      `json:"role_to_hire"`
	AdminStatus AdminStatus `json:"admin_status"`
	CreatedAt   time.Time   `json:"created_at"`
}

// ToListItem converts a PilotRequest to a list item
func (p *PilotRequest) ToListItem() *PilotRequestListItem {
	return &PilotRequestListItem{
		ID:          p.ID,
		FirstName:   p.FirstName,
		LastName:    p.LastName,
		Email:       p.Email,
		Company:     p.Company,
		RoleToHire:  p.RoleToHire,
		AdminStatus: p.AdminStatus,
		CreatedAt:   p.CreatedAt,
	}
}
