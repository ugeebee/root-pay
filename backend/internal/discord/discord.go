package discord

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"
)

type WebhookPayload struct {
	Embeds []Embed `json:"embeds"`
}

type Embed struct {
	Title       string  `json:"title"`
	Description string  `json:"description"`
	Color       int     `json:"color"`
	Timestamp   string  `json:"timestamp"`
	Fields      []Field `json:"fields"`
}

type Field struct {
	Name   string `json:"name"`
	Value  string `json:"value"`
	Inline bool   `json:"inline"`
}

func SendSupportTicket(clientKey, upiID, issue string) error {
	webhookURL := os.Getenv("DISCORD_WEBHOOK_URL")
	if webhookURL == "" {
		return fmt.Errorf("DISCORD_WEBHOOK_URL environment variable is not set")
	}

	payload := WebhookPayload{
		Embeds: []Embed{
			{
				Title:       "New Support Ticket",
				Description: issue,
				Color:       15548997, // Red highlight color
				Timestamp:   time.Now().Format(time.RFC3339),
				Fields: []Field{
					{Name: "Viewer UPI ID", Value: fmt.Sprintf("`%s`", upiID), Inline: true},
					{Name: "Transaction ID", Value: fmt.Sprintf("`%s`", clientKey), Inline: false},
				},
			},
		},
	}

	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	resp, err := http.Post(webhookURL, "application/json", bytes.NewBuffer(payloadBytes))
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("discord API rejected the payload: status %d", resp.StatusCode)
	}

	return nil
}

func SendMessage(content string) error {
	webhookURL := os.Getenv("DISCORD_WEBHOOK_URL")
	if webhookURL == "" {
		return fmt.Errorf("DISCORD_WEBHOOK_URL environment variable is not set")
	}

	payload := map[string]string{"content": content}
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	resp, err := http.Post(webhookURL, "application/json", bytes.NewBuffer(payloadBytes))
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("discord API rejected the payload: status %d", resp.StatusCode)
	}

	return nil
}
