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
	"github.com/ugeebee/tip-root/backend/internal/discord"
	"github.com/ugeebee/tip-root/backend/internal/eventbus"
	"github.com/ugeebee/tip-root/backend/internal/logger"
	"github.com/ugeebee/tip-root/backend/internal/models"
)

func main() {
	logger.InitLogger()
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, relying on system environment variables")
	}
	nc, js := eventbus.Connect()
	defer nc.Close()

	_, err := js.Subscribe("tips.processed", func(m *nats.Msg) {
		defer m.Ack()
		var event models.TipEvent
		json.Unmarshal(m.Data, &event)
		if !event.IsNSFW {
			return
		}

		log.Printf("[MODERATION] Flagged tip routed to Discord: %s", event.ClientKey)

		warningMsg := fmt.Sprintf("**NSFW Tip Blocked!**\nUser: %s\nAmount: %.2f\nMessage: %s",
			event.Name, event.Amount, event.Message)

		discord.SendMessage(warningMsg)
	}, nats.Durable("moderation-service"), nats.ManualAck())

	if err != nil {
		log.Fatalf("NATS Subscription failed: %v", err)
	}

	log.Println("Moderation Service listening on NATS...")

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)
	<-sigChan
}
