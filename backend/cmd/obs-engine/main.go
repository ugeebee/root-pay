package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
	"github.com/nats-io/nats.go"
	"github.com/ugeebee/root-pay/backend/internal/database"
	"github.com/ugeebee/root-pay/backend/internal/eventbus"
	"github.com/ugeebee/root-pay/backend/internal/models"
)

// overlayClient holds both the channel and a cancel func so we can
// cleanly evict a stale connection when a new one registers for the
// same streamerID.
type overlayClient struct {
	ch     chan string
	cancel context.CancelFunc
}

type OverlayHub struct {
	sync.Mutex
	clients map[string]*overlayClient
}

var Hub = &OverlayHub{
	clients: make(map[string]*overlayClient),
}

// Register creates a fresh client for streamerID.
// If one already exists (reconnect / duplicate tab), the old connection's
// context is cancelled and its channel is drained + closed before the new
// one takes its place — no goroutine leak, no orphaned channel.
func (h *OverlayHub) Register(streamerID string, cancel context.CancelFunc) chan string {
	h.Lock()
	defer h.Unlock()

	if old, ok := h.clients[streamerID]; ok {
		log.Printf("[OBS Hub] ⚠️  Evicting stale connection for Streamer %s", streamerID)
		old.cancel() // unblocks the old serveOverlaySSE goroutine via ctx.Done()
		// Drain and close the old channel so nothing blocks on it.
		close(old.ch)
		for range old.ch {
		}
	}

	ch := make(chan string, 10)
	h.clients[streamerID] = &overlayClient{ch: ch, cancel: cancel}
	return ch
}

// Unregister removes the client only if the stored cancel func matches
// the one passed in. This prevents a reconnecting client from unregistering
// the brand-new connection that just replaced it.
func (h *OverlayHub) Unregister(streamerID string, cancel context.CancelFunc) {
	h.Lock()
	defer h.Unlock()

	client, ok := h.clients[streamerID]
	if !ok {
		return
	}
	// Compare by pointer identity: same cancel → this is still the owner.
	// Different cancel means a newer connection already took over; leave it alone.
	if fmt.Sprintf("%p", client.cancel) != fmt.Sprintf("%p", cancel) {
		log.Printf("[OBS Hub] 🔁 Skipping unregister for Streamer %s (newer connection owns the slot)", streamerID)
		return
	}

	close(client.ch)
	delete(h.clients, streamerID)
}

// Publish sends payload to the active channel for streamerID (non-blocking).
// If the channel buffer is full the event is dropped with a warning rather
// than blocking the NATS callback.
func (h *OverlayHub) Publish(streamerID string, payload string) {
	h.Lock()
	defer h.Unlock()

	client, ok := h.clients[streamerID]
	if !ok {
		return
	}
	select {
	case client.ch <- payload:
	default:
		log.Printf("[OBS Hub] ⚠️  Channel full for Streamer %s, dropping event", streamerID)
	}
}

func main() {
	godotenv.Load(".env")
	godotenv.Load("backend/.env")

	database.InitDB()

	nc, js := eventbus.Connect()
	defer nc.Close()

	_, err := js.Subscribe("tips.processed", func(m *nats.Msg) {
		var event models.TipEvent
		json.Unmarshal(m.Data, &event)

		if event.IsNSFW {
			log.Printf("[OBS Engine] 🛡️ Blocked NSFW tip from screen: %s", event.ClientKey)
			m.Ack()
			return
		}

		payload, _ := json.Marshal(map[string]interface{}{
			"client_key": event.ClientKey,
			"name":       event.Name,
			"amount":     event.Amount,
			"message":    event.Message,
		})

		Hub.Publish(event.StreamerID, string(payload))
		log.Printf("[OBS Engine] 🟢 Pushed safe tip to overlay for Streamer %s", event.StreamerID)

		m.Ack()
	}, nats.Durable("OBS_ENGINE_WORKER"), nats.ManualAck())

	if err != nil {
		log.Fatalf("JetStream Subscription failed: %v", err)
	}

	_, err = js.Subscribe("tips.approved", func(m *nats.Msg) {
		var event models.TipEvent
		json.Unmarshal(m.Data, &event)

		payload, _ := json.Marshal(map[string]interface{}{
			"client_key": event.ClientKey,
			"name":       event.Name,
			"amount":     event.Amount,
			"message":    event.Message,
		})

		Hub.Publish(event.StreamerID, string(payload))
		log.Printf("[OBS Engine] ✅ Pushed APPROVED tip to overlay for Streamer %s", event.StreamerID)

		m.Ack()
	}, nats.Durable("OBS_ENGINE_APPROVED_WORKER"), nats.ManualAck())

	if err != nil {
		log.Fatalf("JetStream Subscription to tips.approved failed: %v", err)
	}

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{
			"http://localhost:3000",
			"https://adminroot.ugbhartariya.com",
			"https://tiproot.ugbhartariya.com", // overlay origin
			"null",                              // OBS browser source sends Origin: null
		},
		AllowedMethods: []string{"GET", "OPTIONS"},
		AllowedHeaders: []string{"Accept", "Authorization", "Content-Type"},
	}))

	r.Get("/api/overlay/stream", serveOverlaySSE)

	log.Println("🎬 OBS Engine listening for Browser Sources on :8083...")
	log.Fatal(http.ListenAndServe(":8083", r))
}

func serveOverlaySSE(w http.ResponseWriter, r *http.Request) {
	streamerID := r.URL.Query().Get("streamer_id")
	if streamerID == "" {
		http.Error(w, "Missing streamer_id parameter", http.StatusBadRequest)
		return
	}

	authHeader := r.Header.Get("Authorization")
	if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
		http.Error(w, "Missing or invalid Authorization header", http.StatusUnauthorized)
		return
	}
	token := strings.TrimPrefix(authHeader, "Bearer ")

	var dbStreamerID string
	err := database.DB.QueryRow(
		r.Context(),
		"SELECT id FROM streamers WHERE overlay_token = $1 AND id = $2",
		token,
		streamerID,
	).Scan(&dbStreamerID)

	if err != nil {
		http.Error(w, "Unauthorized: Invalid token for this streamer", http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	flusher.Flush()

	// Create a child context tied to this specific connection.
	// Hub.Register stores the cancel so it can evict this connection
	// if a newer one arrives for the same streamerID.
	connCtx, cancel := context.WithCancel(r.Context())
	defer cancel()

	msgChan := Hub.Register(streamerID, cancel)
	defer Hub.Unregister(streamerID, cancel)

	ticker := time.NewTicker(15 * time.Second)
	defer ticker.Stop()

	fmt.Printf("🎥 OBS Connected securely for Streamer: %s\n", streamerID)

	for {
		select {
		case msg, ok := <-msgChan:
			if !ok {
				// Channel was closed by Hub (evicted by a newer connection).
				fmt.Printf("🔌 OBS Evicted for Streamer: %s\n", streamerID)
				return
			}
			fmt.Fprintf(w, "data: %s\n\n", msg)
			flusher.Flush()
		case <-ticker.C:
			fmt.Fprintf(w, ": heartbeat\n\n")
			flusher.Flush()
		case <-connCtx.Done():
			fmt.Printf("🔌 OBS Disconnected for Streamer: %s\n", streamerID)
			return
		}
	}
}