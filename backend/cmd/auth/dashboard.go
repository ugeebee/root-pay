package main

import (
	"encoding/json"
	"net/http"
)

type DashboardSettings struct {
	DisplayName      string  `json:"display_name"`
	UpiID            string  `json:"upi_id"`
	SupportTitle     string  `json:"support_title"`
	SupportTotal     float64 `json:"support_total"`
	SupportCompleted float64 `json:"support_completed"`
}

type TokenResponse struct {
	OverlayToken string `json:"overlay_token"`
}

func getDashboardSettingsHandler(w http.ResponseWriter, r *http.Request, streamerID string) {
	var p DashboardSettings
	query := `
		SELECT 
			COALESCE(display_name, ''), 
			COALESCE(upi_id, ''), 
			COALESCE(support_title, 'Support the Stream'), 
			COALESCE(support_total, 0.00), 
			COALESCE(support_completed, 0.00)
		FROM streamers 
		WHERE id = $1`

	err := dbPool.QueryRow(r.Context(), query, streamerID).Scan(
		&p.DisplayName, &p.UpiID, &p.SupportTitle, &p.SupportTotal, &p.SupportCompleted,
	)
	if err != nil {
		http.Error(w, `{"error": "Failed to load settings"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(p)
}

func updateDashboardSettingsHandler(w http.ResponseWriter, r *http.Request, streamerID string) {
	var p DashboardSettings
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		http.Error(w, `{"error": "Invalid payload"}`, http.StatusBadRequest)
		return
	}

	query := `
		UPDATE streamers 
		SET display_name = $1, upi_id = $2, support_title = $3, support_total = $4, support_completed = $5
		WHERE id = $6`

	_, err := dbPool.Exec(r.Context(), query, p.DisplayName, p.UpiID, p.SupportTitle, p.SupportTotal, p.SupportCompleted, streamerID)
	if err != nil {
		http.Error(w, `{"error": "Failed to save changes"}`, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status": "success"}`))
}

func getOverlayTokenHandler(w http.ResponseWriter, r *http.Request, streamerID string) {
	var resp TokenResponse
	err := dbPool.QueryRow(r.Context(), "SELECT overlay_token FROM streamers WHERE id = $1", streamerID).Scan(&resp.OverlayToken)
	if err != nil {
		http.Error(w, `{"error": "Failed to load security token"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func rotateTokenHandler(w http.ResponseWriter, r *http.Request, streamerID string) {
	newToken := generateSecureToken()

	_, err := dbPool.Exec(r.Context(), "UPDATE streamers SET overlay_token = $1 WHERE id = $2", newToken, streamerID)
	if err != nil {
		http.Error(w, `{"error": "Failed to rotate token"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"overlay_token": newToken})
}
