package main

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"os"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/sessions"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"github.com/markbates/goth"
	"github.com/markbates/goth/gothic"
	"github.com/markbates/goth/providers/discord"
)

var (
	dbPool       *pgxpool.Pool
	jwtSecret    []byte
	cookieDomain string
	masterPwd    string
)

type Claims struct {
	StreamerID string `json:"streamer_id"`
	jwt.RegisteredClaims
}

type PendingClaims struct {
	DiscordID string `json:"discord_id"`
	Username  string `json:"username"`
	Email     string `json:"email"`
	jwt.RegisteredClaims
}

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: No .env file found, relying on environment variables")
	}

	jwtSecret = []byte(os.Getenv("JWT_SECRET"))
	cookieDomain = os.Getenv("COOKIE_DOMAIN")
	masterPwd = os.Getenv("MASTER_PASSWORD")

	if masterPwd == "" {
		log.Fatal("MASTER_PASSWORD environment variable is not set")
	}

	store := sessions.NewCookieStore([]byte(os.Getenv("SESSION_SECRET")))
	store.Options.HttpOnly = true
	store.Options.Secure = true
	store.Options.SameSite = http.SameSiteLaxMode
	gothic.Store = store
	goth.UseProviders(
		discord.New(
			os.Getenv("DISCORD_CLIENT_ID"),
			os.Getenv("DISCORD_CLIENT_SECRET"),
			os.Getenv("CALLBACK_URL"),
			discord.ScopeIdentify,
			discord.ScopeEmail,
		),
	)
	var err error
	dbPool, err = pgxpool.New(context.Background(), os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatalf("Unable to connect to database pool: %v", err)
	}
	defer dbPool.Close()

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "https://root.ugbhartariya.com"},
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	r.Route("/api/auth", func(r chi.Router) {
		r.Get("/{provider}", beginAuth)
		r.Get("/{provider}/callback", callbackHandler)
		r.Post("/refresh", refreshHandler)
		r.Post("/logout", logoutHandler)
		r.Post("/claim", claimAccountHandler)
	})

	r.Get("/api/dashboard/stats", verifyAccessMiddleware(func(w http.ResponseWriter, r *http.Request, streamerID string) {
		fmt.Fprintf(w, "Authenticated secure statistics payload for Streamer: %s", streamerID)
	}))

	fmt.Println("Auth Gateway microservice streaming live on :8084")
	log.Fatal(http.ListenAndServe(":8084", r))
}

func beginAuth(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	q.Set("provider", chi.URLParam(r, "provider"))
	r.URL.RawQuery = q.Encode()

	gothic.BeginAuthHandler(w, r)
}

func callbackHandler(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	q.Set("provider", chi.URLParam(r, "provider"))
	r.URL.RawQuery = q.Encode()

	discordUser, err := gothic.CompleteUserAuth(w, r)
	if err != nil {
		http.Error(w, fmt.Sprintf("Authentication failed: %v", err), http.StatusBadRequest)
		return
	}

	var streamerID string
	err = dbPool.QueryRow(r.Context(), "SELECT id FROM streamers WHERE discord_id = $1", discordUser.UserID).Scan(&streamerID)

	if err == nil {
		if err := issueTokens(w, streamerID); err != nil {
			http.Error(w, "Token provisioning failed", http.StatusInternalServerError)
			return
		}
		http.Redirect(w, r, "https://adminroot.ugbhartariya.com/dashboard", http.StatusFound)
		return
	}

	if err.Error() == "no rows in result set" || errors.Is(err, context.Canceled) {

		_, _ = dbPool.Exec(r.Context(), `
			INSERT INTO pending_signups (discord_id, display_name, email)
			VALUES ($1, $2, $3)
			ON CONFLICT (discord_id) DO NOTHING
		`, discordUser.UserID, discordUser.Name, discordUser.Email)

		pendingClaims := PendingClaims{
			DiscordID: discordUser.UserID,
			Username:  discordUser.Name,
			Email:     discordUser.Email,
			RegisteredClaims: jwt.RegisteredClaims{
				ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
			},
		}
		pendingToken := jwt.NewWithClaims(jwt.SigningMethodHS256, pendingClaims)
		signedPending, _ := pendingToken.SignedString(jwtSecret)

		http.SetCookie(w, &http.Cookie{
			Name:     "root_pending",
			Value:    signedPending,
			Path:     "/",
			Domain:   cookieDomain,
			HttpOnly: true,
			Secure:   true,
			SameSite: http.SameSiteLaxMode,
			MaxAge:   15 * 60,
		})

		http.Redirect(w, r, "https://root.ugbhartariya.com/claim", http.StatusFound)
		return
	}

	http.Error(w, "Database account mapping failed", http.StatusInternalServerError)
}

type ClaimRequest struct {
	MasterPassword string `json:"master_password"`
}

func claimAccountHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	cookie, err := r.Cookie("root_pending")
	if err != nil {
		http.Error(w, "Pending session missing or expired. Please login with Discord again.", http.StatusUnauthorized)
		return
	}

	token, err := jwt.ParseWithClaims(cookie.Value, &PendingClaims{}, func(t *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})

	if err != nil || !token.Valid {
		http.Error(w, "Invalid pending session", http.StatusUnauthorized)
		return
	}

	claims, ok := token.Claims.(*PendingClaims)
	if !ok {
		http.Error(w, "Invalid claims", http.StatusUnauthorized)
		return
	}

	var req ClaimRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.MasterPassword != masterPwd {
		http.Error(w, "Incorrect master password", http.StatusUnauthorized)
		return
	}

	streamerID := generateCleanID()
	overlayToken := generateSecureToken()

	insertQuery := `
		INSERT INTO streamers (id, discord_id, display_name, email, overlayToken)
		VALUES ($1, $2, $3, $4, $5)
	`
	_, err = dbPool.Exec(r.Context(), insertQuery, streamerID, claims.DiscordID, claims.Username, claims.Email, overlayToken)
	if err != nil {
		http.Error(w, "Failed to create account", http.StatusInternalServerError)
		return
	}

	_, _ = dbPool.Exec(r.Context(), "DELETE FROM pending_signups WHERE discord_id = $1", claims.DiscordID)

	if err := issueTokens(w, streamerID); err != nil {
		http.Error(w, "Token provisioning failed", http.StatusInternalServerError)
		return
	}

	clearCookie(w, "root_pending")

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status": "account_claimed"}`))
}

func refreshHandler(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("root_refresh")
	if err != nil {
		http.Error(w, "Refresh token missing", http.StatusUnauthorized)
		return
	}

	var isBlacklisted bool
	err = dbPool.QueryRow(r.Context(), "SELECT EXISTS(SELECT 1 FROM blacklisted_tokens WHERE token = $1)", cookie.Value).Scan(&isBlacklisted)
	if isBlacklisted || err != nil {
		http.Error(w, "Session has been revoked", http.StatusUnauthorized)
		return
	}

	token, err := jwt.ParseWithClaims(cookie.Value, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})

	if err != nil || !token.Valid {
		http.Error(w, "Invalid or expired rotation session token", http.StatusUnauthorized)
		return
	}

	claims, ok := token.Claims.(*Claims)
	if !ok {
		http.Error(w, "Malformed claims payload structure", http.StatusUnauthorized)
		return
	}
	if err := issueTokens(w, claims.StreamerID); err != nil {
		http.Error(w, "Token rotation execution failed", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status": "tokens rotated successfully"}`))
}

func logoutHandler(w http.ResponseWriter, r *http.Request) {
	clearCookie(w, "root_access")
	clearCookie(w, "root_refresh")
	w.WriteHeader(http.StatusOK)
}

func issueTokens(w http.ResponseWriter, streamerID string) error {
	accessClaims := Claims{
		StreamerID: streamerID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
		},
	}
	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	signedAccess, err := accessToken.SignedString(jwtSecret)
	if err != nil {
		return err
	}

	refreshClaims := Claims{
		StreamerID: streamerID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
		},
	}
	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	signedRefresh, err := refreshToken.SignedString(jwtSecret)
	if err != nil {
		return err
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "root_access",
		Value:    signedAccess,
		Path:     "/",
		Domain:   cookieDomain,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   15 * 60,
	})
	http.SetCookie(w, &http.Cookie{
		Name:     "root_refresh",
		Value:    signedRefresh,
		Path:     "/api/auth/refresh",
		Domain:   cookieDomain,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   7 * 24 * 60 * 60,
	})

	return nil
}

func clearCookie(w http.ResponseWriter, name string) {
	http.SetCookie(w, &http.Cookie{
		Name:     name,
		Value:    "",
		Path:     "/",
		Domain:   cookieDomain,
		HttpOnly: true,
		Secure:   true,
		MaxAge:   -1,
	})
}

func generateCleanID() string {
	var id string
	for i := 0; i < 8; i++ {
		n, _ := rand.Int(rand.Reader, big.NewInt(10))
		id += n.String()
	}
	return id
}

func generateSecureToken() string {
	b := make([]byte, 16)
	rand.Read(b)
	return hex.EncodeToString(b)
}

type ProtectedHandler func(w http.ResponseWriter, r *http.Request, streamerID string)

func verifyAccessMiddleware(next ProtectedHandler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("root_access")
		if err != nil {
			http.Error(w, "Access token missing, authorization denied", http.StatusUnauthorized)
			return
		}

		token, err := jwt.ParseWithClaims(cookie.Value, &Claims{}, func(t *jwt.Token) (interface{}, error) {
			return jwtSecret, nil
		})

		if err != nil || !token.Valid {
			http.Error(w, "Access token expired or malformed", http.StatusUnauthorized)
			return
		}

		claims, ok := token.Claims.(*Claims)
		if !ok {
			http.Error(w, "Context assertion failed", http.StatusUnauthorized)
			return
		}

		next(w, r, claims.StreamerID)
	}
}
