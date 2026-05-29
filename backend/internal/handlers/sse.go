package handlers

import (
	"fmt"
	"net/http"

	"github.com/ugeebee/root-pay/backend/internal/sse"
)

// SSEWait holds the HTTP connection open until the payment clears.
func SSEWait(w http.ResponseWriter, r *http.Request) {
	serverKey := r.URL.Query().Get("server_key")
	if serverKey == "" || len(serverKey) != 32 {
		http.Error(w, "Invalid or missing server_key", http.StatusBadRequest)
		return
	}

	// 1. Tell the Next.js browser to expect a stream, not a standard JSON payload
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	// 2. We need a Flusher to push data immediately over the wire
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported by server", http.StatusInternalServerError)
		return
	}

	// 3. Register this viewer in the switchboard
	msgChan := sse.PaymentHub.Register(serverKey)

	// Ensure memory is freed the second the viewer closes the tab
	defer sse.PaymentHub.Unregister(serverKey)

	// 4. The Infinite Wait Loop
	for {
		select {
		case msg, ok := <-msgChan:
			if !ok {
				return // Channel was closed internally
			}

			// SSE Protocol dictates payloads must start with "data: " and end with "\n\n"
			fmt.Fprintf(w, "data: %s\n\n", msg)
			flusher.Flush()

			// Once the payment succeeds, we can safely kill this connection
			return

		case <-r.Context().Done():
			// The viewer closed the tab, their internet dropped, or they hit the back button
			fmt.Println("Viewer disconnected:", serverKey)
			return
		}
	}
}
