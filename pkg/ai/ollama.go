package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

const (
	defaultOllamaURL   = "http://localhost:11434"
	defaultOllamaModel = "llama3.2" // Good balance of speed and quality
)

// OllamaProvider implements Provider using a local Ollama instance
type OllamaProvider struct {
	baseURL    string
	model      string
	httpClient *http.Client
}

// Ensure OllamaProvider implements Provider interface
var _ Provider = (*OllamaProvider)(nil)

// NewOllamaProvider creates a new Ollama provider
func NewOllamaProvider() *OllamaProvider {
	baseURL := os.Getenv("OLLAMA_URL")
	if baseURL == "" {
		baseURL = defaultOllamaURL
	}

	model := os.Getenv("OLLAMA_MODEL")
	if model == "" {
		model = defaultOllamaModel
	}

	return &OllamaProvider{
		baseURL: baseURL,
		model:   model,
		httpClient: &http.Client{
			Timeout: 120 * time.Second, // Longer timeout for local models
		},
	}
}

// NewOllamaProviderWithConfig creates a provider with explicit configuration
func NewOllamaProviderWithConfig(baseURL, model string) *OllamaProvider {
	if baseURL == "" {
		baseURL = defaultOllamaURL
	}
	if model == "" {
		model = defaultOllamaModel
	}

	return &OllamaProvider{
		baseURL: baseURL,
		model:   model,
		httpClient: &http.Client{
			Timeout: 120 * time.Second,
		},
	}
}

// Name returns the provider name
func (p *OllamaProvider) Name() string {
	return "ollama"
}

// IsConfigured checks if Ollama is running by pinging the server
func (p *OllamaProvider) IsConfigured() bool {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, "GET", p.baseURL+"/api/tags", nil)
	if err != nil {
		return false
	}

	resp, err := p.httpClient.Do(req)
	if err != nil {
		return false
	}
	defer resp.Body.Close()

	return resp.StatusCode == http.StatusOK
}

// ollamaRequest represents the Ollama API request format
type ollamaRequest struct {
	Model    string          `json:"model"`
	Messages []ollamaMessage `json:"messages"`
	Stream   bool            `json:"stream"`
	Options  ollamaOptions   `json:"options,omitempty"`
}

type ollamaMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type ollamaOptions struct {
	NumPredict int `json:"num_predict,omitempty"`
}

// ollamaResponse represents the Ollama API response format
type ollamaResponse struct {
	Model     string        `json:"model"`
	CreatedAt string        `json:"created_at"`
	Message   ollamaMessage `json:"message"`
	Done      bool          `json:"done"`
}

// Complete sends a completion request to Ollama
func (p *OllamaProvider) Complete(ctx context.Context, req CompletionRequest) (string, error) {
	model := req.Model
	if model == "" {
		model = p.model
	}

	// Build messages array
	messages := []ollamaMessage{}

	// Add system prompt if provided
	if req.SystemPrompt != "" {
		messages = append(messages, ollamaMessage{
			Role:    "system",
			Content: req.SystemPrompt,
		})
	}

	// Add user message
	messages = append(messages, ollamaMessage{
		Role:    "user",
		Content: req.UserPrompt,
	})

	ollamaReq := ollamaRequest{
		Model:    model,
		Messages: messages,
		Stream:   false,
	}

	if req.MaxTokens > 0 {
		ollamaReq.Options = ollamaOptions{
			NumPredict: req.MaxTokens,
		}
	}

	body, err := json.Marshal(ollamaReq)
	if err != nil {
		return "", fmt.Errorf("failed to marshal Ollama request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", p.baseURL+"/api/chat", bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("failed to create Ollama request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := p.httpClient.Do(httpReq)
	if err != nil {
		return "", fmt.Errorf("ollama request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read Ollama response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("ollama api error (%d): %s", resp.StatusCode, string(respBody))
	}

	var ollamaResp ollamaResponse
	if err := json.Unmarshal(respBody, &ollamaResp); err != nil {
		return "", fmt.Errorf("failed to unmarshal Ollama response: %w", err)
	}

	if ollamaResp.Message.Content == "" {
		return "", fmt.Errorf("empty response from Ollama")
	}

	return ollamaResp.Message.Content, nil
}
