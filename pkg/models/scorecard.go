package models

import (
	"encoding/json"
	"time"
)

// CriterionWeight represents the importance of a criterion
type CriterionWeight string

const (
	WeightCritical   CriterionWeight = "critical"
	WeightImportant  CriterionWeight = "important"
	WeightNiceToHave CriterionWeight = "nice_to_have"
)

// ScorecardCriterion represents a single evaluation criterion
type ScorecardCriterion struct {
	Name            string          `json:"name"`
	Description     string          `json:"description"`
	Weight          CriterionWeight `json:"weight"`
	PositiveSignals []string        `json:"positive_signals"` // 2-4 observable positive indicators
	NegativeSignals []string        `json:"negative_signals"` // 2-3 observable negative indicators
	RedFlags        []string        `json:"red_flags"`        // 1-2 deal-breakers
}

// Scorecard represents evaluation criteria generated for a job
type Scorecard struct {
	ID            string          `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	JobID         string          `gorm:"type:uuid;not null;uniqueIndex" json:"job_id"`
	Job           *Job            `gorm:"foreignKey:JobID" json:"job,omitempty"`
	Criteria      json.RawMessage `gorm:"type:jsonb;default:'[]'" json:"criteria"`
	GeneratedAt   *time.Time      `json:"generated_at,omitempty"`
	PromptVersion string          `json:"prompt_version,omitempty"`
	CreatedAt     time.Time       `json:"created_at"`
	UpdatedAt     time.Time       `json:"updated_at"`
}

func (Scorecard) TableName() string {
	return "scorecards"
}

// ScorecardResponse is the API response for a scorecard
type ScorecardResponse struct {
	ID            string               `json:"id"`
	JobID         string               `json:"job_id"`
	Criteria      []ScorecardCriterion `json:"criteria"`
	GeneratedAt   *time.Time           `json:"generated_at,omitempty"`
	PromptVersion string               `json:"prompt_version,omitempty"`
	CreatedAt     time.Time            `json:"created_at"`
	UpdatedAt     time.Time            `json:"updated_at"`
}

// ToResponse converts a Scorecard to its API response
func (s *Scorecard) ToResponse() *ScorecardResponse {
	resp := &ScorecardResponse{
		ID:            s.ID,
		JobID:         s.JobID,
		Criteria:      []ScorecardCriterion{},
		GeneratedAt:   s.GeneratedAt,
		PromptVersion: s.PromptVersion,
		CreatedAt:     s.CreatedAt,
		UpdatedAt:     s.UpdatedAt,
	}

	// Parse criteria from JSON
	if len(s.Criteria) > 0 {
		var criteria []ScorecardCriterion
		if err := json.Unmarshal(s.Criteria, &criteria); err == nil {
			resp.Criteria = criteria
		}
	}

	return resp
}

// GetCriteria parses and returns the criteria
func (s *Scorecard) GetCriteria() []ScorecardCriterion {
	var criteria []ScorecardCriterion
	if len(s.Criteria) > 0 {
		if err := json.Unmarshal(s.Criteria, &criteria); err != nil {
			return []ScorecardCriterion{}
		}
	}
	return criteria
}

// SetCriteria sets the criteria from a slice
func (s *Scorecard) SetCriteria(criteria []ScorecardCriterion) error {
	data, err := json.Marshal(criteria)
	if err != nil {
		return err
	}
	s.Criteria = data
	return nil
}
