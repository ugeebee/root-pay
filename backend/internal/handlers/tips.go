package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"

	"github.com/ugeebee/root-pay/backend/internal/database"
)

type CreateTipRequest struct {
	StreamerID string  `json:"streamer_id"`
	Name       string  `json:"name"`
	Message    string  `json:"message"`
	Amount     float64 `json:"amount"`
	ClientKey  string  `json:"client_key"`
}

type CreateTipResponse struct {
	UPIDeepLink string `json:"upi_deeplink"`
	IsPaid      bool   `json:"is_paid"`
}

var isNumeric = regexp.MustCompile(`^[0-9]+$`).MatchString

func CreateTip(w http.ResponseWriter, r *http.Request) {
	var req CreateTipRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	if len(req.ClientKey) != 32 || !isNumeric(req.ClientKey) {
		http.Error(w, "Invalid client_key", http.StatusBadRequest)
		return
	}

	if req.ClientKey[:8] != req.StreamerID {
		http.Error(w, "Security Mismatch: streamer_id does not align with client_key prefix.", http.StatusBadRequest)
		return
	}

	query := `
		INSERT INTO tips (streamer_id, client_key, name, message, amount, status)
		VALUES ($1, $2, $3, $4, $5, 'PENDING')
		ON CONFLICT (client_key) 
		DO UPDATE SET client_key = EXCLUDED.client_key
		RETURNING status
	`

	var status string
	var isPaid bool

	err := database.DB.QueryRow(context.Background(), query,
		req.StreamerID, req.ClientKey, req.Name, req.Message, req.Amount,
	).Scan(&status)

	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	if status == "PAID" {
		isPaid = true
	}

	streamerVPA := "test@oksbi"
	upiLink := fmt.Sprintf("upi://pay?pa=%s&pn=RootPay&am=%.2f&cu=INR&tn=%s", streamerVPA, req.Amount, req.ClientKey)

	res := CreateTipResponse{
		UPIDeepLink: upiLink,
		IsPaid:      isPaid,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(res)
}
