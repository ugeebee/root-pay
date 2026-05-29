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

type CreateTipRequest struct {
	ClientKey string  `json:"client_key"`
	Name      string  `json:"name"`
	Message   string  `json:"message"`
	Amount    float64 `json:"amount"`
}

type CreateTipResponse struct {
	ServerKey   string `json:"server_key"`
	UPIDeepLink string `json:"upi_deeplink"`
}

var isNumeric = regexp.MustCompile(`^[0-9]+$`).MatchString

func CreateTip(w http.ResponseWriter, r *http.Request) {
	var req CreateTipRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	if len(req.ClientKey) != 32 || !isNumeric(req.ClientKey) {
		http.Error(w, "Invalid client_key format. Must be exactly 32 digits.", http.StatusBadRequest)
		return
	}

	streamerID := req.ClientKey[:8]
	serverKey, err := generate32DigitKey()
	if err != nil {
		http.Error(w, "Failed to generate secure key", http.StatusInternalServerError)
		return
	}

	query := `
		INSERT INTO tips (streamer_id, client_key, server_key, name, message, amount, status)
		VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')
	`
	_, err = database.DB.Exec(context.Background(), query,
		streamerID, req.ClientKey, serverKey, req.Name, req.Message, req.Amount)

	if err != nil {
		fmt.Printf("DB Insert Error: %v\n", err)
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	streamerVPA := "test@ybl"
	upiLink := fmt.Sprintf("upi://pay?pa=%s&pn=RootPay&am=%.2f&cu=INR&tn=%s",
		streamerVPA, req.Amount, req.ClientKey)
	res := CreateTipResponse{
		ServerKey:   serverKey,
		UPIDeepLink: upiLink,
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
