package handlers

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"math/big"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/ugeebee/tip-root/backend/internal/database"
)

type CreateTipRequest struct {
	StreamerID string  `json:"streamer_id"`
	RequestID  string  `json:"request_id"`
	Name       string  `json:"name"`
	Message    string  `json:"message"`
	Amount     float64 `json:"amount"`
}

type CreateTipResponse struct {
	UPIDeepLink string `json:"upi_deeplink"`
	IsPaid      bool   `json:"is_paid"`
	ClientKey   string `json:"client_key"`
	SupportKey  string `json:"support_key"`
}

func CreateTip(w http.ResponseWriter, r *http.Request) {
	var req CreateTipRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	minAmountStr := os.Getenv("MIN_AMOUNT")
	minAmount, parseErr := strconv.ParseFloat(minAmountStr, 64)
	if parseErr != nil || minAmount <= 0 {
		minAmount = 40
	}

	if req.Amount < minAmount {
		http.Error(w, fmt.Sprintf("Minimum tip amount is ₹%.2f", minAmount), http.StatusBadRequest)
		return
	}

	var existingClientKey, existingSupportKey, existingStatus string
	err := database.DB.QueryRow(context.Background(),
		"SELECT client_key, support_key, status FROM tips WHERE request_id = $1",
		req.RequestID,
	).Scan(&existingClientKey, &existingSupportKey, &existingStatus)

	if err == nil {
		var streamerUPI string
		database.DB.QueryRow(context.Background(), "SELECT upi_id FROM streamers WHERE id = $1", req.StreamerID).Scan(&streamerUPI)
		upiLink := fmt.Sprintf("upi://pay?pa=%s&pn=%s&am=%.2f&cu=INR&tn=%s", streamerUPI, "Streamer", req.Amount, existingClientKey)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(CreateTipResponse{
			UPIDeepLink: upiLink,
			IsPaid:      existingStatus == "PAID",
			ClientKey:   existingClientKey,
			SupportKey:  existingSupportKey,
		})
		return
	}

	paddedStreamerID := fmt.Sprintf("%08s", req.StreamerID)
	if len(paddedStreamerID) > 8 {
		paddedStreamerID = paddedStreamerID[:8]
	}
	now := time.Now()
	timestamp := now.Format("02012006150405") + fmt.Sprintf("%03d", now.UnixMilli()%1000)
	n, _ := rand.Int(rand.Reader, big.NewInt(10000000))
	entropy := fmt.Sprintf("%07d", n)

	clientKey := paddedStreamerID + timestamp + entropy

	supBytes := make([]byte, 4)
	rand.Read(supBytes)
	supportKey := fmt.Sprintf("SUP-%X", supBytes)

	var streamerUPI string
	err = database.DB.QueryRow(context.Background(), "SELECT upi_id FROM streamers WHERE id = $1", req.StreamerID).Scan(&streamerUPI)
	if err != nil {
		http.Error(w, "Streamer not found or missing UPI ID", http.StatusNotFound)
		return
	}

	upiLink := fmt.Sprintf("upi://pay?pa=%s&pn=%s&am=%.2f&cu=INR&tn=%s", streamerUPI, "Streamer", req.Amount, clientKey)

	query := `
		INSERT INTO tips (request_id, streamer_id, client_key, support_key, name, message, amount, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING')
		RETURNING status
	`
	var status string
	err = database.DB.QueryRow(context.Background(), query,
		req.RequestID, req.StreamerID, clientKey, supportKey, req.Name, req.Message, req.Amount,
	).Scan(&status)

	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(CreateTipResponse{
		UPIDeepLink: upiLink,
		IsPaid:      status == "PAID",
		ClientKey:   clientKey,
		SupportKey:  supportKey,
	})
}
