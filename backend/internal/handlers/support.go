package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/ugeebee/root-pay/backend/internal/discord"
)

type SupportRequest struct {
	ClientKey string `json:"client_key"`
	UpiID     string `json:"upi_id"`
	Issue     string `json:"issue"`
}

func SubmitSupportTicket(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req SupportRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid payload", http.StatusBadRequest)
		return
	}

	if req.ClientKey == "" || req.UpiID == "" || req.Issue == "" {
		http.Error(w, "Missing required fields", http.StatusBadRequest)
		return
	}

	err := discord.SendSupportTicket(req.ClientKey, req.UpiID, req.Issue)
	if err != nil {
		http.Error(w, "Failed to dispatch ticket to mods", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status": "ticket_created"}`))
}
