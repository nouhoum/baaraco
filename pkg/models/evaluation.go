package models

import (
	"encoding/json"
	"time"
)

// EvaluationRecommendation represents the final recommendation
type EvaluationRecommendation string

const (
	RecommendationProceed EvaluationRecommendation = "proceed_to_interview"
	RecommendationMaybe   EvaluationRecommendation = "maybe"
	RecommendationReject  EvaluationRecommendation = "reject"
)

// ConfidenceLevel represents how confident the AI is in its evaluation
type ConfidenceLevel string

const (
	ConfidenceHigh   ConfidenceLevel = "high"
	ConfidenceMedium ConfidenceLevel = "medium"
	ConfidenceLow    ConfidenceLevel = "low"
)

// CriterionEvaluation represents the evaluation of a single criterion
type CriterionEvaluation struct {
	CriterionName    string          `json:"criterion_name"`
	CriterionWeight  CriterionWeight `json:"criterion_weight"`
	Score            int             `json:"score"`             // 0-100
	Confidence       ConfidenceLevel `json:"confidence"`        // high|medium|low
	PositiveSignals  []string        `json:"positive_signals"`  // Detected positive signals
	NegativeSignals  []string        `json:"negative_signals"`  // Detected negative signals
	RedFlags         []string        `json:"red_flags"`         // Detected red flags
	Quotes           []string        `json:"quotes"`            // Relevant quotes from answers
	Assessment       string          `json:"assessment"`        // Justification for the score
	CriterionCovered bool            `json:"criterion_covered"` // Was this criterion covered by answers?
}

// Evaluation represents the AI-generated evaluation of a work sample attempt
type Evaluation struct {
	ID          string `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	AttemptID   string `gorm:"type:uuid;not null;uniqueIndex" json:"attempt_id"`
	JobID       string `gorm:"type:uuid;not null" json:"job_id"`
	CandidateID string `gorm:"type:uuid;not null" json:"candidate_id"`

	// Relationships
	Attempt   *WorkSampleAttempt `gorm:"foreignKey:AttemptID" json:"attempt,omitempty"`
	Job       *Job               `gorm:"foreignKey:JobID" json:"job,omitempty"`
	Candidate *User              `gorm:"foreignKey:CandidateID" json:"candidate,omitempty"`

	// Scores
	GlobalScore         int             `json:"global_score"` // 0-100, weighted average
	CriteriaEvaluations json.RawMessage `gorm:"type:jsonb;default:'[]'" json:"criteria_evaluations"`

	// Recommendation
	Recommendation       EvaluationRecommendation `json:"recommendation"`
	RecommendationReason string                   `json:"recommendation_reason"`

	// Zones d'ombre (uncovered criteria)
	UncoveredCriteria json.RawMessage `gorm:"type:jsonb;default:'[]'" json:"uncovered_criteria"`

	// Metadata
	PromptVersion string     `json:"prompt_version,omitempty"`
	GeneratedAt   *time.Time `json:"generated_at,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}

func (Evaluation) TableName() string {
	return "evaluations"
}

// EvaluationResponse is the API response for an evaluation
type EvaluationResponse struct {
	ID                   string                   `json:"id"`
	AttemptID            string                   `json:"attempt_id"`
	JobID                string                   `json:"job_id"`
	CandidateID          string                   `json:"candidate_id"`
	GlobalScore          int                      `json:"global_score"`
	CriteriaEvaluations  []CriterionEvaluation    `json:"criteria_evaluations"`
	Recommendation       EvaluationRecommendation `json:"recommendation"`
	RecommendationReason string                   `json:"recommendation_reason"`
	UncoveredCriteria    []string                 `json:"uncovered_criteria"`
	PromptVersion        string                   `json:"prompt_version,omitempty"`
	GeneratedAt          *time.Time               `json:"generated_at,omitempty"`
	CreatedAt            time.Time                `json:"created_at"`
	UpdatedAt            time.Time                `json:"updated_at"`
}

// ToResponse converts an Evaluation to its API response
func (e *Evaluation) ToResponse() *EvaluationResponse {
	resp := &EvaluationResponse{
		ID:                   e.ID,
		AttemptID:            e.AttemptID,
		JobID:                e.JobID,
		CandidateID:          e.CandidateID,
		GlobalScore:          e.GlobalScore,
		CriteriaEvaluations:  []CriterionEvaluation{},
		Recommendation:       e.Recommendation,
		RecommendationReason: e.RecommendationReason,
		UncoveredCriteria:    []string{},
		PromptVersion:        e.PromptVersion,
		GeneratedAt:          e.GeneratedAt,
		CreatedAt:            e.CreatedAt,
		UpdatedAt:            e.UpdatedAt,
	}

	// Parse criteria evaluations from JSON
	if len(e.CriteriaEvaluations) > 0 {
		var evals []CriterionEvaluation
		if err := json.Unmarshal(e.CriteriaEvaluations, &evals); err == nil {
			resp.CriteriaEvaluations = evals
		}
	}

	// Parse uncovered criteria from JSON
	if len(e.UncoveredCriteria) > 0 {
		var uncovered []string
		if err := json.Unmarshal(e.UncoveredCriteria, &uncovered); err == nil {
			resp.UncoveredCriteria = uncovered
		}
	}

	return resp
}

// GetCriteriaEvaluations parses and returns the criteria evaluations
func (e *Evaluation) GetCriteriaEvaluations() []CriterionEvaluation {
	var evals []CriterionEvaluation
	if len(e.CriteriaEvaluations) > 0 {
		if err := json.Unmarshal(e.CriteriaEvaluations, &evals); err != nil {
			return []CriterionEvaluation{}
		}
	}
	return evals
}

// SetCriteriaEvaluations sets the criteria evaluations from a slice
func (e *Evaluation) SetCriteriaEvaluations(evals []CriterionEvaluation) error {
	data, err := json.Marshal(evals)
	if err != nil {
		return err
	}
	e.CriteriaEvaluations = data
	return nil
}

// GetUncoveredCriteria parses and returns the uncovered criteria
func (e *Evaluation) GetUncoveredCriteria() []string {
	var uncovered []string
	if len(e.UncoveredCriteria) > 0 {
		if err := json.Unmarshal(e.UncoveredCriteria, &uncovered); err != nil {
			return []string{}
		}
	}
	return uncovered
}

// SetUncoveredCriteria sets the uncovered criteria
func (e *Evaluation) SetUncoveredCriteria(uncovered []string) error {
	data, err := json.Marshal(uncovered)
	if err != nil {
		return err
	}
	e.UncoveredCriteria = data
	return nil
}

// GetScoreLabel returns a human-readable label for the score
func GetScoreLabel(score int) string {
	switch {
	case score >= 86:
		return "excellent"
	case score >= 76:
		return "bon"
	case score >= 61:
		return "acceptable"
	case score >= 41:
		return "en_dessous_attentes"
	default:
		return "insuffisant"
	}
}

// GetCriterionStatus returns the status based on score
func GetCriterionStatus(score int) string {
	switch {
	case score >= 85:
		return "strong"
	case score >= 70:
		return "good"
	case score >= 55:
		return "acceptable"
	default:
		return "weak"
	}
}

// Weight multipliers for global score calculation
const (
	WeightCriticalMultiplier   = 3
	WeightImportantMultiplier  = 2
	WeightNiceToHaveMultiplier = 1
)

// CalculateGlobalScore calculates the weighted average score
func CalculateGlobalScore(evals []CriterionEvaluation) int {
	if len(evals) == 0 {
		return 0
	}

	var totalWeight, weightedSum int

	for _, eval := range evals {
		var multiplier int
		switch eval.CriterionWeight {
		case WeightCritical:
			multiplier = WeightCriticalMultiplier
		case WeightImportant:
			multiplier = WeightImportantMultiplier
		case WeightNiceToHave:
			multiplier = WeightNiceToHaveMultiplier
		default:
			multiplier = WeightImportantMultiplier // Default to important
		}

		totalWeight += multiplier
		weightedSum += eval.Score * multiplier
	}

	if totalWeight == 0 {
		return 0
	}

	return weightedSum / totalWeight
}
