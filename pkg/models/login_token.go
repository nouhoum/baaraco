package models

import (
	"time"
)

// LoginToken represents a magic link token for passwordless auth
type LoginToken struct {
	ID         string     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Email      string     `gorm:"not null" json:"email"`
	TokenHash  string     `gorm:"type:varchar(64);not null" json:"-"` // SHA256 hex of token
	IsNewUser  bool       `gorm:"default:false" json:"is_new_user"`
	ExpiresAt  time.Time  `gorm:"not null" json:"expires_at"`
	ConsumedAt *time.Time `json:"consumed_at,omitempty"` // NULL if not yet used
	CreatedAt  time.Time  `json:"created_at"`
}

func (LoginToken) TableName() string {
	return "login_tokens"
}

// IsValid returns true if the token is valid (not expired, not consumed)
func (t *LoginToken) IsValid() bool {
	return t.ConsumedAt == nil && t.ExpiresAt.After(time.Now())
}
