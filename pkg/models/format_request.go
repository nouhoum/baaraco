package models

import (
	"time"

	"gorm.io/gorm"
)

// FormatRequestReason represents why a candidate wants an alternative format
type FormatRequestReason string

const (
	FormatReasonOral          FormatRequestReason = "oral"
	FormatReasonMoreTime      FormatRequestReason = "more_time"
	FormatReasonAccessibility FormatRequestReason = "accessibility"
	FormatReasonOther         FormatRequestReason = "other"
)

// FormatRequestPreference represents the preferred alternative format
type FormatRequestPreference string

const (
	FormatPreferenceVideoCall  FormatRequestPreference = "video_call"
	FormatPreferenceGoogleDocs FormatRequestPreference = "google_docs"
	FormatPreferenceMultiStep  FormatRequestPreference = "multi_step"
	FormatPreferenceOther      FormatRequestPreference = "other"
)

// FormatRequestStatus represents the status of a format request
type FormatRequestStatus string

const (
	FormatRequestStatusPending  FormatRequestStatus = "pending"
	FormatRequestStatusApproved FormatRequestStatus = "approved"
	FormatRequestStatusDenied   FormatRequestStatus = "denied"
)

// FormatRequest represents a candidate's request for an alternative format
type FormatRequest struct {
	ID              string                  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	AttemptID       string                  `gorm:"type:uuid;not null" json:"attempt_id"`
	Attempt         *WorkSampleAttempt      `gorm:"foreignKey:AttemptID" json:"attempt,omitempty"`
	CandidateID     *string                 `gorm:"type:uuid" json:"candidate_id,omitempty"`
	Candidate       *User                   `gorm:"foreignKey:CandidateID" json:"candidate,omitempty"`
	Reason          FormatRequestReason     `gorm:"type:varchar(30);not null" json:"reason"`
	PreferredFormat FormatRequestPreference `gorm:"type:varchar(30);not null" json:"preferred_format"`
	Comment         string                  `json:"comment,omitempty"`
	Status          FormatRequestStatus     `gorm:"type:varchar(20);not null;default:'pending'" json:"status"`
	ResponseMessage string                  `gorm:"column:response_message" json:"response_message,omitempty"`
	ReviewedBy      *string                 `gorm:"type:uuid" json:"reviewed_by,omitempty"`
	Reviewer        *User                   `gorm:"foreignKey:ReviewedBy" json:"reviewer,omitempty"`
	ReviewedAt      *time.Time              `json:"reviewed_at,omitempty"`
	ReviewNote      string                  `json:"review_note,omitempty"` // Kept for compatibility
	CreatedAt       time.Time               `json:"created_at"`
	UpdatedAt       time.Time               `json:"updated_at"`
	DeletedAt       gorm.DeletedAt          `gorm:"index" json:"-"`
}

func (FormatRequest) TableName() string {
	return "format_requests"
}

// FormatRequestResponse is the basic API response for a format request
type FormatRequestResponse struct {
	ID              string                  `json:"id"`
	AttemptID       string                  `json:"attempt_id"`
	CandidateID     *string                 `json:"candidate_id,omitempty"`
	Reason          FormatRequestReason     `json:"reason"`
	PreferredFormat FormatRequestPreference `json:"preferred_format"`
	Comment         string                  `json:"comment,omitempty"`
	Status          FormatRequestStatus     `json:"status"`
	ResponseMessage string                  `json:"response_message,omitempty"`
	ReviewedAt      *time.Time              `json:"reviewed_at,omitempty"`
	CreatedAt       time.Time               `json:"created_at"`
}

// ToResponse converts a FormatRequest to its basic API response
func (f *FormatRequest) ToResponse() *FormatRequestResponse {
	return &FormatRequestResponse{
		ID:              f.ID,
		AttemptID:       f.AttemptID,
		CandidateID:     f.CandidateID,
		Reason:          f.Reason,
		PreferredFormat: f.PreferredFormat,
		Comment:         f.Comment,
		Status:          f.Status,
		ResponseMessage: f.ResponseMessage,
		ReviewedAt:      f.ReviewedAt,
		CreatedAt:       f.CreatedAt,
	}
}

// FormatRequestDetailResponse is the detailed API response including candidate info
type FormatRequestDetailResponse struct {
	ID              string                  `json:"id"`
	AttemptID       string                  `json:"attempt_id"`
	Reason          FormatRequestReason     `json:"reason"`
	PreferredFormat FormatRequestPreference `json:"preferred_format"`
	Comment         string                  `json:"comment,omitempty"`
	Status          FormatRequestStatus     `json:"status"`
	ResponseMessage string                  `json:"response_message,omitempty"`
	ReviewedAt      *time.Time              `json:"reviewed_at,omitempty"`
	ReviewedBy      *UserResponse           `json:"reviewed_by,omitempty"`
	Candidate       *UserResponse           `json:"candidate,omitempty"`
	CreatedAt       time.Time               `json:"created_at"`
	UpdatedAt       time.Time               `json:"updated_at"`
}

// ToDetailResponse converts a FormatRequest to its detailed API response
func (f *FormatRequest) ToDetailResponse() *FormatRequestDetailResponse {
	resp := &FormatRequestDetailResponse{
		ID:              f.ID,
		AttemptID:       f.AttemptID,
		Reason:          f.Reason,
		PreferredFormat: f.PreferredFormat,
		Comment:         f.Comment,
		Status:          f.Status,
		ResponseMessage: f.ResponseMessage,
		ReviewedAt:      f.ReviewedAt,
		CreatedAt:       f.CreatedAt,
		UpdatedAt:       f.UpdatedAt,
	}

	if f.Candidate != nil {
		resp.Candidate = f.Candidate.ToResponse()
	}

	if f.Reviewer != nil {
		resp.ReviewedBy = f.Reviewer.ToResponse()
	}

	return resp
}

// GetReasonLabel returns a human-readable label for the reason
func (r FormatRequestReason) Label() string {
	switch r {
	case FormatReasonOral:
		return "Préfère l'oral"
	case FormatReasonMoreTime:
		return "Besoin de plus de temps"
	case FormatReasonAccessibility:
		return "Accessibilité"
	case FormatReasonOther:
		return "Autre"
	default:
		return string(r)
	}
}

// GetPreferredFormatLabel returns a human-readable label for the preferred format
func (p FormatRequestPreference) Label() string {
	switch p {
	case FormatPreferenceVideoCall:
		return "Appel vidéo"
	case FormatPreferenceGoogleDocs:
		return "Google Docs"
	case FormatPreferenceMultiStep:
		return "Questions multi-étapes"
	case FormatPreferenceOther:
		return "Autre"
	default:
		return string(p)
	}
}

// GetStatusLabel returns a human-readable label for the status
func (s FormatRequestStatus) Label() string {
	switch s {
	case FormatRequestStatusPending:
		return "En attente"
	case FormatRequestStatusApproved:
		return "Approuvé"
	case FormatRequestStatusDenied:
		return "Refusé"
	default:
		return string(s)
	}
}
