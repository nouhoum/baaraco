package ai

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/baaraco/baara/pkg/models"
)

func TestBuildEvaluationUserPrompt(t *testing.T) {
	input := EvaluationInput{
		JobTitle:     "Senior Backend Engineer",
		JobSeniority: "senior",
		Criteria: []models.ScorecardCriterion{
			{
				Name:            "Technical Skills",
				Description:     "Ability to write clean code",
				Weight:          models.WeightCritical,
				PositiveSignals: []string{"Clean code", "Good patterns"},
				NegativeSignals: []string{"Messy code"},
				RedFlags:        []string{"Cannot explain code"},
			},
			{
				Name:            "Problem Solving",
				Description:     "Ability to solve complex problems",
				Weight:          models.WeightImportant,
				PositiveSignals: []string{"Structured approach"},
				NegativeSignals: []string{"Jumps to conclusions"},
				RedFlags:        []string{},
			},
		},
		Sections: []models.WorkSampleSection{
			{
				Title:             "Coding Challenge",
				Description:       "Implement a REST API",
				Instructions:      "Build a simple API endpoint",
				Rubric:            "Code quality, error handling, tests",
				CriteriaEvaluated: []string{"Technical Skills"},
			},
		},
		Answers: map[string]string{
			"0": "Here is my implementation...",
		},
		CandidateName: "John Doe",
	}

	prompt := buildEvaluationUserPrompt(input)

	assert.NotEmpty(t, prompt)

	// Check for presence of key sections
	assert.Contains(t, prompt, "# Contexte de l'évaluation")
	assert.Contains(t, prompt, "Senior Backend Engineer")
	assert.Contains(t, prompt, "senior")
	assert.Contains(t, prompt, "John Doe")

	// Check scorecard criteria
	assert.Contains(t, prompt, "# Scorecard")
	assert.Contains(t, prompt, "Technical Skills")
	assert.Contains(t, prompt, "critical")
	assert.Contains(t, prompt, "Clean code")
	assert.Contains(t, prompt, "Cannot explain code")

	// Check work sample sections
	assert.Contains(t, prompt, "# Work Sample")
	assert.Contains(t, prompt, "Coding Challenge")
	assert.Contains(t, prompt, "Build a simple API endpoint")

	// Check answers
	assert.Contains(t, prompt, "# Réponses du candidat")
	assert.Contains(t, prompt, "Here is my implementation")
}

func TestBuildEvaluationUserPrompt_MinimalInput(t *testing.T) {
	input := EvaluationInput{
		JobTitle: "Developer",
		Criteria: []models.ScorecardCriterion{
			{Name: "Skills", Description: "Basic skills", Weight: models.WeightImportant},
		},
		Sections: []models.WorkSampleSection{},
		Answers:  map[string]string{},
	}

	prompt := buildEvaluationUserPrompt(input)

	assert.NotEmpty(t, prompt)
	assert.Contains(t, prompt, "Developer")
	assert.Contains(t, prompt, "Skills")
}

func TestParseEvaluationResponse_ValidJSON(t *testing.T) {
	response := `{
		"criteria_evaluations": [
			{
				"criterion_name": "Technical Skills",
				"criterion_weight": "critical",
				"score": 85,
				"confidence": "high",
				"positive_signals": ["Clean code", "Good patterns"],
				"negative_signals": [],
				"red_flags": [],
				"quotes": ["The candidate demonstrated excellent coding skills"],
				"assessment": "Strong technical background",
				"criterion_covered": true
			},
			{
				"criterion_name": "Problem Solving",
				"criterion_weight": "important",
				"score": 70,
				"confidence": "medium",
				"positive_signals": ["Structured approach"],
				"negative_signals": ["Could improve on edge cases"],
				"red_flags": [],
				"quotes": [],
				"assessment": "Good problem solving skills",
				"criterion_covered": true
			}
		],
		"uncovered_criteria": ["Leadership"],
		"recommendation": "proceed_to_interview",
		"recommendation_reason": "Strong candidate with good technical skills"
	}`

	output, err := parseEvaluationResponse(response)

	require.NoError(t, err)
	assert.Len(t, output.CriteriaEvaluations, 2)

	// Check first criterion evaluation
	assert.Equal(t, "Technical Skills", output.CriteriaEvaluations[0].CriterionName)
	assert.Equal(t, models.WeightCritical, output.CriteriaEvaluations[0].CriterionWeight)
	assert.Equal(t, 85, output.CriteriaEvaluations[0].Score)
	assert.Equal(t, models.ConfidenceHigh, output.CriteriaEvaluations[0].Confidence)
	assert.Len(t, output.CriteriaEvaluations[0].PositiveSignals, 2)
	assert.True(t, output.CriteriaEvaluations[0].CriterionCovered)

	// Check second criterion evaluation
	assert.Equal(t, "Problem Solving", output.CriteriaEvaluations[1].CriterionName)
	assert.Equal(t, 70, output.CriteriaEvaluations[1].Score)

	// Check uncovered criteria
	assert.Len(t, output.UncoveredCriteria, 1)
	assert.Contains(t, output.UncoveredCriteria, "Leadership")

	// Check recommendation
	assert.Equal(t, models.RecommendationProceed, output.Recommendation)
	assert.Contains(t, output.RecommendationReason, "Strong candidate")
}

func TestParseEvaluationResponse_WithMarkdownCodeBlock(t *testing.T) {
	response := "```json\n" + `{
		"criteria_evaluations": [
			{
				"criterion_name": "Test",
				"criterion_weight": "important",
				"score": 75,
				"confidence": "medium",
				"positive_signals": [],
				"negative_signals": [],
				"red_flags": [],
				"quotes": [],
				"assessment": "Test assessment",
				"criterion_covered": true
			}
		],
		"uncovered_criteria": [],
		"recommendation": "maybe",
		"recommendation_reason": "Average performance"
	}` + "\n```"

	output, err := parseEvaluationResponse(response)

	require.NoError(t, err)
	assert.Len(t, output.CriteriaEvaluations, 1)
	assert.Equal(t, "Test", output.CriteriaEvaluations[0].CriterionName)
	assert.Equal(t, models.RecommendationMaybe, output.Recommendation)
}

func TestParseEvaluationResponse_WithCodeBlockOnly(t *testing.T) {
	response := "```\n" + `{
		"criteria_evaluations": [{"criterion_name": "Test", "score": 60}],
		"recommendation": "reject",
		"recommendation_reason": "Below expectations"
	}` + "\n```"

	output, err := parseEvaluationResponse(response)

	require.NoError(t, err)
	assert.Len(t, output.CriteriaEvaluations, 1)
	assert.Equal(t, models.RecommendationReject, output.Recommendation)
}

func TestParseEvaluationResponse_InvalidJSON(t *testing.T) {
	response := "not valid json"

	_, err := parseEvaluationResponse(response)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid JSON")
}

func TestParseEvaluationResponse_EmptyCriteriaEvaluations(t *testing.T) {
	response := `{
		"criteria_evaluations": [],
		"recommendation": "maybe",
		"recommendation_reason": "No evaluations"
	}`

	_, err := parseEvaluationResponse(response)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "no criteria evaluations")
}

func TestParseEvaluationResponse_MissingCriterionName(t *testing.T) {
	response := `{
		"criteria_evaluations": [{"score": 70, "criterion_weight": "important"}],
		"recommendation": "maybe"
	}`

	_, err := parseEvaluationResponse(response)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "no criterion name")
}

func TestParseEvaluationResponse_ScoreClamping(t *testing.T) {
	response := `{
		"criteria_evaluations": [
			{"criterion_name": "Test1", "score": -10},
			{"criterion_name": "Test2", "score": 150}
		],
		"recommendation": "maybe"
	}`

	output, err := parseEvaluationResponse(response)

	require.NoError(t, err)
	assert.Equal(t, 0, output.CriteriaEvaluations[0].Score)   // Clamped to 0
	assert.Equal(t, 100, output.CriteriaEvaluations[1].Score) // Clamped to 100
}

func TestParseEvaluationResponse_DefaultConfidence(t *testing.T) {
	response := `{
		"criteria_evaluations": [
			{"criterion_name": "Test", "score": 70}
		],
		"recommendation": "maybe"
	}`

	output, err := parseEvaluationResponse(response)

	require.NoError(t, err)
	assert.Equal(t, models.ConfidenceMedium, output.CriteriaEvaluations[0].Confidence)
}

func TestParseEvaluationResponse_DefaultRecommendation(t *testing.T) {
	response := `{
		"criteria_evaluations": [
			{"criterion_name": "Test", "score": 70}
		]
	}`

	output, err := parseEvaluationResponse(response)

	require.NoError(t, err)
	assert.Equal(t, models.RecommendationMaybe, output.Recommendation)
}

func TestGetEvaluationPromptVersion(t *testing.T) {
	version := GetEvaluationPromptVersion()

	assert.NotEmpty(t, version)
	assert.Equal(t, "v1.0", version)
}

//nolint:govet // Ignore false positive
func TestEvaluationInput_Structure(t *testing.T) {
	input := EvaluationInput{
		JobTitle:      "Engineer",
		JobSeniority:  "mid",
		Criteria:      []models.ScorecardCriterion{},
		Sections:      []models.WorkSampleSection{},
		Answers:       map[string]string{"0": "answer"},
		CandidateName: "Test User",
	}

	assert.Equal(t, "Engineer", input.JobTitle)
	assert.Equal(t, "mid", input.JobSeniority)
	assert.Equal(t, "Test User", input.CandidateName)
	assert.Len(t, input.Answers, 1)
}

func TestEvaluationOutput_Structure(t *testing.T) {
	output := EvaluationOutput{
		CriteriaEvaluations: []models.CriterionEvaluation{
			{CriterionName: "Test", Score: 80},
		},
		UncoveredCriteria:    []string{"Missing"},
		Recommendation:       models.RecommendationProceed,
		RecommendationReason: "Good candidate", //nolint:govet // Ignore false positive
	}

	assert.Len(t, output.CriteriaEvaluations, 1)
	assert.Len(t, output.UncoveredCriteria, 1)
	assert.Equal(t, models.RecommendationProceed, output.Recommendation)
}
