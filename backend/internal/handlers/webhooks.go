package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/ugeebee/root-pay/backend/internal/database"
	"github.com/ugeebee/root-pay/backend/internal/sse"
)

// 1. Update the payload to expect client_key instead of server_key
type WebhookRequest struct {
	ClientKey string `json:"client_key"`
}

func UPIWebhook(w http.ResponseWriter, r *http.Request) {
	var req WebhookRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid payload", http.StatusBadRequest)
		return
	}

	// 2. We update based on client_key, but we ask Postgres to RETURN the server_key
	query := `
		UPDATE tips 
		SET status = 'PAID' 
		WHERE client_key = $1 AND status = 'PENDING'
		RETURNING server_key, name, amount, message, streamer_id
	`

	var serverKey, name, message, streamerID string
	var amount float64

	err := database.DB.QueryRow(context.Background(), query, req.ClientKey).Scan(&serverKey, &name, &amount, &message, &streamerID)
	if err != nil {
		fmt.Println("Webhook skipped: Tip already paid or invalid key.")
		w.WriteHeader(http.StatusOK)
		return
	}

	// 3. Fire the SSE Trigger using the server_key we just pulled from the database!
	successPayload := `{"status": "PAID"}`
	sse.PaymentHub.Publish(serverKey, successPayload)

	fmt.Printf("💰 PAYMENT SUCCESS: %s tipped %.2f to %s!\n", name, amount, streamerID)
	w.WriteHeader(http.StatusOK)
}
