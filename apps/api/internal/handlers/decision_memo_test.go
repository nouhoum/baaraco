package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/baaraco/baara/pkg/models"
)

// =============================================================================
// GET /jobs/:id/candidates/:candidate_id/decision-memo
// =============================================================================

func TestGetOrInitDecisionMemo_CreatesDraft_AsRecruiter(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	recruiter := createTestUser(db, models.RoleRecruiter, &org.ID)
	candidate := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)

	router := setupTestRouter()
	handler := createTestDecisionMemoHandler()
	router.GET("/jobs/:id/candidates/:candidate_id/decision-memo",
		authMiddleware(recruiter), handler.GetOrInitDecisionMemo)

	w := performRequest(router, "GET",
		fmt.Sprintf("/jobs/%s/candidates/%s/decision-memo", job.ID, candidate.ID), nil)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	memo := response["decision_memo"].(map[string]interface{})
	assert.Equal(t, "pending", memo["decision"])
	assert.Equal(t, "draft", memo["status"])
	assert.Equal(t, job.ID, memo["job_id"])
	assert.Equal(t, candidate.ID, memo["candidate_id"])
	assert.Equal(t, recruiter.ID, memo["recruiter_id"])

	candidateResp := response["candidate"].(map[string]interface{})
	assert.Equal(t, candidate.ID, candidateResp["id"])

	jobResp := response["job"].(map[string]interface{})
	assert.Equal(t, job.ID, jobResp["id"])
}

func TestGetOrInitDecisionMemo_ReturnsExisting(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	recruiter := createTestUser(db, models.RoleRecruiter, &org.ID)
	candidate := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)
	memo := createTestDecisionMemo(db, job.ID, candidate.ID, recruiter.ID)

	router := setupTestRouter()
	handler := createTestDecisionMemoHandler()
	router.GET("/jobs/:id/candidates/:candidate_id/decision-memo",
		authMiddleware(recruiter), handler.GetOrInitDecisionMemo)

	w := performRequest(router, "GET",
		fmt.Sprintf("/jobs/%s/candidates/%s/decision-memo", job.ID, candidate.ID), nil)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	memoResp := response["decision_memo"].(map[string]interface{})
	assert.Equal(t, memo.ID, memoResp["id"])
}

func TestGetOrInitDecisionMemo_PrePopulatesFromProofProfile(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	recruiter := createTestUser(db, models.RoleRecruiter, &org.ID)
	candidate := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)
	attempt := createTestWorkSampleAttempt(db, candidate.ID, &job.ID, "reviewed")
	evaluation := createTestEvaluation(db, attempt.ID, job.ID, candidate.ID)
	profile := createTestProofProfile(db, evaluation.ID, attempt.ID, job.ID, candidate.ID)

	// Set criteria summary and strengths on the profile
	profile.CriteriaSummary = []byte(`[{"name":"Technical Skills","score":85,"weight":"critical","status":"strong","headline":"Solide"}]`)
	profile.Strengths = []byte(`[{"criterion_name":"Technical Skills","score":85,"signals":["Clean code"],"evidence":"Good"}]`)
	db.Save(profile)

	router := setupTestRouter()
	handler := createTestDecisionMemoHandler()
	router.GET("/jobs/:id/candidates/:candidate_id/decision-memo",
		authMiddleware(recruiter), handler.GetOrInitDecisionMemo)

	w := performRequest(router, "GET",
		fmt.Sprintf("/jobs/%s/candidates/%s/decision-memo", job.ID, candidate.ID), nil)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	memoResp := response["decision_memo"].(map[string]interface{})
	evals := memoResp["post_interview_evaluations"].([]interface{})
	assert.Len(t, evals, 1)
	eval := evals[0].(map[string]interface{})
	assert.Equal(t, "Technical Skills", eval["criterion_name"])
	assert.Equal(t, float64(85), eval["pre_interview_score"])

	strengths := memoResp["confirmed_strengths"].([]interface{})
	assert.Len(t, strengths, 1)
	assert.Equal(t, "Technical Skills", strengths[0])
}

func TestGetOrInitDecisionMemo_Success_AsAdmin(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	admin := createTestUser(db, models.RoleAdmin, nil)
	candidate := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)

	router := setupTestRouter()
	handler := createTestDecisionMemoHandler()
	router.GET("/jobs/:id/candidates/:candidate_id/decision-memo",
		authMiddleware(admin), handler.GetOrInitDecisionMemo)

	w := performRequest(router, "GET",
		fmt.Sprintf("/jobs/%s/candidates/%s/decision-memo", job.ID, candidate.ID), nil)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestGetOrInitDecisionMemo_Unauthorized(t *testing.T) {
	_, err := setupTestDB()
	require.NoError(t, err)

	router := setupTestRouter()
	handler := createTestDecisionMemoHandler()
	router.GET("/jobs/:id/candidates/:candidate_id/decision-memo",
		handler.GetOrInitDecisionMemo)

	w := performRequest(router, "GET", "/jobs/some-id/candidates/some-id/decision-memo", nil)
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestGetOrInitDecisionMemo_Forbidden_Candidate(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	candidate := createTestUser(db, models.RoleCandidate, nil)

	router := setupTestRouter()
	handler := createTestDecisionMemoHandler()
	router.GET("/jobs/:id/candidates/:candidate_id/decision-memo",
		authMiddleware(candidate), handler.GetOrInitDecisionMemo)

	w := performRequest(router, "GET", "/jobs/some-id/candidates/some-id/decision-memo", nil)
	assert.Equal(t, http.StatusForbidden, w.Code)
}

func TestGetOrInitDecisionMemo_Forbidden_WrongOrg(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org1 := createTestOrg(db)
	org2 := createTestOrg(db)
	recruiter := createTestUser(db, models.RoleRecruiter, &org2.ID)
	candidate := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org1.ID)

	router := setupTestRouter()
	handler := createTestDecisionMemoHandler()
	router.GET("/jobs/:id/candidates/:candidate_id/decision-memo",
		authMiddleware(recruiter), handler.GetOrInitDecisionMemo)

	w := performRequest(router, "GET",
		fmt.Sprintf("/jobs/%s/candidates/%s/decision-memo", job.ID, candidate.ID), nil)

	assert.Equal(t, http.StatusForbidden, w.Code)
}

// =============================================================================
// PATCH /jobs/:id/candidates/:candidate_id/decision-memo
// =============================================================================

func TestSaveDecisionMemo_Success(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	recruiter := createTestUser(db, models.RoleRecruiter, &org.ID)
	candidate := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)
	createTestDecisionMemo(db, job.ID, candidate.ID, recruiter.ID)

	router := setupTestRouter()
	handler := createTestDecisionMemoHandler()
	router.PATCH("/jobs/:id/candidates/:candidate_id/decision-memo",
		authMiddleware(recruiter), handler.SaveDecisionMemo)

	body := `{"decision":"hire","justification":"Great candidate"}`
	w := performRequest(router, "PATCH",
		fmt.Sprintf("/jobs/%s/candidates/%s/decision-memo", job.ID, candidate.ID), &body)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	memo := response["decision_memo"].(map[string]interface{})
	assert.Equal(t, "hire", memo["decision"])
	assert.Equal(t, "Great candidate", memo["justification"])
}

func TestSaveDecisionMemo_PartialUpdate(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	recruiter := createTestUser(db, models.RoleRecruiter, &org.ID)
	candidate := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)
	createTestDecisionMemo(db, job.ID, candidate.ID, recruiter.ID)

	router := setupTestRouter()
	handler := createTestDecisionMemoHandler()
	router.PATCH("/jobs/:id/candidates/:candidate_id/decision-memo",
		authMiddleware(recruiter), handler.SaveDecisionMemo)

	// Only update justification
	body := `{"justification":"Updated justification"}`
	w := performRequest(router, "PATCH",
		fmt.Sprintf("/jobs/%s/candidates/%s/decision-memo", job.ID, candidate.ID), &body)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	memo := response["decision_memo"].(map[string]interface{})
	assert.Equal(t, "pending", memo["decision"]) // unchanged
	assert.Equal(t, "Updated justification", memo["justification"])
}

func TestSaveDecisionMemo_RejectsSubmitted(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	recruiter := createTestUser(db, models.RoleRecruiter, &org.ID)
	candidate := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)
	memo := createTestDecisionMemo(db, job.ID, candidate.ID, recruiter.ID)
	memo.Status = models.DecisionMemoSubmitted
	db.Save(memo)

	router := setupTestRouter()
	handler := createTestDecisionMemoHandler()
	router.PATCH("/jobs/:id/candidates/:candidate_id/decision-memo",
		authMiddleware(recruiter), handler.SaveDecisionMemo)

	body := `{"justification":"Try to update"}`
	w := performRequest(router, "PATCH",
		fmt.Sprintf("/jobs/%s/candidates/%s/decision-memo", job.ID, candidate.ID), &body)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestSaveDecisionMemo_NotFound(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	recruiter := createTestUser(db, models.RoleRecruiter, &org.ID)
	candidate := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)

	router := setupTestRouter()
	handler := createTestDecisionMemoHandler()
	router.PATCH("/jobs/:id/candidates/:candidate_id/decision-memo",
		authMiddleware(recruiter), handler.SaveDecisionMemo)

	body := `{"justification":"Test"}`
	w := performRequest(router, "PATCH",
		fmt.Sprintf("/jobs/%s/candidates/%s/decision-memo", job.ID, candidate.ID), &body)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestSaveDecisionMemo_Unauthorized(t *testing.T) {
	_, err := setupTestDB()
	require.NoError(t, err)

	router := setupTestRouter()
	handler := createTestDecisionMemoHandler()
	router.PATCH("/jobs/:id/candidates/:candidate_id/decision-memo",
		handler.SaveDecisionMemo)

	body := `{"justification":"Test"}`
	w := performRequest(router, "PATCH",
		"/jobs/some-id/candidates/some-id/decision-memo", &body)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

// =============================================================================
// POST /jobs/:id/candidates/:candidate_id/decision-memo/submit
// =============================================================================

func TestSubmitDecisionMemo_Hire(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	recruiter := createTestUser(db, models.RoleRecruiter, &org.ID)
	candidate := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)
	attempt := createTestWorkSampleAttempt(db, candidate.ID, &job.ID, "reviewed")

	memo := createTestDecisionMemo(db, job.ID, candidate.ID, recruiter.ID)
	memo.Decision = models.DecisionHire
	memo.Justification = "Excellent candidate"
	db.Save(memo)

	router := setupTestRouter()
	handler := createTestDecisionMemoHandler()
	router.POST("/jobs/:id/candidates/:candidate_id/decision-memo/submit",
		authMiddleware(recruiter), handler.SubmitDecisionMemo)

	w := performRequest(router, "POST",
		fmt.Sprintf("/jobs/%s/candidates/%s/decision-memo/submit", job.ID, candidate.ID), nil)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	memoResp := response["decision_memo"].(map[string]interface{})
	assert.Equal(t, "submitted", memoResp["status"])
	assert.NotNil(t, memoResp["submitted_at"])

	// Verify attempt status updated to hired
	var updatedAttempt models.WorkSampleAttempt
	db.First(&updatedAttempt, "id = ?", attempt.ID)
	assert.Equal(t, models.AttemptStatusHired, updatedAttempt.Status)
}

func TestSubmitDecisionMemo_NoHire(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	recruiter := createTestUser(db, models.RoleRecruiter, &org.ID)
	candidate := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)
	attempt := createTestWorkSampleAttempt(db, candidate.ID, &job.ID, "reviewed")

	memo := createTestDecisionMemo(db, job.ID, candidate.ID, recruiter.ID)
	memo.Decision = models.DecisionNoHire
	memo.Justification = "Not a fit"
	memo.NextSteps = []byte(`{"feedback_to_send":"Thank you for your time"}`)
	db.Save(memo)

	router := setupTestRouter()
	handler := createTestDecisionMemoHandler()
	router.POST("/jobs/:id/candidates/:candidate_id/decision-memo/submit",
		authMiddleware(recruiter), handler.SubmitDecisionMemo)

	w := performRequest(router, "POST",
		fmt.Sprintf("/jobs/%s/candidates/%s/decision-memo/submit", job.ID, candidate.ID), nil)

	assert.Equal(t, http.StatusOK, w.Code)

	// Verify attempt status updated to rejected with reason
	var updatedAttempt models.WorkSampleAttempt
	db.First(&updatedAttempt, "id = ?", attempt.ID)
	assert.Equal(t, models.AttemptStatusRejected, updatedAttempt.Status)
	assert.Equal(t, "Thank you for your time", updatedAttempt.RejectionReason)
}

func TestSubmitDecisionMemo_NeedMoreInfo_NoStatusChange(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	recruiter := createTestUser(db, models.RoleRecruiter, &org.ID)
	candidate := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)
	attempt := createTestWorkSampleAttempt(db, candidate.ID, &job.ID, "reviewed")

	memo := createTestDecisionMemo(db, job.ID, candidate.ID, recruiter.ID)
	memo.Decision = models.DecisionNeedMoreInfo
	memo.Justification = "Need another interview"
	db.Save(memo)

	router := setupTestRouter()
	handler := createTestDecisionMemoHandler()
	router.POST("/jobs/:id/candidates/:candidate_id/decision-memo/submit",
		authMiddleware(recruiter), handler.SubmitDecisionMemo)

	w := performRequest(router, "POST",
		fmt.Sprintf("/jobs/%s/candidates/%s/decision-memo/submit", job.ID, candidate.ID), nil)

	assert.Equal(t, http.StatusOK, w.Code)

	// Verify attempt status NOT changed
	var updatedAttempt models.WorkSampleAttempt
	db.First(&updatedAttempt, "id = ?", attempt.ID)
	assert.Equal(t, models.WorkSampleAttemptStatus("reviewed"), updatedAttempt.Status)
}

func TestSubmitDecisionMemo_RejectsPending(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	recruiter := createTestUser(db, models.RoleRecruiter, &org.ID)
	candidate := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)
	createTestDecisionMemo(db, job.ID, candidate.ID, recruiter.ID) // decision=pending

	router := setupTestRouter()
	handler := createTestDecisionMemoHandler()
	router.POST("/jobs/:id/candidates/:candidate_id/decision-memo/submit",
		authMiddleware(recruiter), handler.SubmitDecisionMemo)

	w := performRequest(router, "POST",
		fmt.Sprintf("/jobs/%s/candidates/%s/decision-memo/submit", job.ID, candidate.ID), nil)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestSubmitDecisionMemo_RejectsEmptyJustification(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	recruiter := createTestUser(db, models.RoleRecruiter, &org.ID)
	candidate := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)
	memo := createTestDecisionMemo(db, job.ID, candidate.ID, recruiter.ID)
	memo.Decision = models.DecisionHire
	// justification is empty
	db.Save(memo)

	router := setupTestRouter()
	handler := createTestDecisionMemoHandler()
	router.POST("/jobs/:id/candidates/:candidate_id/decision-memo/submit",
		authMiddleware(recruiter), handler.SubmitDecisionMemo)

	w := performRequest(router, "POST",
		fmt.Sprintf("/jobs/%s/candidates/%s/decision-memo/submit", job.ID, candidate.ID), nil)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestSubmitDecisionMemo_RejectsAlreadySubmitted(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	recruiter := createTestUser(db, models.RoleRecruiter, &org.ID)
	candidate := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)
	memo := createTestDecisionMemo(db, job.ID, candidate.ID, recruiter.ID)
	memo.Status = models.DecisionMemoSubmitted
	memo.Decision = models.DecisionHire
	memo.Justification = "Done"
	db.Save(memo)

	router := setupTestRouter()
	handler := createTestDecisionMemoHandler()
	router.POST("/jobs/:id/candidates/:candidate_id/decision-memo/submit",
		authMiddleware(recruiter), handler.SubmitDecisionMemo)

	w := performRequest(router, "POST",
		fmt.Sprintf("/jobs/%s/candidates/%s/decision-memo/submit", job.ID, candidate.ID), nil)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestSubmitDecisionMemo_Unauthorized(t *testing.T) {
	_, err := setupTestDB()
	require.NoError(t, err)

	router := setupTestRouter()
	handler := createTestDecisionMemoHandler()
	router.POST("/jobs/:id/candidates/:candidate_id/decision-memo/submit",
		handler.SubmitDecisionMemo)

	w := performRequest(router, "POST",
		"/jobs/some-id/candidates/some-id/decision-memo/submit", nil)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}
