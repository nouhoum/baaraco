package models

import (
	"time"
)

// Invite represents an invitation for recruiters and candidates
type Invite struct {
	ID         string     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	OrgID      *string    `gorm:"type:uuid" json:"org_id,omitempty"` // NULL for standalone candidate invites
	Org        *Org       `gorm:"foreignKey:OrgID" json:"org,omitempty"`
	Email      string     `gorm:"not null" json:"email"`
	Role       UserRole   `gorm:"type:varchar(20);not null" json:"role"` // recruiter, candidate
	InvitedBy  *string    `gorm:"type:uuid" json:"invited_by,omitempty"`
	Inviter    *User      `gorm:"foreignKey:InvitedBy" json:"inviter,omitempty"`
	JobID      *string    `gorm:"type:uuid" json:"job_id,omitempty"` // For candidate invites
	Job        *Job       `gorm:"foreignKey:JobID" json:"job,omitempty"`
	TokenHash  string     `gorm:"type:varchar(64);not null" json:"-"` // SHA256 hex of token
	ExpiresAt  time.Time  `gorm:"not null" json:"expires_at"`
	AcceptedAt *time.Time `json:"accepted_at,omitempty"` // NULL if not yet accepted
	CreatedAt  time.Time  `json:"created_at"`
}

func (Invite) TableName() string {
	return "invites"
}

// IsValid returns true if the invite is valid (not expired, not accepted)
func (i *Invite) IsValid() bool {
	return i.AcceptedAt == nil && i.ExpiresAt.After(time.Now())
}

// InviteResponse is the API response for an invite
type InviteResponse struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	Role      UserRole  `json:"role"`
	ExpiresAt time.Time `json:"expires_at"`
	CreatedAt time.Time `json:"created_at"`
}

// ToResponse converts an Invite to its API response
func (i *Invite) ToResponse() *InviteResponse {
	return &InviteResponse{
		ID:        i.ID,
		Email:     i.Email,
		Role:      i.Role,
		ExpiresAt: i.ExpiresAt,
		CreatedAt: i.CreatedAt,
	}
}
