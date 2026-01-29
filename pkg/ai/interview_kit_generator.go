package ai

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/baaraco/baara/pkg/models"
)

// InterviewKitInput contains all the data needed to generate an interview kit
type InterviewKitInput struct {
	JobTitle       string                       `json:"job_title"`
	CandidateName  string                       `json:"candidate_name"`
	GlobalScore    int                          `json:"global_score"`
	Recommendation string                       `json:"recommendation"`
	OneLiner       string                       `json:"one_liner"`
	Criteria       []models.CriterionSummary    `json:"criteria"`
	Strengths      []models.StrengthItem        `json:"strengths"`
	AreasToExplore []models.AreaToExplore       `json:"areas_to_explore"`
	RedFlags       []models.RedFlagItem         `json:"red_flags"`
}

// InterviewKitOutput represents the parsed AI interview kit response
type InterviewKitOutput struct {
	TotalDurationMinutes int                          `json:"total_duration_minutes"`
	Sections             []models.InterviewKitSection `json:"sections"`
	DebriefTemplate      models.DebriefTemplate       `json:"debrief_template"`
}

const interviewKitSystemPrompt = `Tu es un expert en recrutement technique et en conduite d'entretiens structurés.
Tu dois générer un Interview Kit personnalisé basé sur le Proof Profile d'un candidat.

Règles importantes:
1. Génère 2 à 3 sections d'entretien avec des questions ciblées
2. Chaque question doit avoir un contexte clair expliquant pourquoi on la pose
3. Fournis des signaux positifs et négatifs concrets à observer
4. Les follow-ups doivent permettre d'approfondir
5. Adapte les questions au profil du candidat (zones d'ombre, forces à confirmer)
6. La durée totale recommandée est de 60 minutes

Sections typiques:
- "Validation des zones d'ombre" : Questions sur les critères faibles ou non couverts
- "Approfondissement des forces" : Questions pour confirmer les points forts détectés
- "Culture et motivation" : Questions comportementales et d'alignement

Format de sortie attendu (JSON valide):
{
  "total_duration_minutes": 60,
  "sections": [
    {
      "title": "Titre de la section",
      "duration_minutes": 20,
      "questions": [
        {
          "question": "La question à poser",
          "context": "Pourquoi on pose cette question (lié au Proof Profile)",
          "positive_signals": ["Signal positif à chercher 1", "Signal positif 2"],
          "negative_signals": ["Signal négatif à surveiller 1"],
          "follow_up": "Question de relance suggérée"
        }
      ]
    }
  ],
  "debrief_template": {
    "criteria": [
      {
        "name": "Nom du critère",
        "score": 75,
        "reevaluate": true
      }
    ],
    "final_recommendation_prompt": "Après cet entretien, recommandez-vous ce candidat pour la suite du processus ?"
  }
}

IMPORTANT: Réponds UNIQUEMENT avec le JSON, sans texte avant ou après.`

// GenerateInterviewKit generates an interview kit from a proof profile
func (c *Client) GenerateInterviewKit(input InterviewKitInput) (*InterviewKitOutput, error) {
	userPrompt := buildInterviewKitUserPrompt(input)

	response, err := c.Generate(interviewKitSystemPrompt, userPrompt, 8192)
	if err != nil {
		return nil, fmt.Errorf("failed to generate interview kit: %w", err)
	}

	output, err := parseInterviewKitResponse(response)
	if err != nil {
		return nil, fmt.Errorf("failed to parse interview kit response: %w", err)
	}

	return output, nil
}

func buildInterviewKitUserPrompt(input InterviewKitInput) string {
	var sb strings.Builder

	sb.WriteString("# Contexte\n\n")
	sb.WriteString(fmt.Sprintf("- **Poste**: %s\n", input.JobTitle))
	sb.WriteString(fmt.Sprintf("- **Candidat**: %s\n", input.CandidateName))
	sb.WriteString(fmt.Sprintf("- **Score global**: %d/100\n", input.GlobalScore))
	sb.WriteString(fmt.Sprintf("- **Recommandation**: %s\n", input.Recommendation))
	sb.WriteString(fmt.Sprintf("- **Résumé**: %s\n\n", input.OneLiner))

	// Criteria summary
	sb.WriteString("# Évaluation par critère\n\n")
	for _, c := range input.Criteria {
		sb.WriteString(fmt.Sprintf("- **%s** : %d/100 (poids: %s, statut: %s) — %s\n",
			c.Name, c.Score, c.Weight, c.Status, c.Headline))
	}

	// Strengths
	if len(input.Strengths) > 0 {
		sb.WriteString("\n# Points forts détectés\n\n")
		for _, s := range input.Strengths {
			sb.WriteString(fmt.Sprintf("- **%s** (%d/100): %s\n", s.CriterionName, s.Score, s.Evidence))
			if len(s.Signals) > 0 {
				sb.WriteString(fmt.Sprintf("  Signaux: %s\n", strings.Join(s.Signals, ", ")))
			}
		}
	}

	// Areas to explore
	if len(input.AreasToExplore) > 0 {
		sb.WriteString("\n# Zones d'ombre\n\n")
		for _, a := range input.AreasToExplore {
			sb.WriteString(fmt.Sprintf("- **%s** (%d/100)\n", a.CriterionName, a.Score))
			for _, concern := range a.Concerns {
				sb.WriteString(fmt.Sprintf("  - Préoccupation: %s\n", concern))
			}
		}
	}

	// Red flags
	if len(input.RedFlags) > 0 {
		sb.WriteString("\n# Red flags\n\n")
		for _, rf := range input.RedFlags {
			sb.WriteString(fmt.Sprintf("- **%s**:\n", rf.CriterionName))
			for _, flag := range rf.Flags {
				sb.WriteString(fmt.Sprintf("  - %s\n", flag))
			}
		}
	}

	sb.WriteString("\n---\n\nGénère un Interview Kit structuré pour ce candidat avec 2 à 3 sections de questions ciblées.")

	return sb.String()
}

func parseInterviewKitResponse(response string) (*InterviewKitOutput, error) {
	// Clean the response
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

	var result InterviewKitOutput
	if err := json.Unmarshal([]byte(response), &result); err != nil {
		return nil, fmt.Errorf("invalid JSON response: %w\nResponse was: %s", err, response)
	}

	if len(result.Sections) == 0 {
		return nil, fmt.Errorf("no sections in interview kit response")
	}

	// Validate and set defaults
	if result.TotalDurationMinutes <= 0 {
		result.TotalDurationMinutes = 60
	}

	for i, section := range result.Sections {
		if section.Title == "" {
			result.Sections[i].Title = fmt.Sprintf("Section %d", i+1)
		}
		if section.DurationMinutes <= 0 {
			result.Sections[i].DurationMinutes = 20
		}
		for j, q := range section.Questions {
			if q.PositiveSignals == nil {
				result.Sections[i].Questions[j].PositiveSignals = []string{}
			}
			if q.NegativeSignals == nil {
				result.Sections[i].Questions[j].NegativeSignals = []string{}
			}
		}
	}

	if result.DebriefTemplate.Criteria == nil {
		result.DebriefTemplate.Criteria = []models.DebriefCriterion{}
	}
	if result.DebriefTemplate.FinalRecommendationPrompt == "" {
		result.DebriefTemplate.FinalRecommendationPrompt = "Après cet entretien, recommandez-vous ce candidat pour la suite du processus ?"
	}

	return &result, nil
}
