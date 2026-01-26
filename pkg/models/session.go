package models

import (
	"time"
)

// Session represents a user authentication session
type Session struct {
	ID        string     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID    string     `gorm:"type:uuid;not null" json:"user_id"`
	User      *User      `gorm:"foreignKey:UserID" json:"-"`
	TokenHash string     `gorm:"type:varchar(64);not null" json:"-"` // SHA256 hex of token
	IPAddress string     `gorm:"type:inet" json:"ip_address,omitempty"`
	UserAgent string     `json:"user_agent,omitempty"`
	ExpiresAt time.Time  `gorm:"not null" json:"expires_at"`
	RevokedAt *time.Time `json:"revoked_at,omitempty"` // NULL if active
	CreatedAt time.Time  `json:"created_at"`
}

func (Session) TableName() string {
	return "sessions"
}

// IsValid returns true if the session is valid (not expired, not revoked)
func (s *Session) IsValid() bool {
	return s.RevokedAt == nil && s.ExpiresAt.After(time.Now())
}
