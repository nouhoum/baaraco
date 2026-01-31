package ai

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/baaraco/baara/pkg/models"
)

func TestBuildInterviewKitUserPrompt(t *testing.T) {
	input := InterviewKitInput{
		JobTitle:       "Senior Backend Engineer",
		CandidateName:  "Jean Dupont",
		GlobalScore:    75,
		Recommendation: "proceed_to_interview",
		OneLiner:       "Bon profil avec des points à approfondir",
		Criteria: []models.CriterionSummary{
			{Name: "Technical Skills", Score: 85, Weight: models.WeightCritical, Status: "strong", Headline: "Solide"},
			{Name: "Communication", Score: 60, Weight: models.WeightImportant, Status: "acceptable", Headline: "À vérifier"},
		},
		Strengths: []models.StrengthItem{
			{CriterionName: "Technical Skills", Score: 85, Signals: []string{"Clean code", "Good architecture"}, Evidence: "Demonstrated solid skills"},
		},
		AreasToExplore: []models.AreaToExplore{
			{CriterionName: "Communication", Score: 60, Concerns: []string{"Vague on team collaboration"}, SuggestedQuestions: []string{"Tell about a conflict"}},
		},
		RedFlags: []models.RedFlagItem{
			{CriterionName: "Testing", Flags: []string{"No test coverage mentioned"}},
		},
	}

	prompt := buildInterviewKitUserPrompt(input)

	assert.NotEmpty(t, prompt)

	// Context section
	assert.Contains(t, prompt, "# Contexte")
	assert.Contains(t, prompt, "Senior Backend Engineer")
	assert.Contains(t, prompt, "Jean Dupont")
	assert.Contains(t, prompt, "75/100")
	assert.Contains(t, prompt, "proceed_to_interview")

	// Criteria
	assert.Contains(t, prompt, "Évaluation par critère")
	assert.Contains(t, prompt, "Technical Skills")
	assert.Contains(t, prompt, "85/100")
	assert.Contains(t, prompt, "critical")

	// Strengths
	assert.Contains(t, prompt, "Points forts")
	assert.Contains(t, prompt, "Clean code")
	assert.Contains(t, prompt, "Demonstrated solid skills")

	// Areas to explore
	assert.Contains(t, prompt, "Zones d'ombre")
	assert.Contains(t, prompt, "Communication")
	assert.Contains(t, prompt, "Vague on team collaboration")

	// Red flags
	assert.Contains(t, prompt, "Red flags")
	assert.Contains(t, prompt, "Testing")
	assert.Contains(t, prompt, "No test coverage mentioned")
}

func TestBuildInterviewKitUserPrompt_MinimalInput(t *testing.T) {
	input := InterviewKitInput{
		JobTitle:       "Developer",
		CandidateName:  "Test",
		GlobalScore:    50,
		Recommendation: "maybe",
		OneLiner:       "Average candidate",
		Criteria:       []models.CriterionSummary{},
	}

	prompt := buildInterviewKitUserPrompt(input)

	assert.NotEmpty(t, prompt)
	assert.Contains(t, prompt, "Developer")
	assert.Contains(t, prompt, "Test")
	// Should not contain optional sections if empty
	assert.NotContains(t, prompt, "Points forts")
	assert.NotContains(t, prompt, "Zones d'ombre")
	assert.NotContains(t, prompt, "Red flags")
}

//nolint:misspell // false positive
func TestParseInterviewKitResponse_Valid(t *testing.T) {
	response := `{
		"total_duration_minutes": 60,
		"sections": [
			{
				"title": "Validation des zones d'ombre",
				"duration_minutes": 25,
				"questions": [
					{
						"question": "Parlez de votre expérience en microservices",
						"context": "Score faible sur ce critère",
						"positive_signals": ["Exemples concrets", "Architecture claire"],
						"negative_signals": ["Réponses vagues"],
						"follow_up": "Pouvez-vous donner un exemple ?"
					}
				]
			},
			{
				"title": "Culture et motivation",
				"duration_minutes": 15,
				"questions": [
					{
						"question": "Pourquoi ce poste ?",
						"context": "Vérifier la motivation",
						"positive_signals": ["Connaissance de l'entreprise"],
						"negative_signals": ["Peu d'intérêt"],
						"follow_up": "Qu'attendez-vous de ce rôle ?"
					}
				]
			}
		],
		"debrief_template": {
			"criteria": [
				{"name": "Tech", "score": 75, "reevaluate": true}
			],
			"final_recommendation_prompt": "Recommandez-vous ce candidat ?"
		}
	}`

	result, err := parseInterviewKitResponse(response)
	require.NoError(t, err)

	assert.Equal(t, 60, result.TotalDurationMinutes)
	assert.Len(t, result.Sections, 2)
	assert.Equal(t, "Validation des zones d'ombre", result.Sections[0].Title)
	assert.Equal(t, 25, result.Sections[0].DurationMinutes)
	assert.Len(t, result.Sections[0].Questions, 1)
	assert.Equal(t, "Parlez de votre expérience en microservices", result.Sections[0].Questions[0].Question)
	assert.Len(t, result.Sections[0].Questions[0].PositiveSignals, 2)
	assert.Len(t, result.Sections[0].Questions[0].NegativeSignals, 1)
	assert.Len(t, result.DebriefTemplate.Criteria, 1)
	assert.True(t, result.DebriefTemplate.Criteria[0].Reevaluate)
}

func TestParseInterviewKitResponse_WithCodeFence(t *testing.T) {
	response := "```json\n{\"total_duration_minutes\":60,\"sections\":[{\"title\":\"Test\",\"duration_minutes\":20,\"questions\":[{\"question\":\"Q?\",\"context\":\"C\",\"positive_signals\":[],\"negative_signals\":[],\"follow_up\":\"F\"}]}],\"debrief_template\":{\"criteria\":[],\"final_recommendation_prompt\":\"P\"}}\n```"

	result, err := parseInterviewKitResponse(response)
	require.NoError(t, err)

	assert.Equal(t, 60, result.TotalDurationMinutes)
	assert.Len(t, result.Sections, 1)
	assert.Equal(t, "Test", result.Sections[0].Title)
}

func TestParseInterviewKitResponse_InvalidJSON(t *testing.T) {
	_, err := parseInterviewKitResponse("not valid json")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid JSON")
}

func TestParseInterviewKitResponse_EmptySections(t *testing.T) {
	response := `{"total_duration_minutes":60,"sections":[],"debrief_template":{"criteria":[]}}`

	_, err := parseInterviewKitResponse(response)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "no sections")
}

func TestParseInterviewKitResponse_DefaultValues(t *testing.T) {
	response := `{
		"total_duration_minutes": 0,
		"sections": [
			{
				"title": "",
				"duration_minutes": 0,
				"questions": [
					{
						"question": "Test?",
						"context": "Context",
						"follow_up": "Follow"
					}
				]
			}
		],
		"debrief_template": {
			"criteria": null,
			"final_recommendation_prompt": ""
		}
	}`

	result, err := parseInterviewKitResponse(response)
	require.NoError(t, err)

	// Default duration
	assert.Equal(t, 60, result.TotalDurationMinutes)
	// Default section title
	assert.Equal(t, "Section 1", result.Sections[0].Title)
	// Default section duration
	assert.Equal(t, 20, result.Sections[0].DurationMinutes)
	// Nil signals become empty slices
	assert.NotNil(t, result.Sections[0].Questions[0].PositiveSignals)
	assert.NotNil(t, result.Sections[0].Questions[0].NegativeSignals)
	assert.Empty(t, result.Sections[0].Questions[0].PositiveSignals)
	assert.Empty(t, result.Sections[0].Questions[0].NegativeSignals)
	// Default debrief
	assert.NotNil(t, result.DebriefTemplate.Criteria)
	assert.Empty(t, result.DebriefTemplate.Criteria)
	assert.Contains(t, result.DebriefTemplate.FinalRecommendationPrompt, "recommandez")
}
