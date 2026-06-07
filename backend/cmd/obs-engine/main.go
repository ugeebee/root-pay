package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
	"github.com/nats-io/nats.go"
	"github.com/ugeebee/root-pay/backend/internal/eventbus"
	"github.com/ugeebee/root-pay/backend/internal/models"
)

// OverlayHub manages active OBS browser sources
type OverlayHub struct {
	sync.RWMutex
	clients map[string]chan string // Key: streamer_id
}

var Hub = &OverlayHub{
	clients: make(map[string]chan string),
}

func (h *OverlayHub) Register(streamerID string) chan string {
	h.Lock()
	defer h.Unlock()
	ch := make(chan string, 10) // Buffer allows queueing
	h.clients[streamerID] = ch
	return ch
}

func (h *OverlayHub) Unregister(streamerID string) {
	h.Lock()
	defer h.Unlock()
	if ch, ok := h.clients[streamerID]; ok {
		close(ch)
		delete(h.clients, streamerID)
	}
}

func (h *OverlayHub) Publish(streamerID string, payload string) {
	h.RLock()
	defer h.RUnlock()
	if ch, ok := h.clients[streamerID]; ok {
		ch <- payload
	}
}

func main() {
	godotenv.Load(".env")
	godotenv.Load("backend/.env")

	nc, js := eventbus.Connect()
	defer nc.Close()

	// 1. Listen to NATS JetStream
	_, err := js.Subscribe("tips.processed", func(m *nats.Msg) {
		var event models.TipEvent
		json.Unmarshal(m.Data, &event)

		// THE SHIELD: Do not send to OBS if flagged!
		if event.IsNSFW {
			log.Printf("[OBS Engine] 🛡️ Blocked NSFW tip from screen: %s", event.ClientKey)
			m.Ack()
			return
		}

		// Push to the Streamer's OBS Hub
		payload, _ := json.Marshal(map[string]interface{}{
			"client_key": event.ClientKey,
			"name":       event.Name,
			"amount":     event.Amount,
			"message":    event.Message,
		})

		Hub.Publish(event.StreamerID, string(payload))
		log.Printf("[OBS Engine] 🟢 Pushed safe tip to overlay for Streamer %s", event.StreamerID)

		m.Ack() // Tell JetStream we successfully handled it
	}, nats.Durable("OBS_ENGINE_WORKER"), nats.ManualAck())

	if err != nil {
		log.Fatalf("JetStream Subscription failed: %v", err)
	}

	// 2. Start the HTTP Server for the Next.js Overlay
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{"http://localhost:3000", "https://xyz.com"},
		AllowedMethods: []string{"GET"},
	}))

	r.Get("/api/v1/overlay/stream", serveOverlaySSE)

	log.Println("🎬 OBS Engine listening for Browser Sources on :8083...")
	log.Fatal(http.ListenAndServe(":8083", r))
}

func serveOverlaySSE(w http.ResponseWriter, r *http.Request) {
	streamerID := r.URL.Query().Get("streamer_id")
	if streamerID == "" {
		http.Error(w, "Missing streamer_id", http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	flusher, ok := w.(http.Flusher)
	if !ok {
		return
	}

	w.WriteHeader(http.StatusOK)
	flusher.Flush()

	msgChan := Hub.Register(streamerID)
	defer Hub.Unregister(streamerID)

	// Keep alive ticker to prevent OBS from closing the connection
	ticker := time.NewTicker(15 * time.Second)
	defer ticker.Stop()

	fmt.Printf("🎥 OBS Connected for Streamer: %s\n", streamerID)

	for {
		select {
		case msg, ok := <-msgChan:
			if !ok {
				return
			}
			fmt.Fprintf(w, "data: %s\n\n", msg)
			flusher.Flush()
		case <-ticker.C:
			fmt.Fprintf(w, ": heartbeat\n\n")
			flusher.Flush()
		case <-r.Context().Done():
			fmt.Printf("🔌 OBS Disconnected for Streamer: %s\n", streamerID)
			return
		}
	}
}
