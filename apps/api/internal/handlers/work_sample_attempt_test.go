package handlers

import (
	"encoding/json"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/baaraco/baara/pkg/models"
)

// =============================================================================
// GET MY ATTEMPT
// =============================================================================

func TestGetMyAttempt_ExistingAttempt(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	candidate := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)
	attempt := createTestWorkSampleAttempt(db, candidate.ID, &job.ID, "in_progress")

	router := setupTestRouter()
	handler := NewWorkSampleAttemptHandler()
	router.GET("/work-sample-attempts/me", authMiddleware(candidate), handler.GetMyAttempt)

	w := performRequest(router, "GET", "/work-sample-attempts/me", nil)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	att := response["attempt"].(map[string]interface{})
	assert.Equal(t, attempt.ID, att["id"])
	assert.Equal(t, "in_progress", att["status"])
}

func TestGetMyAttempt_CreatesNewIfNone(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	candidate := createTestUser(db, models.RoleCandidate, nil)

	router := setupTestRouter()
	handler := NewWorkSampleAttemptHandler()
	router.GET("/work-sample-attempts/me", authMiddleware(candidate), handler.GetMyAttempt)

	w := performRequest(router, "GET", "/work-sample-attempts/me", nil)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	att := response["attempt"].(map[string]interface{})
	assert.Equal(t, "draft", att["status"])
	assert.Equal(t, float64(0), att["progress"])
}

func TestGetMyAttempt_RecruiterForbidden(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	recruiter := createTestUser(db, models.RoleRecruiter, &org.ID)

	router := setupTestRouter()
	handler := NewWorkSampleAttemptHandler()
	router.GET("/work-sample-attempts/me", authMiddleware(recruiter), handler.GetMyAttempt)

	w := performRequest(router, "GET", "/work-sample-attempts/me", nil)

	assert.Equal(t, http.StatusForbidden, w.Code)
}

func TestGetMyAttempt_Unauthenticated(t *testing.T) {
	_, err := setupTestDB()
	require.NoError(t, err)

	router := setupTestRouter()
	handler := NewWorkSampleAttemptHandler()
	router.GET("/work-sample-attempts/me", handler.GetMyAttempt)

	w := performRequest(router, "GET", "/work-sample-attempts/me", nil)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

// =============================================================================
// GET ATTEMPT BY ID
// =============================================================================

func TestGetAttempt_AsCandidate_Own(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	candidate := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)
	attempt := createTestWorkSampleAttempt(db, candidate.ID, &job.ID, "submitted")

	router := setupTestRouter()
	handler := NewWorkSampleAttemptHandler()
	router.GET("/work-sample-attempts/:id", authMiddleware(candidate), handler.GetAttempt)

	w := performRequest(router, "GET", "/work-sample-attempts/"+attempt.ID, nil)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestGetAttempt_AsCandidate_OthersForbidden(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	candidate1 := createTestUser(db, models.RoleCandidate, nil)
	candidate2 := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)
	attempt := createTestWorkSampleAttempt(db, candidate1.ID, &job.ID, "draft")

	router := setupTestRouter()
	handler := NewWorkSampleAttemptHandler()
	router.GET("/work-sample-attempts/:id", authMiddleware(candidate2), handler.GetAttempt)

	w := performRequest(router, "GET", "/work-sample-attempts/"+attempt.ID, nil)

	assert.Equal(t, http.StatusForbidden, w.Code)
}

func TestGetAttempt_AsRecruiter_Allowed(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	recruiter := createTestUser(db, models.RoleRecruiter, &org.ID)
	candidate := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)
	attempt := createTestWorkSampleAttempt(db, candidate.ID, &job.ID, "submitted")

	router := setupTestRouter()
	handler := NewWorkSampleAttemptHandler()
	router.GET("/work-sample-attempts/:id", authMiddleware(recruiter), handler.GetAttempt)

	w := performRequest(router, "GET", "/work-sample-attempts/"+attempt.ID, nil)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestGetAttempt_NotFound(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	candidate := createTestUser(db, models.RoleCandidate, nil)

	router := setupTestRouter()
	handler := NewWorkSampleAttemptHandler()
	router.GET("/work-sample-attempts/:id", authMiddleware(candidate), handler.GetAttempt)

	w := performRequest(router, "GET", "/work-sample-attempts/nonexistent-id", nil)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

// =============================================================================
// SAVE ATTEMPT
// =============================================================================

func TestSaveAttempt_Success(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	candidate := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)
	attempt := createTestWorkSampleAttempt(db, candidate.ID, &job.ID, "draft")

	router := setupTestRouter()
	handler := NewWorkSampleAttemptHandler()
	router.PATCH("/work-sample-attempts/:id", authMiddleware(candidate), handler.SaveAttempt)

	body := `{"answers":{"q1":"My answer"},"progress":30}`
	w := performRequest(router, "PATCH", "/work-sample-attempts/"+attempt.ID, &body)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	att := response["attempt"].(map[string]interface{})
	assert.Equal(t, "in_progress", att["status"]) // draft -> in_progress
	assert.Equal(t, float64(30), att["progress"])
}

func TestSaveAttempt_SubmittedAttempt_Rejected(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	candidate := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)
	attempt := createTestWorkSampleAttempt(db, candidate.ID, &job.ID, "submitted")

	router := setupTestRouter()
	handler := NewWorkSampleAttemptHandler()
	router.PATCH("/work-sample-attempts/:id", authMiddleware(candidate), handler.SaveAttempt)

	body := `{"answers":{"q1":"Late edit"},"progress":50}`
	w := performRequest(router, "PATCH", "/work-sample-attempts/"+attempt.ID, &body)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestSaveAttempt_NotOwner_Forbidden(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	candidate1 := createTestUser(db, models.RoleCandidate, nil)
	candidate2 := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)
	attempt := createTestWorkSampleAttempt(db, candidate1.ID, &job.ID, "draft")

	router := setupTestRouter()
	handler := NewWorkSampleAttemptHandler()
	router.PATCH("/work-sample-attempts/:id", authMiddleware(candidate2), handler.SaveAttempt)

	body := `{"answers":{"q1":"Hacked"},"progress":10}`
	w := performRequest(router, "PATCH", "/work-sample-attempts/"+attempt.ID, &body)

	assert.Equal(t, http.StatusForbidden, w.Code)
}

func TestSaveAttempt_RecruiterForbidden(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	recruiter := createTestUser(db, models.RoleRecruiter, &org.ID)
	candidate := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)
	attempt := createTestWorkSampleAttempt(db, candidate.ID, &job.ID, "draft")

	router := setupTestRouter()
	handler := NewWorkSampleAttemptHandler()
	router.PATCH("/work-sample-attempts/:id", authMiddleware(recruiter), handler.SaveAttempt)

	body := `{"answers":{"q1":"By recruiter"},"progress":10}`
	w := performRequest(router, "PATCH", "/work-sample-attempts/"+attempt.ID, &body)

	assert.Equal(t, http.StatusForbidden, w.Code)
}

func TestSaveAttempt_InvalidProgress(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	candidate := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)
	attempt := createTestWorkSampleAttempt(db, candidate.ID, &job.ID, "draft")

	router := setupTestRouter()
	handler := NewWorkSampleAttemptHandler()
	router.PATCH("/work-sample-attempts/:id", authMiddleware(candidate), handler.SaveAttempt)

	body := `{"answers":{"q1":"answer"},"progress":150}`
	w := performRequest(router, "PATCH", "/work-sample-attempts/"+attempt.ID, &body)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

// =============================================================================
// SUBMIT ATTEMPT
// =============================================================================

func TestSubmitAttempt_Success(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	candidate := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)
	attempt := createTestWorkSampleAttempt(db, candidate.ID, &job.ID, "in_progress")

	// Set actual answers
	attempt.Answers = []byte(`{"q1":"Some real answer content"}`)
	db.Save(attempt)

	router := setupTestRouter()
	handler := NewWorkSampleAttemptHandler()
	router.POST("/work-sample-attempts/:id/submit", authMiddleware(candidate), handler.SubmitAttempt)

	w := performRequest(router, "POST", "/work-sample-attempts/"+attempt.ID+"/submit", nil)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	att := response["attempt"].(map[string]interface{})
	assert.Equal(t, "submitted", att["status"])
	assert.Equal(t, float64(100), att["progress"])
}

func TestSubmitAttempt_EmptyAnswers_Rejected(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	candidate := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)
	attempt := createTestWorkSampleAttempt(db, candidate.ID, &job.ID, "in_progress")

	// Answers are empty {}
	attempt.Answers = []byte(`{}`)
	db.Save(attempt)

	router := setupTestRouter()
	handler := NewWorkSampleAttemptHandler()
	router.POST("/work-sample-attempts/:id/submit", authMiddleware(candidate), handler.SubmitAttempt)

	w := performRequest(router, "POST", "/work-sample-attempts/"+attempt.ID+"/submit", nil)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestSubmitAttempt_AlreadySubmitted_Rejected(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	candidate := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)
	attempt := createTestWorkSampleAttempt(db, candidate.ID, &job.ID, "submitted")

	router := setupTestRouter()
	handler := NewWorkSampleAttemptHandler()
	router.POST("/work-sample-attempts/:id/submit", authMiddleware(candidate), handler.SubmitAttempt)

	w := performRequest(router, "POST", "/work-sample-attempts/"+attempt.ID+"/submit", nil)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestSubmitAttempt_NotOwner_Forbidden(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	candidate1 := createTestUser(db, models.RoleCandidate, nil)
	candidate2 := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)
	attempt := createTestWorkSampleAttempt(db, candidate1.ID, &job.ID, "in_progress")

	router := setupTestRouter()
	handler := NewWorkSampleAttemptHandler()
	router.POST("/work-sample-attempts/:id/submit", authMiddleware(candidate2), handler.SubmitAttempt)

	w := performRequest(router, "POST", "/work-sample-attempts/"+attempt.ID+"/submit", nil)

	assert.Equal(t, http.StatusForbidden, w.Code)
}

func TestSubmitAttempt_RecruiterForbidden(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	recruiter := createTestUser(db, models.RoleRecruiter, &org.ID)
	candidate := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)
	attempt := createTestWorkSampleAttempt(db, candidate.ID, &job.ID, "in_progress")

	router := setupTestRouter()
	handler := NewWorkSampleAttemptHandler()
	router.POST("/work-sample-attempts/:id/submit", authMiddleware(recruiter), handler.SubmitAttempt)

	w := performRequest(router, "POST", "/work-sample-attempts/"+attempt.ID+"/submit", nil)

	assert.Equal(t, http.StatusForbidden, w.Code)
}

func TestSubmitAttempt_NotFound(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	candidate := createTestUser(db, models.RoleCandidate, nil)

	router := setupTestRouter()
	handler := NewWorkSampleAttemptHandler()
	router.POST("/work-sample-attempts/:id/submit", authMiddleware(candidate), handler.SubmitAttempt)

	w := performRequest(router, "POST", "/work-sample-attempts/nonexistent/submit", nil)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

// =============================================================================
// REQUEST ALTERNATIVE FORMAT
// =============================================================================

func TestRequestAlternativeFormat_Success(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	candidate := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)
	attempt := createTestWorkSampleAttempt(db, candidate.ID, &job.ID, "draft")

	router := setupTestRouter()
	handler := NewWorkSampleAttemptHandler()
	router.POST("/work-sample-attempts/:id/format-request", authMiddleware(candidate), handler.RequestAlternativeFormat)

	body := `{"reason":"oral","preferred_format":"video_call","comment":"Je préfère l'oral"}`
	w := performRequest(router, "POST", "/work-sample-attempts/"+attempt.ID+"/format-request", &body)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]any
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	fr := response["format_request"].(map[string]interface{})
	assert.Equal(t, "oral", fr["reason"])
	assert.Equal(t, "video_call", fr["preferred_format"])
	assert.Equal(t, "pending", fr["status"])
}

func TestRequestAlternativeFormat_NotOwner_Forbidden(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	candidate1 := createTestUser(db, models.RoleCandidate, nil)
	candidate2 := createTestUser(db, models.RoleCandidate, nil)
	job := createTestJob(db, org.ID)
	attempt := createTestWorkSampleAttempt(db, candidate1.ID, &job.ID, "draft")

	router := setupTestRouter()
	handler := NewWorkSampleAttemptHandler()
	router.POST("/work-sample-attempts/:id/format-request", authMiddleware(candidate2), handler.RequestAlternativeFormat)

	body := `{"reason":"oral","preferred_format":"video_call"}`
	w := performRequest(router, "POST", "/work-sample-attempts/"+attempt.ID+"/format-request", &body)

	assert.Equal(t, http.StatusForbidden, w.Code)
}
