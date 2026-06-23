package database

import (
	"context"
	"fmt"
	"log"
	"os"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/ugeebee/tip-root/backend/internal/models"
)

var (
	DB   *pgxpool.Pool
	once sync.Once
)

func InitDB() *pgxpool.Pool {
	once.Do(func() {
		connStr := os.Getenv("DATABASE_URL")
		if connStr == "" {
			log.Fatal("DATABASE_URL environment variable is not set")
		}

		config, err := pgxpool.ParseConfig(connStr)
		if err != nil {
			log.Fatalf("Unable to parse database config: %v", err)
		}

		config.MaxConns = 25
		config.MinConns = 5
		config.MaxConnIdleTime = 30 * time.Minute

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		pool, err := pgxpool.NewWithConfig(ctx, config)
		if err != nil {
			log.Fatalf("Unable to connect to database: %v", err)
		}

		if err := pool.Ping(ctx); err != nil {
			log.Fatalf("Database ping failed: %v", err)
		}

		fmt.Println("Successfully locked connection to PostgreSQL!")
		DB = pool
	})

	return DB
}

func ProcessWebhookTip(clientKey string) (*models.Tip, error) {
	query := `
		UPDATE tips 
		SET status = 'PAID' 
		WHERE client_key = $1 AND status = 'PENDING'
		RETURNING streamer_id, name, amount, message
	`
	var tip models.Tip
	tip.ClientKey = clientKey

	err := DB.QueryRow(context.Background(), query, clientKey).Scan(
		&tip.StreamerID, &tip.Name, &tip.Amount, &tip.Message,
	)
	if err != nil {
		return nil, err
	}
	return &tip, nil
}

func UpdateNSFWFlag(clientKey string, isNSFW bool) error {
	query := `UPDATE tips SET is_nsfw = $1 WHERE client_key = $2`
	_, err := DB.Exec(context.Background(), query, isNSFW, clientKey)
	return err
}

func AddSupportToStreamer(streamerID string, amount float64) error {
	query := `UPDATE streamers SET support_completed = support_completed + $1 WHERE id = $2`

	_, err := DB.Exec(context.Background(), query, amount, streamerID)
	return err
}
