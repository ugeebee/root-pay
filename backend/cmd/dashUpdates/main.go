package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"github.com/nats-io/nats.go"
	"github.com/ugeebee/tip-root/backend/internal/eventbus"
	"github.com/ugeebee/tip-root/backend/internal/logger"
	"github.com/ugeebee/tip-root/backend/internal/models"
)

var (
	dbPool    *pgxpool.Pool
	natsConn  *nats.Conn
	jetStream nats.JetStreamContext
	jwtSecret []byte
)

type Claims struct {
	StreamerID string `json:"streamer_id"`
	jwt.RegisteredClaims
}

type LedgerEntry struct {
	ClientKey string  `json:"client_key"`
	Name      string  `json:"name"`
	Amount    float64 `json:"amount"`
	Message   string  `json:"message"`
	CreatedAt string  `json:"created_at"`
}

func main() {
	logger.InitLogger()
	godotenv.Load()
	godotenv.Load("../.env")

	jwtSecret = []byte(os.Getenv("JWT_SECRET"))

	var err error
	dbPool, err = pgxpool.New(context.Background(), os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer dbPool.Close()

	natsConn, jetStream = eventbus.Connect()
	defer natsConn.Close()

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"https://streamer.tip-root.in"},
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	r.Get("/api/dashboard/updates/stream", verifyAccessMiddleware(streamDashboardUpdates))
	r.Post("/api/dashboard/tips/approve", verifyAccessMiddleware(approveTipHandler))
	r.Get("/api/dashboard/ledger", verifyAccessMiddleware(getLedgerHandler))
	slog.Info("Dashboard Updates Microservice live", slog.String("port", "8086"))
	log.Fatal(http.ListenAndServe(":8086", r))
}

func streamDashboardUpdates(w http.ResponseWriter, r *http.Request, streamerID string) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	msgChan := make(chan *nats.Msg, 10)
	sub, err := natsConn.Subscribe("tips.processed", func(msg *nats.Msg) {
		msgChan <- msg
	})
	if err != nil {
		http.Error(w, "NATS subscription failed", http.StatusInternalServerError)
		return
	}
	defer sub.Unsubscribe()

	w.WriteHeader(http.StatusOK)
	flusher.Flush()

	ticker := time.NewTicker(15 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case msg := <-msgChan:
			var event models.TipEvent
			json.Unmarshal(msg.Data, &event)

			if event.StreamerID == streamerID {
				payload, _ := json.Marshal(event)
				fmt.Fprintf(w, "data: %s\n\n", string(payload))
				flusher.Flush()
			}

		case <-ticker.C:
			fmt.Fprintf(w, ": heartbeat\n\n")
			flusher.Flush()

		case <-r.Context().Done():
			return
		}
	}
}

func approveTipHandler(w http.ResponseWriter, r *http.Request, streamerID string) {
	var req struct {
		ClientKey string `json:"client_key"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid payload", http.StatusBadRequest)
		return
	}

	query := "UPDATE tips SET is_nsfw = false WHERE client_key = $1 AND streamer_id = $2 RETURNING name, amount, message"
	var tip models.TipEvent
	err := dbPool.QueryRow(r.Context(), query, req.ClientKey, streamerID).Scan(&tip.Name, &tip.Amount, &tip.Message)
	if err != nil {
		http.Error(w, "Tip not found or unauthorized", http.StatusNotFound)
		return
	}

	tip.ClientKey = req.ClientKey
	tip.StreamerID = streamerID
	tip.IsNSFW = false
	eventData, _ := json.Marshal(tip)

	jetStream.Publish("tips.approved", eventData)

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status": "approved"}`))
}

func verifyAccessMiddleware(next func(w http.ResponseWriter, r *http.Request, streamerID string)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("root_access")
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		token, err := jwt.ParseWithClaims(cookie.Value, &Claims{}, func(t *jwt.Token) (interface{}, error) {
			return jwtSecret, nil
		})
		if err != nil || !token.Valid {
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}
		claims := token.Claims.(*Claims)
		next(w, r, claims.StreamerID)
	}
}

func getLedgerHandler(w http.ResponseWriter, r *http.Request, streamerID string) {
	query := `
		SELECT client_key, name, amount, message, created_at 
		FROM tips 
		WHERE streamer_id = $1 
		  AND status = 'PAID'
		  AND created_at >= date_trunc('month', CURRENT_DATE)
		ORDER BY created_at DESC
	`
	rows, err := dbPool.Query(r.Context(), query, streamerID)
	if err != nil {
		http.Error(w, "Failed to fetch ledger data", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var entries []LedgerEntry
	for rows.Next() {
		var entry LedgerEntry
		var timestamp time.Time

		if err := rows.Scan(&entry.ClientKey, &entry.Name, &entry.Amount, &entry.Message, &timestamp); err != nil {
			continue
		}

		entry.CreatedAt = timestamp.Format("Jan 02, 2006 - 15:04")
		entries = append(entries, entry)
	}

	if entries == nil {
		entries = []LedgerEntry{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(entries)
}
