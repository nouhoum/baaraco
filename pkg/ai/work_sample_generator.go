package ai

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/baaraco/baara/pkg/models"
)

const workSamplePromptVersion = "v1.0"

// WorkSampleInput contains all the data needed to generate a work sample
type WorkSampleInput struct {
	// Job info
	Title            string   `json:"title"`
	Team             string   `json:"team"`
	Seniority        string   `json:"seniority"`
	Stack            []string `json:"stack"`
	BusinessContext  string   `json:"business_context"`
	MainProblem      string   `json:"main_problem"`
	ExpectedOutcomes []string `json:"expected_outcomes"`
	SuccessLooksLike string   `json:"success_looks_like"`

	// Scorecard criteria
	Criteria []models.ScorecardCriterion `json:"criteria"`
}

//nolint:misspell // false positive
const workSampleSystemPrompt = `Tu es un expert en design d'évaluations techniques pour le recrutement.
Tu dois créer un "Work Sample" - un exercice pratique qui permet d'évaluer un candidat sur des critères spécifiques.

Règles importantes:
1. Crée 1 à 3 sections/scénarios
2. Chaque section doit être faisable en 20-35 minutes
3. Le temps total ne doit PAS dépasser 60 minutes
4. Chaque section doit évaluer 2-3 critères de la scorecard
5. Les scénarios doivent être RÉALISTES et refléter le travail quotidien du poste
6. Les instructions doivent être CLAIRES et SANS AMBIGUÏTÉ
7. Le rubric doit expliquer ce qu'on évalue sans donner la réponse

Format de sortie attendu (JSON valide):
{
  "intro_message": "Message d'introduction rassurant pour le candidat",
  "rules": [
    "Vous pouvez consulter la documentation en ligne",
    "N'utilisez pas de code propriétaire",
    "Vous pouvez faire des pauses"
  ],
  "sections": [
    {
      "title": "Titre de la section",
      "description": "Contexte et mise en situation",
      "instructions": "Instructions détaillées et claires de ce que le candidat doit faire",
      "estimated_time_minutes": 25,
      "criteria_evaluated": ["Nom du critère 1", "Nom du critère 2"],
      "rubric": "Ce qu'on évalue: capacité à X, approche de Y, qualité de Z"
    }
  ],
  "estimated_time_minutes": 60
}

IMPORTANT:
- Le work sample doit tester les compétences RÉELLES du poste
- Évite les exercices algorithmiques abstraits (type LeetCode)
- Privilégie des mises en situation proches du quotidien
- Réponds UNIQUEMENT avec le JSON, sans texte avant ou après.`

// GenerateWorkSample generates a work sample for a job based on its scorecard
func (c *Client) GenerateWorkSample(input WorkSampleInput) (*models.JobWorkSampleResponse, error) {
	userPrompt := buildWorkSampleUserPrompt(input)

	response, err := c.Generate(workSampleSystemPrompt, userPrompt, 4096)
	if err != nil {
		return nil, fmt.Errorf("failed to generate work sample: %w", err)
	}

	// Parse the JSON response
	workSample, err := parseWorkSampleResponse(response)
	if err != nil {
		return nil, fmt.Errorf("failed to parse work sample response: %w", err)
	}

	return workSample, nil
}

func buildWorkSampleUserPrompt(input WorkSampleInput) string {
	var sb strings.Builder

	sb.WriteString("# Contexte du poste\n\n")
	sb.WriteString(fmt.Sprintf("- **Titre**: %s\n", input.Title))
	if input.Team != "" {
		sb.WriteString(fmt.Sprintf("- **Équipe**: %s\n", input.Team))
	}
	if input.Seniority != "" {
		sb.WriteString(fmt.Sprintf("- **Séniorité**: %s\n", input.Seniority))
	}
	if len(input.Stack) > 0 {
		sb.WriteString(fmt.Sprintf("- **Stack**: %s\n", strings.Join(input.Stack, ", ")))
	}
	if input.BusinessContext != "" {
		sb.WriteString(fmt.Sprintf("- **Contexte business**: %s\n", input.BusinessContext))
	}
	if input.MainProblem != "" {
		sb.WriteString(fmt.Sprintf("- **Problème principal**: %s\n", input.MainProblem))
	}
	if len(input.ExpectedOutcomes) > 0 {
		sb.WriteString("- **Résultats attendus**:\n")
		for i, outcome := range input.ExpectedOutcomes {
			sb.WriteString(fmt.Sprintf("  %d. %s\n", i+1, outcome))
		}
	}
	if input.SuccessLooksLike != "" {
		sb.WriteString(fmt.Sprintf("- **Le succès**: %s\n", input.SuccessLooksLike))
	}

	sb.WriteString("\n# Scorecard (critères à évaluer)\n\n")
	for i, criterion := range input.Criteria {
		sb.WriteString(fmt.Sprintf("## %d. %s (%s)\n", i+1, criterion.Name, criterion.Weight))
		sb.WriteString(fmt.Sprintf("%s\n\n", criterion.Description))
	}

	sb.WriteString("\n---\n\nCrée un work sample avec 1-3 sections qui permettent d'évaluer ces critères. Temps total max: 60 minutes.")

	return sb.String()
}

type workSampleJSONResponse struct {
	IntroMessage         string                     `json:"intro_message"`
	Rules                []string                   `json:"rules"`
	Sections             []models.WorkSampleSection `json:"sections"`
	EstimatedTimeMinutes int                        `json:"estimated_time_minutes"`
}

func parseWorkSampleResponse(response string) (*models.JobWorkSampleResponse, error) {
	// Clean the response - remove markdown code blocks if present
	response = strings.TrimSpace(response)
	if after, ok := strings.CutPrefix(response, "```json"); ok {
		response = after
	}
	if after, ok := strings.CutPrefix(response, "```"); ok {
		response = after
	}
	if before, ok := strings.CutSuffix(response, "```"); ok {
		response = before
	}
	response = strings.TrimSpace(response)

	var result workSampleJSONResponse
	if err := json.Unmarshal([]byte(response), &result); err != nil {
		return nil, fmt.Errorf("invalid JSON response: %w\nResponse was: %s", err, response)
	}

	if len(result.Sections) == 0 {
		return nil, fmt.Errorf("no sections in response")
	}

	// Validate sections
	for i, section := range result.Sections {
		if section.Title == "" {
			return nil, fmt.Errorf("section %d has no title", i)
		}
	}

	estimatedTime := result.EstimatedTimeMinutes
	if estimatedTime == 0 {
		// Calculate from sections
		for _, section := range result.Sections {
			estimatedTime += section.EstimatedTimeMinutes
		}
	}

	return &models.JobWorkSampleResponse{
		IntroMessage:         result.IntroMessage,
		Rules:                result.Rules,
		Sections:             result.Sections,
		EstimatedTimeMinutes: &estimatedTime,
	}, nil
}

// GetWorkSamplePromptVersion returns the current prompt version
func GetWorkSamplePromptVersion() string {
	return workSamplePromptVersion
}
