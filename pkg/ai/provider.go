package ai

import "context"

// Provider is the interface for LLM providers (Anthropic, Ollama, etc.)
type Provider interface {
	// Name returns the provider name for logging/debugging
	Name() string

	// IsConfigured returns true if the provider is properly configured
	IsConfigured() bool

	// Complete sends a completion request and returns the response text
	Complete(ctx context.Context, req CompletionRequest) (string, error)
}

// StreamingProvider extends Provider with streaming conversation support
type StreamingProvider interface {
	Provider

	// CompleteStream sends a conversation request and streams the response
	CompleteStream(ctx context.Context, req ConversationRequest) (<-chan StreamChunk, error)
}

// DocumentAttachment represents a document to include in the request
type DocumentAttachment struct {
	Data      string // base64-encoded content
	MediaType string // e.g. "application/pdf"
}

// CompletionRequest represents a generic completion request
type CompletionRequest struct {
	Model        string
	SystemPrompt string
	UserPrompt   string
	MaxTokens    int
	Documents    []DocumentAttachment // optional document attachments (e.g. PDFs)
}

// ConversationMessage represents a message in a multi-turn conversation
type ConversationMessage struct {
	Role    string // "user", "assistant", "system"
	Content string
}

// ConversationRequest represents a multi-turn conversation request with streaming
type ConversationRequest struct {
	Model        string
	SystemPrompt string
	Messages     []ConversationMessage
	MaxTokens    int
}

// StreamChunk represents a single chunk of streamed output
type StreamChunk struct {
	Text  string
	Done  bool
	Error error
}

// ProviderType represents the type of AI provider
type ProviderType string

const (
	ProviderAnthropic ProviderType = "anthropic"
	ProviderOllama    ProviderType = "ollama"
)
