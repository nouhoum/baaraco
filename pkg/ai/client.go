package ai

import (
	"context"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/baaraco/baara/pkg/models"
)

//go:generate mockgen -destination=mocks/mock_generator.go -package=mocks github.com/baaraco/baara/pkg/ai Generator

// Generator interface for AI content generation - used for mocking in tests
type Generator interface {
	IsConfigured() bool
	Generate(systemPrompt, userPrompt string, maxTokens int) (string, error)
	GenerateScorecard(input ScorecardInput) ([]models.ScorecardCriterion, error)
	GenerateWorkSample(input WorkSampleInput) (*models.JobWorkSampleResponse, error)
	GenerateEvaluation(input EvaluationInput) (*EvaluationOutput, error)
	GenerateInterviewKit(input InterviewKitInput) (*InterviewKitOutput, error)
	ParseResume(pdfBase64 string) (*ResumeParseOutput, error)
	StreamConversation(ctx context.Context, systemPrompt string, messages []ConversationMessage, maxTokens int) (<-chan StreamChunk, error)
}

// Client is the AI client for generating content
// It wraps a Provider and implements the Generator interface
type Client struct {
	provider Provider
	timeout  time.Duration
}

// Ensure Client implements Generator interface
var _ Generator = (*Client)(nil)

// ErrAPIError creates an API error
func ErrAPIError(msg string) error {
	return &APIError{Message: msg}
}

// APIError represents an error from the AI API
type APIError struct {
	Message string
}

func (e *APIError) Error() string {
	return e.Message
}

// NewClient creates a new AI client with automatic provider selection
// Provider is selected based on AI_PROVIDER env var:
// - "ollama" : Use local Ollama (for development)
// - "anthropic" (default): Use Anthropic Claude API
func NewClient() *Client {
	provider := selectProvider()
	return &Client{
		provider: provider,
		timeout:  60 * time.Second,
	}
}

// NewClientWithProvider creates a client with a specific provider
func NewClientWithProvider(provider Provider) *Client {
	return &Client{
		provider: provider,
		timeout:  60 * time.Second,
	}
}

// selectProvider chooses the appropriate provider based on configuration
func selectProvider() Provider {
	providerType := strings.ToLower(os.Getenv("AI_PROVIDER"))

	switch ProviderType(providerType) {
	case ProviderOllama:
		return NewOllamaProvider()
	case ProviderAnthropic:
		return NewAnthropicProvider()
	default:
		// Default to Anthropic if AI_PROVIDER is not set
		// But try Ollama first if ANTHROPIC_API_KEY is not set (dev mode)
		if os.Getenv("ANTHROPIC_API_KEY") == "" {
			ollama := NewOllamaProvider()
			if ollama.IsConfigured() {
				return ollama
			}
		}
		return NewAnthropicProvider()
	}
}

// ProviderName returns the name of the underlying provider
func (c *Client) ProviderName() string {
	return c.provider.Name()
}

// IsConfigured returns true if the provider is properly configured
func (c *Client) IsConfigured() bool {
	return c.provider.IsConfigured()
}

// Generate sends a prompt to the AI and returns the response
func (c *Client) Generate(systemPrompt, userPrompt string, maxTokens int) (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), c.timeout)
	defer cancel()

	return c.provider.Complete(ctx, CompletionRequest{
		SystemPrompt: systemPrompt,
		UserPrompt:   userPrompt,
		MaxTokens:    maxTokens,
	})
}

// StreamConversation streams a multi-turn conversation response.
// If the provider supports streaming, it returns chunks in real time.
// Otherwise, it falls back to a single non-streaming call.
func (c *Client) StreamConversation(ctx context.Context, systemPrompt string, messages []ConversationMessage, maxTokens int) (<-chan StreamChunk, error) {
	if !c.IsConfigured() {
		return nil, fmt.Errorf("AI client is not configured")
	}

	req := ConversationRequest{
		SystemPrompt: systemPrompt,
		Messages:     messages,
		MaxTokens:    maxTokens,
	}

	// Use streaming if the provider supports it
	if sp, ok := c.provider.(StreamingProvider); ok {
		return sp.CompleteStream(ctx, req)
	}

	// Fallback: non-streaming provider — build a single user prompt from messages
	ch := make(chan StreamChunk, 1)
	go func() {
		defer close(ch)

		// Use the last user message as the prompt
		var userPrompt string
		for _, msg := range messages {
			if msg.Role == "user" {
				userPrompt = msg.Content
			}
		}

		result, err := c.provider.Complete(ctx, CompletionRequest{
			SystemPrompt: systemPrompt,
			UserPrompt:   userPrompt,
			MaxTokens:    maxTokens,
		})
		if err != nil {
			ch <- StreamChunk{Error: err}
			return
		}

		ch <- StreamChunk{Text: result}
		ch <- StreamChunk{Done: true}
	}()

	return ch, nil
}
