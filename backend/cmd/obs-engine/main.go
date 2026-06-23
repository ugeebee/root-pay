package main

import (
	"encoding/json"
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
	"github.com/nats-io/nats.go"
	"github.com/ugeebee/tip-root/backend/internal/database"
	"github.com/ugeebee/tip-root/backend/internal/eventbus"
	"github.com/ugeebee/tip-root/backend/internal/logger"
	"github.com/ugeebee/tip-root/backend/internal/models"
)

type OverlayHub struct {
	sync.RWMutex
	clients map[string]chan string
}

var Hub = &OverlayHub{
	clients: make(map[string]chan string),
}

func (h *OverlayHub) Register(streamerID string) chan string {
	h.Lock()
	defer h.Unlock()
	ch := make(chan string, 10)
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
	logger.InitLogger()
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
		AllowedOrigins: []string{"https://streamer.tip-root.in"},
		AllowedMethods: []string{"GET", "OPTIONS"},
		AllowedHeaders: []string{"Accept", "Content-Type"},
	}))

	r.Get("/api/overlay/stream", serveOverlaySSE)

	slog.Info("OBS Engine live", slog.String("port", "8083"))
	log.Fatal(http.ListenAndServe(":8083", r))
}

func serveOverlaySSE(w http.ResponseWriter, r *http.Request) {
	streamerID := r.URL.Query().Get("streamer_id")
	token := r.URL.Query().Get("token")

	if streamerID == "" || token == "" {
		http.Error(w, "Missing streamer_id or token parameter", http.StatusBadRequest)
		return
	}

	var dbStreamerID string
	err := database.DB.QueryRow(
		r.Context(),
		"SELECT id FROM streamers WHERE overlay_token = $1 AND id = $2",
		token,
		streamerID,
	).Scan(&dbStreamerID)

	if err != nil {
		log.Printf("Unauthorized access attempt for streamer %s", streamerID)
		http.Error(w, "Unauthorized: Invalid token for this streamer", http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	flusher.Flush()

	msgChan := Hub.Register(streamerID)
	defer Hub.Unregister(streamerID)

	ticker := time.NewTicker(15 * time.Second)
	defer ticker.Stop()

	fmt.Printf("🎥 OBS Connected securely for Streamer: %s\n", streamerID)

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
