package models

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestScorecard_TableName(t *testing.T) {
	scorecard := Scorecard{}
	assert.Equal(t, "scorecards", scorecard.TableName())
}

func TestScorecard_ToResponse(t *testing.T) {
	now := time.Now()
	criteria := []ScorecardCriterion{
		{
			Name:            "Technical Skills",
			Description:     "Ability to write clean code",
			Weight:          WeightCritical,
			PositiveSignals: []string{"Clean code", "Good patterns"},
			NegativeSignals: []string{"Messy code"},
			RedFlags:        []string{"Cannot explain code"},
		},
	}
	criteriaJSON, _ := json.Marshal(criteria)

	scorecard := &Scorecard{
		ID:            "test-id",
		JobID:         "job-123",
		Criteria:      criteriaJSON,
		GeneratedAt:   &now,
		PromptVersion: "v1.0",
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	response := scorecard.ToResponse()

	assert.Equal(t, "test-id", response.ID)
	assert.Equal(t, "job-123", response.JobID)
	assert.Len(t, response.Criteria, 1)
	assert.Equal(t, "Technical Skills", response.Criteria[0].Name)
	assert.Equal(t, WeightCritical, response.Criteria[0].Weight)
	assert.Equal(t, "v1.0", response.PromptVersion)
	assert.NotNil(t, response.GeneratedAt)
}

func TestScorecard_ToResponse_EmptyCriteria(t *testing.T) {
	scorecard := &Scorecard{
		ID:       "test-id",
		JobID:    "job-123",
		Criteria: nil,
	}

	response := scorecard.ToResponse()

	assert.Equal(t, "test-id", response.ID)
	assert.Empty(t, response.Criteria)
}

func TestScorecard_ToResponse_InvalidJSON(t *testing.T) {
	scorecard := &Scorecard{
		ID:       "test-id",
		JobID:    "job-123",
		Criteria: json.RawMessage(`invalid json`),
	}

	response := scorecard.ToResponse()

	assert.Equal(t, "test-id", response.ID)
	assert.Empty(t, response.Criteria) // Should default to empty array on parse error
}

func TestScorecard_GetCriteria(t *testing.T) {
	criteria := []ScorecardCriterion{
		{Name: "Criterion 1", Weight: WeightCritical},
		{Name: "Criterion 2", Weight: WeightImportant},
	}
	criteriaJSON, _ := json.Marshal(criteria)

	scorecard := &Scorecard{
		Criteria: criteriaJSON,
	}

	result := scorecard.GetCriteria()

	assert.Len(t, result, 2)
	assert.Equal(t, "Criterion 1", result[0].Name)
	assert.Equal(t, "Criterion 2", result[1].Name)
}

func TestScorecard_GetCriteria_Empty(t *testing.T) {
	scorecard := &Scorecard{
		Criteria: nil,
	}

	result := scorecard.GetCriteria()

	assert.Empty(t, result)
}

func TestScorecard_SetCriteria(t *testing.T) {
	scorecard := &Scorecard{}
	criteria := []ScorecardCriterion{
		{
			Name:        "Test Criterion",
			Description: "Test Description",
			Weight:      WeightImportant,
		},
	}

	err := scorecard.SetCriteria(criteria)

	require.NoError(t, err)
	assert.NotEmpty(t, scorecard.Criteria)

	// Verify by parsing back
	result := scorecard.GetCriteria()
	assert.Len(t, result, 1)
	assert.Equal(t, "Test Criterion", result[0].Name)
}

func TestCriterionWeight_Values(t *testing.T) {
	assert.Equal(t, CriterionWeight("critical"), WeightCritical)
	assert.Equal(t, CriterionWeight("important"), WeightImportant)
	assert.Equal(t, CriterionWeight("nice_to_have"), WeightNiceToHave)
}

func TestScorecardCriterion_JSON(t *testing.T) {
	criterion := ScorecardCriterion{
		Name:            "Communication",
		Description:     "Ability to communicate clearly",
		Weight:          WeightImportant,
		PositiveSignals: []string{"Clear explanations", "Active listening"},
		NegativeSignals: []string{"Vague responses"},
		RedFlags:        []string{"Cannot explain basic concepts"},
	}

	// Marshal
	data, err := json.Marshal(criterion)
	require.NoError(t, err)

	// Unmarshal
	var result ScorecardCriterion
	err = json.Unmarshal(data, &result)
	require.NoError(t, err)

	assert.Equal(t, criterion.Name, result.Name)
	assert.Equal(t, criterion.Description, result.Description)
	assert.Equal(t, criterion.Weight, result.Weight)
	assert.ElementsMatch(t, criterion.PositiveSignals, result.PositiveSignals)
	assert.ElementsMatch(t, criterion.NegativeSignals, result.NegativeSignals)
	assert.ElementsMatch(t, criterion.RedFlags, result.RedFlags)
}
