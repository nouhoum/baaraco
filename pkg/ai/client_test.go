package ai

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestNewClient(t *testing.T) {
	client := NewClient()
	assert.NotNil(t, client, "NewClient should return a non-nil client")
	assert.NotNil(t, client.provider, "Client should have a provider")
}

func TestNewClientWithProvider(t *testing.T) {
	mockProvider := &mockProvider{configured: true}
	client := NewClientWithProvider(mockProvider)

	assert.NotNil(t, client)
	assert.Equal(t, mockProvider, client.provider)
}

func TestIsConfigured(t *testing.T) {
	tests := []struct {
		name       string
		configured bool
		expected   bool
	}{
		{
			name:       "configured provider",
			configured: true,
			expected:   true,
		},
		{
			name:       "not configured provider",
			configured: false,
			expected:   false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			client := NewClientWithProvider(&mockProvider{configured: tt.configured})
			assert.Equal(t, tt.expected, client.IsConfigured())
		})
	}
}

func TestGenerate_Success(t *testing.T) {
	mockProv := &mockProvider{
		configured: true,
		response:   "Generated content",
	}
	client := NewClientWithProvider(mockProv)

	result, err := client.Generate("system prompt", "user prompt", 1000)

	assert.NoError(t, err)
	assert.Equal(t, "Generated content", result)
	assert.Equal(t, "system prompt", mockProv.lastRequest.SystemPrompt)
	assert.Equal(t, "user prompt", mockProv.lastRequest.UserPrompt)
	assert.Equal(t, 1000, mockProv.lastRequest.MaxTokens)
}

func TestGenerate_NotConfigured(t *testing.T) {
	mockProv := &mockProvider{
		configured: false,
		err:        ErrAPIError("provider not configured"),
	}
	client := NewClientWithProvider(mockProv)

	result, err := client.Generate("system", "user", 1000)

	assert.Error(t, err)
	assert.Empty(t, result)
}

func TestProviderName(t *testing.T) {
	mockProv := &mockProvider{name: "test-provider"}
	client := NewClientWithProvider(mockProv)

	assert.Equal(t, "test-provider", client.ProviderName())
}

func TestClientImplementsGeneratorInterface(t *testing.T) {
	// This test ensures the Client type implements the Generator interface
	var _ Generator = (*Client)(nil)
}

// mockProvider is a test implementation of the Provider interface
type mockProvider struct {
	name        string
	configured  bool
	response    string
	err         error
	lastRequest CompletionRequest
}

func (m *mockProvider) Name() string {
	if m.name == "" {
		return "mock"
	}
	return m.name
}

func (m *mockProvider) IsConfigured() bool {
	return m.configured
}

func (m *mockProvider) Complete(ctx context.Context, req CompletionRequest) (string, error) {
	m.lastRequest = req
	if m.err != nil {
		return "", m.err
	}
	return m.response, nil
}
