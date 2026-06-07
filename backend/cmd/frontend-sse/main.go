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
	sse.InitHub()

	nc := eventbus.Connect()
	defer nc.Close()

	_, err := nc.Subscribe("tips.processed", func(m *nats.Msg) {
		var event models.TipEvent
		json.Unmarshal(m.Data, &event)

		log.Printf("[FRONTEND] Sending success animation for key: %s", event.ClientKey)

		payload := `{"status": "PAID"}`
		sse.PaymentHub.Publish(event.ClientKey, payload)
	})

	if err != nil {
		log.Fatalf("NATS Subscription failed: %v", err)
	}

	r := chi.NewRouter()
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{"http://localhost:3000", "https://xyz.com"},
	}))

	r.Get("/api/stream", handlers.SSEWait)

	log.Println("Frontend SSE Service listening for browser connections on :8082...")
	log.Fatal(http.ListenAndServe(":8082", r))
}
