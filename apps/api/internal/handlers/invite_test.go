package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/baaraco/baara/pkg/auth"
	"github.com/baaraco/baara/pkg/models"
)

// =============================================================================
// CREATE INVITE
// =============================================================================

func TestCreateInvite_CandidateWithJob_Success(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	recruiter := createTestUser(db, models.RoleRecruiter, &org.ID)
	job := createTestJob(db, org.ID)

	router := setupTestRouter()
	handler := createTestInviteHandler()
	router.POST("/invites", authMiddleware(recruiter), handler.Create)

	body := fmt.Sprintf(`{"email":"candidate@example.com","role":"candidate","job_id":"%s"}`, job.ID)
	w := performRequest(router, "POST", "/invites", &body)

	assert.Equal(t, http.StatusCreated, w.Code)

	var response CreateInviteResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.True(t, response.Success)
	assert.Equal(t, "candidate@example.com", response.Invite.Email)
	assert.Equal(t, models.RoleCandidate, response.Invite.Role)
}

func TestCreateInvite_RecruiterRole_Forbidden_ForRecruiter(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	recruiter := createTestUser(db, models.RoleRecruiter, &org.ID)

	router := setupTestRouter()
	handler := createTestInviteHandler()
	router.POST("/invites", authMiddleware(recruiter), handler.Create)

	body := `{"email":"other@example.com","role":"recruiter"}`
	w := performRequest(router, "POST", "/invites", &body)

	assert.Equal(t, http.StatusForbidden, w.Code)
}

func TestCreateInvite_CandidateRole_Forbidden(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	candidate := createTestUser(db, models.RoleCandidate, nil)

	router := setupTestRouter()
	handler := createTestInviteHandler()
	router.POST("/invites", authMiddleware(candidate), handler.Create)

	body := `{"email":"other@example.com","role":"candidate"}`
	w := performRequest(router, "POST", "/invites", &body)

	assert.Equal(t, http.StatusForbidden, w.Code)
}

func TestCreateInvite_ExistingRecruiter_Conflict(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	admin := createTestUser(db, models.RoleAdmin, &org.ID)
	// Create existing active user with same email
	existing := createTestUser(db, models.RoleRecruiter, &org.ID)

	router := setupTestRouter()
	handler := createTestInviteHandler()
	router.POST("/invites", authMiddleware(admin), handler.Create)

	body := fmt.Sprintf(`{"email":"%s","role":"recruiter"}`, existing.Email)
	w := performRequest(router, "POST", "/invites", &body)

	assert.Equal(t, http.StatusConflict, w.Code)
}

func TestCreateInvite_ExistingCandidate_AllowedForNewJob(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	recruiter := createTestUser(db, models.RoleRecruiter, &org.ID)
	existingCandidate := createTestUser(db, models.RoleCandidate, &org.ID)
	job := createTestJob(db, org.ID)

	router := setupTestRouter()
	handler := createTestInviteHandler()
	router.POST("/invites", authMiddleware(recruiter), handler.Create)

	// Existing candidate, new job — should be allowed
	body := fmt.Sprintf(`{"email":"%s","role":"candidate","job_id":"%s"}`, existingCandidate.Email, job.ID)
	w := performRequest(router, "POST", "/invites", &body)

	assert.Equal(t, http.StatusCreated, w.Code)
}

func TestCreateInvite_ExistingCandidate_ConflictIfAlreadyHasAttempt(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	recruiter := createTestUser(db, models.RoleRecruiter, &org.ID)
	existingCandidate := createTestUser(db, models.RoleCandidate, &org.ID)
	job := createTestJob(db, org.ID)

	// Create an existing attempt for this candidate+job
	createTestWorkSampleAttempt(db, existingCandidate.ID, &job.ID, "draft")

	router := setupTestRouter()
	handler := createTestInviteHandler()
	router.POST("/invites", authMiddleware(recruiter), handler.Create)

	body := fmt.Sprintf(`{"email":"%s","role":"candidate","job_id":"%s"}`, existingCandidate.Email, job.ID)
	w := performRequest(router, "POST", "/invites", &body)

	assert.Equal(t, http.StatusConflict, w.Code)
}

func TestCreateInvite_PendingInvite_Conflict(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	recruiter := createTestUser(db, models.RoleRecruiter, &org.ID)
	job := createTestJob(db, org.ID)

	// Create a pending invite
	createTestInvite(db, "pending@example.com", models.RoleCandidate, &org.ID, &job.ID, "somehash", time.Now().Add(24*time.Hour))

	router := setupTestRouter()
	handler := createTestInviteHandler()
	router.POST("/invites", authMiddleware(recruiter), handler.Create)

	body := fmt.Sprintf(`{"email":"pending@example.com","role":"candidate","job_id":"%s"}`, job.ID)
	w := performRequest(router, "POST", "/invites", &body)

	assert.Equal(t, http.StatusConflict, w.Code)
}

func TestCreateInvite_InvalidRole(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	admin := createTestUser(db, models.RoleAdmin, &org.ID)

	router := setupTestRouter()
	handler := createTestInviteHandler()
	router.POST("/invites", authMiddleware(admin), handler.Create)

	body := `{"email":"test@example.com","role":"superadmin"}`
	w := performRequest(router, "POST", "/invites", &body)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestCreateInvite_InvalidJSON(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	recruiter := createTestUser(db, models.RoleRecruiter, &org.ID)

	router := setupTestRouter()
	handler := createTestInviteHandler()
	router.POST("/invites", authMiddleware(recruiter), handler.Create)

	body := `{"email":"not-an-email"}`
	w := performRequest(router, "POST", "/invites", &body)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestCreateInvite_Unauthenticated(t *testing.T) {
	_, err := setupTestDB()
	require.NoError(t, err)

	router := setupTestRouter()
	handler := createTestInviteHandler()
	// No auth middleware
	router.POST("/invites", handler.Create)

	body := `{"email":"test@example.com","role":"candidate"}`
	w := performRequest(router, "POST", "/invites", &body)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

// =============================================================================
// GET INFO
// =============================================================================

func TestGetInviteInfo_ValidInvite(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	job := createTestJob(db, org.ID)
	token := "test-token-123"
	tokenHash := auth.HashToken(token)
	createTestInvite(db, "info@example.com", models.RoleCandidate, &org.ID, &job.ID, tokenHash, time.Now().Add(24*time.Hour))

	router := setupTestRouter()
	handler := createTestInviteHandler()
	router.GET("/invites/:token", handler.GetInfo)

	w := performRequest(router, "GET", "/invites/"+token, nil)

	assert.Equal(t, http.StatusOK, w.Code)

	var response InviteInfoResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.True(t, response.Valid)
	assert.Equal(t, "info@example.com", response.Email)
	assert.Equal(t, "candidate", response.Role)
	assert.Equal(t, "Test Org", response.OrgName)
	assert.Equal(t, "Senior Backend Engineer", response.JobTitle)
}

func TestGetInviteInfo_ExpiredInvite(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	token := "expired-token"
	tokenHash := auth.HashToken(token)
	createTestInvite(db, "expired@example.com", models.RoleCandidate, &org.ID, nil, tokenHash, time.Now().Add(-1*time.Hour))

	router := setupTestRouter()
	handler := createTestInviteHandler()
	router.GET("/invites/:token", handler.GetInfo)

	w := performRequest(router, "GET", "/invites/"+token, nil)

	assert.Equal(t, http.StatusOK, w.Code)

	var response InviteInfoResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.False(t, response.Valid)
}

func TestGetInviteInfo_NotFound(t *testing.T) {
	_, err := setupTestDB()
	require.NoError(t, err)

	router := setupTestRouter()
	handler := createTestInviteHandler()
	router.GET("/invites/:token", handler.GetInfo)

	w := performRequest(router, "GET", "/invites/nonexistent-token", nil)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

// =============================================================================
// ACCEPT INVITE
// =============================================================================

func TestAcceptInvite_NewUser_Success(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	token := "accept-token-new"
	tokenHash := auth.HashToken(token)
	createTestInvite(db, "newuser@example.com", models.RoleRecruiter, &org.ID, nil, tokenHash, time.Now().Add(24*time.Hour))

	router := setupTestRouter()
	handler := createTestInviteHandler()
	router.POST("/invites/:token/accept", handler.Accept)

	body := `{"name":"Jean Dupont"}`
	w := performRequest(router, "POST", "/invites/"+token+"/accept", &body)

	assert.Equal(t, http.StatusOK, w.Code)

	var response AcceptInviteResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.True(t, response.Success)
	assert.Equal(t, "newuser@example.com", response.User.Email)
	assert.Equal(t, "Jean Dupont", response.User.Name)
	assert.Equal(t, models.RoleRecruiter, response.User.Role)

	// Verify user was created in DB
	var user models.User
	db.Where("email = ?", "newuser@example.com").First(&user)
	assert.Equal(t, models.UserStatusActive, user.Status)
	assert.NotNil(t, user.EmailVerifiedAt)
}

func TestAcceptInvite_CandidateWithJob_CreatesAttempt(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	job := createTestJob(db, org.ID)
	token := "accept-candidate-job"
	tokenHash := auth.HashToken(token)
	createTestInvite(db, "candidate-job@example.com", models.RoleCandidate, &org.ID, &job.ID, tokenHash, time.Now().Add(24*time.Hour))

	router := setupTestRouter()
	handler := createTestInviteHandler()
	router.POST("/invites/:token/accept", handler.Accept)

	body := `{"name":"Marie Diallo"}`
	w := performRequest(router, "POST", "/invites/"+token+"/accept", &body)

	assert.Equal(t, http.StatusOK, w.Code)

	var response AcceptInviteResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.True(t, response.Success)
	assert.Equal(t, models.RoleCandidate, response.User.Role)

	// Verify WorkSampleAttempt was created
	var attempt models.WorkSampleAttempt
	err = db.Where("candidate_id = ? AND job_id = ?", response.User.ID, job.ID).First(&attempt).Error
	assert.NoError(t, err)
	assert.Equal(t, models.AttemptStatusDraft, attempt.Status)
}

func TestAcceptInvite_CandidateWithoutJob_NoAttempt(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	token := "accept-candidate-nojob"
	tokenHash := auth.HashToken(token)
	createTestInvite(db, "candidate-nojob@example.com", models.RoleCandidate, &org.ID, nil, tokenHash, time.Now().Add(24*time.Hour))

	router := setupTestRouter()
	handler := createTestInviteHandler()
	router.POST("/invites/:token/accept", handler.Accept)

	body := `{"name":"Awa Konaté"}`
	w := performRequest(router, "POST", "/invites/"+token+"/accept", &body)

	assert.Equal(t, http.StatusOK, w.Code)

	var response AcceptInviteResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	// No attempt should be created (no job linked)
	var count int64
	db.Model(&models.WorkSampleAttempt{}).Where("candidate_id = ?", response.User.ID).Count(&count)
	assert.Equal(t, int64(0), count)
}

func TestAcceptInvite_ExpiredInvite(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	token := "accept-expired"
	tokenHash := auth.HashToken(token)
	createTestInvite(db, "expired-accept@example.com", models.RoleCandidate, &org.ID, nil, tokenHash, time.Now().Add(-1*time.Hour))

	router := setupTestRouter()
	handler := createTestInviteHandler()
	router.POST("/invites/:token/accept", handler.Accept)

	body := `{"name":"Test User"}`
	w := performRequest(router, "POST", "/invites/"+token+"/accept", &body)

	assert.Equal(t, http.StatusGone, w.Code)
}

func TestAcceptInvite_AlreadyAccepted(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	token := "accept-already"
	tokenHash := auth.HashToken(token)
	invite := createTestInvite(db, "already@example.com", models.RoleCandidate, &org.ID, nil, tokenHash, time.Now().Add(24*time.Hour))

	// Mark as already accepted
	now := time.Now()
	invite.AcceptedAt = &now
	db.Save(invite)

	router := setupTestRouter()
	handler := createTestInviteHandler()
	router.POST("/invites/:token/accept", handler.Accept)

	body := `{"name":"Test User"}`
	w := performRequest(router, "POST", "/invites/"+token+"/accept", &body)

	assert.Equal(t, http.StatusGone, w.Code)
}

func TestAcceptInvite_InvalidToken(t *testing.T) {
	_, err := setupTestDB()
	require.NoError(t, err)

	router := setupTestRouter()
	handler := createTestInviteHandler()
	router.POST("/invites/:token/accept", handler.Accept)

	body := `{"name":"Test User"}`
	w := performRequest(router, "POST", "/invites/bad-token/accept", &body)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestAcceptInvite_NameTooShort(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	token := "accept-short-name"
	tokenHash := auth.HashToken(token)
	createTestInvite(db, "short@example.com", models.RoleCandidate, &org.ID, nil, tokenHash, time.Now().Add(24*time.Hour))

	router := setupTestRouter()
	handler := createTestInviteHandler()
	router.POST("/invites/:token/accept", handler.Accept)

	body := `{"name":"A"}`
	w := performRequest(router, "POST", "/invites/"+token+"/accept", &body)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAcceptInvite_ExistingUser_UpdatesProfile(t *testing.T) {
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	job := createTestJob(db, org.ID)

	// Create existing candidate user
	existingUser := &models.User{
		ID:     generateID("user"),
		Email:  "existing-candidate@example.com",
		Name:   "Old Name",
		Role:   models.RoleCandidate,
		Status: models.UserStatusActive,
	}
	db.Create(existingUser)

	token := "accept-existing"
	tokenHash := auth.HashToken(token)
	createTestInvite(db, existingUser.Email, models.RoleCandidate, &org.ID, &job.ID, tokenHash, time.Now().Add(24*time.Hour))

	router := setupTestRouter()
	handler := createTestInviteHandler()
	router.POST("/invites/:token/accept", handler.Accept)

	body := `{"name":"New Name"}`
	w := performRequest(router, "POST", "/invites/"+token+"/accept", &body)

	assert.Equal(t, http.StatusOK, w.Code)

	// Verify user was updated
	var updatedUser models.User
	db.Where("email = ?", existingUser.Email).First(&updatedUser)
	assert.Equal(t, "New Name", updatedUser.Name)
	assert.Equal(t, org.ID, *updatedUser.OrgID)

	// Verify attempt was created
	var attempt models.WorkSampleAttempt
	err = db.Where("candidate_id = ? AND job_id = ?", updatedUser.ID, job.ID).First(&attempt).Error
	assert.NoError(t, err)
}
