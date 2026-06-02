package handlers

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"math/big"
	"net/http"
	"regexp"

	"github.com/ugeebee/root-pay/backend/internal/database"
)

// The new architecture request payload from Next.js
type CreateTipRequest struct {
	StreamerID string  `json:"streamer_id"`
	Name       string  `json:"name"`
	Message    string  `json:"message"`
	Amount     float64 `json:"amount"`
	ClientKey  string  `json:"client_key"`
}

// The exact response payload your state machine expects
type CreateTipResponse struct {
	ServerKey   string `json:"server_key"`
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

	// 1. Strict Validation
	if len(req.ClientKey) != 32 || !isNumeric(req.ClientKey) {
		http.Error(w, "Invalid client_key. Must be exactly 32 numeric digits.", http.StatusBadRequest)
		return
	}

	// Ensure the first 8 digits of the client_key actually match the requested StreamerID
	if req.ClientKey[:8] != req.StreamerID {
		http.Error(w, "Security Mismatch: streamer_id does not align with client_key prefix.", http.StatusBadRequest)
		return
	}

	// 2. Generate a secure backend ServerKey
	newServerKey, err := generate32DigitKey()
	if err != nil {
		http.Error(w, "Failed to generate server key", http.StatusInternalServerError)
		return
	}

	// 3. The Idempotent Upsert (Handles the "Stale Transaction" logic flawlessly)
	query := `
		INSERT INTO tips (streamer_id, client_key, server_key, name, message, amount, status)
		VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')
		ON CONFLICT (client_key) 
		DO UPDATE SET client_key = EXCLUDED.client_key
		RETURNING server_key, status
	`

	var activeServerKey string
	var status string
	var isPaid bool

	err = database.DB.QueryRow(context.Background(), query,
		req.StreamerID, req.ClientKey, newServerKey, req.Name, req.Message, req.Amount,
	).Scan(&activeServerKey, &status)

	if err != nil {
		fmt.Printf("Database Execution Error: %v\n", err)
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	// If the database returns PAID (meaning this client_key was already processed)
	if status == "PAID" {
		isPaid = true
	}

	// 4. Generate the UPI Deep Link passing the client_key to the 'tn' parameter
	// (Note: For MVP we hardcode kavvaie@ybl, but later you will query the VPA based on StreamerID)
	streamerVPA := "kavvaie@ybl"
	upiLink := fmt.Sprintf("upi://pay?pa=%s&pn=RootPay&am=%.2f&cu=INR&tn=%s",
		streamerVPA, req.Amount, req.ClientKey)

	// 5. Fire back the exact payload your Next.js state machine requires
	res := CreateTipResponse{
		ServerKey:   activeServerKey,
		UPIDeepLink: upiLink,
		IsPaid:      isPaid,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(res)
}

func generate32DigitKey() (string, error) {
	result := ""
	for i := 0; i < 32; i++ {
		n, err := rand.Int(rand.Reader, big.NewInt(10))
		if err != nil {
			return "", err
		}
		result += n.String()
	}
	return result, nil
}
