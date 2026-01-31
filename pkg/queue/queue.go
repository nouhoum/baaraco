package queue

import (
	"context"
	"encoding/json"
	"fmt"

	"go.uber.org/zap"

	"github.com/baaraco/baara/pkg/logger"
	"github.com/baaraco/baara/pkg/redis"
)

// Queue names
const (
	NameEmail                = "email:queue"
	NameEvaluateWorkSample   = "evaluate_work_sample"
	NameGenerateProofProfile = "generate_proof_profile"
	NameGenerateInterviewKit = "generate_interview_kit"
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

// GenerateInterviewKitJob is the job to generate an interview kit after proof profile creation
type GenerateInterviewKitJob struct {
	Type           string `json:"type"`
	ProofProfileID string `json:"proof_profile_id"`
}

// =============================================================================
// QUEUE FUNCTIONS
// =============================================================================

// QueueEvaluateWorkSample queues a job to evaluate a work sample attempt
func QueueEvaluateWorkSample(attemptID string) error {
	job := EvaluateWorkSampleJob{
		Type:      "evaluate_work_sample",
		AttemptID: attemptID,
	}
	data, err := json.Marshal(job)
	if err != nil {
		return fmt.Errorf("failed to marshal job: %w", err)
	}

	if err := redis.Push(context.Background(), NameEvaluateWorkSample, data); err != nil {
		return fmt.Errorf("failed to queue job: %w", err)
	}

	logger.Info("Queued work sample evaluation",
		zap.String("attempt_id", attemptID),
	)

	return nil
}

// QueueGenerateProofProfile queues a job to generate a proof profile
func QueueGenerateProofProfile(evaluationID string) error {
	job := GenerateProofProfileJob{
		Type:         "generate_proof_profile",
		EvaluationID: evaluationID,
	}
	data, err := json.Marshal(job)
	if err != nil {
		return fmt.Errorf("failed to marshal job: %w", err)
	}

	if err := redis.Push(context.Background(), NameGenerateProofProfile, data); err != nil {
		return fmt.Errorf("failed to queue job: %w", err)
	}

	logger.Info("Queued proof profile generation",
		zap.String("evaluation_id", evaluationID),
	)

	return nil
}

// QueueGenerateInterviewKit queues a job to generate an interview kit
func QueueGenerateInterviewKit(proofProfileID string) error {
	job := GenerateInterviewKitJob{
		Type:           "generate_interview_kit",
		ProofProfileID: proofProfileID,
	}
	data, err := json.Marshal(job)
	if err != nil {
		return fmt.Errorf("failed to marshal job: %w", err)
	}

	if err := redis.Push(context.Background(), NameGenerateInterviewKit, data); err != nil {
		return fmt.Errorf("failed to queue job: %w", err)
	}

	logger.Info("Queued interview kit generation",
		zap.String("proof_profile_id", proofProfileID),
	)

	return nil
}
