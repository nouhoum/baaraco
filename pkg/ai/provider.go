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

// CompletionRequest represents a generic completion request
type CompletionRequest struct {
	Model       string
	SystemPrompt string
	UserPrompt  string
	MaxTokens   int
}

// ProviderType represents the type of AI provider
type ProviderType string

const (
	ProviderAnthropic ProviderType = "anthropic"
	ProviderOllama    ProviderType = "ollama"
)
