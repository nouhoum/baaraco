package handlers

import (
	"encoding/json"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/mock/gomock"

	"github.com/baaraco/baara/pkg/ai"
	"github.com/baaraco/baara/pkg/ai/mocks"
	"github.com/baaraco/baara/pkg/models"
)

func TestGetScorecard_Success(t *testing.T) {
	// Setup
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	orgID := org.ID
	user := createTestUser(db, models.RoleRecruiter, &orgID)
	job := createTestJob(db, org.ID)

	// Create a scorecard
	criteria := []models.ScorecardCriterion{
		{Name: "Test Criterion", Description: "Test", Weight: models.WeightCritical},
	}
	criteriaJSON, _ := json.Marshal(criteria)
	scorecard := &models.Scorecard{
		ID:       "scorecard-123",
		JobID:    job.ID,
		Criteria: criteriaJSON,
	}
	db.Create(scorecard)

	// Setup router
	router := setupTestRouter()
	handler := createTestScorecardHandler()
	router.GET("/jobs/:id/scorecard", authMiddleware(user), handler.GetScorecard)

	// Test
	w := performRequest(router, "GET", "/jobs/"+job.ID+"/scorecard", nil)

	// Assert
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.NotNil(t, response["scorecard"])
}

func TestGetScorecard_NotFound(t *testing.T) {
	// Setup
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	orgID := org.ID
	user := createTestUser(db, models.RoleRecruiter, &orgID)
	job := createTestJob(db, org.ID)

	// No scorecard created

	// Setup router
	router := setupTestRouter()
	handler := createTestScorecardHandler()
	router.GET("/jobs/:id/scorecard", authMiddleware(user), handler.GetScorecard)

	// Test
	w := performRequest(router, "GET", "/jobs/"+job.ID+"/scorecard", nil)

	// Assert
	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestGetScorecard_JobNotFound(t *testing.T) {
	// Setup
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	orgID := org.ID
	user := createTestUser(db, models.RoleRecruiter, &orgID)

	// No job created

	// Setup router
	router := setupTestRouter()
	handler := createTestScorecardHandler()
	router.GET("/jobs/:id/scorecard", authMiddleware(user), handler.GetScorecard)

	// Test
	w := performRequest(router, "GET", "/jobs/nonexistent-job/scorecard", nil)

	// Assert
	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestGetScorecard_Unauthorized_NoUser(t *testing.T) {
	// Setup
	_, err := setupTestDB()
	require.NoError(t, err)

	// Setup router without auth middleware setting user
	router := setupTestRouter()
	handler := createTestScorecardHandler()
	router.GET("/jobs/:id/scorecard", handler.GetScorecard)

	// Test
	w := performRequest(router, "GET", "/jobs/any-job/scorecard", nil)

	// Assert
	assert.Equal(t, http.StatusForbidden, w.Code)
}

func TestGetScorecard_Unauthorized_WrongOrg(t *testing.T) {
	// Setup
	db, err := setupTestDB()
	require.NoError(t, err)

	org1 := createTestOrg(db)
	org1ID := org1.ID
	user := createTestUser(db, models.RoleRecruiter, &org1ID)

	// Create job in different org
	org2 := &models.Org{ID: "other-org", Name: "Other Org"}
	db.Create(org2)
	job := createTestJob(db, org2.ID)

	// Setup router
	router := setupTestRouter()
	handler := createTestScorecardHandler()
	router.GET("/jobs/:id/scorecard", authMiddleware(user), handler.GetScorecard)

	// Test
	w := performRequest(router, "GET", "/jobs/"+job.ID+"/scorecard", nil)

	// Assert
	assert.Equal(t, http.StatusForbidden, w.Code)
}

func TestUpdateScorecard_Success(t *testing.T) {
	// Setup
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	orgID := org.ID
	user := createTestUser(db, models.RoleRecruiter, &orgID)
	job := createTestJob(db, org.ID)

	// Create a scorecard
	criteria := []models.ScorecardCriterion{
		{Name: "Old Criterion", Description: "Old", Weight: models.WeightImportant},
	}
	criteriaJSON, _ := json.Marshal(criteria)
	scorecard := &models.Scorecard{
		ID:       "scorecard-123",
		JobID:    job.ID,
		Criteria: criteriaJSON,
	}
	db.Create(scorecard)

	// Setup router
	router := setupTestRouter()
	handler := createTestScorecardHandler()
	router.PATCH("/jobs/:id/scorecard", authMiddleware(user), handler.UpdateScorecard)

	// Test
	newCriteria := []models.ScorecardCriterion{
		{Name: "New Criterion", Description: "New", Weight: models.WeightCritical},
	}
	body, _ := json.Marshal(UpdateScorecardRequest{Criteria: newCriteria})
	bodyStr := string(body)
	w := performRequest(router, "PATCH", "/jobs/"+job.ID+"/scorecard", &bodyStr)

	// Assert
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.NotNil(t, response["scorecard"])
	assert.Equal(t, "Scorecard updated", response["message"])
}

func TestUpdateScorecard_InvalidJSON(t *testing.T) {
	// Setup
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	orgID := org.ID
	user := createTestUser(db, models.RoleRecruiter, &orgID)
	job := createTestJob(db, org.ID)

	// Setup router
	router := setupTestRouter()
	handler := createTestScorecardHandler()
	router.PATCH("/jobs/:id/scorecard", authMiddleware(user), handler.UpdateScorecard)

	// Test with invalid JSON
	bodyStr := "invalid json"
	w := performRequest(router, "PATCH", "/jobs/"+job.ID+"/scorecard", &bodyStr)

	// Assert
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestGenerateScorecard_Success(t *testing.T) {
	// Setup
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	orgID := org.ID
	user := createTestUser(db, models.RoleRecruiter, &orgID)
	job := createTestJob(db, org.ID)

	// Mock AI client
	mockAI := mocks.NewMockGenerator(ctrl)
	mockAI.EXPECT().IsConfigured().Return(true)
	mockAI.EXPECT().GenerateScorecard(gomock.Any()).Return([]models.ScorecardCriterion{
		{Name: "Generated Criterion", Description: "AI generated", Weight: models.WeightCritical},
	}, nil)

	// Setup router
	router := setupTestRouter()
	handler := createTestScorecardHandlerWithAI(mockAI)
	router.POST("/jobs/:id/generate-scorecard", authMiddleware(user), handler.GenerateScorecard)

	// Test
	w := performRequest(router, "POST", "/jobs/"+job.ID+"/generate-scorecard", nil)

	// Assert
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.NotNil(t, response["scorecard"])
	assert.Equal(t, "Scorecard generated successfully", response["message"])
}

func TestGenerateScorecard_AINotConfigured(t *testing.T) {
	// Setup
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	orgID := org.ID
	user := createTestUser(db, models.RoleRecruiter, &orgID)
	job := createTestJob(db, org.ID)

	// Mock AI client - not configured
	mockAI := mocks.NewMockGenerator(ctrl)
	mockAI.EXPECT().IsConfigured().Return(false)

	// Setup router
	router := setupTestRouter()
	handler := createTestScorecardHandlerWithAI(mockAI)
	router.POST("/jobs/:id/generate-scorecard", authMiddleware(user), handler.GenerateScorecard)

	// Test
	w := performRequest(router, "POST", "/jobs/"+job.ID+"/generate-scorecard", nil)

	// Assert
	assert.Equal(t, http.StatusServiceUnavailable, w.Code)
}

func TestGenerateScorecard_AIError(t *testing.T) {
	// Setup
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	orgID := org.ID
	user := createTestUser(db, models.RoleRecruiter, &orgID)
	job := createTestJob(db, org.ID)

	// Mock AI client - returns error
	mockAI := mocks.NewMockGenerator(ctrl)
	mockAI.EXPECT().IsConfigured().Return(true)
	mockAI.EXPECT().GenerateScorecard(gomock.Any()).Return(nil, ai.ErrAPIError("API error"))

	// Setup router
	router := setupTestRouter()
	handler := createTestScorecardHandlerWithAI(mockAI)
	router.POST("/jobs/:id/generate-scorecard", authMiddleware(user), handler.GenerateScorecard)

	// Test
	w := performRequest(router, "POST", "/jobs/"+job.ID+"/generate-scorecard", nil)

	// Assert
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestGenerateScorecard_AdminCanAccessAnyOrg(t *testing.T) {
	// Setup
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	db, err := setupTestDB()
	require.NoError(t, err)

	// Admin user with no org
	user := createTestUser(db, models.RoleAdmin, nil)

	// Job in some org
	org := createTestOrg(db)
	job := createTestJob(db, org.ID)

	// Mock AI client
	mockAI := mocks.NewMockGenerator(ctrl)
	mockAI.EXPECT().IsConfigured().Return(true)
	mockAI.EXPECT().GenerateScorecard(gomock.Any()).Return([]models.ScorecardCriterion{
		{Name: "Test", Weight: models.WeightCritical},
	}, nil)

	// Setup router
	router := setupTestRouter()
	handler := createTestScorecardHandlerWithAI(mockAI)
	router.POST("/jobs/:id/generate-scorecard", authMiddleware(user), handler.GenerateScorecard)

	// Test
	w := performRequest(router, "POST", "/jobs/"+job.ID+"/generate-scorecard", nil)

	// Assert - Admin should be able to access
	assert.Equal(t, http.StatusOK, w.Code)
}
