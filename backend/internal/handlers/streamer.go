package handlers

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/jackc/pgx/v5"
	"github.com/ugeebee/root-pay/backend/internal/database"
)

type SupportStats struct {
	Title     string  `json:"title"`
	Total     float64 `json:"total"`
	Completed float64 `json:"completed"`
}

type StreamerResponse struct {
	StreamerID  string       `json:"streamerID"`
	StreamerTag string       `json:"streamer_tag"`
	Support     SupportStats `json:"support"`
	LiveLink    string       `json:"live_link"`
	UpiID       string       `json:"upi_id"`
}

func GetStreamer(w http.ResponseWriter, r *http.Request) {
	streamerID := r.URL.Query().Get("streamerID")
	if streamerID == "" {
		http.Error(w, `{"error": "streamerID is required"}`, http.StatusBadRequest)
		return
	}

	var tag, title, liveLink, upiID string
	var total, completed float64

	query := `
		SELECT 
			display_name, 
			COALESCE(support_title, 'Support the Stream'), 
			COALESCE(support_total, 0.00), 
			COALESCE(support_completed, 0.00), 
			COALESCE(live_link, ''),
			COALESCE(upi_id, '')
		FROM streamers 
		WHERE id = $1`

	err := database.DB.QueryRow(context.Background(), query, streamerID).Scan(&tag, &title, &total, &completed, &liveLink, &upiID)

	if err != nil {
		if err == pgx.ErrNoRows {
			http.Error(w, `{"error": "Streamer not found"}`, http.StatusNotFound)
			return
		}
		http.Error(w, `{"error": "Internal server error"}`, http.StatusInternalServerError)
		return
	}

	resp := StreamerResponse{
		StreamerID:  streamerID,
		StreamerTag: tag,
		Support: SupportStats{
			Title:     title,
			Total:     total,
			Completed: completed,
		},
		LiveLink: liveLink,
		UpiID:    upiID,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
