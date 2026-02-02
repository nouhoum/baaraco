package models

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestInterviewKit_TableName(t *testing.T) {
	kit := InterviewKit{}
	assert.Equal(t, "interview_kits", kit.TableName())
}

//nolint:misspell // false positive
func TestInterviewKit_ToResponse(t *testing.T) {
	now := time.Now()
	sections := []InterviewKitSection{
		{
			Title:           "Validation des zones d'ombre",
			DurationMinutes: 25,
			Questions: []InterviewQuestion{
				{
					Question:        "Parlez-nous de votre experience avec les microservices",
					Context:         "Le candidat a un score faible sur ce critere",
					PositiveSignals: []string{"Exemples concrets", "Architecture claire"},
					NegativeSignals: []string{"Reponses vagues"},
					FollowUp:        "Pouvez-vous donner un exemple specifique ?",
				},
			},
		},
	}
	debrief := DebriefTemplate{
		Criteria: []DebriefCriterion{
			{Name: "Technical Skills", Score: 75, Reevaluate: true},
		},
		FinalRecommendationPrompt: "Recommandez-vous ce candidat ?",
	}
	notes := map[string]string{
		"q1": "Bonne reponse", //nolint:misspell // false positive
	}

	sectionsJSON, _ := json.Marshal(sections)
	debriefJSON, _ := json.Marshal(debrief)
	notesJSON, _ := json.Marshal(notes)

	jobID := "job-001"
	kit := &InterviewKit{
		ID:                   "ik-123",
		ProofProfileID:       "pp-456",
		CandidateID:          "user-789",
		JobID:                &jobID,
		TotalDurationMinutes: 60,
		Sections:             sectionsJSON,
		DebriefTemplate:      debriefJSON,
		Notes:                notesJSON,
		GeneratedAt:          &now,
		CreatedAt:            now,
		UpdatedAt:            now,
	}

	resp := kit.ToResponse()

	assert.Equal(t, "ik-123", resp.ID)
	assert.Equal(t, "pp-456", resp.ProofProfileID)
	assert.Equal(t, "user-789", resp.CandidateID)
	assert.Equal(t, &jobID, resp.JobID)
	assert.Equal(t, 60, resp.TotalDurationMinutes)
	assert.Len(t, resp.Sections, 1)
	assert.Equal(t, "Validation des zones d'ombre", resp.Sections[0].Title)
	assert.Equal(t, 25, resp.Sections[0].DurationMinutes)
	assert.Len(t, resp.Sections[0].Questions, 1)
	assert.Equal(t, "Parlez-nous de votre experience avec les microservices", resp.Sections[0].Questions[0].Question)
	assert.Len(t, resp.Sections[0].Questions[0].PositiveSignals, 2)
	assert.Len(t, resp.Sections[0].Questions[0].NegativeSignals, 1)
	assert.Len(t, resp.DebriefTemplate.Criteria, 1)
	assert.Equal(t, "Technical Skills", resp.DebriefTemplate.Criteria[0].Name)
	assert.True(t, resp.DebriefTemplate.Criteria[0].Reevaluate)
	assert.Equal(t, "Recommandez-vous ce candidat ?", resp.DebriefTemplate.FinalRecommendationPrompt) //nolint:misspell // false positive
	assert.Equal(t, "Bonne reponse", resp.Notes["q1"])                                                //nolint:misspell // false positive
	assert.NotNil(t, resp.GeneratedAt)
}

func TestInterviewKit_ToResponse_Empty(t *testing.T) {
	kit := &InterviewKit{
		ID: "ik-123",
	}

	resp := kit.ToResponse()

	assert.Equal(t, "ik-123", resp.ID)
	assert.Empty(t, resp.Sections)
	assert.Empty(t, resp.DebriefTemplate.Criteria)
	assert.Empty(t, resp.Notes)
}

func TestInterviewKit_ToResponse_InvalidJSON(t *testing.T) {
	kit := &InterviewKit{
		ID:              "ik-123",
		Sections:        json.RawMessage(`invalid`),
		DebriefTemplate: json.RawMessage(`invalid`),
		Notes:           json.RawMessage(`invalid`),
	}

	resp := kit.ToResponse()

	assert.Equal(t, "ik-123", resp.ID)
	assert.Empty(t, resp.Sections)
	assert.Empty(t, resp.DebriefTemplate.Criteria)
	assert.Empty(t, resp.Notes)
}

func TestInterviewKit_SetGetSections(t *testing.T) {
	kit := &InterviewKit{}
	sections := []InterviewKitSection{
		{
			Title:           "Test Section",
			DurationMinutes: 20,
			Questions: []InterviewQuestion{
				{
					Question:        "Test question?",
					Context:         "Context here",
					PositiveSignals: []string{"Good"},
					NegativeSignals: []string{"Bad"},
					FollowUp:        "Follow up?",
				},
			},
		},
	}

	err := kit.SetSections(sections)
	require.NoError(t, err)
	assert.NotEmpty(t, kit.Sections)

	// Verify via ToResponse
	resp := kit.ToResponse()
	assert.Len(t, resp.Sections, 1)
	assert.Equal(t, "Test Section", resp.Sections[0].Title)
	assert.Equal(t, 20, resp.Sections[0].DurationMinutes)
}

func TestInterviewKit_SetGetDebriefTemplate(t *testing.T) {
	kit := &InterviewKit{}
	dt := DebriefTemplate{
		Criteria: []DebriefCriterion{
			{Name: "Tech", Score: 80, Reevaluate: true},
			{Name: "Communication", Score: 90, Reevaluate: false},
		},
		FinalRecommendationPrompt: "Custom prompt",
	}

	err := kit.SetDebriefTemplate(dt)
	require.NoError(t, err)
	assert.NotEmpty(t, kit.DebriefTemplate)

	resp := kit.ToResponse()
	assert.Len(t, resp.DebriefTemplate.Criteria, 2)
	assert.Equal(t, "Custom prompt", resp.DebriefTemplate.FinalRecommendationPrompt)
}

func TestInterviewKit_SetGetNotes(t *testing.T) {
	kit := &InterviewKit{}

	// Initially empty
	notes := kit.GetNotes()
	assert.Empty(t, notes)

	// Set notes
	err := kit.SetNotes(map[string]string{
		"q1": "Good answer",
		"q2": "Needs improvement",
	})
	require.NoError(t, err)

	// Get notes back
	notes = kit.GetNotes()
	assert.Len(t, notes, 2)
	assert.Equal(t, "Good answer", notes["q1"])
	assert.Equal(t, "Needs improvement", notes["q2"])
}

func TestInterviewKit_GetNotes_InvalidJSON(t *testing.T) {
	kit := &InterviewKit{
		Notes: json.RawMessage(`invalid`),
	}

	notes := kit.GetNotes()
	assert.Empty(t, notes)
}

func TestInterviewKitSection_JSON(t *testing.T) {
	section := InterviewKitSection{
		Title:           "Test",
		DurationMinutes: 25,
		Questions: []InterviewQuestion{
			{
				Question:        "Q1",
				Context:         "Context",
				PositiveSignals: []string{"Good"},
				NegativeSignals: []string{"Bad"},
				FollowUp:        "Follow",
			},
		},
	}

	data, err := json.Marshal(section)
	require.NoError(t, err)

	var result InterviewKitSection
	err = json.Unmarshal(data, &result)
	require.NoError(t, err)

	assert.Equal(t, section.Title, result.Title)
	assert.Equal(t, section.DurationMinutes, result.DurationMinutes)
	assert.Len(t, result.Questions, 1)
	assert.Equal(t, "Q1", result.Questions[0].Question)
}

func TestDebriefTemplate_JSON(t *testing.T) {
	dt := DebriefTemplate{
		Criteria: []DebriefCriterion{
			{Name: "Tech", Score: 85, Reevaluate: true},
		},
		FinalRecommendationPrompt: "Prompt here",
	}

	data, err := json.Marshal(dt)
	require.NoError(t, err)

	var result DebriefTemplate
	err = json.Unmarshal(data, &result)
	require.NoError(t, err)

	assert.Equal(t, dt.FinalRecommendationPrompt, result.FinalRecommendationPrompt)
	assert.Len(t, result.Criteria, 1)
	assert.Equal(t, "Tech", result.Criteria[0].Name)
	assert.True(t, result.Criteria[0].Reevaluate)
}
