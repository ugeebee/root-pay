package main

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/joho/godotenv"
	"github.com/ugeebee/root-pay/backend/internal/database"
	"github.com/ugeebee/root-pay/backend/internal/eventbus"
	"github.com/ugeebee/root-pay/backend/internal/models"

	goaway "github.com/TwiN/go-away"
	"github.com/nats-io/nats.go"
)

type IngestionServer struct {
	nc *nats.Conn
}

type IncomingProxyPayload struct {
	ClientKey string `json:"client_key"`
}

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, relying on system environment variables")
	}
	database.InitDB() // Initialize DB connection

	server := &IngestionServer{
		nc: eventbus.Connect(),
	}
	defer server.nc.Close()

	http.HandleFunc("/api/v1/webhooks/upi", server.handleProxyWebhook)
	log.Println("Ingestion Service listening on :8081...")
	log.Fatal(http.ListenAndServe(":8081", nil))
}

func (s *IngestionServer) handleProxyWebhook(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req IncomingProxyPayload
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid payload", http.StatusBadRequest)
		return
	}

	// 1. Fetch & Mark Paid (Atomic update)
	tipRecord, err := database.ProcessWebhookTip(req.ClientKey)
	if err != nil {
		log.Printf("Tip not found or already processed: %s", req.ClientKey)
		w.WriteHeader(http.StatusOK) // Return 200 so the webhook proxy stops retrying
		return
	}

	// 2. Profanity Check
	isNSFW := goaway.IsProfane(tipRecord.Name) || goaway.IsProfane(tipRecord.Message)

	// 3. Update Database State
	_ = database.UpdateNSFWFlag(req.ClientKey, isNSFW)

	// 4. Construct Event
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

	// 5. Broadcast
	if err := s.nc.Publish("tips.processed", eventData); err != nil {
		log.Printf("Failed to publish to NATS: %v", err)
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"processed and published"}`))
}
