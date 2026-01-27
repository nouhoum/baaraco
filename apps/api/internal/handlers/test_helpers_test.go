package handlers

import (
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"net/http/httptest"

	"github.com/baaraco/baara/pkg/database"
	"github.com/baaraco/baara/pkg/models"
	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite" // Pure Go SQLite driver (no CGO required)
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var testCounter int

// TestDB sets up an in-memory SQLite database for testing
func setupTestDB() (*gorm.DB, error) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		return nil, err
	}

	// Create simplified tables for SQLite (avoiding PostgreSQL-specific features)
	err = db.Exec(`
		CREATE TABLE IF NOT EXISTS orgs (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			slug TEXT,
			plan TEXT DEFAULT 'pilot',
			logo_url TEXT,
			website TEXT,
			created_at DATETIME,
			updated_at DATETIME,
			deleted_at DATETIME
		)
	`).Error
	if err != nil {
		return nil, err
	}

	err = db.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY,
			email TEXT UNIQUE NOT NULL,
			name TEXT,
			avatar_url TEXT,
			role TEXT NOT NULL DEFAULT 'candidate',
			org_id TEXT,
			status TEXT NOT NULL DEFAULT 'pending',
			locale TEXT DEFAULT 'fr',
			role_type TEXT,
			linkedin_url TEXT,
			github_username TEXT,
			email_verified_at DATETIME,
			last_login_at DATETIME,
			onboarding_completed_at DATETIME,
			created_at DATETIME,
			updated_at DATETIME,
			deleted_at DATETIME
		)
	`).Error
	if err != nil {
		return nil, err
	}

	err = db.Exec(`
		CREATE TABLE IF NOT EXISTS jobs (
			id TEXT PRIMARY KEY,
			org_id TEXT NOT NULL,
			status TEXT DEFAULT 'draft',
			title TEXT NOT NULL,
			team TEXT,
			location_type TEXT,
			location_city TEXT,
			contract_type TEXT,
			seniority TEXT,
			stack BLOB,
			team_size TEXT,
			manager_info TEXT,
			business_context TEXT,
			main_problem TEXT,
			expected_outcomes BLOB,
			success_looks_like TEXT,
			failure_looks_like TEXT,
			salary_min INTEGER,
			salary_max INTEGER,
			start_date DATETIME,
			urgency TEXT,
			description TEXT,
			role_type TEXT,
			work_sample_id TEXT,
			created_by TEXT,
			created_at DATETIME,
			updated_at DATETIME,
			deleted_at DATETIME
		)
	`).Error
	if err != nil {
		return nil, err
	}

	err = db.Exec(`
		CREATE TABLE IF NOT EXISTS scorecards (
			id TEXT PRIMARY KEY,
			job_id TEXT NOT NULL,
			criteria BLOB,
			generated_at DATETIME,
			prompt_version TEXT,
			created_at DATETIME,
			updated_at DATETIME
		)
	`).Error
	if err != nil {
		return nil, err
	}

	err = db.Exec(`
		CREATE TABLE IF NOT EXISTS job_work_samples (
			id TEXT PRIMARY KEY,
			job_id TEXT NOT NULL,
			scorecard_id TEXT,
			intro_message TEXT,
			rules BLOB,
			sections BLOB,
			estimated_time_minutes INTEGER,
			generated_at DATETIME,
			prompt_version TEXT,
			created_at DATETIME,
			updated_at DATETIME
		)
	`).Error
	if err != nil {
		return nil, err
	}

	// Set as global DB
	database.Db = db

	return db, nil
}

// setupTestRouter creates a test router with gin in test mode
func setupTestRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	return router
}

// generateID creates a unique ID for testing
func generateID(prefix string) string {
	testCounter++
	return fmt.Sprintf("%s-%d-%d", prefix, testCounter, rand.Intn(10000))
}

// createTestUser creates a test user and sets it in the context
func createTestUser(db *gorm.DB, role models.UserRole, orgID *string) *models.User {
	user := &models.User{
		ID:     generateID("user"),
		Email:  fmt.Sprintf("test-%d@example.com", testCounter),
		Role:   role,
		OrgID:  orgID,
		Status: models.UserStatusActive,
	}
	db.Create(user)
	return user
}

// createTestOrg creates a test organization
func createTestOrg(db *gorm.DB) *models.Org {
	org := &models.Org{
		ID:   generateID("org"),
		Name: "Test Org",
	}
	db.Create(org)
	return org
}

// createTestJob creates a test job
func createTestJob(db *gorm.DB, orgID string) *models.Job {
	job := &models.Job{
		ID:              generateID("job"),
		OrgID:           orgID,
		Title:           "Senior Backend Engineer",
		Team:            "Payments",
		BusinessContext: "Test business context",
		MainProblem:     "Test main problem",
		Status:          models.JobStatusDraft,
	}
	db.Create(job)
	return job
}

// authMiddleware is a test middleware that sets the user in context
func authMiddleware(user *models.User) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Set("user", user)
		c.Next()
	}
}

// performRequest performs an HTTP request and returns the response
func performRequest(router *gin.Engine, method, path string, body *string) *httptest.ResponseRecorder {
	var req *http.Request
	if body != nil {
		req, _ = http.NewRequest(method, path, stringReader(*body))
		req.Header.Set("Content-Type", "application/json")
	} else {
		req, _ = http.NewRequest(method, path, nil)
	}
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	return w
}

// stringReader creates a reader from a string
func stringReader(s string) *stringReaderImpl {
	return &stringReaderImpl{s: s, i: 0}
}

type stringReaderImpl struct {
	s string
	i int
}

func (r *stringReaderImpl) Read(p []byte) (n int, err error) {
	if r.i >= len(r.s) {
		return 0, io.EOF
	}
	n = copy(p, r.s[r.i:])
	r.i += n
	return n, nil
}
