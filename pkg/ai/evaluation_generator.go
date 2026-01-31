package ai

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/baaraco/baara/pkg/models"
)

const evaluationPromptVersion = "v1.0"

// EvaluationInput contains all the data needed to evaluate a work sample
type EvaluationInput struct {
	// Job info
	JobTitle     string `json:"job_title"`
	JobSeniority string `json:"job_seniority"`

	// Scorecard criteria to evaluate against
	Criteria []models.ScorecardCriterion `json:"criteria"`

	// Work sample sections with rubrics
	Sections []models.WorkSampleSection `json:"sections"`

	// Candidate answers
	Answers map[string]string `json:"answers"` // section_index -> answer text

	// Candidate info
	CandidateName string `json:"candidate_name"`
}

//nolint:misspell // false positive
const evaluationSystemPrompt = `Tu es un expert en évaluation de candidats pour des postes techniques.
Tu dois analyser les réponses d'un candidat à un Work Sample et évaluer sa performance par rapport à une scorecard de critères.

Règles importantes:
1. Évalue CHAQUE critère de la scorecard
2. Base ton évaluation sur des PREUVES concrètes dans les réponses
3. Cite les passages pertinents (quotes) pour justifier tes évaluations
4. Sois objectif et équilibré
5. Identifie les zones d'ombre (critères non couverts par les réponses)

Échelle de scoring (0-100):
- 86-100 : Excellent - Dépasse les attentes, preuves solides
- 76-85 : Bon - Répond aux attentes, bonnes preuves
- 61-75 : Acceptable - Répond partiellement, quelques preuves
- 41-60 : En dessous des attentes - Preuves faibles ou partielles
- 0-40 : Insuffisant - Pas de preuves ou réponses inadéquates

Pondération pour le score global:
- critical : poids 3
- important : poids 2
- nice_to_have : poids 1

Niveau de confiance:
- "high" : Réponses complètes et claires permettant une évaluation précise
- "medium" : Réponses partielles mais suffisantes
- "low" : Peu d'éléments pour évaluer ce critère

Format de sortie attendu (JSON valide):
{
  "criteria_evaluations": [
    {
      "criterion_name": "Nom exact du critère",
      "criterion_weight": "critical|important|nice_to_have",
      "score": 75,
      "confidence": "high|medium|low",
      "positive_signals": ["Signal positif détecté 1", "Signal positif détecté 2"],
      "negative_signals": ["Signal négatif détecté"],
      "red_flags": [],
      "quotes": ["Citation pertinente de la réponse du candidat..."],
      "assessment": "Justification détaillée de l'évaluation...",
      "criterion_covered": true
    }
  ],
  "uncovered_criteria": ["Nom du critère non couvert"],
  "recommendation": "proceed_to_interview|maybe|reject",
  "recommendation_reason": "Justification détaillée de la recommandation..."
}

Recommandation:
- "proceed_to_interview" : Score global >= 70 ET pas de red flags critiques
- "maybe" : Score global 55-69 OU présence de zones d'ombre importantes
- "reject" : Score global < 55 OU red flags critiques sur critères critical

IMPORTANT: Réponds UNIQUEMENT avec le JSON, sans texte avant ou après.`

// EvaluationOutput represents the parsed AI evaluation response
type EvaluationOutput struct {
	CriteriaEvaluations  []models.CriterionEvaluation    `json:"criteria_evaluations"`
	UncoveredCriteria    []string                        `json:"uncovered_criteria"`
	Recommendation       models.EvaluationRecommendation `json:"recommendation"`
	RecommendationReason string                          `json:"recommendation_reason"`
}

// GenerateEvaluation generates an evaluation for a work sample attempt
func (c *Client) GenerateEvaluation(input EvaluationInput) (*EvaluationOutput, error) {
	userPrompt := buildEvaluationUserPrompt(input)

	response, err := c.Generate(evaluationSystemPrompt, userPrompt, 8192)
	if err != nil {
		return nil, fmt.Errorf("failed to generate evaluation: %w", err)
	}

	// Parse the JSON response
	output, err := parseEvaluationResponse(response)
	if err != nil {
		return nil, fmt.Errorf("failed to parse evaluation response: %w", err)
	}

	return output, nil
}

func buildEvaluationUserPrompt(input EvaluationInput) string {
	var sb strings.Builder

	sb.WriteString("# Contexte de l'évaluation\n\n")
	sb.WriteString(fmt.Sprintf("- **Poste**: %s\n", input.JobTitle))
	if input.JobSeniority != "" {
		sb.WriteString(fmt.Sprintf("- **Séniorité**: %s\n", input.JobSeniority))
	}
	if input.CandidateName != "" {
		sb.WriteString(fmt.Sprintf("- **Candidat**: %s\n", input.CandidateName))
	}

	sb.WriteString("\n# Scorecard (critères à évaluer)\n\n")
	for i, criterion := range input.Criteria {
		sb.WriteString(fmt.Sprintf("## %d. %s (%s)\n", i+1, criterion.Name, criterion.Weight))
		sb.WriteString(fmt.Sprintf("**Description**: %s\n\n", criterion.Description))

		if len(criterion.PositiveSignals) > 0 {
			sb.WriteString("**Signaux positifs attendus**:\n")
			for _, signal := range criterion.PositiveSignals {
				sb.WriteString(fmt.Sprintf("- %s\n", signal))
			}
		}

		if len(criterion.NegativeSignals) > 0 {
			sb.WriteString("\n**Signaux négatifs**:\n")
			for _, signal := range criterion.NegativeSignals {
				sb.WriteString(fmt.Sprintf("- %s\n", signal))
			}
		}

		if len(criterion.RedFlags) > 0 {
			sb.WriteString("\n**Red flags**:\n")
			for _, flag := range criterion.RedFlags {
				sb.WriteString(fmt.Sprintf("- %s\n", flag))
			}
		}
		sb.WriteString("\n")
	}

	sb.WriteString("\n# Work Sample (sections et rubrics)\n\n")
	for i, section := range input.Sections {
		sb.WriteString(fmt.Sprintf("## Section %d: %s\n", i+1, section.Title))
		sb.WriteString(fmt.Sprintf("**Instructions**: %s\n", section.Instructions))
		sb.WriteString(fmt.Sprintf("**Rubric (ce qu'on évalue)**: %s\n", section.Rubric))
		if len(section.CriteriaEvaluated) > 0 {
			sb.WriteString(fmt.Sprintf("**Critères évalués**: %s\n", strings.Join(section.CriteriaEvaluated, ", ")))
		}
		sb.WriteString("\n")
	}

	sb.WriteString("\n# Réponses du candidat\n\n")
	for sectionIdx, answer := range input.Answers {
		sb.WriteString(fmt.Sprintf("## Réponse à la section %s\n\n", sectionIdx))
		sb.WriteString("```\n")
		sb.WriteString(answer)
		sb.WriteString("\n```\n\n")
	}

	sb.WriteString("\n---\n\nÉvalue ce candidat sur tous les critères de la scorecard. Fournis des citations pour justifier tes évaluations.")

	return sb.String()
}

type evaluationJSONResponse struct {
	CriteriaEvaluations  []models.CriterionEvaluation    `json:"criteria_evaluations"`
	UncoveredCriteria    []string                        `json:"uncovered_criteria"`
	Recommendation       models.EvaluationRecommendation `json:"recommendation"`
	RecommendationReason string                          `json:"recommendation_reason"`
}

func parseEvaluationResponse(response string) (*EvaluationOutput, error) {
	// Clean the response - remove markdown code blocks if present
	response = strings.TrimSpace(response)
	response = strings.TrimPrefix(response, "```json")
	response = strings.TrimPrefix(response, "```")
	response = strings.TrimSuffix(response, "```")
	response = strings.TrimSpace(response)

	var result evaluationJSONResponse
	if err := json.Unmarshal([]byte(response), &result); err != nil {
		return nil, fmt.Errorf("invalid JSON response: %w\nResponse was: %s", err, response)
	}

	if len(result.CriteriaEvaluations) == 0 {
		return nil, fmt.Errorf("no criteria evaluations in response")
	}

	// Validate evaluations
	for i, eval := range result.CriteriaEvaluations {
		if eval.CriterionName == "" {
			return nil, fmt.Errorf("evaluation %d has no criterion name", i)
		}
		// Clamp score to 0-100
		if eval.Score < 0 {
			result.CriteriaEvaluations[i].Score = 0
		}
		if eval.Score > 100 {
			result.CriteriaEvaluations[i].Score = 100
		}
		// Set default confidence if empty
		if eval.Confidence == "" {
			result.CriteriaEvaluations[i].Confidence = models.ConfidenceMedium
		}
	}

	// Validate recommendation
	if result.Recommendation == "" {
		result.Recommendation = models.RecommendationMaybe
	}

	return &EvaluationOutput{
		CriteriaEvaluations:  result.CriteriaEvaluations,
		UncoveredCriteria:    result.UncoveredCriteria,
		Recommendation:       result.Recommendation,
		RecommendationReason: result.RecommendationReason,
	}, nil
}

// GetEvaluationPromptVersion returns the current prompt version
func GetEvaluationPromptVersion() string {
	return evaluationPromptVersion
}
