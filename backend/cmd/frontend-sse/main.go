package main

import (
	"encoding/json"
	"log"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
	"github.com/nats-io/nats.go"
	"github.com/ugeebee/tip-root/backend/internal/eventbus"
	"github.com/ugeebee/tip-root/backend/internal/handlers"
	"github.com/ugeebee/tip-root/backend/internal/logger"
	"github.com/ugeebee/tip-root/backend/internal/models"
	"github.com/ugeebee/tip-root/backend/internal/sse"
)

func main() {
	logger.InitLogger()
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, relying on system environment variables")
	}
	sse.InitHub()

	nc, js := eventbus.Connect()
	defer nc.Close()

	_, err := js.Subscribe("tips.processed", func(m *nats.Msg) {
		defer m.Ack()
		var event models.TipEvent
		json.Unmarshal(m.Data, &event)

		log.Printf("[FRONTEND] Sending success animation for key: %s", event.ClientKey)

		payload := `{"status": "PAID"}`
		sse.PaymentHub.Publish(event.ClientKey, payload)
	}, nats.Durable("frontend-sse-service"), nats.ManualAck())

	if err != nil {
		log.Fatalf("NATS Subscription failed: %v", err)
	}

	r := chi.NewRouter()
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{"https://tip-root.in"},
	}))

	r.Get("/api/stream", handlers.SSEWait)

	slog.Info("Frontend SSE Service live", slog.String("port", "8082"))
	log.Fatal(http.ListenAndServe(":8082", r))
}
