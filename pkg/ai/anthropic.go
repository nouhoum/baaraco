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

// Ensure AnthropicProvider implements Provider and StreamingProvider interfaces
var _ Provider = (*AnthropicProvider)(nil)
var _ StreamingProvider = (*AnthropicProvider)(nil)

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
	contentBlocks := make([]anthropic.ContentBlockParamUnion, 0, len(req.Documents)+1)

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

// CompleteStream sends a conversation request and streams the response
func (p *AnthropicProvider) CompleteStream(ctx context.Context, req ConversationRequest) (<-chan StreamChunk, error) {
	if !p.IsConfigured() {
		return nil, fmt.Errorf("anthropic provider not configured: ANTHROPIC_API_KEY not set")
	}

	model := req.Model
	if model == "" {
		model = p.model
	}

	maxTokens := req.MaxTokens
	if maxTokens == 0 {
		maxTokens = 4096
	}

	// Build messages array from conversation
	var messages []anthropic.MessageParam
	for _, msg := range req.Messages {
		switch msg.Role {
		case "user":
			messages = append(messages, anthropic.NewUserMessage(anthropic.NewTextBlock(msg.Content)))
		case "assistant":
			messages = append(messages, anthropic.NewAssistantMessage(anthropic.NewTextBlock(msg.Content)))
		}
	}

	params := anthropic.MessageNewParams{
		Model:     anthropic.Model(model),
		MaxTokens: int64(maxTokens),
		Messages:  messages,
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

	// Start streaming
	stream := p.client.Messages.NewStreaming(ctx, params)

	ch := make(chan StreamChunk, 64)

	go func() {
		defer close(ch)

		for stream.Next() {
			event := stream.Current()
			switch variant := event.AsAny().(type) {
			case anthropic.ContentBlockDeltaEvent:
				if variant.Delta.Type == "text_delta" && variant.Delta.Text != "" {
					ch <- StreamChunk{Text: variant.Delta.Text}
				}
			}
		}

		if err := stream.Err(); err != nil {
			ch <- StreamChunk{Error: fmt.Errorf("anthropic stream error: %w", err)}
			return
		}

		ch <- StreamChunk{Done: true}
	}()

	return ch, nil
}
