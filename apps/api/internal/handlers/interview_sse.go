package handlers

import "sync"

// SessionHub manages in-memory channels for signaling between
// the SendMessage endpoint and the SSE Stream handler.
// When a candidate sends a message, the hub signals the corresponding
// SSE stream goroutine to process the AI response.
type SessionHub struct {
	mu       sync.RWMutex
	channels map[string]chan struct{} // attemptID -> signal channel
}

var globalSessionHub = &SessionHub{
	channels: make(map[string]chan struct{}),
}

// GetSessionHub returns the global session hub singleton
func GetSessionHub() *SessionHub {
	return globalSessionHub
}

// Subscribe creates or returns the signal channel for an attempt
func (h *SessionHub) Subscribe(attemptID string) chan struct{} {
	h.mu.Lock()
	defer h.mu.Unlock()

	if ch, ok := h.channels[attemptID]; ok {
		return ch
	}

	ch := make(chan struct{}, 1)
	h.channels[attemptID] = ch
	return ch
}

// Signal notifies the SSE stream that a new message is ready
func (h *SessionHub) Signal(attemptID string) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	if ch, ok := h.channels[attemptID]; ok {
		// Non-blocking send — if the channel already has a signal, skip
		select {
		case ch <- struct{}{}:
		default:
		}
	}
}

// Unsubscribe removes the channel for an attempt
func (h *SessionHub) Unsubscribe(attemptID string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if ch, ok := h.channels[attemptID]; ok {
		close(ch)
		delete(h.channels, attemptID)
	}
}
