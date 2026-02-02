package ai

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"

	"github.com/baaraco/baara/pkg/models"
)

const interviewPromptVersion = "v1.0"

// ConversationManager orchestrates the conversational AI interview
type ConversationManager struct {
	Session   *models.InterviewSession
	Sections  []models.WorkSampleSection
	Criteria  []models.ScorecardCriterion
	JobTitle  string
	Seniority string
}

// NewConversationManager creates a new conversation manager
func NewConversationManager(
	session *models.InterviewSession,
	sections []models.WorkSampleSection,
	criteria []models.ScorecardCriterion,
	jobTitle, seniority string,
) *ConversationManager {
	return &ConversationManager{
		Session:   session,
		Sections:  sections,
		Criteria:  criteria,
		JobTitle:  jobTitle,
		Seniority: seniority,
	}
}

//nolint:misspell // false positive on French text
func (cm *ConversationManager) BuildSystemPrompt() string {
	var sb strings.Builder

	sb.WriteString(fmt.Sprintf(`Tu es un intervieweur technique expert qui conduit un entretien pour le poste de %s (%s).

Tu dois explorer les compétences du candidat à travers une conversation naturelle et professionnelle.
Tu couvres les sujets un par un. Pour chaque sujet, tu poses une question ouverte basée sur le scénario décrit,
écoutes la réponse, puis poses 1 à 3 questions de suivi selon la qualité et la profondeur de la réponse.

`, cm.JobTitle, cm.Seniority))

	// Topics (from work sample sections)
	sb.WriteString("== SUJETS À COUVRIR ==\n\n")
	for i, section := range cm.Sections {
		sb.WriteString(fmt.Sprintf("--- Sujet %d: %s ---\n", i+1, section.Title))
		sb.WriteString(fmt.Sprintf("Description: %s\n", section.Description))
		sb.WriteString(fmt.Sprintf("Instructions: %s\n", section.Instructions))
		if section.Rubric != "" {
			sb.WriteString(fmt.Sprintf("Ce qu'on cherche: %s\n", section.Rubric))
		}
		if len(section.CriteriaEvaluated) > 0 {
			sb.WriteString(fmt.Sprintf("Critères évalués: %s\n", strings.Join(section.CriteriaEvaluated, ", ")))
		}
		sb.WriteString("\n")
	}

	// Scorecard criteria
	sb.WriteString("== CRITÈRES D'ÉVALUATION (CONFIDENTIEL) ==\n\n")
	for _, c := range cm.Criteria {
		sb.WriteString(fmt.Sprintf("- %s (poids: %s)\n", c.Name, c.Weight))
		sb.WriteString(fmt.Sprintf("  Description: %s\n", c.Description))
		if len(c.PositiveSignals) > 0 {
			sb.WriteString(fmt.Sprintf("  Signaux positifs: %s\n", strings.Join(c.PositiveSignals, "; ")))
		}
		if len(c.NegativeSignals) > 0 {
			sb.WriteString(fmt.Sprintf("  Signaux négatifs: %s\n", strings.Join(c.NegativeSignals, "; ")))
		}
		if len(c.RedFlags) > 0 {
			sb.WriteString(fmt.Sprintf("  Red flags: %s\n", strings.Join(c.RedFlags, "; ")))
		}
		sb.WriteString("\n")
	}

	sb.WriteString(`== RÈGLES DE CONDUITE ==

1. Pose UNE seule question à la fois. Attends toujours la réponse avant de continuer.
2. Si la réponse est vague ou superficielle, demande des précisions ou un exemple concret.
3. Si tu détectes une incohérence avec une réponse précédente, pose une question pour clarifier sans être accusateur.
4. Quand un sujet est suffisamment couvert (2-4 échanges par sujet), passe au suivant avec une transition naturelle.
5. Sois professionnel, bienveillant mais rigoureux.
6. Ne révèle JAMAIS les critères d'évaluation, la scorecard, ou ce que tu cherches spécifiquement.
7. Ne donne JAMAIS de feedback sur la qualité des réponses pendant l'entretien.
8. Ne pose JAMAIS de questions théoriques abstraites — ancre tout dans des situations concrètes.
9. Si le candidat dit ne pas avoir d'expérience sur un point, pose une question hypothétique : "Comment aborderiez-vous...?"

== BALISES DE CONTRÔLE ==

Quand tu passes au sujet suivant, inclus la balise [TOPIC_CHANGE:{numéro du nouveau sujet, commençant à 0}] à la fin de ton message.
Quand TOUS les sujets sont couverts, inclus la balise [INTERVIEW_COMPLETE] à la fin de ton dernier message.
Ces balises seront automatiquement retirées avant l'affichage au candidat.

== FORMAT ==

Parle de manière conversationnelle. Pas de listes, pas de formatage lourd, pas de markdown.
Commence par te présenter brièvement comme l'intervieweur IA de Baara, explique le format (entretien conversationnel, plusieurs sujets), et pose la première question du premier sujet.
`)

	return sb.String()
}

// BuildMessages returns the full conversation history as ConversationMessage slice
func (cm *ConversationManager) BuildMessages() []ConversationMessage {
	messages, err := cm.Session.GetMessages()
	if err != nil {
		return []ConversationMessage{}
	}

	result := make([]ConversationMessage, 0, len(messages))
	for _, msg := range messages {
		result = append(result, ConversationMessage{
			Role:    msg.Role,
			Content: msg.Content,
		})
	}

	return result
}

var (
	topicChangeRegex     = regexp.MustCompile(`\[TOPIC_CHANGE:(\d+)\]`)
	interviewCompleteTag = "[INTERVIEW_COMPLETE]"
)

// ProcessAIResponse parses control tags from the AI response and returns
// the display text (tags stripped), whether a topic changed, and the new topic index
func ProcessAIResponse(raw string) (display string, topicChanged bool, newTopicIndex int, interviewComplete bool) {
	display = raw

	// Check for interview complete
	if strings.Contains(display, interviewCompleteTag) {
		interviewComplete = true
		display = strings.ReplaceAll(display, interviewCompleteTag, "")
	}

	// Check for topic change
	matches := topicChangeRegex.FindStringSubmatch(display)
	if len(matches) >= 2 {
		topicChanged = true
		if idx, aErr := strconv.Atoi(matches[1]); aErr == nil {
			newTopicIndex = idx
		}
		display = topicChangeRegex.ReplaceAllString(display, "")
	}

	display = strings.TrimSpace(display)
	return
}

// ConvertToAnswers transforms the conversation transcript into the map[string]string
// format expected by the existing evaluation pipeline.
// Each section key maps to a formatted Q&A transcript.
func (cm *ConversationManager) ConvertToAnswers() map[string]string {
	messages, err := cm.Session.GetMessages()
	if err != nil {
		return map[string]string{}
	}

	// Group messages by topic index
	type topicMessages struct {
		messages []models.InterviewMessage
	}
	topics := make(map[int]*topicMessages)

	for _, msg := range messages {
		if _, ok := topics[msg.TopicIndex]; !ok {
			topics[msg.TopicIndex] = &topicMessages{}
		}
		topics[msg.TopicIndex].messages = append(topics[msg.TopicIndex].messages, msg)
	}

	// Build answers map keyed by section title
	answers := make(map[string]string)
	for i, section := range cm.Sections {
		tm, ok := topics[i]
		if !ok {
			answers[section.Title] = ""
			continue
		}

		var sb strings.Builder
		for _, msg := range tm.messages {
			switch msg.Role {
			case "assistant":
				sb.WriteString("Q: ")
				sb.WriteString(msg.Content)
				sb.WriteString("\n\n")
			case "user":
				sb.WriteString("A: ")
				sb.WriteString(msg.Content)
				sb.WriteString("\n\n")
			}
		}
		answers[section.Title] = strings.TrimSpace(sb.String())
	}

	return answers
}

// GetInterviewPromptVersion returns the current prompt version
func GetInterviewPromptVersion() string {
	return interviewPromptVersion
}
