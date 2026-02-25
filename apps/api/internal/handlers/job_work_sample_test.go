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

func TestGetWorkSample_Success(t *testing.T) {
	// Setup
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	orgID := org.ID
	user := createTestUser(db, models.RoleRecruiter, &orgID)
	job := createTestJob(db, org.ID)

	// Create a work sample
	sections := []models.WorkSampleSection{
		{Title: "API Design", EstimatedTimeMinutes: 30},
	}
	sectionsJSON, _ := json.Marshal(sections)
	rules := []string{"Rule 1", "Rule 2"}
	rulesJSON, _ := json.Marshal(rules)
	estimatedTime := 30

	workSample := &models.JobWorkSample{
		ID:                   "work-sample-123",
		JobID:                job.ID,
		IntroMessage:         "Welcome",
		Rules:                rulesJSON,
		Sections:             sectionsJSON,
		EstimatedTimeMinutes: &estimatedTime,
	}
	db.Create(workSample)

	// Setup router
	router := setupTestRouter()
	handler := createTestJobWorkSampleHandler()
	router.GET("/jobs/:id/work-sample", authMiddleware(user), handler.GetWorkSample)

	// Test
	w := performRequest(router, "GET", "/jobs/"+job.ID+"/work-sample", nil)

	// Assert
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.NotNil(t, response["work_sample"])
}

func TestGetWorkSample_NotFound(t *testing.T) {
	// Setup
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	orgID := org.ID
	user := createTestUser(db, models.RoleRecruiter, &orgID)
	job := createTestJob(db, org.ID)

	// No work sample created

	// Setup router
	router := setupTestRouter()
	handler := createTestJobWorkSampleHandler()
	router.GET("/jobs/:id/work-sample", authMiddleware(user), handler.GetWorkSample)

	// Test
	w := performRequest(router, "GET", "/jobs/"+job.ID+"/work-sample", nil)

	// Assert
	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestGetWorkSample_JobNotFound(t *testing.T) {
	// Setup
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	orgID := org.ID
	user := createTestUser(db, models.RoleRecruiter, &orgID)

	// No job created

	// Setup router
	router := setupTestRouter()
	handler := createTestJobWorkSampleHandler()
	router.GET("/jobs/:id/work-sample", authMiddleware(user), handler.GetWorkSample)

	// Test
	w := performRequest(router, "GET", "/jobs/nonexistent-job/work-sample", nil)

	// Assert
	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestGetWorkSample_Unauthorized_NoUser(t *testing.T) {
	// Setup
	_, err := setupTestDB()
	require.NoError(t, err)

	// Setup router without auth middleware setting user
	router := setupTestRouter()
	handler := createTestJobWorkSampleHandler()
	router.GET("/jobs/:id/work-sample", handler.GetWorkSample)

	// Test
	w := performRequest(router, "GET", "/jobs/any-job/work-sample", nil)

	// Assert
	assert.Equal(t, http.StatusForbidden, w.Code)
}

func TestGetWorkSample_Unauthorized_WrongOrg(t *testing.T) {
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
	handler := createTestJobWorkSampleHandler()
	router.GET("/jobs/:id/work-sample", authMiddleware(user), handler.GetWorkSample)

	// Test
	w := performRequest(router, "GET", "/jobs/"+job.ID+"/work-sample", nil)

	// Assert
	assert.Equal(t, http.StatusForbidden, w.Code)
}

func TestUpdateWorkSample_Success(t *testing.T) {
	// Setup
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	orgID := org.ID
	user := createTestUser(db, models.RoleRecruiter, &orgID)
	job := createTestJob(db, org.ID)

	// Create a work sample
	sections := []models.WorkSampleSection{
		{Title: "Old Section", EstimatedTimeMinutes: 20},
	}
	sectionsJSON, _ := json.Marshal(sections)
	estimatedTime := 20

	workSample := &models.JobWorkSample{
		ID:                   "work-sample-123",
		JobID:                job.ID,
		Sections:             sectionsJSON,
		EstimatedTimeMinutes: &estimatedTime,
	}
	db.Create(workSample)

	// Setup router
	router := setupTestRouter()
	handler := createTestJobWorkSampleHandler()
	router.PATCH("/jobs/:id/work-sample", authMiddleware(user), handler.UpdateWorkSample)

	// Test
	newSections := []models.WorkSampleSection{
		{Title: "New Section", EstimatedTimeMinutes: 45},
	}
	body, _ := json.Marshal(UpdateJobWorkSampleRequest{
		IntroMessage: "Updated intro",
		Rules:        []string{"New rule"},
		Sections:     newSections,
	})
	bodyStr := string(body)
	w := performRequest(router, "PATCH", "/jobs/"+job.ID+"/work-sample", &bodyStr)

	// Assert
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.NotNil(t, response["work_sample"])
	assert.Equal(t, "Work sample updated", response["message"])
}

func TestUpdateWorkSample_InvalidJSON(t *testing.T) {
	// Setup
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	orgID := org.ID
	user := createTestUser(db, models.RoleRecruiter, &orgID)
	job := createTestJob(db, org.ID)

	// Setup router
	router := setupTestRouter()
	handler := createTestJobWorkSampleHandler()
	router.PATCH("/jobs/:id/work-sample", authMiddleware(user), handler.UpdateWorkSample)

	// Test with invalid JSON
	bodyStr := "invalid json"
	w := performRequest(router, "PATCH", "/jobs/"+job.ID+"/work-sample", &bodyStr)

	// Assert
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestUpdateWorkSample_NotFound(t *testing.T) {
	// Setup
	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	orgID := org.ID
	user := createTestUser(db, models.RoleRecruiter, &orgID)
	job := createTestJob(db, org.ID)

	// No work sample created

	// Setup router
	router := setupTestRouter()
	handler := createTestJobWorkSampleHandler()
	router.PATCH("/jobs/:id/work-sample", authMiddleware(user), handler.UpdateWorkSample)

	// Test
	newSections := []models.WorkSampleSection{
		{Title: "Section", EstimatedTimeMinutes: 30},
	}
	body, _ := json.Marshal(UpdateJobWorkSampleRequest{Sections: newSections})
	bodyStr := string(body)
	w := performRequest(router, "PATCH", "/jobs/"+job.ID+"/work-sample", &bodyStr)

	// Assert
	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestGenerateWorkSample_Success(t *testing.T) {
	// Setup
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	orgID := org.ID
	user := createTestUser(db, models.RoleRecruiter, &orgID)
	job := createTestJob(db, org.ID)

	// Create scorecard (required for work sample generation)
	criteriaJSON, _ := json.Marshal([]models.ScorecardCriterion{
		{Name: "Technical Skills", Weight: models.WeightCritical},
	})
	scorecard := &models.Scorecard{
		ID:       "scorecard-123",
		JobID:    job.ID,
		Criteria: criteriaJSON,
	}
	db.Create(scorecard)

	// Mock AI client
	estimatedTime := 60
	mockAI := mocks.NewMockGenerator(ctrl)
	mockAI.EXPECT().IsConfigured().Return(true)
	mockAI.EXPECT().GenerateWorkSample(gomock.Any()).Return(&models.JobWorkSampleResponse{
		IntroMessage: "Welcome to the test",
		Rules:        []string{"Rule 1"},
		Sections: []models.WorkSampleSection{
			{Title: "Generated Section", EstimatedTimeMinutes: 60},
		},
		EstimatedTimeMinutes: &estimatedTime,
	}, nil)

	// Setup router
	router := setupTestRouter()
	handler := createTestJobWorkSampleHandlerWithAI(mockAI)
	router.POST("/jobs/:id/generate-work-sample", authMiddleware(user), handler.GenerateWorkSample)

	// Test
	w := performRequest(router, "POST", "/jobs/"+job.ID+"/generate-work-sample", nil)

	// Assert
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.NotNil(t, response["work_sample"])
	assert.Equal(t, "Work sample generated successfully", response["message"])
}

func TestGenerateWorkSample_AINotConfigured(t *testing.T) {
	// Setup
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	orgID := org.ID
	user := createTestUser(db, models.RoleRecruiter, &orgID)
	job := createTestJob(db, org.ID)

	// Create scorecard (required for work sample generation)
	criteriaJSON, _ := json.Marshal([]models.ScorecardCriterion{
		{Name: "Technical Skills", Weight: models.WeightCritical},
	})
	scorecard := &models.Scorecard{
		ID:       "scorecard-123",
		JobID:    job.ID,
		Criteria: criteriaJSON,
	}
	db.Create(scorecard)

	// Mock AI client - not configured
	mockAI := mocks.NewMockGenerator(ctrl)
	mockAI.EXPECT().IsConfigured().Return(false)

	// Setup router
	router := setupTestRouter()
	handler := createTestJobWorkSampleHandlerWithAI(mockAI)
	router.POST("/jobs/:id/generate-work-sample", authMiddleware(user), handler.GenerateWorkSample)

	// Test
	w := performRequest(router, "POST", "/jobs/"+job.ID+"/generate-work-sample", nil)

	// Assert
	assert.Equal(t, http.StatusServiceUnavailable, w.Code)
}

func TestGenerateWorkSample_AIError(t *testing.T) {
	// Setup
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	orgID := org.ID
	user := createTestUser(db, models.RoleRecruiter, &orgID)
	job := createTestJob(db, org.ID)

	// Create scorecard (required for work sample generation)
	criteriaJSON, _ := json.Marshal([]models.ScorecardCriterion{
		{Name: "Technical Skills", Weight: models.WeightCritical},
	})
	scorecard := &models.Scorecard{
		ID:       "scorecard-123",
		JobID:    job.ID,
		Criteria: criteriaJSON,
	}
	db.Create(scorecard)

	// Mock AI client - returns error
	mockAI := mocks.NewMockGenerator(ctrl)
	mockAI.EXPECT().IsConfigured().Return(true)
	mockAI.EXPECT().GenerateWorkSample(gomock.Any()).Return(nil, ai.ErrAPIError("API error"))

	// Setup router
	router := setupTestRouter()
	handler := createTestJobWorkSampleHandlerWithAI(mockAI)
	router.POST("/jobs/:id/generate-work-sample", authMiddleware(user), handler.GenerateWorkSample)

	// Test
	w := performRequest(router, "POST", "/jobs/"+job.ID+"/generate-work-sample", nil)

	// Assert
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestGenerateWorkSample_NoScorecard(t *testing.T) {
	// Setup
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	db, err := setupTestDB()
	require.NoError(t, err)

	org := createTestOrg(db)
	orgID := org.ID
	user := createTestUser(db, models.RoleRecruiter, &orgID)
	job := createTestJob(db, org.ID)

	// No scorecard created - should fail

	// Mock AI client - IsConfigured is checked before scorecard
	mockAI := mocks.NewMockGenerator(ctrl)
	mockAI.EXPECT().IsConfigured().Return(true)

	// Setup router
	router := setupTestRouter()
	handler := createTestJobWorkSampleHandlerWithAI(mockAI)
	router.POST("/jobs/:id/generate-work-sample", authMiddleware(user), handler.GenerateWorkSample)

	// Test
	w := performRequest(router, "POST", "/jobs/"+job.ID+"/generate-work-sample", nil)

	// Assert
	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.Equal(t, "business.no_scorecard", response["code"])
}

func TestGenerateWorkSample_AdminCanAccessAnyOrg(t *testing.T) {
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

	// Create scorecard (required for work sample generation)
	criteriaJSON, _ := json.Marshal([]models.ScorecardCriterion{
		{Name: "Technical Skills", Weight: models.WeightCritical},
	})
	scorecard := &models.Scorecard{
		ID:       "scorecard-123",
		JobID:    job.ID,
		Criteria: criteriaJSON,
	}
	db.Create(scorecard)

	// Mock AI client
	estimatedTime := 45
	mockAI := mocks.NewMockGenerator(ctrl)
	mockAI.EXPECT().IsConfigured().Return(true)
	mockAI.EXPECT().GenerateWorkSample(gomock.Any()).Return(&models.JobWorkSampleResponse{
		IntroMessage:         "Welcome",
		Rules:                []string{"Rule"},
		Sections:             []models.WorkSampleSection{{Title: "Test", EstimatedTimeMinutes: 45}},
		EstimatedTimeMinutes: &estimatedTime,
	}, nil)

	// Setup router
	router := setupTestRouter()
	handler := createTestJobWorkSampleHandlerWithAI(mockAI)
	router.POST("/jobs/:id/generate-work-sample", authMiddleware(user), handler.GenerateWorkSample)

	// Test
	w := performRequest(router, "POST", "/jobs/"+job.ID+"/generate-work-sample", nil)

	// Assert - Admin should be able to access
	assert.Equal(t, http.StatusOK, w.Code)
}
