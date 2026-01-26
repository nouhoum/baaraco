package models

import (
	"time"
)

type AuthProvider string

const (
	ProviderMagicLink AuthProvider = "magiclink"
	ProviderGoogle    AuthProvider = "google"
	ProviderGitHub    AuthProvider = "github"
)

// Identity represents an authentication provider for a user
type Identity struct {
	ID              string       `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID          string       `gorm:"type:uuid;not null" json:"user_id"`
	User            *User        `gorm:"foreignKey:UserID" json:"-"`
	Provider        AuthProvider `gorm:"type:varchar(50);not null" json:"provider"`
	ProviderSubject string       `json:"provider_subject,omitempty"` // ID from provider (NULL for magiclink)
	Email           string       `json:"email,omitempty"`
	Metadata        string       `gorm:"type:jsonb;default:'{}'" json:"metadata,omitempty"`
	CreatedAt       time.Time    `json:"created_at"`
	UpdatedAt       time.Time    `json:"updated_at"`
}

func (Identity) TableName() string {
	return "identities"
}
