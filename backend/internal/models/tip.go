package models

import "time"

type Tip struct {
	ID         int       `json:"-"`
	StreamerID string    `json:"streamer_id"`
	ClientKey  string    `json:"client_key"`
	SupportKey string    `json:"support_key"`
	Name       string    `json:"name"`
	Message    string    `json:"message"`
	Amount     float64   `json:"amount"`
	Status     string    `json:"status"`
	IsNSFW     bool      `json:"is_nsfw"`
	CreatedAt  time.Time `json:"created_at"`
}

type TipEvent struct {
	ClientKey  string    `json:"client_key"`
	StreamerID string    `json:"streamer_id"`
	Name       string    `json:"name"`
	Amount     float64   `json:"amount"`
	Message    string    `json:"message"`
	IsNSFW     bool      `json:"is_nsfw"`
	Timestamp  time.Time `json:"timestamp"`
}
