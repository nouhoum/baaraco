package models

import (
	"time"

	"gorm.io/gorm"
)

// WorkSample represents a work sample uploaded by a candidate
type WorkSample struct {
	ID          string         `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID      string         `gorm:"type:uuid" json:"user_id,omitempty"`
	User        *User          `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Title       string         `gorm:"not null" json:"title"`
	Description string         `json:"description,omitempty"`
	URL         string         `json:"url,omitempty"`
	FileKey     string         `json:"file_key,omitempty"`
	FileType    string         `json:"file_type,omitempty"`
	FileSize    int64          `json:"file_size,omitempty"`
	Order       int            `gorm:"column:order;default:0" json:"order"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

func (WorkSample) TableName() string {
	return "work_samples"
}

// WorkSampleResponse is the API response for a work sample
type WorkSampleResponse struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description,omitempty"`
	URL         string `json:"url,omitempty"`
	FileType    string `json:"file_type,omitempty"`
	Order       int    `json:"order"`
}

// ToResponse converts a WorkSample to its API response
func (ws *WorkSample) ToResponse() *WorkSampleResponse {
	return &WorkSampleResponse{
		ID:          ws.ID,
		Title:       ws.Title,
		Description: ws.Description,
		URL:         ws.URL,
		FileType:    ws.FileType,
		Order:       ws.Order,
	}
}
