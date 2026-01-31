package models

import (
	"encoding/json"
	"time"
)

// WorkSampleSection represents a single section/scenario in a work sample
type WorkSampleSection struct {
	Title                string   `json:"title"`
	Description          string   `json:"description"`
	Instructions         string   `json:"instructions"`
	EstimatedTimeMinutes int      `json:"estimated_time_minutes"`
	CriteriaEvaluated    []string `json:"criteria_evaluated"` // Names of criteria this section evaluates
	Rubric               string   `json:"rubric"`             // What we're looking for
}

// JobWorkSample represents a work sample template generated for a job
type JobWorkSample struct {
	ID                   string          `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	JobID                string          `gorm:"type:uuid;not null;uniqueIndex" json:"job_id"`
	Job                  *Job            `gorm:"foreignKey:JobID" json:"job,omitempty"`
	ScorecardID          *string         `gorm:"type:uuid" json:"scorecard_id,omitempty"`
	Scorecard            *Scorecard      `gorm:"foreignKey:ScorecardID" json:"scorecard,omitempty"`
	IntroMessage         string          `json:"intro_message,omitempty"`
	Rules                json.RawMessage `gorm:"type:jsonb;default:'[]'" json:"rules"`
	Sections             json.RawMessage `gorm:"type:jsonb;default:'[]'" json:"sections"`
	EstimatedTimeMinutes *int            `json:"estimated_time_minutes,omitempty"`
	GeneratedAt          *time.Time      `json:"generated_at,omitempty"`
	PromptVersion        string          `json:"prompt_version,omitempty"`
	CreatedAt            time.Time       `json:"created_at"`
	UpdatedAt            time.Time       `json:"updated_at"`
}

func (JobWorkSample) TableName() string {
	return "job_work_samples"
}

// JobWorkSampleResponse is the API response for a job work sample
type JobWorkSampleResponse struct {
	ID                   string              `json:"id"`
	JobID                string              `json:"job_id"`
	ScorecardID          *string             `json:"scorecard_id,omitempty"`
	IntroMessage         string              `json:"intro_message,omitempty"`
	Rules                []string            `json:"rules"`
	Sections             []WorkSampleSection `json:"sections"`
	EstimatedTimeMinutes *int                `json:"estimated_time_minutes,omitempty"`
	GeneratedAt          *time.Time          `json:"generated_at,omitempty"`
	PromptVersion        string              `json:"prompt_version,omitempty"`
	CreatedAt            time.Time           `json:"created_at"`
	UpdatedAt            time.Time           `json:"updated_at"`
}

// ToResponse converts a JobWorkSample to its API response
func (jws *JobWorkSample) ToResponse() *JobWorkSampleResponse {
	resp := &JobWorkSampleResponse{
		ID:                   jws.ID,
		JobID:                jws.JobID,
		ScorecardID:          jws.ScorecardID,
		IntroMessage:         jws.IntroMessage,
		Rules:                []string{},
		Sections:             []WorkSampleSection{},
		EstimatedTimeMinutes: jws.EstimatedTimeMinutes,
		GeneratedAt:          jws.GeneratedAt,
		PromptVersion:        jws.PromptVersion,
		CreatedAt:            jws.CreatedAt,
		UpdatedAt:            jws.UpdatedAt,
	}

	// Parse rules from JSON
	if len(jws.Rules) > 0 {
		var rules []string
		if err := json.Unmarshal(jws.Rules, &rules); err == nil {
			resp.Rules = rules
		}
	}

	// Parse sections from JSON
	if len(jws.Sections) > 0 {
		var sections []WorkSampleSection
		if err := json.Unmarshal(jws.Sections, &sections); err == nil {
			resp.Sections = sections
		}
	}

	return resp
}

// GetSections parses and returns the sections
func (jws *JobWorkSample) GetSections() []WorkSampleSection {
	var sections []WorkSampleSection
	if len(jws.Sections) > 0 {
		if err := json.Unmarshal(jws.Sections, &sections); err != nil {
			return []WorkSampleSection{}
		}
	}
	return sections
}

// SetSections sets the sections from a slice
func (jws *JobWorkSample) SetSections(sections []WorkSampleSection) error {
	data, err := json.Marshal(sections)
	if err != nil {
		return err
	}
	jws.Sections = data
	return nil
}

// GetRules parses and returns the rules
func (jws *JobWorkSample) GetRules() []string {
	var rules []string
	if len(jws.Rules) > 0 {
		if err := json.Unmarshal(jws.Rules, &rules); err != nil {
			return []string{}
		}
	}
	return rules
}

// SetRules sets the rules from a slice
func (jws *JobWorkSample) SetRules(rules []string) error {
	data, err := json.Marshal(rules)
	if err != nil {
		return err
	}
	jws.Rules = data
	return nil
}
