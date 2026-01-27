package models

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestJobWorkSample_TableName(t *testing.T) {
	jws := JobWorkSample{}
	assert.Equal(t, "job_work_samples", jws.TableName())
}

func TestJobWorkSample_ToResponse(t *testing.T) {
	now := time.Now()
	scorecardID := "scorecard-123"
	estimatedTime := 60

	sections := []WorkSampleSection{
		{
			Title:                "API Design",
			Description:          "Design a REST API",
			Instructions:         "Create endpoints for payments",
			EstimatedTimeMinutes: 30,
			CriteriaEvaluated:    []string{"Technical Skills", "Problem Solving"},
			Rubric:               "We evaluate the quality of the design",
		},
	}
	sectionsJSON, _ := json.Marshal(sections)

	rules := []string{"Use any documentation", "No proprietary code"}
	rulesJSON, _ := json.Marshal(rules)

	jws := &JobWorkSample{
		ID:                   "test-id",
		JobID:                "job-123",
		ScorecardID:          &scorecardID,
		IntroMessage:         "Welcome to this exercise",
		Rules:                rulesJSON,
		Sections:             sectionsJSON,
		EstimatedTimeMinutes: &estimatedTime,
		GeneratedAt:          &now,
		PromptVersion:        "v1.0",
		CreatedAt:            now,
		UpdatedAt:            now,
	}

	response := jws.ToResponse()

	assert.Equal(t, "test-id", response.ID)
	assert.Equal(t, "job-123", response.JobID)
	assert.Equal(t, &scorecardID, response.ScorecardID)
	assert.Equal(t, "Welcome to this exercise", response.IntroMessage)
	assert.Len(t, response.Rules, 2)
	assert.Contains(t, response.Rules, "Use any documentation")
	assert.Len(t, response.Sections, 1)
	assert.Equal(t, "API Design", response.Sections[0].Title)
	assert.Equal(t, 30, response.Sections[0].EstimatedTimeMinutes)
	assert.Equal(t, 60, *response.EstimatedTimeMinutes)
	assert.Equal(t, "v1.0", response.PromptVersion)
}

func TestJobWorkSample_ToResponse_EmptyData(t *testing.T) {
	jws := &JobWorkSample{
		ID:       "test-id",
		JobID:    "job-123",
		Rules:    nil,
		Sections: nil,
	}

	response := jws.ToResponse()

	assert.Equal(t, "test-id", response.ID)
	assert.Empty(t, response.Rules)
	assert.Empty(t, response.Sections)
}

func TestJobWorkSample_ToResponse_InvalidJSON(t *testing.T) {
	jws := &JobWorkSample{
		ID:       "test-id",
		JobID:    "job-123",
		Rules:    json.RawMessage(`invalid json`),
		Sections: json.RawMessage(`also invalid`),
	}

	response := jws.ToResponse()

	assert.Equal(t, "test-id", response.ID)
	assert.Empty(t, response.Rules)    // Should default to empty on parse error
	assert.Empty(t, response.Sections) // Should default to empty on parse error
}

func TestJobWorkSample_GetSections(t *testing.T) {
	sections := []WorkSampleSection{
		{Title: "Section 1", EstimatedTimeMinutes: 20},
		{Title: "Section 2", EstimatedTimeMinutes: 30},
	}
	sectionsJSON, _ := json.Marshal(sections)

	jws := &JobWorkSample{
		Sections: sectionsJSON,
	}

	result := jws.GetSections()

	assert.Len(t, result, 2)
	assert.Equal(t, "Section 1", result[0].Title)
	assert.Equal(t, "Section 2", result[1].Title)
}

func TestJobWorkSample_GetSections_Empty(t *testing.T) {
	jws := &JobWorkSample{
		Sections: nil,
	}

	result := jws.GetSections()

	assert.Empty(t, result)
}

func TestJobWorkSample_SetSections(t *testing.T) {
	jws := &JobWorkSample{}
	sections := []WorkSampleSection{
		{
			Title:                "Test Section",
			Description:          "Test Description",
			Instructions:         "Test Instructions",
			EstimatedTimeMinutes: 25,
			CriteriaEvaluated:    []string{"Criterion 1"},
			Rubric:               "Test Rubric",
		},
	}

	err := jws.SetSections(sections)

	require.NoError(t, err)
	assert.NotEmpty(t, jws.Sections)

	// Verify by parsing back
	result := jws.GetSections()
	assert.Len(t, result, 1)
	assert.Equal(t, "Test Section", result[0].Title)
	assert.Equal(t, 25, result[0].EstimatedTimeMinutes)
}

func TestJobWorkSample_GetRules(t *testing.T) {
	rules := []string{"Rule 1", "Rule 2", "Rule 3"}
	rulesJSON, _ := json.Marshal(rules)

	jws := &JobWorkSample{
		Rules: rulesJSON,
	}

	result := jws.GetRules()

	assert.Len(t, result, 3)
	assert.Contains(t, result, "Rule 1")
	assert.Contains(t, result, "Rule 2")
	assert.Contains(t, result, "Rule 3")
}

func TestJobWorkSample_GetRules_Empty(t *testing.T) {
	jws := &JobWorkSample{
		Rules: nil,
	}

	result := jws.GetRules()

	assert.Empty(t, result)
}

func TestJobWorkSample_SetRules(t *testing.T) {
	jws := &JobWorkSample{}
	rules := []string{"No cheating", "Use documentation freely"}

	err := jws.SetRules(rules)

	require.NoError(t, err)
	assert.NotEmpty(t, jws.Rules)

	// Verify by parsing back
	result := jws.GetRules()
	assert.Len(t, result, 2)
	assert.Contains(t, result, "No cheating")
	assert.Contains(t, result, "Use documentation freely")
}

func TestWorkSampleSection_JSON(t *testing.T) {
	section := WorkSampleSection{
		Title:                "API Design Challenge",
		Description:          "Design a payment API",
		Instructions:         "Create CRUD endpoints for payments",
		EstimatedTimeMinutes: 30,
		CriteriaEvaluated:    []string{"Technical Skills", "Problem Solving"},
		Rubric:               "Evaluate architecture quality and code clarity",
	}

	// Marshal
	data, err := json.Marshal(section)
	require.NoError(t, err)

	// Unmarshal
	var result WorkSampleSection
	err = json.Unmarshal(data, &result)
	require.NoError(t, err)

	assert.Equal(t, section.Title, result.Title)
	assert.Equal(t, section.Description, result.Description)
	assert.Equal(t, section.Instructions, result.Instructions)
	assert.Equal(t, section.EstimatedTimeMinutes, result.EstimatedTimeMinutes)
	assert.ElementsMatch(t, section.CriteriaEvaluated, result.CriteriaEvaluated)
	assert.Equal(t, section.Rubric, result.Rubric)
}
