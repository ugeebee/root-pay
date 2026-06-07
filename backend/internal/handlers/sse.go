package handlers

import (
	"fmt"
	"net/http"

	"github.com/ugeebee/root-pay/backend/internal/sse"
)

func SSEWait(w http.ResponseWriter, r *http.Request) {
	clientKey := r.URL.Query().Get("client_key")
	if clientKey == "" || len(clientKey) != 32 {
		http.Error(w, "Invalid or missing client_key", http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
	flusher.Flush()

	msgChan := sse.PaymentHub.Register(clientKey)
	defer sse.PaymentHub.Unregister(clientKey)

	for {
		select {
		case msg, ok := <-msgChan:
			if !ok {
				return
			}
			if len(msg) > 0 && msg[0] == ':' {
				fmt.Fprint(w, msg)
				flusher.Flush()
				continue
			}
			fmt.Fprintf(w, "data: %s\n\n", msg)
			flusher.Flush()
			return

		case <-r.Context().Done():
			fmt.Println("Viewer disconnected:", clientKey)
			return
		}
	}
}
