package models

import "time"

type Tip struct {
	ID         int       `json:"-"`
	StreamerID string    `json:"streamer_id"`
	ClientKey  string    `json:"client_key"`
	ServerKey  string    `json:"server_key"`
	Name       string    `json:"name"`
	Message    string    `json:"message"`
	Amount     float64   `json:"amount"`
	Status     string    `json:"status"`
	CreatedAt  time.Time `json:"created_at"`
}
