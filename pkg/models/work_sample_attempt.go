package models

import (
	"encoding/json"
	"time"

	"gorm.io/gorm"
)

// WorkSampleAttemptStatus represents the status of a work sample attempt
type WorkSampleAttemptStatus string

const (
	AttemptStatusDraft       WorkSampleAttemptStatus = "draft"
	AttemptStatusInProgress  WorkSampleAttemptStatus = "in_progress"
	AttemptStatusSubmitted   WorkSampleAttemptStatus = "submitted"
	AttemptStatusReviewed    WorkSampleAttemptStatus = "reviewed"
	AttemptStatusShortlisted WorkSampleAttemptStatus = "shortlisted"
	AttemptStatusRejected    WorkSampleAttemptStatus = "rejected"
	AttemptStatusHired       WorkSampleAttemptStatus = "hired"
)

// WorkSampleAttempt represents a candidate's attempt at a work sample
type WorkSampleAttempt struct {
	ID          string                  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CandidateID string                  `gorm:"type:uuid;not null" json:"candidate_id"`
	Candidate   *User                   `gorm:"foreignKey:CandidateID" json:"candidate,omitempty"`
	JobID       *string                 `gorm:"type:uuid" json:"job_id,omitempty"`
	Job         *Job                    `gorm:"foreignKey:JobID" json:"job,omitempty"`
	Status      WorkSampleAttemptStatus `gorm:"type:varchar(20);not null;default:'draft'" json:"status"`
	Answers     json.RawMessage         `gorm:"type:jsonb;default:'{}'" json:"answers"`
	Progress    int                     `gorm:"default:0" json:"progress"`
	LastSavedAt *time.Time              `json:"last_saved_at,omitempty"`
	SubmittedAt *time.Time              `json:"submitted_at,omitempty"`
	ReviewedAt      *time.Time              `json:"reviewed_at,omitempty"`
	RejectionReason string                  `json:"rejection_reason,omitempty"`
	CreatedAt       time.Time               `json:"created_at"`
	UpdatedAt       time.Time               `json:"updated_at"`
	DeletedAt       gorm.DeletedAt          `gorm:"index" json:"-"`
}

func (WorkSampleAttempt) TableName() string {
	return "work_sample_attempts"
}

// GetAnswers returns the answers as a map
func (w *WorkSampleAttempt) GetAnswers() (map[string]string, error) {
	var answers map[string]string
	if w.Answers == nil {
		return make(map[string]string), nil
	}
	if err := json.Unmarshal(w.Answers, &answers); err != nil {
		return nil, err
	}
	return answers, nil
}

// SetAnswers sets the answers from a map
func (w *WorkSampleAttempt) SetAnswers(answers map[string]string) error {
	data, err := json.Marshal(answers)
	if err != nil {
		return err
	}
	w.Answers = data
	return nil
}

// WorkSampleAttemptResponse is the API response for a work sample attempt
type WorkSampleAttemptResponse struct {
	ID          string                  `json:"id"`
	CandidateID string                  `json:"candidate_id"`
	JobID       *string                 `json:"job_id,omitempty"`
	Status      WorkSampleAttemptStatus `json:"status"`
	Answers     map[string]string       `json:"answers"`
	Progress    int                     `json:"progress"`
	LastSavedAt *time.Time              `json:"last_saved_at,omitempty"`
	SubmittedAt *time.Time              `json:"submitted_at,omitempty"`
	ReviewedAt  *time.Time              `json:"reviewed_at,omitempty"`
	CreatedAt   time.Time               `json:"created_at"`
	UpdatedAt   time.Time               `json:"updated_at"`
}

// ToResponse converts a WorkSampleAttempt to its API response
func (w *WorkSampleAttempt) ToResponse() *WorkSampleAttemptResponse {
	answers, _ := w.GetAnswers()
	return &WorkSampleAttemptResponse{
		ID:          w.ID,
		CandidateID: w.CandidateID,
		JobID:       w.JobID,
		Status:      w.Status,
		Answers:     answers,
		Progress:    w.Progress,
		LastSavedAt: w.LastSavedAt,
		SubmittedAt: w.SubmittedAt,
		ReviewedAt:  w.ReviewedAt,
		CreatedAt:   w.CreatedAt,
		UpdatedAt:   w.UpdatedAt,
	}
}

// IsEditable returns true if the attempt can still be edited
func (w *WorkSampleAttempt) IsEditable() bool {
	return w.Status == AttemptStatusDraft || w.Status == AttemptStatusInProgress
}

// IsSubmitted returns true if the attempt has been submitted
func (w *WorkSampleAttempt) IsSubmitted() bool {
	return w.Status == AttemptStatusSubmitted || w.Status == AttemptStatusReviewed
}
