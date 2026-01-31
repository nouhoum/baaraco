package handlers

import (
	"encoding/json"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/baaraco/baara/pkg/models"
)

func TestGetEvaluation_Success_AsCandidate(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	candidate := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)
	attempt := createTestWorkSampleAttempt(db, candidate.ID, &job.ID, "submitted")
	evaluation := createTestEvaluation(db, attempt.ID, job.ID, candidate.ID)

	router := setupTestRouter()
	handler := NewEvaluationHandler()
	router.GET("/evaluations/:id", authMiddleware(candidate), handler.GetEvaluation)

	w := performRequest(router, "GET", "/evaluations/"+evaluation.ID, nil)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	evalResp := response["evaluation"].(map[string]interface{})
	assert.Equal(t, evaluation.ID, evalResp["id"])
	assert.Equal(t, float64(75), evalResp["global_score"])
}

func TestGetEvaluation_Success_AsRecruiter(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	recruiter := createTestUser(db, models.RoleRecruiter, &org.ID)
	candidate := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)
	attempt := createTestWorkSampleAttempt(db, candidate.ID, &job.ID, "submitted")
	evaluation := createTestEvaluation(db, attempt.ID, job.ID, candidate.ID)

	router := setupTestRouter()
	handler := NewEvaluationHandler()
	router.GET("/evaluations/:id", authMiddleware(recruiter), handler.GetEvaluation)

	w := performRequest(router, "GET", "/evaluations/"+evaluation.ID, nil)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestGetEvaluation_Success_AsAdmin(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	admin := createTestUser(db, models.RoleAdmin, nil)
	candidate := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)
	attempt := createTestWorkSampleAttempt(db, candidate.ID, &job.ID, "submitted")
	evaluation := createTestEvaluation(db, attempt.ID, job.ID, candidate.ID)

	router := setupTestRouter()
	handler := NewEvaluationHandler()
	router.GET("/evaluations/:id", authMiddleware(admin), handler.GetEvaluation)

	w := performRequest(router, "GET", "/evaluations/"+evaluation.ID, nil)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestGetEvaluation_Forbidden_WrongCandidate(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	candidate1 := createTestUser(db, models.RoleCandidate, nil)
	candidate2 := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)
	attempt := createTestWorkSampleAttempt(db, candidate1.ID, &job.ID, "submitted")
	evaluation := createTestEvaluation(db, attempt.ID, job.ID, candidate1.ID)

	router := setupTestRouter()
	handler := NewEvaluationHandler()
	router.GET("/evaluations/:id", authMiddleware(candidate2), handler.GetEvaluation)

	w := performRequest(router, "GET", "/evaluations/"+evaluation.ID, nil)

	assert.Equal(t, http.StatusForbidden, w.Code)
}

func TestGetEvaluation_Forbidden_WrongOrg(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org1 := createTestOrg(db)
	org2 := createTestOrg(db)
	recruiter := createTestUser(db, models.RoleRecruiter, &org2.ID) // Different org
	candidate := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org1.ID)
	attempt := createTestWorkSampleAttempt(db, candidate.ID, &job.ID, "submitted")
	evaluation := createTestEvaluation(db, attempt.ID, job.ID, candidate.ID)

	router := setupTestRouter()
	handler := NewEvaluationHandler()
	router.GET("/evaluations/:id", authMiddleware(recruiter), handler.GetEvaluation)

	w := performRequest(router, "GET", "/evaluations/"+evaluation.ID, nil)

	assert.Equal(t, http.StatusForbidden, w.Code)
}

func TestGetEvaluation_NotFound(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	candidate := createTestUser(db, models.RoleCandidate, nil)

	router := setupTestRouter()
	handler := NewEvaluationHandler()
	router.GET("/evaluations/:id", authMiddleware(candidate), handler.GetEvaluation)

	w := performRequest(router, "GET", "/evaluations/non-existent-id", nil)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestGetEvaluation_Unauthorized(t *testing.T) {
	_, err := setupTestDB()
	require.NoError(t, err)

	router := setupTestRouter()
	handler := NewEvaluationHandler()
	router.GET("/evaluations/:id", handler.GetEvaluation) // No auth middleware

	w := performRequest(router, "GET", "/evaluations/some-id", nil)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestGetEvaluationByAttempt_Success(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	candidate := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)
	attempt := createTestWorkSampleAttempt(db, candidate.ID, &job.ID, "submitted")
	evaluation := createTestEvaluation(db, attempt.ID, job.ID, candidate.ID)

	router := setupTestRouter()
	handler := NewEvaluationHandler()
	router.GET("/work-sample-attempts/:id/evaluation", authMiddleware(candidate), handler.GetEvaluationByAttempt)

	w := performRequest(router, "GET", "/work-sample-attempts/"+attempt.ID+"/evaluation", nil)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	evalResp := response["evaluation"].(map[string]interface{})
	assert.Equal(t, evaluation.ID, evalResp["id"])
}

func TestGetEvaluationByAttempt_NotReady(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	candidate := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)
	attempt := createTestWorkSampleAttempt(db, candidate.ID, &job.ID, "submitted")
	// No evaluation created

	router := setupTestRouter()
	handler := NewEvaluationHandler()
	router.GET("/work-sample-attempts/:id/evaluation", authMiddleware(candidate), handler.GetEvaluationByAttempt)

	w := performRequest(router, "GET", "/work-sample-attempts/"+attempt.ID+"/evaluation", nil)

	assert.Equal(t, http.StatusNotFound, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.Contains(t, response["message"], "en cours")
}

func TestGetEvaluationByAttempt_Forbidden_WrongCandidate(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	candidate1 := createTestUser(db, models.RoleCandidate, nil)
	candidate2 := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)
	attempt := createTestWorkSampleAttempt(db, candidate1.ID, &job.ID, "submitted")

	router := setupTestRouter()
	handler := NewEvaluationHandler()
	router.GET("/work-sample-attempts/:id/evaluation", authMiddleware(candidate2), handler.GetEvaluationByAttempt)

	w := performRequest(router, "GET", "/work-sample-attempts/"+attempt.ID+"/evaluation", nil)

	assert.Equal(t, http.StatusForbidden, w.Code)
}

func TestGetEvaluationByAttempt_AttemptNotFound(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	candidate := createTestUser(db, models.RoleCandidate, nil)

	router := setupTestRouter()
	handler := NewEvaluationHandler()
	router.GET("/work-sample-attempts/:id/evaluation", authMiddleware(candidate), handler.GetEvaluationByAttempt)

	w := performRequest(router, "GET", "/work-sample-attempts/non-existent/evaluation", nil)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestListEvaluationsForJob_Success(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	recruiter := createTestUser(db, models.RoleRecruiter, &org.ID)
	candidate1 := createTestUser(db, models.RoleCandidate, nil)
	candidate2 := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)

	attempt1 := createTestWorkSampleAttempt(db, candidate1.ID, &job.ID, "reviewed")
	attempt2 := createTestWorkSampleAttempt(db, candidate2.ID, &job.ID, "reviewed")
	createTestEvaluation(db, attempt1.ID, job.ID, candidate1.ID)
	createTestEvaluation(db, attempt2.ID, job.ID, candidate2.ID)

	router := setupTestRouter()
	handler := NewEvaluationHandler()
	router.GET("/jobs/:id/evaluations", authMiddleware(recruiter), handler.ListEvaluationsForJob)

	w := performRequest(router, "GET", "/jobs/"+job.ID+"/evaluations", nil)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	evaluations := response["evaluations"].([]interface{})
	assert.Len(t, evaluations, 2)
	assert.Equal(t, float64(2), response["total"])
}

func TestListEvaluationsForJob_EmptyList(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	recruiter := createTestUser(db, models.RoleRecruiter, &org.ID)
	job := createTestJob(db, org.ID)

	router := setupTestRouter()
	handler := NewEvaluationHandler()
	router.GET("/jobs/:id/evaluations", authMiddleware(recruiter), handler.ListEvaluationsForJob)

	w := performRequest(router, "GET", "/jobs/"+job.ID+"/evaluations", nil)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	evaluations := response["evaluations"].([]interface{})
	assert.Len(t, evaluations, 0)
	assert.Equal(t, float64(0), response["total"])
}

func TestListEvaluationsForJob_Forbidden_Candidate(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	candidate := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)

	router := setupTestRouter()
	handler := NewEvaluationHandler()
	router.GET("/jobs/:id/evaluations", authMiddleware(candidate), handler.ListEvaluationsForJob)

	w := performRequest(router, "GET", "/jobs/"+job.ID+"/evaluations", nil)

	assert.Equal(t, http.StatusForbidden, w.Code)
}

func TestListEvaluationsForJob_Forbidden_WrongOrg(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org1 := createTestOrg(db)
	org2 := createTestOrg(db)
	recruiter := createTestUser(db, models.RoleRecruiter, &org2.ID)
	job := createTestJob(db, org1.ID)

	router := setupTestRouter()
	handler := NewEvaluationHandler()
	router.GET("/jobs/:id/evaluations", authMiddleware(recruiter), handler.ListEvaluationsForJob)

	w := performRequest(router, "GET", "/jobs/"+job.ID+"/evaluations", nil)

	assert.Equal(t, http.StatusForbidden, w.Code)
}

func TestListEvaluationsForJob_JobNotFound(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	recruiter := createTestUser(db, models.RoleRecruiter, &org.ID)

	router := setupTestRouter()
	handler := NewEvaluationHandler()
	router.GET("/jobs/:id/evaluations", authMiddleware(recruiter), handler.ListEvaluationsForJob)

	w := performRequest(router, "GET", "/jobs/non-existent/evaluations", nil)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestListEvaluationsForJob_Success_AsAdmin(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	admin := createTestUser(db, models.RoleAdmin, nil) // Admin without org
	job := createTestJob(db, org.ID)

	router := setupTestRouter()
	handler := NewEvaluationHandler()
	router.GET("/jobs/:id/evaluations", authMiddleware(admin), handler.ListEvaluationsForJob)

	w := performRequest(router, "GET", "/jobs/"+job.ID+"/evaluations", nil)

	assert.Equal(t, http.StatusOK, w.Code)
}
