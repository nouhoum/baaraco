package models

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestEvaluation_TableName(t *testing.T) {
	evaluation := Evaluation{}
	assert.Equal(t, "evaluations", evaluation.TableName())
}

func TestEvaluation_ToResponse(t *testing.T) {
	now := time.Now()
	criteriaEvals := []CriterionEvaluation{
		{
			CriterionName:    "Technical Skills",
			CriterionWeight:  WeightCritical,
			Score:            85,
			Confidence:       ConfidenceHigh,
			PositiveSignals:  []string{"Clean code", "Good patterns"},
			NegativeSignals:  []string{},
			RedFlags:         []string{},
			Quotes:           []string{"The candidate demonstrated..."},
			Assessment:       "Strong technical skills demonstrated",
			CriterionCovered: true,
		},
	}
	criteriaJSON, _ := json.Marshal(criteriaEvals)
	uncoveredJSON, _ := json.Marshal([]string{"Leadership"})

	jobID := "job-789"
	evaluation := &Evaluation{
		ID:                   "eval-123",
		AttemptID:            "attempt-456",
		JobID:                &jobID,
		CandidateID:          "user-001",
		GlobalScore:          85,
		CriteriaEvaluations:  criteriaJSON,
		Recommendation:       RecommendationProceed,
		RecommendationReason: "Strong candidate overall",
		UncoveredCriteria:    uncoveredJSON,
		PromptVersion:        "v1.0",
		GeneratedAt:          &now,
		CreatedAt:            now,
		UpdatedAt:            now,
	}

	response := evaluation.ToResponse()

	assert.Equal(t, "eval-123", response.ID)
	assert.Equal(t, "attempt-456", response.AttemptID)
	assert.Equal(t, &jobID, response.JobID)
	assert.Equal(t, "user-001", response.CandidateID)
	assert.Equal(t, 85, response.GlobalScore)
	assert.Len(t, response.CriteriaEvaluations, 1)
	assert.Equal(t, "Technical Skills", response.CriteriaEvaluations[0].CriterionName)
	assert.Equal(t, RecommendationProceed, response.Recommendation)
	assert.Len(t, response.UncoveredCriteria, 1)
	assert.Contains(t, response.UncoveredCriteria, "Leadership")
}

func TestEvaluation_ToResponse_EmptyCriteria(t *testing.T) {
	evaluation := &Evaluation{
		ID:                  "eval-123",
		CriteriaEvaluations: nil,
		UncoveredCriteria:   nil,
	}

	response := evaluation.ToResponse()

	assert.Equal(t, "eval-123", response.ID)
	assert.Empty(t, response.CriteriaEvaluations)
	assert.Empty(t, response.UncoveredCriteria)
}

func TestEvaluation_ToResponse_InvalidJSON(t *testing.T) {
	evaluation := &Evaluation{
		ID:                  "eval-123",
		CriteriaEvaluations: json.RawMessage(`invalid json`),
		UncoveredCriteria:   json.RawMessage(`invalid json`),
	}

	response := evaluation.ToResponse()

	assert.Equal(t, "eval-123", response.ID)
	assert.Empty(t, response.CriteriaEvaluations)
	assert.Empty(t, response.UncoveredCriteria)
}

func TestEvaluation_GetCriteriaEvaluations(t *testing.T) {
	evals := []CriterionEvaluation{
		{CriterionName: "Criterion 1", Score: 80},
		{CriterionName: "Criterion 2", Score: 70},
	}
	evalsJSON, _ := json.Marshal(evals)

	evaluation := &Evaluation{
		CriteriaEvaluations: evalsJSON,
	}

	result := evaluation.GetCriteriaEvaluations()

	assert.Len(t, result, 2)
	assert.Equal(t, "Criterion 1", result[0].CriterionName)
	assert.Equal(t, 80, result[0].Score)
	assert.Equal(t, "Criterion 2", result[1].CriterionName)
}

func TestEvaluation_GetCriteriaEvaluations_Empty(t *testing.T) {
	evaluation := &Evaluation{
		CriteriaEvaluations: nil,
	}

	result := evaluation.GetCriteriaEvaluations()

	assert.Empty(t, result)
}

func TestEvaluation_SetCriteriaEvaluations(t *testing.T) {
	evaluation := &Evaluation{}
	evals := []CriterionEvaluation{
		{
			CriterionName: "Test Criterion",
			Score:         75,
			Confidence:    ConfidenceMedium,
		},
	}

	err := evaluation.SetCriteriaEvaluations(evals)

	require.NoError(t, err)
	assert.NotEmpty(t, evaluation.CriteriaEvaluations)

	// Verify by parsing back
	result := evaluation.GetCriteriaEvaluations()
	assert.Len(t, result, 1)
	assert.Equal(t, "Test Criterion", result[0].CriterionName)
	assert.Equal(t, 75, result[0].Score)
}

func TestEvaluation_GetUncoveredCriteria(t *testing.T) {
	uncovered := []string{"Leadership", "Communication"}
	uncoveredJSON, _ := json.Marshal(uncovered)

	evaluation := &Evaluation{
		UncoveredCriteria: uncoveredJSON,
	}

	result := evaluation.GetUncoveredCriteria()

	assert.Len(t, result, 2)
	assert.Contains(t, result, "Leadership")
	assert.Contains(t, result, "Communication")
}

func TestEvaluation_SetUncoveredCriteria(t *testing.T) {
	evaluation := &Evaluation{}
	uncovered := []string{"Leadership"}

	err := evaluation.SetUncoveredCriteria(uncovered)

	require.NoError(t, err)
	assert.NotEmpty(t, evaluation.UncoveredCriteria)

	result := evaluation.GetUncoveredCriteria()
	assert.Len(t, result, 1)
	assert.Equal(t, "Leadership", result[0])
}

func TestCalculateGlobalScore(t *testing.T) {
	tests := []struct {
		name     string
		evals    []CriterionEvaluation
		expected int
	}{
		{
			name:     "Empty evaluations",
			evals:    []CriterionEvaluation{},
			expected: 0,
		},
		{
			name: "Single critical criterion",
			evals: []CriterionEvaluation{
				{CriterionWeight: WeightCritical, Score: 90},
			},
			expected: 90,
		},
		{
			name: "Single important criterion",
			evals: []CriterionEvaluation{
				{CriterionWeight: WeightImportant, Score: 80},
			},
			expected: 80,
		},
		{
			name: "Mixed weights - critical and important",
			evals: []CriterionEvaluation{
				{CriterionWeight: WeightCritical, Score: 90},  // 3 * 90 = 270
				{CriterionWeight: WeightImportant, Score: 60}, // 2 * 60 = 120
			},
			// Total weight: 3 + 2 = 5
			// Weighted sum: 270 + 120 = 390
			// Global score: 390 / 5 = 78
			expected: 78,
		},
		{
			name: "All weights",
			evals: []CriterionEvaluation{
				{CriterionWeight: WeightCritical, Score: 100},  // 3 * 100 = 300
				{CriterionWeight: WeightImportant, Score: 80},  // 2 * 80 = 160
				{CriterionWeight: WeightNiceToHave, Score: 60}, // 1 * 60 = 60
			},
			// Total weight: 3 + 2 + 1 = 6
			// Weighted sum: 300 + 160 + 60 = 520
			// Global score: 520 / 6 = 86
			expected: 86,
		},
		{
			name: "Default weight (important)",
			evals: []CriterionEvaluation{
				{CriterionWeight: "", Score: 70}, // Defaults to important (weight 2)
			},
			expected: 70,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := CalculateGlobalScore(tt.evals)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestGetScoreLabel(t *testing.T) {
	tests := []struct {
		score    int
		expected string
	}{
		{100, "excellent"},
		{90, "excellent"},
		{86, "excellent"},
		{85, "bon"},
		{76, "bon"},
		{75, "acceptable"},
		{61, "acceptable"},
		{60, "en_dessous_attentes"},
		{41, "en_dessous_attentes"},
		{40, "insuffisant"},
		{0, "insuffisant"},
	}

	for _, tt := range tests {
		t.Run(tt.expected, func(t *testing.T) {
			result := GetScoreLabel(tt.score)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestGetCriterionStatus(t *testing.T) {
	tests := []struct {
		score    int
		expected string
	}{
		{100, "strong"},
		{85, "strong"},
		{84, "good"},
		{70, "good"},
		{69, "acceptable"},
		{55, "acceptable"},
		{54, "weak"},
		{0, "weak"},
	}

	for _, tt := range tests {
		t.Run(tt.expected, func(t *testing.T) {
			result := GetCriterionStatus(tt.score)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestEvaluationRecommendation_Values(t *testing.T) {
	assert.Equal(t, EvaluationRecommendation("proceed_to_interview"), RecommendationProceed)
	assert.Equal(t, EvaluationRecommendation("maybe"), RecommendationMaybe)
	assert.Equal(t, EvaluationRecommendation("reject"), RecommendationReject)
}

func TestConfidenceLevel_Values(t *testing.T) {
	assert.Equal(t, ConfidenceLevel("high"), ConfidenceHigh)
	assert.Equal(t, ConfidenceLevel("medium"), ConfidenceMedium)
	assert.Equal(t, ConfidenceLevel("low"), ConfidenceLow)
}

func TestCriterionEvaluation_JSON(t *testing.T) {
	eval := CriterionEvaluation{
		CriterionName:    "Technical Skills",
		CriterionWeight:  WeightCritical,
		Score:            85,
		Confidence:       ConfidenceHigh,
		PositiveSignals:  []string{"Clean code", "Good architecture"},
		NegativeSignals:  []string{"Missing tests"},
		RedFlags:         []string{},
		Quotes:           []string{"The candidate showed..."},
		Assessment:       "Strong technical background",
		CriterionCovered: true,
	}

	// Marshal
	data, err := json.Marshal(eval)
	require.NoError(t, err)

	// Unmarshal
	var result CriterionEvaluation
	err = json.Unmarshal(data, &result)
	require.NoError(t, err)

	assert.Equal(t, eval.CriterionName, result.CriterionName)
	assert.Equal(t, eval.CriterionWeight, result.CriterionWeight)
	assert.Equal(t, eval.Score, result.Score)
	assert.Equal(t, eval.Confidence, result.Confidence)
	assert.ElementsMatch(t, eval.PositiveSignals, result.PositiveSignals)
	assert.ElementsMatch(t, eval.NegativeSignals, result.NegativeSignals)
	assert.Equal(t, eval.Assessment, result.Assessment)
	assert.Equal(t, eval.CriterionCovered, result.CriterionCovered)
}

func TestWeightMultipliers(t *testing.T) {
	assert.Equal(t, 3, WeightCriticalMultiplier)
	assert.Equal(t, 2, WeightImportantMultiplier)
	assert.Equal(t, 1, WeightNiceToHaveMultiplier)
}
