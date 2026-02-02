package models

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestProofProfile_TableName(t *testing.T) {
	profile := ProofProfile{}
	assert.Equal(t, "proof_profiles", profile.TableName())
}

func TestProofProfile_ToResponse(t *testing.T) {
	now := time.Now()
	criteriaSummary := []CriterionSummary{
		{Name: "Technical Skills", Score: 85, Weight: WeightCritical, Status: "strong", Headline: "Excellent technical background"},
	}
	strengths := []StrengthItem{
		{CriterionName: "Technical Skills", Score: 85, Signals: []string{"Clean code"}, Evidence: "Demonstrated solid coding"},
	}
	areas := []AreaToExplore{
		{CriterionName: "Leadership", Score: 55, Concerns: []string{"Limited examples"}, SuggestedQuestions: []string{"Tell me about leading a team"}},
	}
	redFlags := []RedFlagItem{
		{CriterionName: "Communication", Flags: []string{"Vague answers"}},
	}
	focusPoints := []InterviewFocusPoint{
		{Topic: "Technical Skills", Reason: "Score élevé à confirmer", Type: "verify_strength"},
	}

	csJSON, _ := json.Marshal(criteriaSummary)
	sJSON, _ := json.Marshal(strengths)
	aJSON, _ := json.Marshal(areas)
	rfJSON, _ := json.Marshal(redFlags)
	fpJSON, _ := json.Marshal(focusPoints)

	jobID := "job-001"
	profile := &ProofProfile{
		ID:                   "pp-123",
		EvaluationID:         "eval-456",
		AttemptID:            "attempt-789",
		JobID:                &jobID,
		CandidateID:          "user-001",
		GlobalScore:          85,
		ScoreLabel:           "bon",
		Percentile:           80,
		Recommendation:       RecommendationProceed,
		OneLiner:             "Strong candidate",
		CriteriaSummary:      csJSON,
		Strengths:            sJSON,
		AreasToExplore:       aJSON,
		RedFlags:             rfJSON,
		InterviewFocusPoints: fpJSON,
		GeneratedAt:          &now,
		CreatedAt:            now,
		UpdatedAt:            now,
	}

	resp := profile.ToResponse()

	assert.Equal(t, "pp-123", resp.ID)
	assert.Equal(t, "eval-456", resp.EvaluationID)
	assert.Equal(t, "attempt-789", resp.AttemptID)
	assert.Equal(t, &jobID, resp.JobID)
	assert.Equal(t, "user-001", resp.CandidateID)
	assert.Equal(t, 85, resp.GlobalScore)
	assert.Equal(t, "bon", resp.ScoreLabel)
	assert.Equal(t, 80, resp.Percentile)
	assert.Equal(t, RecommendationProceed, resp.Recommendation)
	assert.Equal(t, "Strong candidate", resp.OneLiner)
	assert.Len(t, resp.CriteriaSummary, 1)
	assert.Equal(t, "Technical Skills", resp.CriteriaSummary[0].Name)
	assert.Len(t, resp.Strengths, 1)
	assert.Len(t, resp.AreasToExplore, 1)
	assert.Len(t, resp.RedFlags, 1)
	assert.Len(t, resp.InterviewFocusPoints, 1)
	assert.NotNil(t, resp.GeneratedAt)
}

func TestProofProfile_ToResponse_Empty(t *testing.T) {
	profile := &ProofProfile{
		ID: "pp-123",
	}

	resp := profile.ToResponse()

	assert.Equal(t, "pp-123", resp.ID)
	assert.Empty(t, resp.CriteriaSummary)
	assert.Empty(t, resp.Strengths)
	assert.Empty(t, resp.AreasToExplore)
	assert.Empty(t, resp.RedFlags)
	assert.Empty(t, resp.InterviewFocusPoints)
}

func TestProofProfile_ToResponse_InvalidJSON(t *testing.T) {
	profile := &ProofProfile{
		ID:                   "pp-123",
		CriteriaSummary:      json.RawMessage(`invalid`),
		Strengths:            json.RawMessage(`invalid`),
		AreasToExplore:       json.RawMessage(`invalid`),
		RedFlags:             json.RawMessage(`invalid`),
		InterviewFocusPoints: json.RawMessage(`invalid`),
	}

	resp := profile.ToResponse()

	assert.Equal(t, "pp-123", resp.ID)
	assert.Empty(t, resp.CriteriaSummary)
	assert.Empty(t, resp.Strengths)
	assert.Empty(t, resp.AreasToExplore)
	assert.Empty(t, resp.RedFlags)
	assert.Empty(t, resp.InterviewFocusPoints)
}

func TestProofProfile_SetGetCriteriaSummary(t *testing.T) {
	profile := &ProofProfile{}
	cs := []CriterionSummary{
		{Name: "Test", Score: 80, Weight: WeightImportant, Status: "good", Headline: "Good performance"},
	}

	err := profile.SetCriteriaSummary(cs)
	require.NoError(t, err)
	assert.NotEmpty(t, profile.CriteriaSummary)

	result := profile.GetCriteriaSummary()
	assert.Len(t, result, 1)
	assert.Equal(t, "Test", result[0].Name)
	assert.Equal(t, 80, result[0].Score)
}

func TestProofProfile_SetGetStrengths(t *testing.T) {
	profile := &ProofProfile{}
	s := []StrengthItem{
		{CriterionName: "Tech", Score: 90, Signals: []string{"Good"}, Evidence: "Evidence"},
	}

	err := profile.SetStrengths(s)
	require.NoError(t, err)
	assert.NotEmpty(t, profile.Strengths)
}

func TestProofProfile_SetGetAreasToExplore(t *testing.T) {
	profile := &ProofProfile{}
	a := []AreaToExplore{
		{CriterionName: "Leadership", Score: 50, Concerns: []string{"Limited"}, SuggestedQuestions: []string{"Q1"}},
	}

	err := profile.SetAreasToExplore(a)
	require.NoError(t, err)
	assert.NotEmpty(t, profile.AreasToExplore)
}

func TestProofProfile_SetGetRedFlags(t *testing.T) {
	profile := &ProofProfile{}
	rf := []RedFlagItem{
		{CriterionName: "Comm", Flags: []string{"Vague"}},
	}

	err := profile.SetRedFlags(rf)
	require.NoError(t, err)
	assert.NotEmpty(t, profile.RedFlags)
}

func TestProofProfile_SetGetInterviewFocusPoints(t *testing.T) {
	profile := &ProofProfile{}
	fp := []InterviewFocusPoint{
		{Topic: "Tech", Reason: "Verify", Type: "verify_strength"},
	}

	err := profile.SetInterviewFocusPoints(fp)
	require.NoError(t, err)
	assert.NotEmpty(t, profile.InterviewFocusPoints)
}

func TestCalculatePercentile_Benchmark(t *testing.T) {
	// When fewer than 3 other candidates, use benchmark
	// Thresholds: 86+ → 95, 76-85 → 75, 61-75 → 50, ≤60 → 0
	tests := []struct {
		score    int
		expected int
	}{
		{95, 95},
		{86, 95},
		{85, 75},
		{76, 75},
		{75, 50},
		{61, 50},
		{60, 0},
		{40, 0},
	}

	for _, tt := range tests {
		result := CalculatePercentile(tt.score, []int{}) // No other scores
		assert.Equal(t, tt.expected, result, "score=%d", tt.score)
	}
}

func TestCalculatePercentile_WithPeers(t *testing.T) {
	otherScores := []int{60, 65, 70, 75, 80}

	// Score 85 is above all 5 scores -> percentile = (5*100)/5 = 100
	result := CalculatePercentile(85, otherScores)
	assert.Equal(t, 100, result)

	// Score 72 is above 3 scores (60, 65, 70) -> percentile = (3*100)/5 = 60
	result = CalculatePercentile(72, otherScores)
	assert.Equal(t, 60, result)

	// Score 50 is below all -> percentile = (0*100)/5 = 0
	result = CalculatePercentile(50, otherScores)
	assert.Equal(t, 0, result)
}

func TestCalculatePercentile_FewPeers(t *testing.T) {
	// With only 2 peers, should use benchmark
	result := CalculatePercentile(85, []int{70, 80})
	assert.Equal(t, 75, result) // Benchmark for score 85 (76-85 → 75th)
}

func TestGenerateOneLiner(t *testing.T) {
	tests := []struct {
		score          int
		recommendation EvaluationRecommendation
		jobTitle       string
		contains       string
	}{
		{90, RecommendationProceed, "Dev", "solide"},
		{75, RecommendationProceed, "Dev", "Bon profil"},
		{65, RecommendationMaybe, "Dev", "prometteur"},
		{40, RecommendationReject, "Dev", "en dessous"},
	}

	for _, tt := range tests {
		result := GenerateOneLiner(tt.score, tt.recommendation, tt.jobTitle)
		assert.Contains(t, result, tt.contains, "score=%d rec=%s", tt.score, tt.recommendation)
	}
}

func TestCriterionSummary_JSON(t *testing.T) {
	cs := CriterionSummary{
		Name:     "Tech",
		Score:    85,
		Weight:   WeightCritical,
		Status:   "strong",
		Headline: "Excellent",
	}

	data, err := json.Marshal(cs)
	require.NoError(t, err)

	var result CriterionSummary
	err = json.Unmarshal(data, &result)
	require.NoError(t, err)

	assert.Equal(t, cs.Name, result.Name)
	assert.Equal(t, cs.Score, result.Score)
	assert.Equal(t, cs.Weight, result.Weight)
	assert.Equal(t, cs.Status, result.Status)
}

func TestStrengthItem_JSON(t *testing.T) {
	s := StrengthItem{
		CriterionName: "Tech",
		Score:         90,
		Signals:       []string{"Clean code", "Good patterns"},
		Evidence:      "The candidate showed...",
	}

	data, err := json.Marshal(s)
	require.NoError(t, err)

	var result StrengthItem
	err = json.Unmarshal(data, &result)
	require.NoError(t, err)

	assert.Equal(t, s.CriterionName, result.CriterionName)
	assert.ElementsMatch(t, s.Signals, result.Signals)
}

func TestInterviewFocusPoint_JSON(t *testing.T) {
	fp := InterviewFocusPoint{
		Topic:  "Leadership",
		Reason: "Not covered",
		Type:   "investigate_gap",
	}

	data, err := json.Marshal(fp)
	require.NoError(t, err)

	var result InterviewFocusPoint
	err = json.Unmarshal(data, &result)
	require.NoError(t, err)

	assert.Equal(t, fp.Topic, result.Topic)
	assert.Equal(t, fp.Type, result.Type)
}
