package main

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
	"github.com/nats-io/nats.go"
	"github.com/ugeebee/root-pay/backend/internal/eventbus"
	"github.com/ugeebee/root-pay/backend/internal/handlers"
	"github.com/ugeebee/root-pay/backend/internal/models"
	"github.com/ugeebee/root-pay/backend/internal/sse"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, relying on system environment variables")
	}
	// 1. Initialize global SSE Hub
	sse.InitHub()

	// 2. Connect to NATS
	nc := eventbus.Connect()
	defer nc.Close()

	// 3. NATS Listener: When a payment succeeds, push to the specific viewer's SSE channel
	_, err := nc.Subscribe("tips.processed", func(m *nats.Msg) {
		var event models.TipEvent
		json.Unmarshal(m.Data, &event)

		log.Printf("[FRONTEND] Sending success animation for key: %s", event.ClientKey)

		// Send a JSON string payload through the SSE Hub targeting the specific server_key
		payload := `{"status": "PAID"}`
		sse.PaymentHub.Publish(event.ClientKey, payload)
	})

	if err != nil {
		log.Fatalf("NATS Subscription failed: %v", err)
	}

	// 4. Start HTTP Server to accept viewer connections
	r := chi.NewRouter()
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{"http://localhost:3000", "https://xyz.com"},
	}))

	// Reusing your existing handler logic!
	r.Get("/api/v1/tips/stream", handlers.SSEWait)

	log.Println("Frontend SSE Service listening for browser connections on :8082...")
	log.Fatal(http.ListenAndServe(":8082", r))
}
