package ai

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/baaraco/baara/pkg/models"
)

func TestBuildScorecardUserPrompt(t *testing.T) {
	input := ScorecardInput{
		Title:            "Senior Backend Engineer",
		Team:             "Payments",
		Seniority:        "senior",
		LocationType:     "remote",
		ContractType:     "cdi",
		Stack:            []string{"Go", "PostgreSQL", "Kubernetes"},
		TeamSize:         "4-8",
		ManagerInfo:      "Marie Dupont, Engineering Manager",
		BusinessContext:  "Nous construisons une plateforme de paiement B2B",
		MainProblem:      "Améliorer la fiabilité du système de paiement",
		ExpectedOutcomes: []string{"Réduire les erreurs de 50%", "Améliorer les temps de réponse"},
		SuccessLooksLike: "Le système est stable et performant",
		FailureLooksLike: "Bugs récurrents et plaintes clients",
	}

	prompt := buildScorecardUserPrompt(input)

	assert.NotEmpty(t, prompt)

	// Check for presence of key sections
	assert.Contains(t, prompt, "# Outcome Brief")
	assert.Contains(t, prompt, "## Le poste")
	assert.Contains(t, prompt, "Senior Backend Engineer")
	assert.Contains(t, prompt, "Payments")
	assert.Contains(t, prompt, "## Le contexte")
	assert.Contains(t, prompt, "Go, PostgreSQL, Kubernetes")
	assert.Contains(t, prompt, "## Les outcomes attendus")
	assert.Contains(t, prompt, "Améliorer la fiabilité")
}

func TestBuildScorecardUserPrompt_MinimalInput(t *testing.T) {
	input := ScorecardInput{
		Title: "Developer",
	}

	prompt := buildScorecardUserPrompt(input)

	assert.NotEmpty(t, prompt)
	assert.Contains(t, prompt, "Developer")
}

func TestParseScorecardResponse_ValidJSON(t *testing.T) {
	response := `{
		"criteria": [
			{
				"name": "Technical Expertise",
				"description": "Deep knowledge of backend systems",
				"weight": "critical",
				"positive_signals": ["Clear explanations", "Good architecture decisions"],
				"negative_signals": ["Vague answers"],
				"red_flags": ["Cannot explain basic concepts"]
			},
			{
				"name": "Problem Solving",
				"description": "Ability to solve complex problems",
				"weight": "important",
				"positive_signals": ["Structured approach"],
				"negative_signals": ["Jumps to solutions"],
				"red_flags": []
			}
		]
	}`

	criteria, err := parseScorecardResponse(response)

	require.NoError(t, err)
	assert.Len(t, criteria, 2)

	// Check first criterion
	assert.Equal(t, "Technical Expertise", criteria[0].Name)
	assert.Equal(t, models.WeightCritical, criteria[0].Weight)
	assert.Len(t, criteria[0].PositiveSignals, 2)
	assert.Contains(t, criteria[0].PositiveSignals, "Clear explanations")

	// Check second criterion
	assert.Equal(t, "Problem Solving", criteria[1].Name)
	assert.Equal(t, models.WeightImportant, criteria[1].Weight)
}

func TestParseScorecardResponse_WithMarkdownCodeBlock(t *testing.T) {
	response := "```json\n{\"criteria\": [{\"name\": \"Test\", \"description\": \"Test desc\", \"weight\": \"important\", \"positive_signals\": [], \"negative_signals\": [], \"red_flags\": []}]}\n```"

	criteria, err := parseScorecardResponse(response)

	require.NoError(t, err)
	assert.Len(t, criteria, 1)
	assert.Equal(t, "Test", criteria[0].Name)
}

func TestParseScorecardResponse_WithCodeBlockOnly(t *testing.T) {
	response := "```\n{\"criteria\": [{\"name\": \"Test\", \"description\": \"Desc\", \"weight\": \"critical\"}]}\n```"

	criteria, err := parseScorecardResponse(response)

	require.NoError(t, err)
	assert.Len(t, criteria, 1)
}

func TestParseScorecardResponse_InvalidJSON(t *testing.T) {
	response := "not valid json"

	_, err := parseScorecardResponse(response)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid JSON")
}

func TestParseScorecardResponse_EmptyCriteria(t *testing.T) {
	response := `{"criteria": []}`

	_, err := parseScorecardResponse(response)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "no criteria")
}

func TestParseScorecardResponse_MissingName(t *testing.T) {
	response := `{"criteria": [{"description": "Test", "weight": "important"}]}`

	_, err := parseScorecardResponse(response)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "no name")
}

func TestParseScorecardResponse_DefaultWeight(t *testing.T) {
	response := `{"criteria": [{"name": "Test", "description": "Test desc"}]}`

	criteria, err := parseScorecardResponse(response)

	require.NoError(t, err)
	assert.Equal(t, models.WeightImportant, criteria[0].Weight)
}

func TestGetScorecardPromptVersion(t *testing.T) {
	version := GetScorecardPromptVersion()

	assert.NotEmpty(t, version)
	assert.Equal(t, "v1.0", version)
}
