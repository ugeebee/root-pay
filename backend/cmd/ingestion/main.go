package main

import (
	"encoding/json"
	"log"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
	"github.com/ugeebee/tip-root/backend/internal/database"
	"github.com/ugeebee/tip-root/backend/internal/eventbus"
	"github.com/ugeebee/tip-root/backend/internal/handlers"
	"github.com/ugeebee/tip-root/backend/internal/logger"
	"github.com/ugeebee/tip-root/backend/internal/models"

	goaway "github.com/TwiN/go-away"
	"github.com/nats-io/nats.go"
)

type IngestionServer struct {
	nc *nats.Conn
	js nats.JetStreamContext
}

type IncomingPayload struct {
	ClientKey string `json:"client_key"`
}

func main() {
	logger.InitLogger()
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, relying on system environment variables")
	}
	database.InitDB()
	nc, js := eventbus.Connect()
	server := &IngestionServer{
		nc: nc,
		js: js,
	}
	defer server.nc.Close()

	r := chi.NewRouter()
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			slog.Info("API Request",
				slog.String("method", r.Method),
				slog.String("path", r.URL.Path),
				slog.String("ip", r.RemoteAddr),
			)
			next.ServeHTTP(w, r)
		})
	})
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"https://tip-root.in", "https://streamer.tip-root.in"},
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	r.Route("/api", func(r chi.Router) {
		r.Get("/streamer", handlers.GetStreamer)
		r.Post("/tips", handlers.CreateTip)
		r.Post("/webhooks/upi", server.handleWebhook)
		r.Post("/support", handlers.SubmitSupportTicket)
	})

	slog.Info("Ingestion API live", slog.String("port", "8081"))
	log.Fatal(http.ListenAndServe(":8081", r))
}

func (s *IngestionServer) handleWebhook(w http.ResponseWriter, r *http.Request) {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		http.Error(w, "Unauthorized: Missing Authorization header", http.StatusUnauthorized)
		return
	}

	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		http.Error(w, "Unauthorized: Invalid Authorization format", http.StatusUnauthorized)
		return
	}
	providedToken := parts[1]

	var requestingStreamerID string
	err := database.DB.QueryRow(
		r.Context(),
		"SELECT id FROM streamers WHERE overlay_token = $1",
		providedToken,
	).Scan(&requestingStreamerID)

	if err != nil {
		log.Printf("[Ingestion] ⚠️ Unauthorized webhook attempt. Invalid App Token: %s", providedToken)
		http.Error(w, "Unauthorized: Invalid App Token", http.StatusUnauthorized)
		return
	}

	var req IncomingPayload
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid payload", http.StatusBadRequest)
		return
	}

	tipRecord, err := database.ProcessWebhookTip(req.ClientKey)
	if err != nil {
		log.Printf("Tip not found or already processed: %s", req.ClientKey)
		w.WriteHeader(http.StatusOK)
		return
	}

	if tipRecord.StreamerID != requestingStreamerID {
		log.Printf("⚠️ Security Alert: Streamer %s attempted to ack tip %s belonging to %s", requestingStreamerID, req.ClientKey, tipRecord.StreamerID)
		http.Error(w, "Unauthorized: Tip does not belong to your account", http.StatusForbidden)
		return
	}

	isNSFW := goaway.IsProfane(tipRecord.Name) || goaway.IsProfane(tipRecord.Message)
	_ = database.UpdateNSFWFlag(req.ClientKey, isNSFW)

	event := models.TipEvent{
		ClientKey:  req.ClientKey,
		StreamerID: tipRecord.StreamerID,
		Name:       tipRecord.Name,
		Amount:     tipRecord.Amount,
		Message:    tipRecord.Message,
		IsNSFW:     isNSFW,
		Timestamp:  time.Now(),
	}

	eventData, _ := json.Marshal(event)

	if _, err := s.js.Publish("tips.processed", eventData); err != nil {
		log.Printf("Failed to publish to JetStream: %v", err)
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"processed and published"}`))
}
