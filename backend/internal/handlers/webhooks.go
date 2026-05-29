package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/ugeebee/root-pay/backend/internal/database"
	"github.com/ugeebee/root-pay/backend/internal/sse"
)

// The payload sent from the Android Kotlin app
type WebhookRequest struct {
	ServerKey string `json:"server_key"`
}

// UPIWebhook is the ultra-fast endpoint that completes the transaction
func UPIWebhook(w http.ResponseWriter, r *http.Request) {
	var req WebhookRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid payload", http.StatusBadRequest)
		return
	}

	// 1. Strict Validation
	if len(req.ServerKey) != 32 || !isNumeric(req.ServerKey) {
		http.Error(w, "Invalid server_key", http.StatusBadRequest)
		return
	}

	// 2. Update PostgreSQL atomically.
	// We use RETURNING to grab the row data for the OBS overlay without running a second query.
	query := `
		UPDATE tips 
		SET status = 'PAID' 
		WHERE server_key = $1 AND status = 'PENDING'
		RETURNING name, amount, message, streamer_id
	`

	var name, message, streamerID string
	var amount float64

	err := database.DB.QueryRow(context.Background(), query, req.ServerKey).Scan(&name, &amount, &message, &streamerID)
	if err != nil {
		// If no rows updated, it was already PAID or the key is wrong.
		// We return 200 OK anyway so the Android app stops retrying the webhook.
		fmt.Println("Webhook skipped: Tip already paid or invalid key.")
		w.WriteHeader(http.StatusOK)
		return
	}

	// 3. Fire the SSE Trigger! This instantly pushes data to the waiting Next.js tab.
	successPayload := `{"status": "PAID"}`
	sse.PaymentHub.Publish(req.ServerKey, successPayload)

	// 4. (Coming Soon) Publish to the OBS WebSocket Hub here
	fmt.Printf("💰 PAYMENT SUCCESS: %s tipped %.2f to %s!\n", name, amount, streamerID)

	w.WriteHeader(http.StatusOK)
}
