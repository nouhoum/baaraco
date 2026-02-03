package models

import (
	"time"

	"gorm.io/gorm"
)

type OrgPlan string

const (
	OrgPlanPilot   OrgPlan = "pilot"
	OrgPlanStarter OrgPlan = "starter"
	OrgPlanPro     OrgPlan = "pro"
)

// Org represents a company using Baara for hiring
type Org struct {
	ID        string         `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name      string         `gorm:"not null" json:"name"`
	Slug      string         `gorm:"uniqueIndex" json:"slug,omitempty"`
	Plan      OrgPlan        `gorm:"type:varchar(50);default:'pilot'" json:"plan"`
	LogoURL   string         `json:"logo_url,omitempty"`
	Website   string         `json:"website,omitempty"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (Org) TableName() string {
	return "orgs"
}

// OrgResponse is the API response for an org
type OrgResponse struct {
	ID      string  `json:"id"`
	Name    string  `json:"name"`
	Slug    string  `json:"slug,omitempty"`
	Plan    OrgPlan `json:"plan"`
	LogoURL string  `json:"logo_url,omitempty"`
	Website string  `json:"website,omitempty"`
}

// ToResponse converts an Org to its API response
func (o *Org) ToResponse() *OrgResponse {
	if o == nil {
		return nil
	}
	return &OrgResponse{
		ID:      o.ID,
		Name:    o.Name,
		Slug:    o.Slug,
		Plan:    o.Plan,
		LogoURL: o.LogoURL,
		Website: o.Website,
	}
}
