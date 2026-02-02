package models

import (
	"encoding/json"
	"time"
)

// InterviewKit represents a structured interview guide generated from a ProofProfile
type InterviewKit struct {
	ID             string  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	ProofProfileID string  `gorm:"type:uuid;not null;uniqueIndex" json:"proof_profile_id"`
	CandidateID    string  `gorm:"type:uuid;not null" json:"candidate_id"`
	JobID          *string `gorm:"type:uuid" json:"job_id,omitempty"`

	// Relationships
	ProofProfile *ProofProfile `gorm:"foreignKey:ProofProfileID" json:"proof_profile,omitempty"`
	Candidate    *User         `gorm:"foreignKey:CandidateID" json:"candidate,omitempty"`
	Job          *Job          `gorm:"foreignKey:JobID" json:"job,omitempty"`

	TotalDurationMinutes int `json:"total_duration_minutes"`

	// JSONB fields
	Sections        json.RawMessage `gorm:"type:jsonb;default:'[]'" json:"sections"`
	DebriefTemplate json.RawMessage `gorm:"type:jsonb;default:'{}'" json:"debrief_template"`
	Notes           json.RawMessage `gorm:"type:jsonb;default:'{}'" json:"notes"`

	GeneratedAt *time.Time `json:"generated_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

func (InterviewKit) TableName() string {
	return "interview_kits"
}

// =============================================================================
// NESTED TYPES
// =============================================================================

// InterviewKitSection represents a section of the interview kit
type InterviewKitSection struct {
	Title           string              `json:"title"`
	DurationMinutes int                 `json:"duration_minutes"`
	Questions       []InterviewQuestion `json:"questions"`
}

// InterviewQuestion represents a single interview question with context
type InterviewQuestion struct {
	Question        string   `json:"question"`
	Context         string   `json:"context"`
	PositiveSignals []string `json:"positive_signals"`
	NegativeSignals []string `json:"negative_signals"`
	FollowUp        string   `json:"follow_up"`
}

// DebriefTemplate represents the debrief section of the interview kit
type DebriefTemplate struct {
	Criteria                  []DebriefCriterion `json:"criteria"`
	FinalRecommendationPrompt string             `json:"final_recommendation_prompt"`
}

// DebriefCriterion represents a criterion to reevaluate during debrief
type DebriefCriterion struct {
	Name       string `json:"name"`
	Score      int    `json:"score"`
	Reevaluate bool   `json:"reevaluate"`
}

// =============================================================================
// API RESPONSE
// =============================================================================

// InterviewKitResponse is the API response for an interview kit
type InterviewKitResponse struct {
	ID                   string                `json:"id"`
	ProofProfileID       string                `json:"proof_profile_id"`
	CandidateID          string                `json:"candidate_id"`
	JobID                *string               `json:"job_id,omitempty"`
	TotalDurationMinutes int                   `json:"total_duration_minutes"`
	Sections             []InterviewKitSection `json:"sections"`
	DebriefTemplate      DebriefTemplate       `json:"debrief_template"`
	Notes                map[string]string     `json:"notes"`
	GeneratedAt          *time.Time            `json:"generated_at,omitempty"`
	CreatedAt            time.Time             `json:"created_at"`
	UpdatedAt            time.Time             `json:"updated_at"`
}

// ToResponse converts an InterviewKit to its API response
func (k *InterviewKit) ToResponse() *InterviewKitResponse {
	resp := &InterviewKitResponse{
		ID:                   k.ID,
		ProofProfileID:       k.ProofProfileID,
		CandidateID:          k.CandidateID,
		JobID:                k.JobID,
		TotalDurationMinutes: k.TotalDurationMinutes,
		Sections:             []InterviewKitSection{},
		DebriefTemplate:      DebriefTemplate{Criteria: []DebriefCriterion{}},
		Notes:                map[string]string{},
		GeneratedAt:          k.GeneratedAt,
		CreatedAt:            k.CreatedAt,
		UpdatedAt:            k.UpdatedAt,
	}

	if len(k.Sections) > 0 {
		var sections []InterviewKitSection
		if err := json.Unmarshal(k.Sections, &sections); err == nil {
			resp.Sections = sections
		}
	}

	if len(k.DebriefTemplate) > 0 {
		var dt DebriefTemplate
		if err := json.Unmarshal(k.DebriefTemplate, &dt); err == nil {
			resp.DebriefTemplate = dt
		}
	}

	if len(k.Notes) > 0 {
		var notes map[string]string
		if err := json.Unmarshal(k.Notes, &notes); err == nil {
			resp.Notes = notes
		}
	}

	return resp
}

// =============================================================================
// HELPERS
// =============================================================================

// SetSections sets the sections from a slice
func (k *InterviewKit) SetSections(sections []InterviewKitSection) error {
	data, err := json.Marshal(sections)
	if err != nil {
		return err
	}
	k.Sections = data
	return nil
}

// SetDebriefTemplate sets the debrief template
func (k *InterviewKit) SetDebriefTemplate(dt DebriefTemplate) error {
	data, err := json.Marshal(dt)
	if err != nil {
		return err
	}
	k.DebriefTemplate = data
	return nil
}

// SetNotes sets the notes
func (k *InterviewKit) SetNotes(notes map[string]string) error {
	data, err := json.Marshal(notes)
	if err != nil {
		return err
	}
	k.Notes = data
	return nil
}

// GetNotes returns the parsed notes
func (k *InterviewKit) GetNotes() map[string]string {
	notes := map[string]string{}
	if len(k.Notes) > 0 {
		if err := json.Unmarshal(k.Notes, &notes); err != nil {
			return map[string]string{}
		}
	}
	return notes
}
