package ai

import (
	"context"
	"fmt"
	"os"

	"github.com/anthropics/anthropic-sdk-go"
	"github.com/anthropics/anthropic-sdk-go/option"
)

const (
	defaultAnthropicModel = "claude-sonnet-4-20250514"
)

// AnthropicProvider implements Provider using the official Anthropic SDK
type AnthropicProvider struct {
	client anthropic.Client
	model  string
	apiKey string
}

// Ensure AnthropicProvider implements Provider interface
var _ Provider = (*AnthropicProvider)(nil)

// NewAnthropicProvider creates a new Anthropic provider
func NewAnthropicProvider() *AnthropicProvider {
	apiKey := os.Getenv("ANTHROPIC_API_KEY")
	model := os.Getenv("ANTHROPIC_MODEL")
	if model == "" {
		model = defaultAnthropicModel
	}

	provider := &AnthropicProvider{
		model:  model,
		apiKey: apiKey,
	}

	if apiKey != "" {
		provider.client = anthropic.NewClient(
			option.WithAPIKey(apiKey),
		)
	}

	return provider
}

// NewAnthropicProviderWithConfig creates a provider with explicit configuration
func NewAnthropicProviderWithConfig(apiKey, model string) *AnthropicProvider {
	if model == "" {
		model = defaultAnthropicModel
	}

	provider := &AnthropicProvider{
		model:  model,
		apiKey: apiKey,
	}

	if apiKey != "" {
		provider.client = anthropic.NewClient(
			option.WithAPIKey(apiKey),
		)
	}

	return provider
}

// Name returns the provider name
func (p *AnthropicProvider) Name() string {
	return "anthropic"
}

// IsConfigured returns true if the API key is set
func (p *AnthropicProvider) IsConfigured() bool {
	return p.apiKey != ""
}

// Complete sends a completion request to Anthropic
func (p *AnthropicProvider) Complete(ctx context.Context, req CompletionRequest) (string, error) {
	if !p.IsConfigured() {
		return "", fmt.Errorf("anthropic provider not configured: ANTHROPIC_API_KEY not set")
	}

	model := req.Model
	if model == "" {
		model = p.model
	}

	maxTokens := req.MaxTokens
	if maxTokens == 0 {
		maxTokens = 4096
	}

	// Build user message content blocks
	var contentBlocks []anthropic.ContentBlockParamUnion

	// Add document blocks first (if any)
	for _, doc := range req.Documents {
		contentBlocks = append(contentBlocks, anthropic.NewDocumentBlock(anthropic.Base64PDFSourceParam{
			Data: doc.Data,
		}))
	}

	// Add the text prompt
	contentBlocks = append(contentBlocks, anthropic.NewTextBlock(req.UserPrompt))

	// Build the message params
	params := anthropic.MessageNewParams{
		Model:     anthropic.Model(model),
		MaxTokens: int64(maxTokens),
		Messages: []anthropic.MessageParam{
			anthropic.NewUserMessage(contentBlocks...),
		},
	}

	// Add system prompt if provided
	if req.SystemPrompt != "" {
		params.System = []anthropic.TextBlockParam{
			{
				Type: "text",
				Text: req.SystemPrompt,
			},
		}
	}

	// Make the API call
	message, err := p.client.Messages.New(ctx, params)
	if err != nil {
		return "", fmt.Errorf("anthropic API error: %w", err)
	}

	// Extract text from response
	var result string
	for _, block := range message.Content {
		if block.Type == "text" {
			result += block.Text
		}
	}

	if result == "" {
		return "", fmt.Errorf("empty response from Anthropic API")
	}

	return result, nil
}
