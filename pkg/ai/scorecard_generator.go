package ai

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/baaraco/baara/pkg/models"
)

const scorecardPromptVersion = "v1.0"

// ScorecardInput contains all the job data needed to generate a scorecard
type ScorecardInput struct {
	Title            string   `json:"title"`
	Team             string   `json:"team"`
	Seniority        string   `json:"seniority"`
	LocationType     string   `json:"location_type"`
	ContractType     string   `json:"contract_type"`
	Stack            []string `json:"stack"`
	TeamSize         string   `json:"team_size"`
	ManagerInfo      string   `json:"manager_info"`
	BusinessContext  string   `json:"business_context"`
	MainProblem      string   `json:"main_problem"`
	ExpectedOutcomes []string `json:"expected_outcomes"`
	SuccessLooksLike string   `json:"success_looks_like"`
	FailureLooksLike string   `json:"failure_looks_like"`
}

const scorecardSystemPrompt = `Tu es un expert en recrutement technique spécialisé dans l'évaluation des candidats pour des postes tech.
Tu dois analyser un "Outcome Brief" (description du poste basée sur les résultats attendus) et générer une scorecard d'évaluation.

Règles importantes:
1. Génère exactement 5 à 7 critères d'évaluation
2. Chaque critère doit être OBSERVABLE et MESURABLE lors d'un entretien ou work sample
3. Priorise les critères selon leur importance pour le succès dans ce rôle spécifique
4. Les signaux doivent être concrets et observables, pas des traits de personnalité abstraits
5. Les red flags doivent être des indicateurs clairs de non-adéquation

Format de sortie attendu (JSON valide):
{
  "criteria": [
    {
      "name": "Nom concis du critère",
      "description": "Description détaillée de ce que ce critère évalue",
      "weight": "critical|important|nice_to_have",
      "positive_signals": ["Signal observable 1", "Signal observable 2", "Signal observable 3"],
      "negative_signals": ["Signal négatif 1", "Signal négatif 2"],
      "red_flags": ["Red flag majeur"]
    }
  ]
}

Poids des critères:
- "critical": Indispensable pour réussir, éliminatoire si absent (2-3 max)
- "important": Très important mais pas éliminatoire (2-3)
- "nice_to_have": Bonus appréciable (1-2)

IMPORTANT: Réponds UNIQUEMENT avec le JSON, sans texte avant ou après.`

// GenerateScorecard generates evaluation criteria for a job
func (c *Client) GenerateScorecard(input ScorecardInput) ([]models.ScorecardCriterion, error) {
	userPrompt := buildScorecardUserPrompt(input)

	response, err := c.Generate(scorecardSystemPrompt, userPrompt, 4096)
	if err != nil {
		return nil, fmt.Errorf("failed to generate scorecard: %w", err)
	}

	// Parse the JSON response
	criteria, err := parseScorecardResponse(response)
	if err != nil {
		return nil, fmt.Errorf("failed to parse scorecard response: %w", err)
	}

	return criteria, nil
}

func buildScorecardUserPrompt(input ScorecardInput) string {
	var sb strings.Builder

	sb.WriteString("# Outcome Brief\n\n")

	sb.WriteString("## Le poste\n")
	sb.WriteString(fmt.Sprintf("- **Titre**: %s\n", input.Title))
	if input.Team != "" {
		sb.WriteString(fmt.Sprintf("- **Équipe**: %s\n", input.Team))
	}
	if input.Seniority != "" {
		sb.WriteString(fmt.Sprintf("- **Séniorité**: %s\n", input.Seniority))
	}
	if input.LocationType != "" {
		sb.WriteString(fmt.Sprintf("- **Type de lieu**: %s\n", input.LocationType))
	}
	if input.ContractType != "" {
		sb.WriteString(fmt.Sprintf("- **Type de contrat**: %s\n", input.ContractType))
	}

	sb.WriteString("\n## Le contexte\n")
	if len(input.Stack) > 0 {
		sb.WriteString(fmt.Sprintf("- **Stack technique**: %s\n", strings.Join(input.Stack, ", ")))
	}
	if input.TeamSize != "" {
		sb.WriteString(fmt.Sprintf("- **Taille de l'équipe**: %s\n", input.TeamSize))
	}
	if input.ManagerInfo != "" {
		sb.WriteString(fmt.Sprintf("- **Manager**: %s\n", input.ManagerInfo))
	}
	if input.BusinessContext != "" {
		sb.WriteString(fmt.Sprintf("- **Contexte business**: %s\n", input.BusinessContext))
	}

	sb.WriteString("\n## Les outcomes attendus\n")
	if input.MainProblem != "" {
		sb.WriteString(fmt.Sprintf("- **Problème principal à résoudre**: %s\n", input.MainProblem))
	}
	if len(input.ExpectedOutcomes) > 0 {
		sb.WriteString("- **Résultats attendus**:\n")
		for i, outcome := range input.ExpectedOutcomes {
			sb.WriteString(fmt.Sprintf("  %d. %s\n", i+1, outcome))
		}
	}
	if input.SuccessLooksLike != "" {
		sb.WriteString(fmt.Sprintf("- **Le succès ressemble à**: %s\n", input.SuccessLooksLike))
	}
	if input.FailureLooksLike != "" {
		sb.WriteString(fmt.Sprintf("- **L'échec ressemble à**: %s\n", input.FailureLooksLike))
	}

	sb.WriteString("\n---\n\nGénère une scorecard avec 5-7 critères d'évaluation pour ce poste.")

	return sb.String()
}

type scorecardJSONResponse struct {
	Criteria []models.ScorecardCriterion `json:"criteria"`
}

func parseScorecardResponse(response string) ([]models.ScorecardCriterion, error) {
	// Clean the response - remove markdown code blocks if present
	response = strings.TrimSpace(response)
	if strings.HasPrefix(response, "```json") {
		response = strings.TrimPrefix(response, "```json")
	}
	if strings.HasPrefix(response, "```") {
		response = strings.TrimPrefix(response, "```")
	}
	if strings.HasSuffix(response, "```") {
		response = strings.TrimSuffix(response, "```")
	}
	response = strings.TrimSpace(response)

	var result scorecardJSONResponse
	if err := json.Unmarshal([]byte(response), &result); err != nil {
		return nil, fmt.Errorf("invalid JSON response: %w\nResponse was: %s", err, response)
	}

	if len(result.Criteria) == 0 {
		return nil, fmt.Errorf("no criteria in response")
	}

	// Validate criteria
	for i, criterion := range result.Criteria {
		if criterion.Name == "" {
			return nil, fmt.Errorf("criterion %d has no name", i)
		}
		if criterion.Weight == "" {
			result.Criteria[i].Weight = models.WeightImportant // Default
		}
	}

	return result.Criteria, nil
}

// GetPromptVersion returns the current prompt version
func GetScorecardPromptVersion() string {
	return scorecardPromptVersion
}
