package handlers

import (
	"encoding/json"
	"net/http"
	"testing"

	"github.com/baaraco/baara/pkg/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGetProofProfile_Success_AsCandidate(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	candidate := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)
	attempt := createTestWorkSampleAttempt(db, candidate.ID, &job.ID, "reviewed")
	evaluation := createTestEvaluation(db, attempt.ID, job.ID, candidate.ID)
	profile := createTestProofProfile(db, evaluation.ID, attempt.ID, job.ID, candidate.ID)

	router := setupTestRouter()
	handler := NewProofProfileHandler()
	router.GET("/proof-profiles/:id", authMiddleware(candidate), handler.GetProofProfile)

	w := performRequest(router, "GET", "/proof-profiles/"+profile.ID, nil)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	ppResp := response["proof_profile"].(map[string]interface{})
	assert.Equal(t, profile.ID, ppResp["id"])
	assert.Equal(t, float64(75), ppResp["global_score"])
}

func TestGetProofProfile_Success_AsRecruiter(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	recruiter := createTestUser(db, models.RoleRecruiter, &org.ID)
	candidate := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)
	attempt := createTestWorkSampleAttempt(db, candidate.ID, &job.ID, "reviewed")
	evaluation := createTestEvaluation(db, attempt.ID, job.ID, candidate.ID)
	profile := createTestProofProfile(db, evaluation.ID, attempt.ID, job.ID, candidate.ID)

	router := setupTestRouter()
	handler := NewProofProfileHandler()
	router.GET("/proof-profiles/:id", authMiddleware(recruiter), handler.GetProofProfile)

	w := performRequest(router, "GET", "/proof-profiles/"+profile.ID, nil)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestGetProofProfile_Success_AsAdmin(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	admin := createTestUser(db, models.RoleAdmin, nil)
	candidate := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)
	attempt := createTestWorkSampleAttempt(db, candidate.ID, &job.ID, "reviewed")
	evaluation := createTestEvaluation(db, attempt.ID, job.ID, candidate.ID)
	profile := createTestProofProfile(db, evaluation.ID, attempt.ID, job.ID, candidate.ID)

	router := setupTestRouter()
	handler := NewProofProfileHandler()
	router.GET("/proof-profiles/:id", authMiddleware(admin), handler.GetProofProfile)

	w := performRequest(router, "GET", "/proof-profiles/"+profile.ID, nil)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestGetProofProfile_Forbidden_WrongCandidate(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	candidate1 := createTestUser(db, models.RoleCandidate, nil)
	candidate2 := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)
	attempt := createTestWorkSampleAttempt(db, candidate1.ID, &job.ID, "reviewed")
	evaluation := createTestEvaluation(db, attempt.ID, job.ID, candidate1.ID)
	profile := createTestProofProfile(db, evaluation.ID, attempt.ID, job.ID, candidate1.ID)

	router := setupTestRouter()
	handler := NewProofProfileHandler()
	router.GET("/proof-profiles/:id", authMiddleware(candidate2), handler.GetProofProfile)

	w := performRequest(router, "GET", "/proof-profiles/"+profile.ID, nil)

	assert.Equal(t, http.StatusForbidden, w.Code)
}

func TestGetProofProfile_Forbidden_WrongOrg(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org1 := createTestOrg(db)
	org2 := createTestOrg(db)
	recruiter := createTestUser(db, models.RoleRecruiter, &org2.ID)
	candidate := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org1.ID)
	attempt := createTestWorkSampleAttempt(db, candidate.ID, &job.ID, "reviewed")
	evaluation := createTestEvaluation(db, attempt.ID, job.ID, candidate.ID)
	profile := createTestProofProfile(db, evaluation.ID, attempt.ID, job.ID, candidate.ID)

	router := setupTestRouter()
	handler := NewProofProfileHandler()
	router.GET("/proof-profiles/:id", authMiddleware(recruiter), handler.GetProofProfile)

	w := performRequest(router, "GET", "/proof-profiles/"+profile.ID, nil)

	assert.Equal(t, http.StatusForbidden, w.Code)
}

func TestGetProofProfile_NotFound(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	candidate := createTestUser(db, models.RoleCandidate, nil)

	router := setupTestRouter()
	handler := NewProofProfileHandler()
	router.GET("/proof-profiles/:id", authMiddleware(candidate), handler.GetProofProfile)

	w := performRequest(router, "GET", "/proof-profiles/non-existent", nil)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestGetProofProfile_Unauthorized(t *testing.T) {
	_, err := setupTestDB()
	require.NoError(t, err)

	router := setupTestRouter()
	handler := NewProofProfileHandler()
	router.GET("/proof-profiles/:id", handler.GetProofProfile)

	w := performRequest(router, "GET", "/proof-profiles/some-id", nil)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestGetProofProfileByEvaluation_Success(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	candidate := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)
	attempt := createTestWorkSampleAttempt(db, candidate.ID, &job.ID, "reviewed")
	evaluation := createTestEvaluation(db, attempt.ID, job.ID, candidate.ID)
	profile := createTestProofProfile(db, evaluation.ID, attempt.ID, job.ID, candidate.ID)

	router := setupTestRouter()
	handler := NewProofProfileHandler()
	router.GET("/evaluations/:id/proof-profile", authMiddleware(candidate), handler.GetProofProfileByEvaluation)

	w := performRequest(router, "GET", "/evaluations/"+evaluation.ID+"/proof-profile", nil)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	ppResp := response["proof_profile"].(map[string]interface{})
	assert.Equal(t, profile.ID, ppResp["id"])
}

func TestGetProofProfileByEvaluation_NotReady(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	candidate := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)
	attempt := createTestWorkSampleAttempt(db, candidate.ID, &job.ID, "reviewed")
	evaluation := createTestEvaluation(db, attempt.ID, job.ID, candidate.ID)
	// No proof profile created

	router := setupTestRouter()
	handler := NewProofProfileHandler()
	router.GET("/evaluations/:id/proof-profile", authMiddleware(candidate), handler.GetProofProfileByEvaluation)

	w := performRequest(router, "GET", "/evaluations/"+evaluation.ID+"/proof-profile", nil)

	assert.Equal(t, http.StatusNotFound, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.Contains(t, response["message"], "en cours")
}

func TestGetProofProfileByEvaluation_Forbidden_WrongCandidate(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	candidate1 := createTestUser(db, models.RoleCandidate, nil)
	candidate2 := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)
	attempt := createTestWorkSampleAttempt(db, candidate1.ID, &job.ID, "reviewed")
	evaluation := createTestEvaluation(db, attempt.ID, job.ID, candidate1.ID)

	router := setupTestRouter()
	handler := NewProofProfileHandler()
	router.GET("/evaluations/:id/proof-profile", authMiddleware(candidate2), handler.GetProofProfileByEvaluation)

	w := performRequest(router, "GET", "/evaluations/"+evaluation.ID+"/proof-profile", nil)

	assert.Equal(t, http.StatusForbidden, w.Code)
}

func TestGetMyProofProfile_Success(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	candidate := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)
	attempt := createTestWorkSampleAttempt(db, candidate.ID, &job.ID, "reviewed")
	evaluation := createTestEvaluation(db, attempt.ID, job.ID, candidate.ID)
	profile := createTestProofProfile(db, evaluation.ID, attempt.ID, job.ID, candidate.ID)

	router := setupTestRouter()
	handler := NewProofProfileHandler()
	router.GET("/proof-profiles/me", authMiddleware(candidate), handler.GetMyProofProfile)

	w := performRequest(router, "GET", "/proof-profiles/me", nil)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	ppResp := response["proof_profile"].(map[string]interface{})
	assert.Equal(t, profile.ID, ppResp["id"])
}

func TestGetMyProofProfile_NotFound(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	candidate := createTestUser(db, models.RoleCandidate, nil)

	router := setupTestRouter()
	handler := NewProofProfileHandler()
	router.GET("/proof-profiles/me", authMiddleware(candidate), handler.GetMyProofProfile)

	w := performRequest(router, "GET", "/proof-profiles/me", nil)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestGetMyProofProfile_Forbidden_NotCandidate(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	recruiter := createTestUser(db, models.RoleRecruiter, &org.ID)

	router := setupTestRouter()
	handler := NewProofProfileHandler()
	router.GET("/proof-profiles/me", authMiddleware(recruiter), handler.GetMyProofProfile)

	w := performRequest(router, "GET", "/proof-profiles/me", nil)

	assert.Equal(t, http.StatusForbidden, w.Code)
}

func TestListProofProfilesForJob_Success(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	recruiter := createTestUser(db, models.RoleRecruiter, &org.ID)
	candidate1 := createTestUser(db, models.RoleCandidate, nil)
	candidate2 := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)

	attempt1 := createTestWorkSampleAttempt(db, candidate1.ID, &job.ID, "reviewed")
	attempt2 := createTestWorkSampleAttempt(db, candidate2.ID, &job.ID, "reviewed")
	eval1 := createTestEvaluation(db, attempt1.ID, job.ID, candidate1.ID)
	eval2 := createTestEvaluation(db, attempt2.ID, job.ID, candidate2.ID)
	createTestProofProfile(db, eval1.ID, attempt1.ID, job.ID, candidate1.ID)
	createTestProofProfile(db, eval2.ID, attempt2.ID, job.ID, candidate2.ID)

	router := setupTestRouter()
	handler := NewProofProfileHandler()
	router.GET("/jobs/:id/proof-profiles", authMiddleware(recruiter), handler.ListProofProfilesForJob)

	w := performRequest(router, "GET", "/jobs/"+job.ID+"/proof-profiles", nil)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	profiles := response["proof_profiles"].([]interface{})
	assert.Len(t, profiles, 2)
	assert.Equal(t, float64(2), response["total"])
}

func TestListProofProfilesForJob_EmptyList(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	recruiter := createTestUser(db, models.RoleRecruiter, &org.ID)
	job := createTestJob(db, org.ID)

	router := setupTestRouter()
	handler := NewProofProfileHandler()
	router.GET("/jobs/:id/proof-profiles", authMiddleware(recruiter), handler.ListProofProfilesForJob)

	w := performRequest(router, "GET", "/jobs/"+job.ID+"/proof-profiles", nil)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	profiles := response["proof_profiles"].([]interface{})
	assert.Len(t, profiles, 0)
}

func TestListProofProfilesForJob_Forbidden_Candidate(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	candidate := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)

	router := setupTestRouter()
	handler := NewProofProfileHandler()
	router.GET("/jobs/:id/proof-profiles", authMiddleware(candidate), handler.ListProofProfilesForJob)

	w := performRequest(router, "GET", "/jobs/"+job.ID+"/proof-profiles", nil)

	assert.Equal(t, http.StatusForbidden, w.Code)
}

func TestListProofProfilesForJob_Forbidden_WrongOrg(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org1 := createTestOrg(db)
	org2 := createTestOrg(db)
	recruiter := createTestUser(db, models.RoleRecruiter, &org2.ID)
	job := createTestJob(db, org1.ID)

	router := setupTestRouter()
	handler := NewProofProfileHandler()
	router.GET("/jobs/:id/proof-profiles", authMiddleware(recruiter), handler.ListProofProfilesForJob)

	w := performRequest(router, "GET", "/jobs/"+job.ID+"/proof-profiles", nil)

	assert.Equal(t, http.StatusForbidden, w.Code)
}

func TestListProofProfilesForJob_JobNotFound(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	recruiter := createTestUser(db, models.RoleRecruiter, &org.ID)

	router := setupTestRouter()
	handler := NewProofProfileHandler()
	router.GET("/jobs/:id/proof-profiles", authMiddleware(recruiter), handler.ListProofProfilesForJob)

	w := performRequest(router, "GET", "/jobs/non-existent/proof-profiles", nil)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestListProofProfilesForJob_Success_AsAdmin(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	admin := createTestUser(db, models.RoleAdmin, nil)
	job := createTestJob(db, org.ID)

	router := setupTestRouter()
	handler := NewProofProfileHandler()
	router.GET("/jobs/:id/proof-profiles", authMiddleware(admin), handler.ListProofProfilesForJob)

	w := performRequest(router, "GET", "/jobs/"+job.ID+"/proof-profiles", nil)

	assert.Equal(t, http.StatusOK, w.Code)
}
