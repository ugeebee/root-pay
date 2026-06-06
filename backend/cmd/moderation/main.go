package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/joho/godotenv"
	"github.com/nats-io/nats.go"
	"github.com/ugeebee/root-pay/backend/internal/discord"
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

		// IGNORE SAFE TIPS
		if !event.IsNSFW {
			return
		}

		log.Printf("[MODERATION] Flagged tip routed to Discord: %s", event.ClientKey)

		warningMsg := fmt.Sprintf("🚨 **NSFW Tip Blocked!**\nUser: %s\nAmount: %.2f\nMessage: %s",
			event.Name, event.Amount, event.Message)

		// Use the new package-level function
		discord.SendMessage(warningMsg)
	})

	if err != nil {
		log.Fatalf("NATS Subscription failed: %v", err)
	}

	log.Println("Moderation Service listening on NATS...")

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)
	<-sigChan
}
