package models

import (
	"encoding/json"
	"time"
)

// DecisionType represents the recruiter's hiring decision
type DecisionType string

const (
	DecisionPending      DecisionType = "pending"
	DecisionHire         DecisionType = "hire"
	DecisionNoHire       DecisionType = "no_hire"
	DecisionNeedMoreInfo DecisionType = "need_more_info"
)

// DecisionMemoStatus represents the memo's completion status
type DecisionMemoStatus string

const (
	DecisionMemoDraft     DecisionMemoStatus = "draft"
	DecisionMemoSubmitted DecisionMemoStatus = "submitted"
)

// DecisionMemo represents a recruiter's post-interview decision document
type DecisionMemo struct {
	ID          string `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	JobID       string `gorm:"type:uuid;not null" json:"job_id"`
	CandidateID string `gorm:"type:uuid;not null" json:"candidate_id"`
	RecruiterID string `gorm:"type:uuid;not null" json:"recruiter_id"`

	// Relationships
	Job       *Job  `gorm:"foreignKey:JobID" json:"job,omitempty"`
	Candidate *User `gorm:"foreignKey:CandidateID" json:"candidate,omitempty"`
	Recruiter *User `gorm:"foreignKey:RecruiterID" json:"recruiter,omitempty"`

	// Section 1: Decision
	Decision DecisionType `gorm:"type:text;not null;default:'pending'" json:"decision"`

	// Section 2: Post-interview evaluation (JSONB)
	PostInterviewEvaluations json.RawMessage `gorm:"type:jsonb;default:'[]'" json:"post_interview_evaluations"`

	// Section 3: Confirmed strengths (JSONB array of strings)
	ConfirmedStrengths json.RawMessage `gorm:"type:jsonb;default:'[]'" json:"confirmed_strengths"`

	// Section 4: Identified risks (JSONB)
	IdentifiedRisks json.RawMessage `gorm:"type:jsonb;default:'[]'" json:"identified_risks"`

	// Section 6: Justification
	Justification string `gorm:"type:text;not null;default:''" json:"justification"`

	// Section 7: Next steps (JSONB)
	NextSteps json.RawMessage `gorm:"type:jsonb;default:'{}'" json:"next_steps"`

	// Status
	Status      DecisionMemoStatus `gorm:"type:text;not null;default:'draft'" json:"status"`
	SubmittedAt *time.Time         `json:"submitted_at,omitempty"`
	CreatedAt   time.Time          `json:"created_at"`
	UpdatedAt   time.Time          `json:"updated_at"`
}

func (DecisionMemo) TableName() string {
	return "decision_memos"
}

// =============================================================================
// NESTED TYPES
// =============================================================================

// PostInterviewEvaluation is one criterion re-evaluated post-interview
type PostInterviewEvaluation struct {
	CriterionName      string `json:"criterion_name"`
	PreInterviewScore  int    `json:"pre_interview_score"`
	PostInterviewScore int    `json:"post_interview_score"`
	Notes              string `json:"notes"`
}

// IdentifiedRisk is a risk with its mitigation strategy
type IdentifiedRisk struct {
	Risk       string `json:"risk"`
	Mitigation string `json:"mitigation"`
}

// =============================================================================
// API RESPONSE
// =============================================================================

// DecisionMemoResponse is the API response for a decision memo
type DecisionMemoResponse struct {
	ID                       string                    `json:"id"`
	JobID                    string                    `json:"job_id"`
	CandidateID              string                    `json:"candidate_id"`
	RecruiterID              string                    `json:"recruiter_id"`
	Decision                 DecisionType              `json:"decision"`
	PostInterviewEvaluations []PostInterviewEvaluation `json:"post_interview_evaluations"`
	ConfirmedStrengths       []string                  `json:"confirmed_strengths"`
	IdentifiedRisks          []IdentifiedRisk          `json:"identified_risks"`
	Justification            string                    `json:"justification"`
	NextSteps                map[string]string         `json:"next_steps"`
	Status                   DecisionMemoStatus        `json:"status"`
	SubmittedAt              *time.Time                `json:"submitted_at,omitempty"`
	CreatedAt                time.Time                 `json:"created_at"`
	UpdatedAt                time.Time                 `json:"updated_at"`
}

// ToResponse converts a DecisionMemo to its API response
func (m *DecisionMemo) ToResponse() *DecisionMemoResponse {
	resp := &DecisionMemoResponse{
		ID:                       m.ID,
		JobID:                    m.JobID,
		CandidateID:              m.CandidateID,
		RecruiterID:              m.RecruiterID,
		Decision:                 m.Decision,
		PostInterviewEvaluations: []PostInterviewEvaluation{},
		ConfirmedStrengths:       []string{},
		IdentifiedRisks:          []IdentifiedRisk{},
		Justification:            m.Justification,
		NextSteps:                map[string]string{},
		Status:                   m.Status,
		SubmittedAt:              m.SubmittedAt,
		CreatedAt:                m.CreatedAt,
		UpdatedAt:                m.UpdatedAt,
	}

	if len(m.PostInterviewEvaluations) > 0 {
		var evals []PostInterviewEvaluation
		if err := json.Unmarshal(m.PostInterviewEvaluations, &evals); err == nil {
			resp.PostInterviewEvaluations = evals
		}
	}

	if len(m.ConfirmedStrengths) > 0 {
		var strengths []string
		if err := json.Unmarshal(m.ConfirmedStrengths, &strengths); err == nil {
			resp.ConfirmedStrengths = strengths
		}
	}

	if len(m.IdentifiedRisks) > 0 {
		var risks []IdentifiedRisk
		if err := json.Unmarshal(m.IdentifiedRisks, &risks); err == nil {
			resp.IdentifiedRisks = risks
		}
	}

	if len(m.NextSteps) > 0 {
		var ns map[string]string
		if err := json.Unmarshal(m.NextSteps, &ns); err == nil {
			resp.NextSteps = ns
		}
	}

	return resp
}

// =============================================================================
// HELPERS
// =============================================================================

// SetPostInterviewEvaluations sets the evaluations from a slice
func (m *DecisionMemo) SetPostInterviewEvaluations(evals []PostInterviewEvaluation) error {
	data, err := json.Marshal(evals)
	if err != nil {
		return err
	}
	m.PostInterviewEvaluations = data
	return nil
}

// GetPostInterviewEvaluations returns the parsed evaluations
func (m *DecisionMemo) GetPostInterviewEvaluations() []PostInterviewEvaluation {
	var evals []PostInterviewEvaluation
	if len(m.PostInterviewEvaluations) > 0 {
		json.Unmarshal(m.PostInterviewEvaluations, &evals)
	}
	if evals == nil {
		return []PostInterviewEvaluation{}
	}
	return evals
}

// SetConfirmedStrengths sets the confirmed strengths
func (m *DecisionMemo) SetConfirmedStrengths(strengths []string) error {
	data, err := json.Marshal(strengths)
	if err != nil {
		return err
	}
	m.ConfirmedStrengths = data
	return nil
}

// GetConfirmedStrengths returns the parsed strengths
func (m *DecisionMemo) GetConfirmedStrengths() []string {
	var strengths []string
	if len(m.ConfirmedStrengths) > 0 {
		json.Unmarshal(m.ConfirmedStrengths, &strengths)
	}
	if strengths == nil {
		return []string{}
	}
	return strengths
}

// SetIdentifiedRisks sets the identified risks
func (m *DecisionMemo) SetIdentifiedRisks(risks []IdentifiedRisk) error {
	data, err := json.Marshal(risks)
	if err != nil {
		return err
	}
	m.IdentifiedRisks = data
	return nil
}

// GetIdentifiedRisks returns the parsed risks
func (m *DecisionMemo) GetIdentifiedRisks() []IdentifiedRisk {
	var risks []IdentifiedRisk
	if len(m.IdentifiedRisks) > 0 {
		json.Unmarshal(m.IdentifiedRisks, &risks)
	}
	if risks == nil {
		return []IdentifiedRisk{}
	}
	return risks
}

// SetNextSteps sets the next steps
func (m *DecisionMemo) SetNextSteps(ns map[string]string) error {
	data, err := json.Marshal(ns)
	if err != nil {
		return err
	}
	m.NextSteps = data
	return nil
}

// GetNextSteps returns the parsed next steps
func (m *DecisionMemo) GetNextSteps() map[string]string {
	ns := map[string]string{}
	if len(m.NextSteps) > 0 {
		json.Unmarshal(m.NextSteps, &ns)
	}
	return ns
}
