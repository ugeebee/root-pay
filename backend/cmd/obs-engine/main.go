package main

import (
	"encoding/json"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/joho/godotenv"
	"github.com/nats-io/nats.go"
	"github.com/ugeebee/root-pay/backend/internal/eventbus"
	"github.com/ugeebee/root-pay/backend/internal/models"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, relying on system environment variables")
	}
	nc := eventbus.Connect()
	defer nc.Close()

	_, err := nc.Subscribe("tips.processed", func(m *nats.Msg) {
		var event models.TipEvent
		json.Unmarshal(m.Data, &event)
		if event.IsNSFW {
			log.Printf("[OBS] Dropped flagged payload for %s", event.ClientKey)
			return
		}
		log.Printf("[OBS] Rendering safe tip: %s tipped %.2f", event.Name, event.Amount)
	})

	if err != nil {
		log.Fatalf("NATS Subscription failed: %v", err)
	}

	log.Println("OBS Engine listening on NATS...")

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)
	<-sigChan
}
