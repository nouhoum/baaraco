package ai

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/ledongthuc/pdf"

	"github.com/baaraco/baara/pkg/models"
)

// ResumeParseOutput represents the structured data extracted from a resume/CV
type ResumeParseOutput struct {
	Name              string                 `json:"name"`
	Bio               string                 `json:"bio"`
	CurrentTitle      string                 `json:"current_title"`
	CurrentCompany    string                 `json:"current_company"`
	YearsOfExperience *int                   `json:"years_of_experience"`
	Location          string                 `json:"location"`
	Skills            []string               `json:"skills"`
	LinkedInURL       string                 `json:"linkedin_url"`
	GithubUsername    string                 `json:"github_username"`
	WebsiteURL        string                 `json:"website_url"`
	Education         []models.Education     `json:"education"`
	Certifications    []models.Certification `json:"certifications"`
	Languages         []models.Language      `json:"languages"`
	Experiences       []models.Experience    `json:"experiences"`
}

//nolint:misspell // false positive
const resumeParserSystemPrompt = `Tu es un expert RH/recruteur spécialisé dans l'extraction de données structurées à partir de CV/résumés.

Ton rôle est d'analyser le document CV joint et d'en extraire les informations suivantes de manière structurée.

Règles importantes:
1. Extrais UNIQUEMENT les informations présentes dans le CV
2. Ne fabrique JAMAIS d'informations manquantes
3. Si une information n'est pas disponible, utilise une chaîne vide "" pour les textes, null pour les nombres, et un tableau vide [] pour les listes
4. Pour years_of_experience, estime le nombre d'années en fonction des dates d'emploi mentionnées
5. Pour les compétences (skills), extrais les compétences techniques et non-techniques mentionnées
6. Pour github_username, extrais uniquement le nom d'utilisateur (pas l'URL complète)
7. Pour linkedin_url, extrais l'URL complète du profil LinkedIn

Format de sortie attendu (JSON valide):
{
  "name": "Nom complet du candidat",
  "bio": "Résumé professionnel ou objectif de carrière",
  "current_title": "Titre du poste actuel",
  "current_company": "Entreprise actuelle",
  "years_of_experience": 5,
  "location": "Ville, Pays",
  "skills": ["Compétence 1", "Compétence 2"],
  "linkedin_url": "https://linkedin.com/in/...",
  "github_username": "username",
  "website_url": "https://...",
  "education": [
    {
      "institution": "Nom de l'établissement",
      "degree": "Type de diplôme",
      "field": "Domaine d'études",
      "start_year": 2015,
      "end_year": 2019
    }
  ],
  "certifications": [
    {
      "name": "Nom de la certification",
      "issuer": "Organisme émetteur",
      "year": 2023
    }
  ],
  "languages": [
    {
      "language": "Français",
      "level": "native"
    }
  ],
  "experiences": [
    {
      "title": "Titre du poste",
      "company": "Nom de l'entreprise",
      "start_year": 2020,
      "end_year": 2024,
      "description": "Description des responsabilités et réalisations"
    }
  ]
}

IMPORTANT: Réponds UNIQUEMENT avec le JSON, sans texte avant ou après.`

// extractTextFromPDF decodes a base64 PDF and extracts its text content
func extractTextFromPDF(pdfBase64 string) (string, error) {
	data, err := base64.StdEncoding.DecodeString(pdfBase64)
	if err != nil {
		return "", fmt.Errorf("failed to decode base64: %w", err)
	}

	reader := bytes.NewReader(data)
	r, err := pdf.NewReader(reader, int64(len(data)))
	if err != nil {
		return "", fmt.Errorf("failed to read PDF: %w", err)
	}

	var text strings.Builder
	for i := 1; i <= r.NumPage(); i++ {
		p := r.Page(i)
		content, err := p.GetPlainText(nil)
		if err != nil {
			continue
		}
		text.WriteString(content)
		text.WriteString("\n")
	}

	return text.String(), nil
}

// ParseResume takes a base64-encoded PDF and extracts structured resume data using AI
func (c *Client) ParseResume(pdfBase64 string) (*ResumeParseOutput, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 120*time.Second)
	defer cancel()

	var req CompletionRequest

	if c.provider.Name() == "anthropic" {
		// Anthropic: send PDF as native document block for best quality
		req = CompletionRequest{
			SystemPrompt: resumeParserSystemPrompt,
			UserPrompt:   `Extrais les informations structurées de ce document CV au format JSON.`,
			MaxTokens:    4096,
			Documents: []DocumentAttachment{
				{Data: pdfBase64, MediaType: "application/pdf"},
			},
		}
	} else {
		// Ollama / other: extract text from PDF and send as text prompt
		pdfText, err := extractTextFromPDF(pdfBase64)
		if err != nil {
			return nil, fmt.Errorf("failed to extract text from PDF: %w", err)
		}
		req = CompletionRequest{
			SystemPrompt: resumeParserSystemPrompt,
			UserPrompt:   fmt.Sprintf("Extrais les informations structurées de ce CV au format JSON.\n\nContenu du CV:\n%s", pdfText),
			MaxTokens:    4096,
		}
	}

	response, err := c.provider.Complete(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("failed to parse resume: %w", err)
	}

	output, err := parseResumeResponse(response)
	if err != nil {
		return nil, fmt.Errorf("failed to parse resume response: %w", err)
	}

	return output, nil
}

func parseResumeResponse(response string) (*ResumeParseOutput, error) {
	// Clean the response - remove markdown code blocks if present
	response = strings.TrimSpace(response)
	response = strings.TrimPrefix(response, "```json")
	response = strings.TrimPrefix(response, "```")
	response = strings.TrimSuffix(response, "```")
	response = strings.TrimSpace(response)

	var result ResumeParseOutput
	if err := json.Unmarshal([]byte(response), &result); err != nil {
		return nil, fmt.Errorf("invalid JSON response: %w\nResponse was: %s", err, response)
	}

	return &result, nil
}
