package sse

import (
	"sync"
	"time"
)

type Hub struct {
	// Map links a 32-digit server_key to a Go channel
	clients map[string]chan string
	mu      sync.RWMutex // Protects the map from concurrent reads/writes
}

// PaymentHub is our global switchboard.
var PaymentHub *Hub

// InitHub initializes the map and kicks off the global heartbeat worker.
func InitHub() {
	PaymentHub = &Hub{
		clients: make(map[string]chan string),
	}

	// Spin up the single global heartbeat worker loop in the background
	go PaymentHub.startHeartbeatWorker()
}

// startHeartbeatWorker keeps all active Cloudflare/AWS connections alive.
func (h *Hub) startHeartbeatWorker() {
	ticker := time.NewTicker(15 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		h.mu.RLock()
		// Broadcast the invisible SSE comment to every open connection at once
		for _, ch := range h.clients {
			select {
			case ch <- ": keepalive\n\n":
			default:
				// If a browser tab is lagging or dead and its channel is full,
				// we skip it so one slow user doesn't stall the entire server.
			}
		}
		h.mu.RUnlock()
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

	// Increased buffer size to 5 to safely hold heartbeats and payment events simultaneously
	newChan := make(chan string, 5)
	h.clients[serverKey] = newChan

	return newChan
}

// Unregister safely cleans up the channel when the viewer closes their browser tab.
func (h *Hub) Unregister(serverKey string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if ch, exists := h.clients[serverKey]; exists {
		// Note: Depending on your architecture, ensure you don't panic on double closing.
		// Checking existence prevents major issues.
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
