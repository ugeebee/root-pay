package main

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"github.com/nats-io/nats.go"
	"github.com/ugeebee/tip-root/backend/internal/eventbus"
	"github.com/ugeebee/tip-root/backend/internal/logger"
	"github.com/ugeebee/tip-root/backend/internal/models"
)

func main() {
	logger.InitLogger()
	godotenv.Load()
	godotenv.Load("../.env")

	dbPool, err := pgxpool.New(context.Background(), os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer dbPool.Close()

	natsConn, jetStream := eventbus.Connect()
	defer natsConn.Close()

	sub, err := jetStream.QueueSubscribe("tips.processed", "stats-workers", func(msg *nats.Msg) {
		var event models.TipEvent
		if err := json.Unmarshal(msg.Data, &event); err != nil {
			log.Printf("Error decoding event: %v", err)
			return
		}

		query := `UPDATE streamers SET support_completed = support_completed + $1 WHERE id = $2`
		_, err = dbPool.Exec(context.Background(), query, event.Amount, event.StreamerID)

		if err != nil {
			log.Printf("Failed to update support for streamer %s: %v", event.StreamerID, err)
			return
		}

		log.Printf("Added ₹%.2f to streamer %s's support total", event.Amount, event.StreamerID)

		msg.Ack()

	}, nats.ManualAck())

	if err != nil {
		log.Fatalf("Failed to subscribe to JetStream: %v", err)
	}
	defer sub.Unsubscribe()

	log.Println("Stats Worker Microservice is running and listening for tips...")

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)
	<-sigChan

	log.Println("Shutting down Stats Worker gracefully...")
}
