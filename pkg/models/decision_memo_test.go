package models

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestDecisionMemo_TableName(t *testing.T) {
	memo := DecisionMemo{}
	assert.Equal(t, "decision_memos", memo.TableName())
}

func TestDecisionMemo_ToResponse(t *testing.T) {
	now := time.Now()
	evals := []PostInterviewEvaluation{
		{CriterionName: "Technical Skills", PreInterviewScore: 85, PostInterviewScore: 90, Notes: "Confirmed strong"},
	}
	strengths := []string{"Clean code", "Good architecture"}
	risks := []IdentifiedRisk{
		{Risk: "Limited team experience", Mitigation: "Pair programming onboarding"},
	}
	nextSteps := map[string]string{"offer_date": "2025-06-01", "start_date": "2025-07-01"}

	evalsJSON, _ := json.Marshal(evals)
	strengthsJSON, _ := json.Marshal(strengths)
	risksJSON, _ := json.Marshal(risks)
	nextStepsJSON, _ := json.Marshal(nextSteps)

	memo := &DecisionMemo{
		ID:                       "dm-123",
		JobID:                    "job-001",
		CandidateID:              "user-001",
		RecruiterID:              "user-002",
		Decision:                 DecisionHire,
		PostInterviewEvaluations: evalsJSON,
		ConfirmedStrengths:       strengthsJSON,
		IdentifiedRisks:          risksJSON,
		Justification:            "Strong candidate overall",
		NextSteps:                nextStepsJSON,
		Status:                   DecisionMemoSubmitted,
		SubmittedAt:              &now,
		CreatedAt:                now,
		UpdatedAt:                now,
	}

	resp := memo.ToResponse()

	assert.Equal(t, "dm-123", resp.ID)
	assert.Equal(t, "job-001", resp.JobID)
	assert.Equal(t, "user-001", resp.CandidateID)
	assert.Equal(t, "user-002", resp.RecruiterID)
	assert.Equal(t, DecisionHire, resp.Decision)
	assert.Len(t, resp.PostInterviewEvaluations, 1)
	assert.Equal(t, "Technical Skills", resp.PostInterviewEvaluations[0].CriterionName)
	assert.Equal(t, 85, resp.PostInterviewEvaluations[0].PreInterviewScore)
	assert.Equal(t, 90, resp.PostInterviewEvaluations[0].PostInterviewScore)
	assert.Len(t, resp.ConfirmedStrengths, 2)
	assert.Equal(t, "Clean code", resp.ConfirmedStrengths[0])
	assert.Len(t, resp.IdentifiedRisks, 1)
	assert.Equal(t, "Limited team experience", resp.IdentifiedRisks[0].Risk)
	assert.Equal(t, "Pair programming onboarding", resp.IdentifiedRisks[0].Mitigation)
	assert.Equal(t, "Strong candidate overall", resp.Justification)
	assert.Equal(t, "2025-06-01", resp.NextSteps["offer_date"])
	assert.Equal(t, DecisionMemoSubmitted, resp.Status)
	assert.NotNil(t, resp.SubmittedAt)
}

func TestDecisionMemo_ToResponse_Empty(t *testing.T) {
	memo := &DecisionMemo{ID: "dm-123"}
	resp := memo.ToResponse()

	assert.Equal(t, "dm-123", resp.ID)
	assert.Empty(t, resp.PostInterviewEvaluations)
	assert.Empty(t, resp.ConfirmedStrengths)
	assert.Empty(t, resp.IdentifiedRisks)
	assert.Empty(t, resp.NextSteps)
}

func TestDecisionMemo_ToResponse_InvalidJSON(t *testing.T) {
	memo := &DecisionMemo{
		ID:                       "dm-123",
		PostInterviewEvaluations: json.RawMessage(`invalid`),
		ConfirmedStrengths:       json.RawMessage(`invalid`),
		IdentifiedRisks:          json.RawMessage(`invalid`),
		NextSteps:                json.RawMessage(`invalid`),
	}

	resp := memo.ToResponse()

	assert.Equal(t, "dm-123", resp.ID)
	assert.Empty(t, resp.PostInterviewEvaluations)
	assert.Empty(t, resp.ConfirmedStrengths)
	assert.Empty(t, resp.IdentifiedRisks)
	assert.Empty(t, resp.NextSteps)
}

func TestDecisionMemo_SetGetPostInterviewEvaluations(t *testing.T) {
	memo := &DecisionMemo{}
	evals := []PostInterviewEvaluation{
		{CriterionName: "Tech", PreInterviewScore: 80, PostInterviewScore: 85, Notes: "Good"},
	}

	err := memo.SetPostInterviewEvaluations(evals)
	require.NoError(t, err)
	assert.NotEmpty(t, memo.PostInterviewEvaluations)

	result := memo.GetPostInterviewEvaluations()
	assert.Len(t, result, 1)
	assert.Equal(t, "Tech", result[0].CriterionName)
	assert.Equal(t, 85, result[0].PostInterviewScore)
}

func TestDecisionMemo_SetGetConfirmedStrengths(t *testing.T) {
	memo := &DecisionMemo{}
	strengths := []string{"Strength 1", "Strength 2"}

	err := memo.SetConfirmedStrengths(strengths)
	require.NoError(t, err)

	result := memo.GetConfirmedStrengths()
	assert.Len(t, result, 2)
	assert.Equal(t, "Strength 1", result[0])
}

func TestDecisionMemo_SetGetIdentifiedRisks(t *testing.T) {
	memo := &DecisionMemo{}
	risks := []IdentifiedRisk{
		{Risk: "Risk 1", Mitigation: "Mitigation 1"},
	}

	err := memo.SetIdentifiedRisks(risks)
	require.NoError(t, err)

	result := memo.GetIdentifiedRisks()
	assert.Len(t, result, 1)
	assert.Equal(t, "Risk 1", result[0].Risk)
}

func TestDecisionMemo_SetGetNextSteps(t *testing.T) {
	memo := &DecisionMemo{}

	// Initially empty
	ns := memo.GetNextSteps()
	assert.Empty(t, ns)

	// Set
	err := memo.SetNextSteps(map[string]string{"offer_date": "2025-06-01"})
	require.NoError(t, err)

	ns = memo.GetNextSteps()
	assert.Equal(t, "2025-06-01", ns["offer_date"])
}

func TestPostInterviewEvaluation_JSON(t *testing.T) {
	eval := PostInterviewEvaluation{
		CriterionName:      "Tech",
		PreInterviewScore:  80,
		PostInterviewScore: 90,
		Notes:              "Improved",
	}

	data, err := json.Marshal(eval)
	require.NoError(t, err)

	var result PostInterviewEvaluation
	err = json.Unmarshal(data, &result)
	require.NoError(t, err)

	assert.Equal(t, eval.CriterionName, result.CriterionName)
	assert.Equal(t, eval.PreInterviewScore, result.PreInterviewScore)
	assert.Equal(t, eval.PostInterviewScore, result.PostInterviewScore)
}

func TestIdentifiedRisk_JSON(t *testing.T) {
	risk := IdentifiedRisk{
		Risk:       "Limited experience",
		Mitigation: "Training plan",
	}

	data, err := json.Marshal(risk)
	require.NoError(t, err)

	var result IdentifiedRisk
	err = json.Unmarshal(data, &result)
	require.NoError(t, err)

	assert.Equal(t, risk.Risk, result.Risk)
	assert.Equal(t, risk.Mitigation, result.Mitigation)
}
