package models

import (
	"time"

	"gorm.io/gorm"
)

type UserRole string

const (
	RoleAdmin     UserRole = "admin"
	RoleRecruiter UserRole = "recruiter"
	RoleCandidate UserRole = "candidate"
)

type UserStatus string

const (
	UserStatusPending  UserStatus = "pending"
	UserStatusActive   UserStatus = "active"
	UserStatusDisabled UserStatus = "disabled"
)

// RoleType represents the type of job role a candidate is looking for
type RoleType string

const (
	RoleTypeBackendGo     RoleType = "backend_go"
	RoleTypeInfraPlatform RoleType = "infra_platform"
	RoleTypeSRE           RoleType = "sre"
	RoleTypeOther         RoleType = "other"
)

// User represents an authenticated user in the system
type User struct {
	ID              string     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Email           string     `gorm:"uniqueIndex;not null" json:"email"`
	Name            string     `json:"name,omitempty"`
	AvatarURL       string     `json:"avatar_url,omitempty"`
	Role            UserRole   `gorm:"type:varchar(20);not null;default:'candidate'" json:"role"`
	OrgID           *string    `gorm:"type:uuid" json:"org_id,omitempty"`
	Org             *Org       `gorm:"foreignKey:OrgID" json:"org,omitempty"`
	Status          UserStatus `gorm:"type:varchar(20);not null;default:'pending'" json:"status"`
	Locale          string     `gorm:"default:'fr'" json:"locale"`
	EmailVerifiedAt *time.Time `json:"email_verified_at,omitempty"`
	LastLoginAt     *time.Time `json:"last_login_at,omitempty"`

	// Onboarding fields (for candidates)
	RoleType              RoleType   `gorm:"type:varchar(50)" json:"role_type,omitempty"`
	LinkedInURL           string     `gorm:"column:linkedin_url" json:"linkedin_url,omitempty"`
	GithubUsername        string     `gorm:"column:github_username" json:"github_username,omitempty"`
	OnboardingCompletedAt *time.Time `gorm:"column:onboarding_completed_at" json:"onboarding_completed_at,omitempty"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (User) TableName() string {
	return "users"
}

// IsActive returns true if the user is active
func (u *User) IsActive() bool {
	return u.Status == UserStatusActive
}

// UserResponse is the API response for a user
type UserResponse struct {
	ID                    string       `json:"id"`
	Email                 string       `json:"email"`
	Name                  string       `json:"name,omitempty"`
	Role                  UserRole     `json:"role"`
	Status                UserStatus   `json:"status"`
	Org                   *OrgResponse `json:"org,omitempty"`
	RoleType              RoleType     `json:"role_type,omitempty"`
	LinkedInURL           string       `json:"linkedin_url,omitempty"`
	GithubUsername        string       `json:"github_username,omitempty"`
	OnboardingCompletedAt *time.Time   `json:"onboarding_completed_at,omitempty"`
}

// ToResponse converts a User to its API response
func (u *User) ToResponse() *UserResponse {
	resp := &UserResponse{
		ID:                    u.ID,
		Email:                 u.Email,
		Name:                  u.Name,
		Role:                  u.Role,
		Status:                u.Status,
		RoleType:              u.RoleType,
		LinkedInURL:           u.LinkedInURL,
		GithubUsername:        u.GithubUsername,
		OnboardingCompletedAt: u.OnboardingCompletedAt,
	}
	if u.Org != nil {
		resp.Org = u.Org.ToResponse()
	}
	return resp
}

// NeedsOnboarding returns true if the user hasn't completed onboarding
func (u *User) NeedsOnboarding() bool {
	return u.Role == RoleCandidate && u.OnboardingCompletedAt == nil
}
