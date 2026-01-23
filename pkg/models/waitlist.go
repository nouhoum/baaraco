package models

import (
	"time"

	"gorm.io/gorm"
)

type WaitlistType string

const (
	WaitlistRecruiter WaitlistType = "recruiter"
	WaitlistCandidate WaitlistType = "candidate"
)

type WaitlistStatus string

const (
	StatusPending  WaitlistStatus = "pending"
	StatusInvited  WaitlistStatus = "invited"
	StatusAccepted WaitlistStatus = "accepted"
	StatusDeclined WaitlistStatus = "declined"
)

type WaitlistEntry struct {
	ID           string         `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Email        string         `gorm:"uniqueIndex;not null" json:"email"`
	Name         string         `gorm:"not null" json:"name"`
	Company      string         `json:"company,omitempty"`         // For recruiters
	JobTitle     string         `json:"job_title,omitempty"`       // For recruiters
	LinkedInURL  string         `json:"linkedin_url,omitempty"`    // For candidates
	PortfolioURL string         `json:"portfolio_url,omitempty"`   // For candidates
	Type         WaitlistType   `gorm:"type:varchar(20);not null" json:"type"`
	Status       WaitlistStatus `gorm:"type:varchar(20);not null;default:'pending'" json:"status"`
	Notes        string         `json:"notes,omitempty"`
	InvitedAt    *time.Time     `json:"invited_at,omitempty"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

func (WaitlistEntry) TableName() string {
	return "waitlist_entries"
}

// WorkSample represents a portfolio item for candidates
type WorkSample struct {
	ID          string         `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID      string         `gorm:"type:uuid;index" json:"user_id"`
	Title       string         `gorm:"not null" json:"title"`
	Description string         `json:"description"`
	URL         string         `json:"url,omitempty"`
	FileKey     string         `json:"file_key,omitempty"` // MinIO object key
	FileType    string         `json:"file_type,omitempty"`
	FileSize    int64          `json:"file_size,omitempty"`
	Order       int            `gorm:"default:0" json:"order"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

func (WorkSample) TableName() string {
	return "work_samples"
}
