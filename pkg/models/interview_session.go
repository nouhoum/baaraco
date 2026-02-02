package models

import (
	"encoding/json"
	"time"
)

// InterviewSessionStatus represents the status of an interview session
type InterviewSessionStatus string

const (
	SessionNotStarted InterviewSessionStatus = "not_started"
	SessionInProgress InterviewSessionStatus = "in_progress"
	SessionCompleted  InterviewSessionStatus = "completed"
	SessionTimedOut   InterviewSessionStatus = "timed_out"
	SessionAbandoned  InterviewSessionStatus = "abandoned"
)

// InterviewMessage represents a single message in the conversation
type InterviewMessage struct {
	Role       string    `json:"role"` // "assistant" or "user"
	Content    string    `json:"content"`
	Timestamp  time.Time `json:"timestamp"`
	TopicIndex int       `json:"topic_index"`
}

// TimingEntry tracks response timing for anti-cheating analysis
type TimingEntry struct {
	MessageIndex   int   `json:"message_index"`
	ResponseTimeMs int64 `json:"response_time_ms"`
	MessageLength  int   `json:"message_length"`
}

// InterviewSession represents a conversational AI interview session
type InterviewSession struct {
	ID                 string                 `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	AttemptID          string                 `gorm:"type:uuid;not null;uniqueIndex" json:"attempt_id"`
	Attempt            *WorkSampleAttempt     `gorm:"foreignKey:AttemptID" json:"attempt,omitempty"`
	Messages           json.RawMessage        `gorm:"type:jsonb;default:'[]'" json:"messages"`
	CurrentTopicIndex  int                    `gorm:"default:0" json:"current_topic_index"`
	TopicsCompleted    json.RawMessage        `gorm:"type:jsonb;default:'[]'" json:"topics_completed"`
	Status             InterviewSessionStatus `gorm:"type:varchar(20);not null;default:'not_started'" json:"status"`
	StartedAt          *time.Time             `json:"started_at,omitempty"`
	EndedAt            *time.Time             `json:"ended_at,omitempty"`
	MaxDurationMinutes int                    `gorm:"default:45" json:"max_duration_minutes"`
	TimingMetadata     json.RawMessage        `gorm:"type:jsonb;default:'[]'" json:"timing_metadata"`
	CreatedAt          time.Time              `json:"created_at"`
	UpdatedAt          time.Time              `json:"updated_at"`
}

func (InterviewSession) TableName() string {
	return "interview_sessions"
}

// GetMessages returns the messages as a typed slice
func (s *InterviewSession) GetMessages() ([]InterviewMessage, error) {
	var messages []InterviewMessage
	if len(s.Messages) == 0 {
		return []InterviewMessage{}, nil
	}
	if err := json.Unmarshal(s.Messages, &messages); err != nil {
		return nil, err
	}
	return messages, nil
}

// AppendMessage adds a message to the session and returns the updated messages
func (s *InterviewSession) AppendMessage(msg InterviewMessage) error {
	messages, err := s.GetMessages()
	if err != nil {
		return err
	}
	messages = append(messages, msg)
	data, err := json.Marshal(messages)
	if err != nil {
		return err
	}
	s.Messages = data
	return nil
}

// GetTopicsCompleted returns the completed topic indices
func (s *InterviewSession) GetTopicsCompleted() ([]int, error) {
	var topics []int
	if len(s.TopicsCompleted) == 0 {
		return []int{}, nil
	}
	if err := json.Unmarshal(s.TopicsCompleted, &topics); err != nil {
		return nil, err
	}
	return topics, nil
}

// AddTopicCompleted marks a topic as completed
func (s *InterviewSession) AddTopicCompleted(topicIndex int) error {
	topics, err := s.GetTopicsCompleted()
	if err != nil {
		return err
	}
	// Avoid duplicates
	for _, t := range topics {
		if t == topicIndex {
			return nil
		}
	}
	topics = append(topics, topicIndex)
	data, err := json.Marshal(topics)
	if err != nil {
		return err
	}
	s.TopicsCompleted = data
	return nil
}

// GetTimingEntries returns the timing metadata
func (s *InterviewSession) GetTimingEntries() ([]TimingEntry, error) {
	var entries []TimingEntry
	if len(s.TimingMetadata) == 0 {
		return []TimingEntry{}, nil
	}
	if err := json.Unmarshal(s.TimingMetadata, &entries); err != nil {
		return nil, err
	}
	return entries, nil
}

// AddTimingEntry adds a timing entry
func (s *InterviewSession) AddTimingEntry(entry TimingEntry) error {
	entries, err := s.GetTimingEntries()
	if err != nil {
		return err
	}
	entries = append(entries, entry)
	data, err := json.Marshal(entries)
	if err != nil {
		return err
	}
	s.TimingMetadata = data
	return nil
}

// IsTimedOut checks if the session has exceeded its time limit
func (s *InterviewSession) IsTimedOut() bool {
	if s.StartedAt == nil {
		return false
	}
	deadline := s.StartedAt.Add(time.Duration(s.MaxDurationMinutes) * time.Minute)
	return time.Now().After(deadline)
}

// TimeRemainingSeconds returns the number of seconds remaining, or 0 if timed out
func (s *InterviewSession) TimeRemainingSeconds() int {
	if s.StartedAt == nil {
		return s.MaxDurationMinutes * 60
	}
	deadline := s.StartedAt.Add(time.Duration(s.MaxDurationMinutes) * time.Minute)
	remaining := time.Until(deadline)
	if remaining < 0 {
		return 0
	}
	return int(remaining.Seconds())
}

// InterviewSessionResponse is the API response for an interview session
type InterviewSessionResponse struct {
	ID                   string                 `json:"id"`
	AttemptID            string                 `json:"attempt_id"`
	Messages             []InterviewMessage     `json:"messages"`
	CurrentTopicIndex    int                    `json:"current_topic_index"`
	TopicsCompleted      []int                  `json:"topics_completed"`
	Status               InterviewSessionStatus `json:"status"`
	StartedAt            *time.Time             `json:"started_at,omitempty"`
	EndedAt              *time.Time             `json:"ended_at,omitempty"`
	MaxDurationMinutes   int                    `json:"max_duration_minutes"`
	TimeRemainingSeconds int                    `json:"time_remaining_seconds"`
	CreatedAt            time.Time              `json:"created_at"`
	UpdatedAt            time.Time              `json:"updated_at"`
}

// ToResponse converts an InterviewSession to its API response
func (s *InterviewSession) ToResponse() *InterviewSessionResponse {
	messages, err := s.GetMessages()
	if err != nil {
		messages = []InterviewMessage{}
	}

	topics, err := s.GetTopicsCompleted()
	if err != nil {
		topics = []int{}
	}

	return &InterviewSessionResponse{
		ID:                   s.ID,
		AttemptID:            s.AttemptID,
		Messages:             messages,
		CurrentTopicIndex:    s.CurrentTopicIndex,
		TopicsCompleted:      topics,
		Status:               s.Status,
		StartedAt:            s.StartedAt,
		EndedAt:              s.EndedAt,
		MaxDurationMinutes:   s.MaxDurationMinutes,
		TimeRemainingSeconds: s.TimeRemainingSeconds(),
		CreatedAt:            s.CreatedAt,
		UpdatedAt:            s.UpdatedAt,
	}
}
