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
// GET /jobs/:id/candidates/:candidate_id/interview-kit
// =============================================================================

func TestGetInterviewKit_Success_AsRecruiter(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	recruiter := createTestUser(db, models.RoleRecruiter, &org.ID)
	candidate := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)
	attempt := createTestWorkSampleAttempt(db, candidate.ID, &job.ID, "reviewed")
	evaluation := createTestEvaluation(db, attempt.ID, job.ID, candidate.ID)
	profile := createTestProofProfile(db, evaluation.ID, attempt.ID, job.ID, candidate.ID)
	kit := createTestInterviewKit(db, profile.ID, job.ID, candidate.ID)

	router := setupTestRouter()
	handler := NewInterviewKitHandler()
	router.GET("/jobs/:id/candidates/:candidate_id/interview-kit",
		authMiddleware(recruiter), handler.GetInterviewKitForCandidate)

	w := performRequest(router, "GET",
		fmt.Sprintf("/jobs/%s/candidates/%s/interview-kit", job.ID, candidate.ID), nil)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	ikResp := response["interview_kit"].(map[string]interface{})
	assert.Equal(t, kit.ID, ikResp["id"])
	assert.Equal(t, float64(60), ikResp["total_duration_minutes"])

	candidateResp := response["candidate"].(map[string]interface{})
	assert.Equal(t, candidate.ID, candidateResp["id"])

	jobResp := response["job"].(map[string]interface{})
	assert.Equal(t, job.ID, jobResp["id"])
}

func TestGetInterviewKit_Success_AsAdmin(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	admin := createTestUser(db, models.RoleAdmin, nil)
	candidate := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)
	attempt := createTestWorkSampleAttempt(db, candidate.ID, &job.ID, "reviewed")
	evaluation := createTestEvaluation(db, attempt.ID, job.ID, candidate.ID)
	profile := createTestProofProfile(db, evaluation.ID, attempt.ID, job.ID, candidate.ID)
	createTestInterviewKit(db, profile.ID, job.ID, candidate.ID)

	router := setupTestRouter()
	handler := NewInterviewKitHandler()
	router.GET("/jobs/:id/candidates/:candidate_id/interview-kit",
		authMiddleware(admin), handler.GetInterviewKitForCandidate)

	w := performRequest(router, "GET",
		fmt.Sprintf("/jobs/%s/candidates/%s/interview-kit", job.ID, candidate.ID), nil)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestGetInterviewKit_Unauthorized(t *testing.T) {
	_, err := setupTestDB()
	require.NoError(t, err)

	router := setupTestRouter()
	handler := NewInterviewKitHandler()
	router.GET("/jobs/:id/candidates/:candidate_id/interview-kit",
		handler.GetInterviewKitForCandidate)

	w := performRequest(router, "GET", "/jobs/some-id/candidates/some-id/interview-kit", nil)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestGetInterviewKit_Forbidden_Candidate(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	candidate := createTestUser(db, models.RoleCandidate, nil)

	router := setupTestRouter()
	handler := NewInterviewKitHandler()
	router.GET("/jobs/:id/candidates/:candidate_id/interview-kit",
		authMiddleware(candidate), handler.GetInterviewKitForCandidate)

	w := performRequest(router, "GET", "/jobs/some-id/candidates/some-id/interview-kit", nil)

	assert.Equal(t, http.StatusForbidden, w.Code)
}

func TestGetInterviewKit_Forbidden_WrongOrg(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org1 := createTestOrg(db)
	org2 := createTestOrg(db)
	recruiter := createTestUser(db, models.RoleRecruiter, &org2.ID)
	candidate := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org1.ID)

	router := setupTestRouter()
	handler := NewInterviewKitHandler()
	router.GET("/jobs/:id/candidates/:candidate_id/interview-kit",
		authMiddleware(recruiter), handler.GetInterviewKitForCandidate)

	w := performRequest(router, "GET",
		fmt.Sprintf("/jobs/%s/candidates/%s/interview-kit", job.ID, candidate.ID), nil)

	assert.Equal(t, http.StatusForbidden, w.Code)
}

func TestGetInterviewKit_NotFound_NoKit(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	recruiter := createTestUser(db, models.RoleRecruiter, &org.ID)
	candidate := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)

	router := setupTestRouter()
	handler := NewInterviewKitHandler()
	router.GET("/jobs/:id/candidates/:candidate_id/interview-kit",
		authMiddleware(recruiter), handler.GetInterviewKitForCandidate)

	w := performRequest(router, "GET",
		fmt.Sprintf("/jobs/%s/candidates/%s/interview-kit", job.ID, candidate.ID), nil)

	assert.Equal(t, http.StatusNotFound, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.Contains(t, response["error"], "Interview Kit")
}

func TestGetInterviewKit_JobNotFound(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	recruiter := createTestUser(db, models.RoleRecruiter, &org.ID)

	router := setupTestRouter()
	handler := NewInterviewKitHandler()
	router.GET("/jobs/:id/candidates/:candidate_id/interview-kit",
		authMiddleware(recruiter), handler.GetInterviewKitForCandidate)

	w := performRequest(router, "GET",
		"/jobs/non-existent/candidates/some-id/interview-kit", nil)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

// =============================================================================
// PATCH /jobs/:id/candidates/:candidate_id/interview-kit/notes
// =============================================================================

func TestSaveInterviewKitNotes_Success(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	recruiter := createTestUser(db, models.RoleRecruiter, &org.ID)
	candidate := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)
	attempt := createTestWorkSampleAttempt(db, candidate.ID, &job.ID, "reviewed")
	evaluation := createTestEvaluation(db, attempt.ID, job.ID, candidate.ID)
	profile := createTestProofProfile(db, evaluation.ID, attempt.ID, job.ID, candidate.ID)
	createTestInterviewKit(db, profile.ID, job.ID, candidate.ID)

	router := setupTestRouter()
	handler := NewInterviewKitHandler()
	router.PATCH("/jobs/:id/candidates/:candidate_id/interview-kit/notes",
		authMiddleware(recruiter), handler.SaveInterviewKitNotes)

	body := `{"notes":{"q1":"Great answer","q2":"Needs follow-up"}}`
	w := performRequest(router, "PATCH",
		fmt.Sprintf("/jobs/%s/candidates/%s/interview-kit/notes", job.ID, candidate.ID), &body)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.Equal(t, "Notes saved", response["message"])

	notes := response["notes"].(map[string]interface{})
	assert.Equal(t, "Great answer", notes["q1"])
	assert.Equal(t, "Needs follow-up", notes["q2"])
}

func TestSaveInterviewKitNotes_MergesWithExisting(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	recruiter := createTestUser(db, models.RoleRecruiter, &org.ID)
	candidate := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)
	attempt := createTestWorkSampleAttempt(db, candidate.ID, &job.ID, "reviewed")
	evaluation := createTestEvaluation(db, attempt.ID, job.ID, candidate.ID)
	profile := createTestProofProfile(db, evaluation.ID, attempt.ID, job.ID, candidate.ID)

	kit := createTestInterviewKit(db, profile.ID, job.ID, candidate.ID)
	// Set initial notes
	kit.Notes = []byte(`{"existing":"note"}`)
	db.Save(kit)

	router := setupTestRouter()
	handler := NewInterviewKitHandler()
	router.PATCH("/jobs/:id/candidates/:candidate_id/interview-kit/notes",
		authMiddleware(recruiter), handler.SaveInterviewKitNotes)

	body := `{"notes":{"new_key":"new value"}}`
	w := performRequest(router, "PATCH",
		fmt.Sprintf("/jobs/%s/candidates/%s/interview-kit/notes", job.ID, candidate.ID), &body)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	notes := response["notes"].(map[string]interface{})
	assert.Equal(t, "note", notes["existing"])
	assert.Equal(t, "new value", notes["new_key"])
}

func TestSaveInterviewKitNotes_Unauthorized(t *testing.T) {
	_, err := setupTestDB()
	require.NoError(t, err)

	router := setupTestRouter()
	handler := NewInterviewKitHandler()
	router.PATCH("/jobs/:id/candidates/:candidate_id/interview-kit/notes",
		handler.SaveInterviewKitNotes)

	body := `{"notes":{"q1":"test"}}`
	w := performRequest(router, "PATCH",
		"/jobs/some-id/candidates/some-id/interview-kit/notes", &body)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestSaveInterviewKitNotes_Forbidden_Candidate(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	candidate := createTestUser(db, models.RoleCandidate, nil)

	router := setupTestRouter()
	handler := NewInterviewKitHandler()
	router.PATCH("/jobs/:id/candidates/:candidate_id/interview-kit/notes",
		authMiddleware(candidate), handler.SaveInterviewKitNotes)

	body := `{"notes":{"q1":"test"}}`
	w := performRequest(router, "PATCH",
		"/jobs/some-id/candidates/some-id/interview-kit/notes", &body)

	assert.Equal(t, http.StatusForbidden, w.Code)
}

func TestSaveInterviewKitNotes_BadRequest_InvalidBody(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	recruiter := createTestUser(db, models.RoleRecruiter, &org.ID)
	job := createTestJob(db, org.ID)

	router := setupTestRouter()
	handler := NewInterviewKitHandler()
	router.PATCH("/jobs/:id/candidates/:candidate_id/interview-kit/notes",
		authMiddleware(recruiter), handler.SaveInterviewKitNotes)

	body := `{"invalid":"body"}`
	w := performRequest(router, "PATCH",
		fmt.Sprintf("/jobs/%s/candidates/some-id/interview-kit/notes", job.ID), &body)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestSaveInterviewKitNotes_NotFound_NoKit(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	recruiter := createTestUser(db, models.RoleRecruiter, &org.ID)
	candidate := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)

	router := setupTestRouter()
	handler := NewInterviewKitHandler()
	router.PATCH("/jobs/:id/candidates/:candidate_id/interview-kit/notes",
		authMiddleware(recruiter), handler.SaveInterviewKitNotes)

	body := `{"notes":{"q1":"test"}}`
	w := performRequest(router, "PATCH",
		fmt.Sprintf("/jobs/%s/candidates/%s/interview-kit/notes", job.ID, candidate.ID), &body)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestSaveInterviewKitNotes_Forbidden_WrongOrg(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org1 := createTestOrg(db)
	org2 := createTestOrg(db)
	recruiter := createTestUser(db, models.RoleRecruiter, &org2.ID)
	candidate := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org1.ID)

	router := setupTestRouter()
	handler := NewInterviewKitHandler()
	router.PATCH("/jobs/:id/candidates/:candidate_id/interview-kit/notes",
		authMiddleware(recruiter), handler.SaveInterviewKitNotes)

	body := `{"notes":{"q1":"test"}}`
	w := performRequest(router, "PATCH",
		fmt.Sprintf("/jobs/%s/candidates/%s/interview-kit/notes", job.ID, candidate.ID), &body)

	assert.Equal(t, http.StatusForbidden, w.Code)
}
