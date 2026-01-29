package models

import (
	"encoding/json"
	"time"
)

// ProofProfile represents the formatted profile generated from an evaluation
type ProofProfile struct {
	ID           string `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	EvaluationID string `gorm:"type:uuid;not null;uniqueIndex" json:"evaluation_id"`
	AttemptID    string `gorm:"type:uuid;not null" json:"attempt_id"`
	JobID        string `gorm:"type:uuid;not null" json:"job_id"`
	CandidateID  string `gorm:"type:uuid;not null" json:"candidate_id"`

	// Relationships
	Evaluation *Evaluation        `gorm:"foreignKey:EvaluationID" json:"evaluation,omitempty"`
	Attempt    *WorkSampleAttempt `gorm:"foreignKey:AttemptID" json:"attempt,omitempty"`
	Job        *Job               `gorm:"foreignKey:JobID" json:"job,omitempty"`
	Candidate  *User              `gorm:"foreignKey:CandidateID" json:"candidate,omitempty"`

	// Summary
	GlobalScore    int                      `json:"global_score"`
	ScoreLabel     string                   `json:"score_label"`      // excellent, bon, acceptable, etc.
	Percentile     int                      `json:"percentile"`       // 0-100
	Recommendation EvaluationRecommendation `json:"recommendation"`
	OneLiner       string                   `json:"one_liner"`        // Short summary

	// Criteria summary stored as JSONB
	CriteriaSummary json.RawMessage `gorm:"type:jsonb;default:'[]'" json:"criteria_summary"`

	// Strengths with evidence
	Strengths json.RawMessage `gorm:"type:jsonb;default:'[]'" json:"strengths"`

	// Areas to explore with suggested questions
	AreasToExplore json.RawMessage `gorm:"type:jsonb;default:'[]'" json:"areas_to_explore"`

	// Red flags
	RedFlags json.RawMessage `gorm:"type:jsonb;default:'[]'" json:"red_flags"`

	// Interview focus points
	InterviewFocusPoints json.RawMessage `gorm:"type:jsonb;default:'[]'" json:"interview_focus_points"`

	// Metadata
	GeneratedAt *time.Time `json:"generated_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

func (ProofProfile) TableName() string {
	return "proof_profiles"
}

// =============================================================================
// NESTED TYPES
// =============================================================================

// CriterionSummary is the summary of a criterion in the proof profile
type CriterionSummary struct {
	Name     string          `json:"name"`
	Score    int             `json:"score"`
	Weight   CriterionWeight `json:"weight"`
	Status   string          `json:"status"`   // strong, good, acceptable, weak
	Headline string          `json:"headline"`  // Short assessment from criterion evaluation
}

// StrengthItem represents a strength with evidence
type StrengthItem struct {
	CriterionName string   `json:"criterion_name"`
	Score         int      `json:"score"`
	Signals       []string `json:"signals"`
	Evidence      string   `json:"evidence"` // Quote or assessment preview
}

// AreaToExplore represents an area that needs further exploration
type AreaToExplore struct {
	CriterionName      string   `json:"criterion_name"`
	Score              int      `json:"score"`
	Concerns           []string `json:"concerns"`
	SuggestedQuestions []string `json:"suggested_questions"`
}

// RedFlagItem represents a red flag detected
type RedFlagItem struct {
	CriterionName string   `json:"criterion_name"`
	Flags         []string `json:"flags"`
}

// InterviewFocusPoint represents a focus point for the interview
type InterviewFocusPoint struct {
	Topic  string `json:"topic"`
	Reason string `json:"reason"`
	Type   string `json:"type"` // "verify_strength", "explore_concern", "investigate_gap"
}

// =============================================================================
// API RESPONSE
// =============================================================================

// ProofProfileResponse is the API response for a proof profile
type ProofProfileResponse struct {
	ID               string                   `json:"id"`
	EvaluationID     string                   `json:"evaluation_id"`
	AttemptID        string                   `json:"attempt_id"`
	JobID            string                   `json:"job_id"`
	CandidateID      string                   `json:"candidate_id"`
	GlobalScore      int                      `json:"global_score"`
	ScoreLabel       string                   `json:"score_label"`
	Percentile       int                      `json:"percentile"`
	Recommendation   EvaluationRecommendation `json:"recommendation"`
	OneLiner         string                   `json:"one_liner"`
	CriteriaSummary  []CriterionSummary       `json:"criteria_summary"`
	Strengths        []StrengthItem           `json:"strengths"`
	AreasToExplore   []AreaToExplore          `json:"areas_to_explore"`
	RedFlags         []RedFlagItem            `json:"red_flags"`
	InterviewFocusPoints []InterviewFocusPoint `json:"interview_focus_points"`
	GeneratedAt      *time.Time               `json:"generated_at,omitempty"`
	CreatedAt        time.Time                `json:"created_at"`
	UpdatedAt        time.Time                `json:"updated_at"`
}

// ToResponse converts a ProofProfile to its API response
func (p *ProofProfile) ToResponse() *ProofProfileResponse {
	resp := &ProofProfileResponse{
		ID:               p.ID,
		EvaluationID:     p.EvaluationID,
		AttemptID:        p.AttemptID,
		JobID:            p.JobID,
		CandidateID:      p.CandidateID,
		GlobalScore:      p.GlobalScore,
		ScoreLabel:       p.ScoreLabel,
		Percentile:       p.Percentile,
		Recommendation:   p.Recommendation,
		OneLiner:         p.OneLiner,
		CriteriaSummary:  []CriterionSummary{},
		Strengths:        []StrengthItem{},
		AreasToExplore:   []AreaToExplore{},
		RedFlags:         []RedFlagItem{},
		InterviewFocusPoints: []InterviewFocusPoint{},
		GeneratedAt:      p.GeneratedAt,
		CreatedAt:        p.CreatedAt,
		UpdatedAt:        p.UpdatedAt,
	}

	if len(p.CriteriaSummary) > 0 {
		var cs []CriterionSummary
		if err := json.Unmarshal(p.CriteriaSummary, &cs); err == nil {
			resp.CriteriaSummary = cs
		}
	}

	if len(p.Strengths) > 0 {
		var s []StrengthItem
		if err := json.Unmarshal(p.Strengths, &s); err == nil {
			resp.Strengths = s
		}
	}

	if len(p.AreasToExplore) > 0 {
		var a []AreaToExplore
		if err := json.Unmarshal(p.AreasToExplore, &a); err == nil {
			resp.AreasToExplore = a
		}
	}

	if len(p.RedFlags) > 0 {
		var rf []RedFlagItem
		if err := json.Unmarshal(p.RedFlags, &rf); err == nil {
			resp.RedFlags = rf
		}
	}

	if len(p.InterviewFocusPoints) > 0 {
		var ifp []InterviewFocusPoint
		if err := json.Unmarshal(p.InterviewFocusPoints, &ifp); err == nil {
			resp.InterviewFocusPoints = ifp
		}
	}

	return resp
}

// =============================================================================
// HELPERS
// =============================================================================

// GetCriteriaSummary parses and returns the criteria summary
func (p *ProofProfile) GetCriteriaSummary() []CriterionSummary {
	var cs []CriterionSummary
	if len(p.CriteriaSummary) > 0 {
		json.Unmarshal(p.CriteriaSummary, &cs)
	}
	return cs
}

// SetCriteriaSummary sets the criteria summary from a slice
func (p *ProofProfile) SetCriteriaSummary(cs []CriterionSummary) error {
	data, err := json.Marshal(cs)
	if err != nil {
		return err
	}
	p.CriteriaSummary = data
	return nil
}

// GetStrengths parses and returns the strengths
func (p *ProofProfile) GetStrengths() []StrengthItem {
	var s []StrengthItem
	if len(p.Strengths) > 0 {
		json.Unmarshal(p.Strengths, &s)
	}
	return s
}

// SetStrengths sets the strengths from a slice
func (p *ProofProfile) SetStrengths(s []StrengthItem) error {
	data, err := json.Marshal(s)
	if err != nil {
		return err
	}
	p.Strengths = data
	return nil
}

// SetAreasToExplore sets the areas to explore from a slice
func (p *ProofProfile) SetAreasToExplore(a []AreaToExplore) error {
	data, err := json.Marshal(a)
	if err != nil {
		return err
	}
	p.AreasToExplore = data
	return nil
}

// SetRedFlags sets the red flags from a slice
func (p *ProofProfile) SetRedFlags(rf []RedFlagItem) error {
	data, err := json.Marshal(rf)
	if err != nil {
		return err
	}
	p.RedFlags = data
	return nil
}

// SetInterviewFocusPoints sets the interview focus points from a slice
func (p *ProofProfile) SetInterviewFocusPoints(ifp []InterviewFocusPoint) error {
	data, err := json.Marshal(ifp)
	if err != nil {
		return err
	}
	p.InterviewFocusPoints = data
	return nil
}

// CalculatePercentile calculates the percentile of this evaluation's score
// compared to other evaluations for the same job. If not enough candidates
// (< 3), it uses a benchmark-based approximation.
func CalculatePercentile(score int, otherScores []int) int {
	if len(otherScores) < 3 {
		// Benchmark-based approximation
		return benchmarkPercentile(score)
	}

	// Count how many scores are below this score
	below := 0
	for _, s := range otherScores {
		if s < score {
			below++
		}
	}

	return (below * 100) / len(otherScores)
}

// benchmarkPercentile returns an approximate percentile based on score ranges
func benchmarkPercentile(score int) int {
	switch {
	case score >= 90:
		return 95
	case score >= 85:
		return 90
	case score >= 80:
		return 80
	case score >= 75:
		return 70
	case score >= 70:
		return 60
	case score >= 65:
		return 50
	case score >= 60:
		return 40
	case score >= 55:
		return 30
	case score >= 50:
		return 20
	default:
		return 10
	}
}

// GenerateOneLiner generates a short summary based on score and recommendation
func GenerateOneLiner(score int, recommendation EvaluationRecommendation, jobTitle string) string {
	switch {
	case score >= 85 && recommendation == RecommendationProceed:
		return "Profil solide avec de fortes compétences techniques pour le poste de " + jobTitle
	case score >= 70 && recommendation == RecommendationProceed:
		return "Bon profil avec des bases solides pour le poste de " + jobTitle
	case recommendation == RecommendationMaybe:
		return "Profil prometteur avec des points à approfondir pour le poste de " + jobTitle
	case recommendation == RecommendationReject:
		return "Profil en dessous des attentes pour le poste de " + jobTitle
	default:
		return "Profil évalué pour le poste de " + jobTitle
	}
}
