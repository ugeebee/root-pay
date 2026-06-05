package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
	"github.com/ugeebee/root-pay/backend/internal/database"
	"github.com/ugeebee/root-pay/backend/internal/handlers"
	"github.com/ugeebee/root-pay/backend/internal/sse"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, relying on environment variables")
	}
	dbPool := database.InitDB()
	defer dbPool.Close()
	sse.InitHub()
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "https://xyz.com"},
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))
	r.Route("/api", func(r chi.Router) {
		r.Get("/health", func(w http.ResponseWriter, req *http.Request) {
			w.Write([]byte("Root-pay API is live"))
		})
		r.Post("/tips", handlers.CreateTip)
		//r.Get("/tips", handlers.GetTip)
		r.Get("/tips/stream", handlers.SSEWait)
		r.Post("/webhooks/upi", handlers.UPIWebhook)
		r.Post("/support", handlers.SubmitSupportTicket)
		// r.Get("/ws/alerts", handlers.OBSWebSocket)
	})
	port := "8080"
	fmt.Printf("Starting backend server on port %s...\n", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
