package sse

import (
	"sync"
)

type Hub struct {
	// Map links a 32-digit server_key to a Go channel
	clients map[string]chan string
	mu      sync.RWMutex // Protects the map from concurrent reads/writes
}

// PaymentHub is our global switchboard.
var PaymentHub *Hub

// InitHub initializes the map. We will call this in main.go
func InitHub() {
	PaymentHub = &Hub{
		clients: make(map[string]chan string),
	}
}

// Register creates a new channel for a specific server_key when a viewer loads the QR page.
func (h *Hub) Register(serverKey string) chan string {
	h.mu.Lock()
	defer h.mu.Unlock()

	// If the user refreshed the page, close their old ghost connection first
	if oldChan, exists := h.clients[serverKey]; exists {
		close(oldChan)
	}

	// We use a buffered channel of size 1 so the sender doesn't get blocked
	newChan := make(chan string, 1)
	h.clients[serverKey] = newChan

	return newChan
}

// Unregister safely cleans up the channel when the viewer closes their browser tab.
func (h *Hub) Unregister(serverKey string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if ch, exists := h.clients[serverKey]; exists {
		close(ch)
		delete(h.clients, serverKey)
	}
}

// Publish is called by the Android webhook to broadcast the "PAID" status.
func (h *Hub) Publish(serverKey string, message string) bool {
	h.mu.RLock()
	ch, exists := h.clients[serverKey]
	h.mu.RUnlock()

	if !exists {
		return false // The viewer closed the tab before paying
	}

	// Non-blocking send. If the channel is full, we drop it rather than crashing.
	select {
	case ch <- message:
		return true
	default:
		return false
	}
}
