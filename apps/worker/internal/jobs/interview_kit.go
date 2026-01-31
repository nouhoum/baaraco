package jobs

import (
	"encoding/json"
	"fmt"
	"time"

	"go.uber.org/zap"

	"github.com/baaraco/baara/pkg/ai"
	"github.com/baaraco/baara/pkg/database"
	"github.com/baaraco/baara/pkg/logger"
	"github.com/baaraco/baara/pkg/models"
)

// =============================================================================
// JOB TYPE
// =============================================================================

// GenerateInterviewKitJob is the job to generate an interview kit after proof profile creation
type GenerateInterviewKitJob struct {
	Type           string `json:"type"`
	ProofProfileID string `json:"proof_profile_id"`
}

// =============================================================================
// PROCESSOR
// =============================================================================

type InterviewKitProcessor struct {
	aiClient ai.Generator
}

func NewInterviewKitProcessor() *InterviewKitProcessor {
	return &InterviewKitProcessor{
		aiClient: ai.NewClient(),
	}
}

func (p *InterviewKitProcessor) Process(data []byte) error {
	var baseJob struct {
		Type string `json:"type"`
	}
	if err := json.Unmarshal(data, &baseJob); err != nil {
		return fmt.Errorf("failed to unmarshal job type: %w", err)
	}

	logger.Debug("Processing interview kit job",
		zap.String("type", baseJob.Type),
	)

	switch baseJob.Type {
	case "generate_interview_kit":
		var job GenerateInterviewKitJob
		if err := json.Unmarshal(data, &job); err != nil {
			return fmt.Errorf("failed to unmarshal generate_interview_kit job: %w", err)
		}
		return p.generateInterviewKit(job)

	default:
		return fmt.Errorf("unknown interview kit job type: %s", baseJob.Type)
	}
}

// =============================================================================
// GENERATE INTERVIEW KIT
// =============================================================================

func (p *InterviewKitProcessor) generateInterviewKit(job GenerateInterviewKitJob) error {
	logger.Info("Starting interview kit generation",
		zap.String("proof_profile_id", job.ProofProfileID),
	)

	// 1. Load the proof profile with candidate and job
	var profile models.ProofProfile
	if err := database.Db.Preload("Candidate").Preload("Job").First(&profile, "id = ?", job.ProofProfileID).Error; err != nil {
		return fmt.Errorf("failed to load proof profile: %w", err)
	}

	// 2. Check if interview kit already exists
	var existingCount int64
	database.Db.Model(&models.InterviewKit{}).Where("proof_profile_id = ?", profile.ID).Count(&existingCount)
	if existingCount > 0 {
		logger.Info("Interview kit already exists, skipping",
			zap.String("proof_profile_id", profile.ID),
		)
		return nil
	}

	// 3. Parse proof profile data
	criteriaSummary := profile.GetCriteriaSummary()

	var strengths []models.StrengthItem
	if len(profile.Strengths) > 0 {
		if err := json.Unmarshal(profile.Strengths, &strengths); err != nil {
			logger.Warn("Failed to unmarshal strengths", zap.Error(err))
		}
	}

	var areasToExplore []models.AreaToExplore
	if len(profile.AreasToExplore) > 0 {
		if err := json.Unmarshal(profile.AreasToExplore, &areasToExplore); err != nil {
			logger.Warn("Failed to unmarshal areas to explore", zap.Error(err))
		}
	}

	var redFlags []models.RedFlagItem
	if len(profile.RedFlags) > 0 {
		if err := json.Unmarshal(profile.RedFlags, &redFlags); err != nil {
			logger.Warn("Failed to unmarshal red flags", zap.Error(err))
		}
	}

	// 4. Build AI input
	jobTitle := ""
	candidateName := ""
	if profile.Job != nil {
		jobTitle = profile.Job.Title
	}
	if profile.Candidate != nil {
		candidateName = profile.Candidate.Name
	}

	input := ai.InterviewKitInput{
		JobTitle:       jobTitle,
		CandidateName:  candidateName,
		GlobalScore:    profile.GlobalScore,
		Recommendation: string(profile.Recommendation),
		OneLiner:       profile.OneLiner,
		Criteria:       criteriaSummary,
		Strengths:      strengths,
		AreasToExplore: areasToExplore,
		RedFlags:       redFlags,
	}

	// 5. Check AI client
	if !p.aiClient.IsConfigured() {
		return fmt.Errorf("AI client is not configured")
	}

	// 6. Generate interview kit via AI
	output, err := p.aiClient.GenerateInterviewKit(input)
	if err != nil {
		return fmt.Errorf("failed to generate interview kit: %w", err)
	}

	// 7. Create and persist interview kit
	now := time.Now()
	kit := models.InterviewKit{
		ProofProfileID:       profile.ID,
		CandidateID:          profile.CandidateID,
		JobID:                profile.JobID,
		TotalDurationMinutes: output.TotalDurationMinutes,
		GeneratedAt:          &now,
	}

	if err := kit.SetSections(output.Sections); err != nil {
		return fmt.Errorf("failed to set sections: %w", err)
	}
	if err := kit.SetDebriefTemplate(output.DebriefTemplate); err != nil {
		return fmt.Errorf("failed to set debrief template: %w", err)
	}

	if err := database.Db.Create(&kit).Error; err != nil {
		return fmt.Errorf("failed to save interview kit: %w", err)
	}

	logger.Info("Interview kit generated",
		zap.String("proof_profile_id", job.ProofProfileID),
		zap.String("interview_kit_id", kit.ID),
		zap.Int("sections", len(output.Sections)),
		zap.Int("duration_minutes", output.TotalDurationMinutes),
	)

	return nil
}
