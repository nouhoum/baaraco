package models

import (
	"encoding/json"
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

// Education represents an education entry
type Education struct {
	Institution string `json:"institution"`
	Degree      string `json:"degree"`
	Field       string `json:"field"`
	StartYear   int    `json:"start_year,omitempty"`
	EndYear     int    `json:"end_year,omitempty"`
}

// Certification represents a professional certification
type Certification struct {
	Name   string `json:"name"`
	Issuer string `json:"issuer"`
	Year   int    `json:"year,omitempty"`
}

// Language represents a spoken language with proficiency level
type Language struct {
	Language string `json:"language"`
	Level    string `json:"level"` // native, fluent, professional, basic
}

// Experience represents a professional experience entry
type Experience struct {
	Title       string `json:"title"`
	Company     string `json:"company"`
	StartYear   int    `json:"start_year,omitempty"`
	EndYear     int    `json:"end_year,omitempty"`
	Description string `json:"description,omitempty"`
}

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

	// Enriched profile fields
	ResumeURL          string          `gorm:"column:resume_url" json:"resume_url,omitempty"`
	ResumeOriginalName string          `gorm:"column:resume_original_name" json:"resume_original_name,omitempty"`
	Bio                string          `gorm:"column:bio" json:"bio,omitempty"`
	YearsOfExperience  *int            `gorm:"column:years_of_experience" json:"years_of_experience,omitempty"`
	CurrentCompany     string          `gorm:"column:current_company" json:"current_company,omitempty"`
	CurrentTitle       string          `gorm:"column:current_title" json:"current_title,omitempty"`
	Skills             json.RawMessage `gorm:"type:jsonb;default:'[]'" json:"skills,omitempty"`
	Location           string          `gorm:"column:location" json:"location,omitempty"`

	// Extended profile fields
	Education        json.RawMessage `gorm:"type:jsonb;default:'[]'" json:"education,omitempty"`
	Certifications   json.RawMessage `gorm:"type:jsonb;default:'[]'" json:"certifications,omitempty"`
	Languages        json.RawMessage `gorm:"type:jsonb;default:'[]'" json:"languages,omitempty"`
	WebsiteURL       string          `gorm:"column:website_url" json:"website_url,omitempty"`
	Availability     string          `gorm:"column:availability;type:varchar(50)" json:"availability,omitempty"`
	RemotePreference string          `gorm:"column:remote_preference;type:varchar(50)" json:"remote_preference,omitempty"`
	OpenToRelocation bool            `gorm:"column:open_to_relocation;default:false" json:"open_to_relocation"`
	Experiences      json.RawMessage `gorm:"type:jsonb;default:'[]'" json:"experiences,omitempty"`

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
	ID                    string          `json:"id"`
	Email                 string          `json:"email"`
	Name                  string          `json:"name,omitempty"`
	Role                  UserRole        `json:"role"`
	Status                UserStatus      `json:"status"`
	Org                   *OrgResponse    `json:"org,omitempty"`
	RoleType              RoleType        `json:"role_type,omitempty"`
	LinkedInURL           string          `json:"linkedin_url,omitempty"`
	GithubUsername        string          `json:"github_username,omitempty"`
	OnboardingCompletedAt *time.Time      `json:"onboarding_completed_at,omitempty"`
	ResumeURL             string          `json:"resume_url,omitempty"`
	ResumeOriginalName    string          `json:"resume_original_name,omitempty"`
	Bio                   string          `json:"bio,omitempty"`
	YearsOfExperience     *int            `json:"years_of_experience,omitempty"`
	CurrentCompany        string          `json:"current_company,omitempty"`
	CurrentTitle          string          `json:"current_title,omitempty"`
	Skills                []string        `json:"skills,omitempty"`
	Location              string          `json:"location,omitempty"`
	Education             []Education     `json:"education,omitempty"`
	Certifications        []Certification `json:"certifications,omitempty"`
	Languages             []Language      `json:"languages,omitempty"`
	WebsiteURL            string          `json:"website_url,omitempty"`
	Availability          string          `json:"availability,omitempty"`
	RemotePreference      string          `json:"remote_preference,omitempty"`
	OpenToRelocation      bool            `json:"open_to_relocation"`
	Experiences           []Experience    `json:"experiences,omitempty"`
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
		ResumeURL:             u.ResumeURL,
		ResumeOriginalName:    u.ResumeOriginalName,
		Bio:                   u.Bio,
		YearsOfExperience:     u.YearsOfExperience,
		CurrentCompany:        u.CurrentCompany,
		CurrentTitle:          u.CurrentTitle,
		Location:              u.Location,
		WebsiteURL:            u.WebsiteURL,
		Availability:          u.Availability,
		RemotePreference:      u.RemotePreference,
		OpenToRelocation:      u.OpenToRelocation,
	}
	if u.Org != nil {
		resp.Org = u.Org.ToResponse()
	}
	if len(u.Skills) > 0 {
		var skills []string
		if err := json.Unmarshal(u.Skills, &skills); err == nil {
			resp.Skills = skills
		}
	}
	if len(u.Education) > 0 {
		var education []Education
		if err := json.Unmarshal(u.Education, &education); err == nil {
			resp.Education = education
		}
	}
	if len(u.Certifications) > 0 {
		var certs []Certification
		if err := json.Unmarshal(u.Certifications, &certs); err == nil {
			resp.Certifications = certs
		}
	}
	if len(u.Languages) > 0 {
		var langs []Language
		if err := json.Unmarshal(u.Languages, &langs); err == nil {
			resp.Languages = langs
		}
	}
	if len(u.Experiences) > 0 {
		var exps []Experience
		if err := json.Unmarshal(u.Experiences, &exps); err == nil {
			resp.Experiences = exps
		}
	}
	return resp
}

// NeedsOnboarding returns true if the user hasn't completed onboarding
func (u *User) NeedsOnboarding() bool {
	return u.Role == RoleCandidate && u.OnboardingCompletedAt == nil
}
