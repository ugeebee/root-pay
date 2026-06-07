package eventbus

import (
	"log"
	"os"

	"github.com/nats-io/nats.go"
)

func Connect() *nats.Conn {
	natsURL := os.Getenv("NATS_URL")
	if natsURL == "" {
		natsURL = nats.DefaultURL
	}

	nc, err := nats.Connect(natsURL)
	if err != nil {
		log.Fatalf("Fatal NATS Connection error: %v", err)
	}

	return nc
}
