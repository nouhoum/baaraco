package jobs

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"go.uber.org/zap"

	"github.com/baaraco/baara/pkg/ai"
	"github.com/baaraco/baara/pkg/database"
	"github.com/baaraco/baara/pkg/logger"
	"github.com/baaraco/baara/pkg/models"
	"github.com/baaraco/baara/pkg/redis"
)

// =============================================================================
// JOB TYPES
// =============================================================================

// EvaluateWorkSampleJob is the job to evaluate a submitted work sample
type EvaluateWorkSampleJob struct {
	Type      string `json:"type"`
	AttemptID string `json:"attempt_id"`
}

// GenerateProofProfileJob is the job to generate a proof profile after evaluation
type GenerateProofProfileJob struct {
	Type         string `json:"type"`
	EvaluationID string `json:"evaluation_id"`
}

// Queue names
const (
	QueueNameEvaluateWorkSample   = "evaluate_work_sample"
	QueueNameGenerateProofProfile = "generate_proof_profile"
)

// =============================================================================
// PROCESSOR
// =============================================================================

type EvaluationProcessor struct {
	aiClient ai.Generator
}

func NewEvaluationProcessor() *EvaluationProcessor {
	return &EvaluationProcessor{
		aiClient: ai.NewClient(),
	}
}

// NewEvaluationProcessorWithClient creates a processor with a custom AI client (for testing)
func NewEvaluationProcessorWithClient(client ai.Generator) *EvaluationProcessor {
	return &EvaluationProcessor{
		aiClient: client,
	}
}

func (p *EvaluationProcessor) Process(data []byte) error {
	// First, check the job type
	var baseJob struct {
		Type string `json:"type"`
	}
	if err := json.Unmarshal(data, &baseJob); err != nil {
		return fmt.Errorf("failed to unmarshal job type: %w", err)
	}

	logger.Debug("Processing evaluation job",
		zap.String("type", baseJob.Type),
	)

	switch baseJob.Type {
	case "evaluate_work_sample":
		var job EvaluateWorkSampleJob
		if err := json.Unmarshal(data, &job); err != nil {
			return fmt.Errorf("failed to unmarshal evaluate_work_sample job: %w", err)
		}
		return p.evaluateWorkSample(job)

	default:
		return fmt.Errorf("unknown evaluation job type: %s", baseJob.Type)
	}
}

// =============================================================================
// EVALUATE WORK SAMPLE
// =============================================================================

func (p *EvaluationProcessor) evaluateWorkSample(job EvaluateWorkSampleJob) error {
	logger.Info("Starting work sample evaluation",
		zap.String("attempt_id", job.AttemptID),
	)

	// 1. Load the attempt with candidate
	var attempt models.WorkSampleAttempt
	if err := database.Db.Preload("Candidate").First(&attempt, "id = ?", job.AttemptID).Error; err != nil {
		return fmt.Errorf("failed to load attempt: %w", err)
	}

	// Verify attempt is submitted
	if attempt.Status != models.AttemptStatusSubmitted {
		return fmt.Errorf("attempt is not in submitted status: %s", attempt.Status)
	}

	// 2. Resolve evaluation config (from template or job)
	cfg, err := models.ResolveEvalConfig(database.Db, &attempt)
	if err != nil {
		return fmt.Errorf("failed to resolve eval config: %w", err)
	}

	// 3. Check AI is configured
	if !p.aiClient.IsConfigured() {
		return fmt.Errorf("AI client is not configured")
	}

	// 4. Parse answers from attempt
	var answers map[string]string
	if len(attempt.Answers) > 0 {
		if err = json.Unmarshal(attempt.Answers, &answers); err != nil {
			return fmt.Errorf("failed to parse answers: %w", err)
		}
	}

	// 5. Build evaluation input
	candidateName := ""
	if attempt.Candidate != nil {
		candidateName = attempt.Candidate.Name
	}

	input := ai.EvaluationInput{
		JobTitle:      cfg.Title,
		JobSeniority:  cfg.Seniority,
		Criteria:      cfg.Criteria,
		Sections:      cfg.Sections,
		Answers:       answers,
		CandidateName: candidateName,
	}

	// 8. Call AI to generate evaluation
	logger.Info("Calling AI to evaluate work sample",
		zap.String("attempt_id", job.AttemptID),
		zap.Int("criteria_count", len(input.Criteria)),
		zap.Int("sections_count", len(input.Sections)),
	)

	output, err := p.aiClient.GenerateEvaluation(input)
	if err != nil {
		return fmt.Errorf("failed to generate evaluation: %w", err)
	}

	// 9. Calculate global score
	globalScore := models.CalculateGlobalScore(output.CriteriaEvaluations)

	// 10. Serialize criteria evaluations
	criteriaJSON, err := json.Marshal(output.CriteriaEvaluations)
	if err != nil {
		return fmt.Errorf("failed to serialize criteria evaluations: %w", err)
	}

	uncoveredJSON, err := json.Marshal(output.UncoveredCriteria)
	if err != nil {
		return fmt.Errorf("failed to serialize uncovered criteria: %w", err)
	}

	// 9. Create evaluation record
	now := time.Now()
	var evalJobID *string
	var evalTemplateID *string
	if cfg.IsTemplate {
		evalTemplateID = &cfg.EvaluationTemplateID
	} else if cfg.JobID != "" {
		evalJobID = &cfg.JobID
	}
	evaluation := models.Evaluation{
		AttemptID:            job.AttemptID,
		JobID:                evalJobID,
		EvaluationTemplateID: evalTemplateID,
		CandidateID:          attempt.CandidateID,
		GlobalScore:          globalScore,
		CriteriaEvaluations:  criteriaJSON,
		Recommendation:       output.Recommendation,
		RecommendationReason: output.RecommendationReason,
		UncoveredCriteria:    uncoveredJSON,
		PromptVersion:        ai.GetEvaluationPromptVersion(),
		GeneratedAt:          &now,
	}

	err = database.Db.Create(&evaluation).Error
	if err != nil {
		return fmt.Errorf("failed to save evaluation: %w", err)
	}

	// 12. Update attempt status to reviewed
	attempt.Status = models.AttemptStatusReviewed
	attempt.ReviewedAt = &now
	err = database.Db.Save(&attempt).Error
	if err != nil {
		logger.Error("Failed to update attempt status",
			zap.String("attempt_id", job.AttemptID),
			zap.Error(err),
		)
	}

	logger.Info("Work sample evaluation completed",
		zap.String("attempt_id", job.AttemptID),
		zap.String("evaluation_id", evaluation.ID),
		zap.Int("global_score", globalScore),
		zap.String("recommendation", string(output.Recommendation)),
	)

	// 13. Queue proof profile generation job
	proofJob := GenerateProofProfileJob{
		Type:         "generate_proof_profile",
		EvaluationID: evaluation.ID,
	}
	proofJobData, err := json.Marshal(proofJob)
	if err != nil {
		logger.Error("Failed to marshal proof profile job", zap.Error(err))
		return nil // Don't fail the evaluation job for a marshaling error
	}
	if err := redis.Push(context.Background(), QueueNameGenerateProofProfile, proofJobData); err != nil {
		logger.Error("Failed to queue proof profile generation",
			zap.String("evaluation_id", evaluation.ID),
			zap.Error(err),
		)
		// Don't fail the evaluation job - proof profile can be retried
	} else {
		logger.Info("Queued proof profile generation",
			zap.String("evaluation_id", evaluation.ID),
		)
	}

	return nil
}
