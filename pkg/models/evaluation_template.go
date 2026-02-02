package models

import (
	"encoding/json"
	"time"
)

// EvaluationTemplate is a standalone evaluation configuration for a role type.
// It bundles criteria, sections, and rules independently of the Job model,
// enabling candidates to be evaluated without a recruiter-created job.
type EvaluationTemplate struct {
	ID                   string          `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	RoleType             string          `gorm:"type:varchar(50);not null;uniqueIndex" json:"role_type"`
	Title                string          `gorm:"type:varchar(255);not null" json:"title"`
	Description          string          `json:"description"`
	Seniority            string          `gorm:"type:varchar(20);default:'mid'" json:"seniority"`
	Criteria             json.RawMessage `gorm:"type:jsonb;default:'[]'" json:"criteria"`
	Sections             json.RawMessage `gorm:"type:jsonb;default:'[]'" json:"sections"`
	Rules                json.RawMessage `gorm:"type:jsonb;default:'[]'" json:"rules"`
	IntroMessage         string          `json:"intro_message"`
	EstimatedTimeMinutes *int            `gorm:"default:45" json:"estimated_time_minutes,omitempty"`
	IsActive             bool            `gorm:"default:true" json:"is_active"`
	CooldownDays         int             `gorm:"default:90" json:"cooldown_days"`
	CreatedAt            time.Time       `json:"created_at"`
	UpdatedAt            time.Time       `json:"updated_at"`
}

func (EvaluationTemplate) TableName() string {
	return "evaluation_templates"
}

// GetCriteria parses and returns the scorecard criteria
func (et *EvaluationTemplate) GetCriteria() []ScorecardCriterion {
	var criteria []ScorecardCriterion
	if len(et.Criteria) > 0 {
		if err := json.Unmarshal(et.Criteria, &criteria); err != nil {
			return []ScorecardCriterion{}
		}
	}
	return criteria
}

// SetCriteria sets the criteria from a slice
func (et *EvaluationTemplate) SetCriteria(criteria []ScorecardCriterion) error {
	data, err := json.Marshal(criteria)
	if err != nil {
		return err
	}
	et.Criteria = data
	return nil
}

// GetSections parses and returns the work sample sections
func (et *EvaluationTemplate) GetSections() []WorkSampleSection {
	var sections []WorkSampleSection
	if len(et.Sections) > 0 {
		if err := json.Unmarshal(et.Sections, &sections); err != nil {
			return []WorkSampleSection{}
		}
	}
	return sections
}

// SetSections sets the sections from a slice
func (et *EvaluationTemplate) SetSections(sections []WorkSampleSection) error {
	data, err := json.Marshal(sections)
	if err != nil {
		return err
	}
	et.Sections = data
	return nil
}

// GetRules parses and returns the rules
func (et *EvaluationTemplate) GetRules() []string {
	var rules []string
	if len(et.Rules) > 0 {
		if err := json.Unmarshal(et.Rules, &rules); err != nil {
			return []string{}
		}
	}
	return rules
}

// SetRules sets the rules from a slice
func (et *EvaluationTemplate) SetRules(rules []string) error {
	data, err := json.Marshal(rules)
	if err != nil {
		return err
	}
	et.Rules = data
	return nil
}

// EvaluationTemplateResponse is the API response for an evaluation template
type EvaluationTemplateResponse struct {
	ID                   string               `json:"id"`
	RoleType             string               `json:"role_type"`
	Title                string               `json:"title"`
	Description          string               `json:"description"`
	Seniority            string               `json:"seniority"`
	Criteria             []ScorecardCriterion `json:"criteria"`
	Sections             []WorkSampleSection  `json:"sections"`
	Rules                []string             `json:"rules"`
	IntroMessage         string               `json:"intro_message"`
	EstimatedTimeMinutes *int                 `json:"estimated_time_minutes,omitempty"`
	IsActive             bool                 `json:"is_active"`
	CooldownDays         int                  `json:"cooldown_days"`
	CreatedAt            time.Time            `json:"created_at"`
	UpdatedAt            time.Time            `json:"updated_at"`
}

// ToWorkSampleResponse builds a JobWorkSampleResponse from the template data,
// so that handlers can return a consistent work_sample shape regardless of source.
func (et *EvaluationTemplate) ToWorkSampleResponse() *JobWorkSampleResponse {
	return &JobWorkSampleResponse{
		ID:                   et.ID,
		IntroMessage:         et.IntroMessage,
		Rules:                et.GetRules(),
		Sections:             et.GetSections(),
		EstimatedTimeMinutes: et.EstimatedTimeMinutes,
		CreatedAt:            et.CreatedAt,
		UpdatedAt:            et.UpdatedAt,
	}
}

// ToResponse converts an EvaluationTemplate to its API response
func (et *EvaluationTemplate) ToResponse() *EvaluationTemplateResponse {
	return &EvaluationTemplateResponse{
		ID:                   et.ID,
		RoleType:             et.RoleType,
		Title:                et.Title,
		Description:          et.Description,
		Seniority:            et.Seniority,
		Criteria:             et.GetCriteria(),
		Sections:             et.GetSections(),
		Rules:                et.GetRules(),
		IntroMessage:         et.IntroMessage,
		EstimatedTimeMinutes: et.EstimatedTimeMinutes,
		IsActive:             et.IsActive,
		CooldownDays:         et.CooldownDays,
		CreatedAt:            et.CreatedAt,
		UpdatedAt:            et.UpdatedAt,
	}
}
