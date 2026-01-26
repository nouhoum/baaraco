package models

import (
	"time"

	"gorm.io/gorm"
)

type CandidateStatus string

const (
	CandidateStatusPending  CandidateStatus = "pending"
	CandidateStatusInvited  CandidateStatus = "invited"
	CandidateStatusAccepted CandidateStatus = "accepted"
	CandidateStatusDeclined CandidateStatus = "declined"
)

// CandidateSignup represents a candidate who wants to join the platform
type CandidateSignup struct {
	ID string `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`

	// Contact info
	Email string `gorm:"uniqueIndex;not null" json:"email"`
	Name  string `gorm:"not null" json:"name"`

	// Optional profile links
	LinkedInURL  string `json:"linkedin_url,omitempty"`
	PortfolioURL string `json:"portfolio_url,omitempty"`

	// Locale for emails
	Locale string `gorm:"default:'fr'" json:"locale"`

	// Status tracking
	Status    CandidateStatus `gorm:"type:varchar(20);not null;default:'pending'" json:"status"`
	InvitedAt *time.Time      `json:"invited_at,omitempty"`

	// Internal notes
	Notes string `json:"notes,omitempty"`

	// Timestamps
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (CandidateSignup) TableName() string {
	return "candidate_signups"
}
