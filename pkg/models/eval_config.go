package models

import (
	"fmt"

	"gorm.io/gorm"
)

// EvalConfig holds everything needed to run an evaluation, interview, or generate a profile.
// It abstracts whether the source is an EvaluationTemplate or a Job+Scorecard+WorkSample.
type EvalConfig struct {
	Title     string
	Seniority string
	Criteria  []ScorecardCriterion
	Sections  []WorkSampleSection
	Rules     []string
	RoleType  string

	// Source tracking — exactly one of these is set
	IsTemplate           bool
	EvaluationTemplateID string
	JobID                string
}

// ResolveEvalConfig loads an EvalConfig from an attempt.
// Priority: EvaluationTemplateID > JobID.
func ResolveEvalConfig(db *gorm.DB, attempt *WorkSampleAttempt) (*EvalConfig, error) {
	// Try EvaluationTemplate first
	if attempt.EvaluationTemplateID != nil && *attempt.EvaluationTemplateID != "" {
		var tmpl EvaluationTemplate
		if err := db.First(&tmpl, "id = ?", *attempt.EvaluationTemplateID).Error; err != nil {
			return nil, fmt.Errorf("evaluation template not found: %w", err)
		}
		return &EvalConfig{
			Title:                tmpl.Title,
			Seniority:            tmpl.Seniority,
			Criteria:             tmpl.GetCriteria(),
			Sections:             tmpl.GetSections(),
			Rules:                tmpl.GetRules(),
			RoleType:             tmpl.RoleType,
			IsTemplate:           true,
			EvaluationTemplateID: tmpl.ID,
		}, nil
	}

	// Fall back to Job + Scorecard + JobWorkSample
	if attempt.JobID != nil && *attempt.JobID != "" {
		var job Job
		if err := db.First(&job, "id = ?", *attempt.JobID).Error; err != nil {
			return nil, fmt.Errorf("job not found: %w", err)
		}

		var scorecard Scorecard
		if err := db.Where("job_id = ?", *attempt.JobID).First(&scorecard).Error; err != nil {
			return nil, fmt.Errorf("scorecard not found for job %s: %w", *attempt.JobID, err)
		}

		var ws JobWorkSample
		if err := db.Where("job_id = ?", *attempt.JobID).First(&ws).Error; err != nil {
			return nil, fmt.Errorf("work sample not found for job %s: %w", *attempt.JobID, err)
		}

		return &EvalConfig{
			Title:      job.Title,
			Seniority:  string(job.Seniority),
			Criteria:   scorecard.GetCriteria(),
			Sections:   ws.GetSections(),
			Rules:      ws.GetRules(),
			RoleType:   job.RoleType,
			IsTemplate: false,
			JobID:      job.ID,
		}, nil
	}

	return nil, fmt.Errorf("attempt has neither evaluation_template_id nor job_id")
}
