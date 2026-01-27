package ai

import (
	"testing"

	"github.com/baaraco/baara/pkg/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestBuildWorkSampleUserPrompt(t *testing.T) {
	input := WorkSampleInput{
		Title:            "Senior Backend Engineer",
		Team:             "Payments",
		Seniority:        "senior",
		Stack:            []string{"Go", "PostgreSQL"},
		BusinessContext:  "Plateforme de paiement B2B",
		MainProblem:      "Améliorer la fiabilité",
		ExpectedOutcomes: []string{"Réduire les erreurs", "Améliorer les performances"},
		SuccessLooksLike: "Système stable",
		Criteria: []models.ScorecardCriterion{
			{
				Name:        "Technical Expertise",
				Description: "Deep knowledge of backend systems",
				Weight:      models.WeightCritical,
			},
			{
				Name:        "Problem Solving",
				Description: "Ability to solve complex problems",
				Weight:      models.WeightImportant,
			},
		},
	}

	prompt := buildWorkSampleUserPrompt(input)

	assert.NotEmpty(t, prompt)
	assert.Contains(t, prompt, "# Contexte du poste")
	assert.Contains(t, prompt, "Senior Backend Engineer")
	assert.Contains(t, prompt, "# Scorecard")
	assert.Contains(t, prompt, "Technical Expertise")
	assert.Contains(t, prompt, "Problem Solving")
	assert.Contains(t, prompt, "critical")
	assert.Contains(t, prompt, "important")
}

func TestBuildWorkSampleUserPrompt_MinimalInput(t *testing.T) {
	input := WorkSampleInput{
		Title: "Developer",
		Criteria: []models.ScorecardCriterion{
			{Name: "Test", Description: "Test criterion", Weight: models.WeightImportant},
		},
	}

	prompt := buildWorkSampleUserPrompt(input)

	assert.NotEmpty(t, prompt)
	assert.Contains(t, prompt, "Developer")
	assert.Contains(t, prompt, "Test")
}

func TestParseWorkSampleResponse_ValidJSON(t *testing.T) {
	response := `{
		"intro_message": "Bienvenue dans cet exercice pratique",
		"rules": [
			"Vous pouvez consulter la documentation",
			"Pas de code propriétaire"
		],
		"sections": [
			{
				"title": "Architecture d'API",
				"description": "Concevoir une API REST",
				"instructions": "Créez un endpoint pour gérer les paiements",
				"estimated_time_minutes": 30,
				"criteria_evaluated": ["Technical Expertise", "Problem Solving"],
				"rubric": "On évalue la qualité de l'architecture"
			}
		],
		"estimated_time_minutes": 30
	}`

	workSample, err := parseWorkSampleResponse(response)

	require.NoError(t, err)
	assert.Equal(t, "Bienvenue dans cet exercice pratique", workSample.IntroMessage)
	assert.Len(t, workSample.Rules, 2)
	assert.Len(t, workSample.Sections, 1)

	section := workSample.Sections[0]
	assert.Equal(t, "Architecture d'API", section.Title)
	assert.Equal(t, 30, section.EstimatedTimeMinutes)
	assert.Len(t, section.CriteriaEvaluated, 2)
	assert.Contains(t, section.CriteriaEvaluated, "Technical Expertise")

	require.NotNil(t, workSample.EstimatedTimeMinutes)
	assert.Equal(t, 30, *workSample.EstimatedTimeMinutes)
}

func TestParseWorkSampleResponse_MultipleSections(t *testing.T) {
	response := `{
		"intro_message": "Test",
		"rules": [],
		"sections": [
			{
				"title": "Section 1",
				"description": "Desc 1",
				"instructions": "Instructions 1",
				"estimated_time_minutes": 20,
				"criteria_evaluated": [],
				"rubric": ""
			},
			{
				"title": "Section 2",
				"description": "Desc 2",
				"instructions": "Instructions 2",
				"estimated_time_minutes": 25,
				"criteria_evaluated": [],
				"rubric": ""
			}
		]
	}`

	workSample, err := parseWorkSampleResponse(response)

	require.NoError(t, err)
	assert.Len(t, workSample.Sections, 2)

	// Total time should be calculated from sections
	expectedTime := 20 + 25
	require.NotNil(t, workSample.EstimatedTimeMinutes)
	assert.Equal(t, expectedTime, *workSample.EstimatedTimeMinutes)
}

func TestParseWorkSampleResponse_WithMarkdownCodeBlock(t *testing.T) {
	response := "```json\n{\"intro_message\": \"Test\", \"rules\": [], \"sections\": [{\"title\": \"Test\", \"description\": \"Desc\", \"instructions\": \"Inst\", \"estimated_time_minutes\": 15, \"criteria_evaluated\": [], \"rubric\": \"\"}]}\n```"

	workSample, err := parseWorkSampleResponse(response)

	require.NoError(t, err)
	assert.Len(t, workSample.Sections, 1)
}

func TestParseWorkSampleResponse_InvalidJSON(t *testing.T) {
	response := "not valid json"

	_, err := parseWorkSampleResponse(response)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid JSON")
}

func TestParseWorkSampleResponse_EmptySections(t *testing.T) {
	response := `{"intro_message": "Test", "rules": [], "sections": []}`

	_, err := parseWorkSampleResponse(response)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "no sections")
}

func TestParseWorkSampleResponse_SectionWithoutTitle(t *testing.T) {
	response := `{"intro_message": "Test", "rules": [], "sections": [{"description": "Test", "instructions": "Test", "estimated_time_minutes": 15}]}`

	_, err := parseWorkSampleResponse(response)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "no title")
}

func TestGetWorkSamplePromptVersion(t *testing.T) {
	version := GetWorkSamplePromptVersion()

	assert.NotEmpty(t, version)
	assert.Equal(t, "v1.0", version)
}
