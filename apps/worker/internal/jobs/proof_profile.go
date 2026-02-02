package jobs

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"go.uber.org/zap"

	"github.com/baaraco/baara/pkg/database"
	"github.com/baaraco/baara/pkg/logger"
	"github.com/baaraco/baara/pkg/models"
	"github.com/baaraco/baara/pkg/queue"
	"github.com/baaraco/baara/pkg/redis"
)

// =============================================================================
// PROCESSOR
// =============================================================================

type ProofProfileProcessor struct{}

func NewProofProfileProcessor() *ProofProfileProcessor {
	return &ProofProfileProcessor{}
}

func (p *ProofProfileProcessor) Process(data []byte) error {
	var baseJob struct {
		Type string `json:"type"`
	}
	if err := json.Unmarshal(data, &baseJob); err != nil {
		return fmt.Errorf("failed to unmarshal job type: %w", err)
	}

	logger.Debug("Processing proof profile job",
		zap.String("type", baseJob.Type),
	)

	switch baseJob.Type {
	case "generate_proof_profile":
		var job GenerateProofProfileJob
		if err := json.Unmarshal(data, &job); err != nil {
			return fmt.Errorf("failed to unmarshal generate_proof_profile job: %w", err)
		}
		return p.generateProofProfile(job)

	default:
		return fmt.Errorf("unknown proof profile job type: %s", baseJob.Type)
	}
}

// =============================================================================
// GENERATE PROOF PROFILE
// =============================================================================

func (p *ProofProfileProcessor) generateProofProfile(job GenerateProofProfileJob) error {
	logger.Info("Starting proof profile generation",
		zap.String("evaluation_id", job.EvaluationID),
	)

	// 1. Load the evaluation
	var evaluation models.Evaluation
	if err := database.Db.Preload("Candidate").Preload("Job").Preload("EvaluationTemplate").First(&evaluation, "id = ?", job.EvaluationID).Error; err != nil {
		return fmt.Errorf("failed to load evaluation: %w", err)
	}

	// 2. Parse criteria evaluations
	criteriaEvals := evaluation.GetCriteriaEvaluations()

	// 3. Calculate percentile
	// For template evaluations, compare against all evaluations with the same evaluation_template_id.
	// For regular job evaluations, compare against the same job_id.
	var otherEvals []models.Evaluation
	if evaluation.EvaluationTemplateID != nil && *evaluation.EvaluationTemplateID != "" {
		database.Db.Where("evaluation_template_id = ? AND id != ?", *evaluation.EvaluationTemplateID, evaluation.ID).
			Find(&otherEvals)
	} else if evaluation.JobID != nil && *evaluation.JobID != "" {
		database.Db.Where("job_id = ? AND id != ?", *evaluation.JobID, evaluation.ID).Find(&otherEvals)
	}
	otherScores := make([]int, 0, len(otherEvals))
	for _, e := range otherEvals {
		otherScores = append(otherScores, e.GlobalScore)
	}
	percentile := models.CalculatePercentile(evaluation.GlobalScore, otherScores)

	// 4. Build criteria summary
	criteriaSummary := buildCriteriaSummary(criteriaEvals)

	// 5. Build strengths
	strengths := buildStrengths(criteriaEvals)

	// 6. Build areas to explore
	areasToExplore := buildAreasToExplore(criteriaEvals)

	// 7. Build red flags
	redFlags := buildRedFlags(criteriaEvals)

	// 8. Build interview focus points
	interviewFocusPoints := buildInterviewFocusPoints(criteriaEvals, evaluation.GetUncoveredCriteria())

	// 9. Generate one-liner
	jobTitle := ""
	if evaluation.Job != nil {
		jobTitle = evaluation.Job.Title
	} else if evaluation.EvaluationTemplate != nil {
		jobTitle = evaluation.EvaluationTemplate.Title
	}
	oneLiner := models.GenerateOneLiner(evaluation.GlobalScore, evaluation.Recommendation, jobTitle)

	// 10. Create proof profile
	now := time.Now()
	profile := models.ProofProfile{
		EvaluationID:         evaluation.ID,
		AttemptID:            evaluation.AttemptID,
		JobID:                evaluation.JobID,
		EvaluationTemplateID: evaluation.EvaluationTemplateID,
		CandidateID:          evaluation.CandidateID,
		GlobalScore:          evaluation.GlobalScore,
		ScoreLabel:           models.GetScoreLabel(evaluation.GlobalScore),
		Percentile:           percentile,
		Recommendation:       evaluation.Recommendation,
		OneLiner:             oneLiner,
		GeneratedAt:          &now,
	}

	// Set JSON fields
	if err := profile.SetCriteriaSummary(criteriaSummary); err != nil {
		return fmt.Errorf("failed to set criteria summary: %w", err)
	}
	if err := profile.SetStrengths(strengths); err != nil {
		return fmt.Errorf("failed to set strengths: %w", err)
	}
	if err := profile.SetAreasToExplore(areasToExplore); err != nil {
		return fmt.Errorf("failed to set areas to explore: %w", err)
	}
	if err := profile.SetRedFlags(redFlags); err != nil {
		return fmt.Errorf("failed to set red flags: %w", err)
	}
	if err := profile.SetInterviewFocusPoints(interviewFocusPoints); err != nil {
		return fmt.Errorf("failed to set interview focus points: %w", err)
	}

	if err := database.Db.Create(&profile).Error; err != nil {
		return fmt.Errorf("failed to save proof profile: %w", err)
	}

	logger.Info("Proof profile generated",
		zap.String("evaluation_id", job.EvaluationID),
		zap.String("proof_profile_id", profile.ID),
		zap.Int("global_score", profile.GlobalScore),
		zap.Int("percentile", profile.Percentile),
	)

	// 11. Send notifications
	p.sendNotifications(evaluation, profile)

	// 12. Queue interview kit generation
	if err := queue.QueueGenerateInterviewKit(profile.ID); err != nil {
		logger.Error("Failed to queue interview kit generation",
			zap.String("proof_profile_id", profile.ID),
			zap.Error(err),
		)
	}

	return nil
}

// =============================================================================
// DATA FORMATTING HELPERS
// =============================================================================

func buildCriteriaSummary(evals []models.CriterionEvaluation) []models.CriterionSummary {
	summaries := make([]models.CriterionSummary, 0, len(evals))
	for _, eval := range evals {
		summaries = append(summaries, models.CriterionSummary{
			Name:     eval.CriterionName,
			Score:    eval.Score,
			Weight:   eval.CriterionWeight,
			Status:   models.GetCriterionStatus(eval.Score),
			Headline: eval.Assessment,
		})
	}
	return summaries
}

func buildStrengths(evals []models.CriterionEvaluation) []models.StrengthItem {
	var strengths []models.StrengthItem
	for _, eval := range evals {
		if eval.Score >= 70 && len(eval.PositiveSignals) > 0 {
			evidence := eval.Assessment
			if len(eval.Quotes) > 0 {
				evidence = eval.Quotes[0]
			}
			strengths = append(strengths, models.StrengthItem{
				CriterionName: eval.CriterionName,
				Score:         eval.Score,
				Signals:       eval.PositiveSignals,
				Evidence:      evidence,
			})
		}
	}
	return strengths
}

func buildAreasToExplore(evals []models.CriterionEvaluation) []models.AreaToExplore {
	var areas []models.AreaToExplore
	for _, eval := range evals {
		if eval.Score < 70 || len(eval.NegativeSignals) > 0 {
			questions := generateSuggestedQuestions(eval)
			if len(questions) > 0 || len(eval.NegativeSignals) > 0 {
				areas = append(areas, models.AreaToExplore{
					CriterionName:      eval.CriterionName,
					Score:              eval.Score,
					Concerns:           eval.NegativeSignals,
					SuggestedQuestions: questions,
				})
			}
		}
	}
	return areas
}

func buildRedFlags(evals []models.CriterionEvaluation) []models.RedFlagItem {
	var flags []models.RedFlagItem
	for _, eval := range evals {
		if len(eval.RedFlags) > 0 {
			flags = append(flags, models.RedFlagItem{
				CriterionName: eval.CriterionName,
				Flags:         eval.RedFlags,
			})
		}
	}
	return flags
}

func buildInterviewFocusPoints(evals []models.CriterionEvaluation, uncoveredCriteria []string) []models.InterviewFocusPoint {
	points := make([]models.InterviewFocusPoint, 0, len(evals))

	// From strong criteria: verify strengths
	for _, eval := range evals {
		if eval.Score >= 85 {
			points = append(points, models.InterviewFocusPoint{
				Topic:  eval.CriterionName,
				Reason: "Score élevé à confirmer en entretien",
				Type:   "verify_strength",
			})
		}
	}

	// From weak criteria: explore concerns
	for _, eval := range evals {
		if eval.Score < 55 {
			points = append(points, models.InterviewFocusPoint{
				Topic:  eval.CriterionName,
				Reason: "Score faible nécessitant une exploration approfondie",
				Type:   "explore_concern",
			})
		}
	}

	// From uncovered criteria: investigate gaps
	for _, criterion := range uncoveredCriteria {
		points = append(points, models.InterviewFocusPoint{
			Topic:  criterion,
			Reason: "Critère non couvert par le work sample",
			Type:   "investigate_gap",
		})
	}

	return points
}

func generateSuggestedQuestions(eval models.CriterionEvaluation) []string {
	var questions []string

	if eval.Score < 55 {
		questions = append(questions,
			fmt.Sprintf("Pouvez-vous décrire une situation où vous avez démontré vos compétences en %s ?", eval.CriterionName),
		)
	}

	if len(eval.NegativeSignals) > 0 {
		questions = append(questions,
			fmt.Sprintf("Comment abordez-vous les défis liés à %s dans votre travail quotidien ?", eval.CriterionName),
		)
	}

	if !eval.CriterionCovered {
		questions = append(questions,
			fmt.Sprintf("Le work sample n'a pas permis d'évaluer %s. Pouvez-vous nous en dire plus ?", eval.CriterionName),
		)
	}

	return questions
}

// =============================================================================
// NOTIFICATIONS
// =============================================================================

func (p *ProofProfileProcessor) sendNotifications(evaluation models.Evaluation, profile models.ProofProfile) {
	// Send email to candidate: "Votre Proof Profile est prêt"
	if evaluation.Candidate != nil && evaluation.Candidate.Email != "" {
		candidateEmailJob := map[string]string{
			"type":             "proof_profile_ready_candidate",
			"to":               evaluation.Candidate.Email,
			"name":             evaluation.Candidate.Name,
			"candidate_id":     evaluation.CandidateID,
			"proof_profile_id": profile.ID,
		}
		data, err := json.Marshal(candidateEmailJob)
		if err != nil {
			logger.Error("Failed to marshal candidate email job", zap.Error(err))
		} else if err := redis.Push(context.Background(), "email:queue", data); err != nil {
			logger.Error("Failed to queue candidate proof profile email",
				zap.String("candidate_id", evaluation.CandidateID),
				zap.Error(err),
			)
		} else {
			logger.Info("Queued candidate proof profile notification",
				zap.String("candidate_id", evaluation.CandidateID),
			)
		}
	}

	// Send notification to recruiter: "Nouveau Proof Profile pour [Candidat]"
	if evaluation.Job != nil && evaluation.Job.OrgID != nil {
		var recruiters []models.User
		database.Db.Where("org_id = ? AND role = ?", *evaluation.Job.OrgID, models.RoleRecruiter).Find(&recruiters)

		for _, recruiter := range recruiters {
			candidateName := ""
			if evaluation.Candidate != nil {
				candidateName = evaluation.Candidate.Name
			}
			jobID := ""
			if evaluation.JobID != nil {
				jobID = *evaluation.JobID
			}
			recruiterEmailJob := map[string]string{
				"type":             "proof_profile_ready_recruiter",
				"to":               recruiter.Email,
				"name":             recruiter.Name,
				"candidate_name":   candidateName,
				"candidate_id":     evaluation.CandidateID,
				"job_id":           jobID,
				"proof_profile_id": profile.ID,
			}
			data, err := json.Marshal(recruiterEmailJob)
			if err != nil {
				logger.Error("Failed to marshal recruiter email job", zap.Error(err))
				continue
			}
			if err := redis.Push(context.Background(), "email:queue", data); err != nil {
				logger.Error("Failed to queue recruiter proof profile email",
					zap.String("recruiter_id", recruiter.ID),
					zap.Error(err),
				)
			} else {
				logger.Info("Queued recruiter proof profile notification",
					zap.String("recruiter_id", recruiter.ID),
				)
			}
		}
	}
}
