package services

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"time"

	"gorm.io/gorm"

	"github.com/baaraco/baara/apps/api/internal/repositories"
	"github.com/baaraco/baara/pkg/models"
)

// Errors
var (
	ErrInvalidRoleType  = errors.New("invalid role type")
	ErrTemplateNotFound = errors.New("template not found")
	ErrCooldownActive   = errors.New("cooldown active")
	ErrProfileNotFound  = errors.New("proof profile not found")
	ErrNotCandidate     = errors.New("user is not a candidate")
)

// CooldownInfo contains information about an active cooldown
type CooldownInfo struct {
	CooldownEnd   time.Time
	RemainingDays int
}

// StartEvaluationResult contains the result of starting an evaluation
type StartEvaluationResult struct {
	Attempt  *models.WorkSampleAttempt
	Existing bool
}

// ValidRoleTypes lists the allowed role types for templates
var ValidRoleTypes = map[string]bool{
	"backend_go":     true,
	"sre":            true,
	"infra_platform": true,
}

// EvaluationService handles business logic for evaluations
type EvaluationService struct {
	templateRepo     *repositories.TemplateRepository
	attemptRepo      *repositories.AttemptRepository
	proofProfileRepo *repositories.ProofProfileRepository
}

// NewEvaluationService creates a new evaluation service
func NewEvaluationService(
	templateRepo *repositories.TemplateRepository,
	attemptRepo *repositories.AttemptRepository,
	proofProfileRepo *repositories.ProofProfileRepository,
) *EvaluationService {
	return &EvaluationService{
		templateRepo:     templateRepo,
		attemptRepo:      attemptRepo,
		proofProfileRepo: proofProfileRepo,
	}
}

// ListTemplates returns all active evaluation templates
func (s *EvaluationService) ListTemplates() ([]models.EvaluationTemplate, error) {
	return s.templateRepo.FindAllActive()
}

// GetTemplate returns a template by role type
func (s *EvaluationService) GetTemplate(roleType string) (*models.EvaluationTemplate, error) {
	if !ValidRoleTypes[roleType] {
		return nil, ErrInvalidRoleType
	}

	template, err := s.templateRepo.FindByRoleType(roleType)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrTemplateNotFound
		}
		return nil, err
	}
	return template, nil
}

// CheckCooldown checks if a user is in cooldown for a role type
// Returns nil if no cooldown is active, or CooldownInfo if cooldown is active
func (s *EvaluationService) CheckCooldown(userID, roleType string, cooldownDays int) (*CooldownInfo, error) {
	lastAttempt, err := s.attemptRepo.FindLastSubmittedByUserAndRole(userID, roleType)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil // No previous attempt, no cooldown
		}
		return nil, err
	}

	if lastAttempt.SubmittedAt == nil {
		return nil, nil
	}

	if cooldownDays == 0 {
		cooldownDays = 90
	}

	cooldownEnd := lastAttempt.SubmittedAt.Add(time.Duration(cooldownDays) * 24 * time.Hour)
	if time.Now().Before(cooldownEnd) {
		remaining := int(time.Until(cooldownEnd).Hours() / 24)
		return &CooldownInfo{
			CooldownEnd:   cooldownEnd,
			RemainingDays: remaining,
		}, nil
	}

	return nil, nil
}

// StartEvaluation starts or returns an existing evaluation for a user
func (s *EvaluationService) StartEvaluation(userID, roleType string) (*StartEvaluationResult, *CooldownInfo, error) {
	if !ValidRoleTypes[roleType] {
		return nil, nil, ErrInvalidRoleType
	}

	// Get template
	template, err := s.templateRepo.FindByRoleType(roleType)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil, ErrTemplateNotFound
		}
		return nil, nil, err
	}

	// Check cooldown
	cooldownInfo, err := s.CheckCooldown(userID, roleType, template.CooldownDays)
	if err != nil {
		return nil, nil, err
	}
	if cooldownInfo != nil {
		return nil, cooldownInfo, ErrCooldownActive
	}

	// Check for existing active attempt
	existingAttempt, err := s.attemptRepo.FindActiveByUserAndRole(userID, roleType)
	if err == nil && existingAttempt != nil {
		return &StartEvaluationResult{
			Attempt:  existingAttempt,
			Existing: true,
		}, nil, nil
	}
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil, err
	}

	// Create new attempt
	attempt := &models.WorkSampleAttempt{
		CandidateID:          userID,
		EvaluationTemplateID: &template.ID,
		RoleType:             roleType,
		InterviewMode:        "conversation",
		Status:               models.AttemptStatusDraft,
		Progress:             0,
	}
	if setErr := attempt.SetAnswers(make(map[string]string)); setErr != nil {
		return nil, nil, setErr
	}

	createdAttempt, wasExisting, err := s.attemptRepo.Create(attempt)
	if err != nil {
		return nil, nil, err
	}

	return &StartEvaluationResult{
		Attempt:  createdAttempt,
		Existing: wasExisting,
	}, nil, nil
}

// GetPublicProofProfile returns a public proof profile by slug
func (s *EvaluationService) GetPublicProofProfile(slug string) (*models.ProofProfile, string, error) {
	profile, err := s.proofProfileRepo.FindByPublicSlug(slug)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, "", ErrProfileNotFound
		}
		return nil, "", err
	}

	// Get role type from job or evaluation template
	roleType := ""
	if profile.Job != nil {
		roleType = profile.Job.RoleType
	} else if profile.EvaluationTemplate != nil {
		roleType = profile.EvaluationTemplate.RoleType
	}

	return profile, roleType, nil
}

// UpdateProofProfileVisibility updates the visibility of a user's proof profile
func (s *EvaluationService) UpdateProofProfileVisibility(userID string, isPublic bool) (*models.ProofProfile, error) {
	profile, err := s.proofProfileRepo.FindLatestByUserID(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrProfileNotFound
		}
		return nil, err
	}

	updates := map[string]interface{}{
		"is_public": isPublic,
	}

	// Generate slug if making public and no slug exists
	if isPublic && profile.PublicSlug == "" {
		slug, err := generatePublicSlug()
		if err != nil {
			return nil, err
		}
		updates["public_slug"] = slug
	}

	if err := s.proofProfileRepo.Update(profile, updates); err != nil {
		return nil, err
	}

	// Reload the profile
	if err := s.proofProfileRepo.Reload(profile); err != nil {
		return nil, err
	}

	return profile, nil
}

// generatePublicSlug generates a random URL-safe slug
func generatePublicSlug() (string, error) {
	bytes := make([]byte, 12)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}
