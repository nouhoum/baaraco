package handlers

import (
	"context"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"net/http/httptest"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite" // Pure Go SQLite driver (no CGO required)
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/baaraco/baara/pkg/database"
	applogger "github.com/baaraco/baara/pkg/logger"
	"github.com/baaraco/baara/pkg/models"
)

var testCounter int

// TestDB sets up an in-memory SQLite database for testing
func setupTestDB() (*gorm.DB, error) {
	// Initialize logger (idempotent - safe to call multiple times)
	if applogger.Log == nil {
		_ = applogger.Init()
	}

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
			resume_url TEXT,
			resume_original_name TEXT,
			bio TEXT,
			years_of_experience INTEGER,
			current_company TEXT,
			current_title TEXT,
			skills BLOB,
			location TEXT,
			education BLOB,
			certifications BLOB,
			languages BLOB,
			website_url TEXT,
			availability TEXT,
			remote_preference TEXT,
			open_to_relocation INTEGER DEFAULT 0,
			experiences BLOB,
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
			org_id TEXT,
			is_template INTEGER DEFAULT 0,
			is_public INTEGER DEFAULT 0,
			slug TEXT,
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

	err = db.Exec(`
		CREATE TABLE IF NOT EXISTS work_sample_attempts (
			id TEXT PRIMARY KEY,
			candidate_id TEXT NOT NULL,
			job_id TEXT,
			evaluation_template_id TEXT,
			status TEXT DEFAULT 'draft',
			role_type TEXT,
			interview_mode TEXT DEFAULT 'form',
			answers BLOB,
			progress INTEGER DEFAULT 0,
			last_saved_at DATETIME,
			submitted_at DATETIME,
			reviewed_at DATETIME,
			rejection_reason TEXT,
			created_at DATETIME,
			updated_at DATETIME,
			deleted_at DATETIME
		)
	`).Error
	if err != nil {
		return nil, err
	}

	err = db.Exec(`
		CREATE TABLE IF NOT EXISTS evaluations (
			id TEXT PRIMARY KEY,
			attempt_id TEXT NOT NULL,
			job_id TEXT,
			candidate_id TEXT NOT NULL,
			evaluation_template_id TEXT,
			global_score INTEGER DEFAULT 0,
			criteria_evaluations BLOB,
			recommendation TEXT,
			recommendation_reason TEXT,
			uncovered_criteria BLOB,
			prompt_version TEXT,
			generated_at DATETIME,
			created_at DATETIME,
			updated_at DATETIME,
			deleted_at DATETIME
		)
	`).Error
	if err != nil {
		return nil, err
	}

	err = db.Exec(`
		CREATE TABLE IF NOT EXISTS proof_profiles (
			id TEXT PRIMARY KEY,
			evaluation_id TEXT NOT NULL,
			attempt_id TEXT NOT NULL,
			job_id TEXT,
			candidate_id TEXT NOT NULL,
			evaluation_template_id TEXT,
			global_score INTEGER DEFAULT 0,
			score_label TEXT,
			percentile INTEGER DEFAULT 0,
			recommendation TEXT,
			one_liner TEXT,
			criteria_summary BLOB,
			strengths BLOB,
			areas_to_explore BLOB,
			red_flags BLOB,
			interview_focus_points BLOB,
			is_public INTEGER DEFAULT 0,
			public_slug TEXT,
			generated_at DATETIME,
			created_at DATETIME,
			updated_at DATETIME
		)
	`).Error
	if err != nil {
		return nil, err
	}

	err = db.Exec(`
		CREATE TABLE IF NOT EXISTS interview_kits (
			id TEXT PRIMARY KEY,
			proof_profile_id TEXT NOT NULL,
			candidate_id TEXT NOT NULL,
			job_id TEXT NOT NULL,
			total_duration_minutes INTEGER DEFAULT 60,
			sections BLOB DEFAULT '[]',
			debrief_template BLOB DEFAULT '{}',
			notes BLOB DEFAULT '{}',
			generated_at DATETIME,
			created_at DATETIME,
			updated_at DATETIME
		)
	`).Error
	if err != nil {
		return nil, err
	}

	err = db.Exec(`
		CREATE TABLE IF NOT EXISTS decision_memos (
			id TEXT PRIMARY KEY,
			job_id TEXT NOT NULL,
			candidate_id TEXT NOT NULL,
			recruiter_id TEXT NOT NULL,
			decision TEXT NOT NULL DEFAULT 'pending',
			post_interview_evaluations BLOB DEFAULT '[]',
			confirmed_strengths BLOB DEFAULT '[]',
			identified_risks BLOB DEFAULT '[]',
			justification TEXT NOT NULL DEFAULT '',
			next_steps BLOB DEFAULT '{}',
			status TEXT NOT NULL DEFAULT 'draft',
			submitted_at DATETIME,
			created_at DATETIME,
			updated_at DATETIME
		)
	`).Error
	if err != nil {
		return nil, err
	}

	err = db.Exec(`
		CREATE TABLE IF NOT EXISTS invites (
			id TEXT PRIMARY KEY,
			org_id TEXT,
			email TEXT NOT NULL,
			role TEXT NOT NULL,
			invited_by TEXT,
			job_id TEXT,
			token_hash TEXT NOT NULL,
			expires_at DATETIME NOT NULL,
			accepted_at DATETIME,
			created_at DATETIME
		)
	`).Error
	if err != nil {
		return nil, err
	}

	err = db.Exec(`
		CREATE TABLE IF NOT EXISTS sessions (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL,
			token_hash TEXT NOT NULL,
			ip_address TEXT,
			user_agent TEXT,
			expires_at DATETIME NOT NULL,
			revoked_at DATETIME,
			created_at DATETIME
		)
	`).Error
	if err != nil {
		return nil, err
	}

	err = db.Exec(`
		CREATE TABLE IF NOT EXISTS identities (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL,
			provider TEXT NOT NULL,
			provider_subject TEXT,
			email TEXT,
			metadata TEXT DEFAULT '{}',
			created_at DATETIME,
			updated_at DATETIME
		)
	`).Error
	if err != nil {
		return nil, err
	}

	err = db.Exec(`
		CREATE TABLE IF NOT EXISTS format_requests (
			id TEXT PRIMARY KEY,
			attempt_id TEXT NOT NULL,
			candidate_id TEXT,
			reason TEXT NOT NULL,
			preferred_format TEXT NOT NULL,
			comment TEXT,
			status TEXT DEFAULT 'pending',
			response_message TEXT,
			reviewed_by TEXT,
			reviewed_at DATETIME,
			review_note TEXT,
			created_at DATETIME,
			updated_at DATETIME,
			deleted_at DATETIME
		)
	`).Error
	if err != nil {
		return nil, err
	}

	// Register callback to auto-generate IDs (SQLite doesn't support gen_random_uuid())
	db.Callback().Create().Before("gorm:create").Register("generate_id", func(tx *gorm.DB) {
		if tx.Statement.Schema != nil {
			for _, field := range tx.Statement.Schema.PrimaryFields {
				if field.Name == "ID" {
					val, _ := field.ValueOf(tx.Statement.Context, tx.Statement.ReflectValue)
					if val == "" || val == nil {
						_ = field.Set(tx.Statement.Context, tx.Statement.ReflectValue, generateID("auto"))
					}
				}
			}
		}
	})

	// Set as global DB
	database.Db = db

	return db, nil
}

// createTestInvite creates a test invite
func createTestInvite(db *gorm.DB, email string, role models.UserRole, orgID *string, jobID *string, tokenHash string, expiresAt time.Time) *models.Invite {
	invite := &models.Invite{
		ID:        generateID("invite"),
		OrgID:     orgID,
		Email:     email,
		Role:      role,
		JobID:     jobID,
		TokenHash: tokenHash,
		ExpiresAt: expiresAt,
	}
	db.Create(invite)
	return invite
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
		OrgID:           &orgID,
		Title:           "Senior Backend Engineer",
		Team:            "Payments",
		BusinessContext: "Test business context",
		MainProblem:     "Test main problem",
		Status:          models.JobStatusDraft,
	}
	db.Create(job)
	return job
}

// createTestWorkSampleAttempt creates a test work sample attempt
func createTestWorkSampleAttempt(db *gorm.DB, candidateID string, jobID *string, status string) *models.WorkSampleAttempt {
	attempt := &models.WorkSampleAttempt{
		ID:          generateID("attempt"),
		CandidateID: candidateID,
		JobID:       jobID,
		Status:      models.WorkSampleAttemptStatus(status),
		Answers:     []byte(`{}`),
		Progress:    50,
	}
	db.Create(attempt)
	return attempt
}

// createTestEvaluation creates a test evaluation
func createTestEvaluation(db *gorm.DB, attemptID, jobID, candidateID string) *models.Evaluation {
	evaluation := &models.Evaluation{
		ID:                   generateID("eval"),
		AttemptID:            attemptID,
		JobID:                &jobID,
		CandidateID:          candidateID,
		GlobalScore:          75,
		CriteriaEvaluations:  []byte(`[]`),
		Recommendation:       models.RecommendationMaybe,
		RecommendationReason: "Test recommendation",
		UncoveredCriteria:    []byte(`[]`),
		PromptVersion:        "v1.0",
	}
	db.Create(evaluation)
	return evaluation
}

// createTestProofProfile creates a test proof profile
func createTestProofProfile(db *gorm.DB, evaluationID, attemptID, jobID, candidateID string) *models.ProofProfile {
	profile := &models.ProofProfile{
		ID:                   generateID("pp"),
		EvaluationID:         evaluationID,
		AttemptID:            attemptID,
		JobID:                &jobID,
		CandidateID:          candidateID,
		GlobalScore:          75,
		ScoreLabel:           "bon",
		Percentile:           70,
		Recommendation:       models.RecommendationMaybe,
		OneLiner:             "Test one-liner",
		CriteriaSummary:      []byte(`[]`),
		Strengths:            []byte(`[]`),
		AreasToExplore:       []byte(`[]`),
		RedFlags:             []byte(`[]`),
		InterviewFocusPoints: []byte(`[]`),
	}
	db.Create(profile)
	return profile
}

// createTestInterviewKit creates a test interview kit
func createTestInterviewKit(db *gorm.DB, proofProfileID, jobID, candidateID string) *models.InterviewKit {
	kit := &models.InterviewKit{
		ID:                   generateID("ik"),
		ProofProfileID:       proofProfileID,
		JobID:                &jobID,
		CandidateID:          candidateID,
		TotalDurationMinutes: 60,
		Sections:             []byte(`[{"title":"Test Section","duration_minutes":20,"questions":[{"question":"Test question?","context":"Test context","positive_signals":["Good"],"negative_signals":["Bad"],"follow_up":"Follow up?"}]}]`),
		DebriefTemplate:      []byte(`{"criteria":[{"name":"Tech","score":75,"reevaluate":true}],"final_recommendation_prompt":"Recommandez-vous ?"}`),
		Notes:                []byte(`{}`),
	}
	db.Create(kit)
	return kit
}

// createTestDecisionMemo creates a test decision memo
func createTestDecisionMemo(db *gorm.DB, jobID, candidateID, recruiterID string) *models.DecisionMemo {
	memo := &models.DecisionMemo{
		ID:                       generateID("dm"),
		JobID:                    jobID,
		CandidateID:              candidateID,
		RecruiterID:              recruiterID,
		Decision:                 models.DecisionPending,
		PostInterviewEvaluations: []byte(`[]`),
		ConfirmedStrengths:       []byte(`[]`),
		IdentifiedRisks:          []byte(`[]`),
		Justification:            "",
		NextSteps:                []byte(`{}`),
		Status:                   models.DecisionMemoDraft,
	}
	db.Create(memo)
	return memo
}

// noopMailer is a test mailer that does nothing
type noopMailer struct{}

func (m *noopMailer) Send(to, subject, htmlBody, textBody string) error {
	return nil
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
		req, _ = http.NewRequestWithContext(context.Background(), method, path, stringReader(*body))
		req.Header.Set("Content-Type", "application/json")
	} else {
		req, _ = http.NewRequestWithContext(context.Background(), method, path, nil)
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
