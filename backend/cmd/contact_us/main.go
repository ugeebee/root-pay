package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"

	_ "github.com/mattn/go-sqlite3"
)

var db *sql.DB

type ContactRequest struct {
	Name             string `json:"name"`
	PhoneNumber      string `json:"phone_number"`
	EmailAddress     string `json:"email address"`
	StreamingChannel string `json:"streaming channel link"`
	Message          string `json:"Your message"`
	TimeCreated      string `json:"time_created"`
}

func initDB() {
	var err error
	db, err = sql.Open("sqlite3", "./contacts.db")
	if err != nil {
		log.Fatalf("Failed to open SQLite database: %v", err)
	}

	createTableQuery := `
	CREATE TABLE IF NOT EXISTS contact_requests (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT,
		phone_number TEXT,
		email_address TEXT,
		streaming_channel TEXT,
		message TEXT,
		time_created TEXT
	);`

	_, err = db.Exec(createTableQuery)
	if err != nil {
		log.Fatalf("Failed to create contact_requests table: %v", err)
	}

	log.Println("SQLite contact database initialized successfully")
}

func handleContactPost(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var req ContactRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("JSON decode error: %v", err)
		http.Error(w, `{"error": "Malformed JSON payload"}`, http.StatusBadRequest)
		return
	}

	insertQuery := `
	INSERT INTO contact_requests 
	(name, phone_number, email_address, streaming_channel, message, time_created)
	VALUES (?, ?, ?, ?, ?, ?)`

	_, err := db.Exec(insertQuery,
		req.Name,
		req.PhoneNumber,
		req.EmailAddress,
		req.StreamingChannel,
		req.Message,
		req.TimeCreated,
	)

	if err != nil {
		log.Printf("Database insertion error: %v", err)
		http.Error(w, `{"error": "Failed to save contact request"}`, http.StatusInternalServerError)
		return
	}

	log.Printf("New contact request saved from: %s", req.Name)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	w.Write([]byte(`{"status": "success", "message": "Contact request saved successfully"}`))
}

func main() {
	initDB()
	defer db.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("/api/contact", handleContactPost)

	log.Println("🚀 Contact Microservice running on port 8085")
	if err := http.ListenAndServe(":8085", mux); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
