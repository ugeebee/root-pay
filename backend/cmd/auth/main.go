package main

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"os"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
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
)

type Claims struct {
	StreamerID string `json:"streamer_id"`
	jwt.MapClaims
}

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: No .env file found, relying on environment variables")
	}

	jwtSecret = []byte(os.Getenv("JWT_SECRET"))
	cookieDomain = os.Getenv("COOKIE_DOMAIN")

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
	r.Route("/api/auth", func(r chi.Router) {
		r.Get("/{provider}", beginAuth)
		r.Get("/{provider}/callback", callbackHandler)
		r.Post("/refresh", refreshHandler)
		r.Post("/logout", logoutHandler)
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
		http.Error(w, fmt.Sprintf("Authentication context handshake failed: %v", err), http.StatusBadRequest)
		return
	}
	streamerID, err := getOrCreateStreamer(r.Context(), discordUser.UserID, discordUser.Name, discordUser.Email)
	if err != nil {
		http.Error(w, "Database account mapping mutation failed", http.StatusInternalServerError)
		return
	}
	if err := issueTokens(w, streamerID); err != nil {
		http.Error(w, "Token provisioning failed", http.StatusInternalServerError)
		return
	}
	http.Redirect(w, r, "https://adminroot.ugbhartariya.com/dashboard", http.StatusFound)
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
		MapClaims: jwt.MapClaims{
			"exp": time.Now().Add(15 * time.Minute).Unix(),
		},
	}
	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	signedAccess, err := accessToken.SignedString(jwtSecret)
	if err != nil {
		return err
	}
	refreshClaims := Claims{
		StreamerID: streamerID,
		MapClaims: jwt.MapClaims{
			"exp": time.Now().Add(7 * 24 * time.Hour).Unix(),
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

func getOrCreateStreamer(ctx context.Context, discordID, username, email string) (string, error) {
	var streamerID string
	err := dbPool.QueryRow(ctx, "SELECT id FROM streamers WHERE discord_id = $1", discordID).Scan(&streamerID)
	if err == nil {
		return streamerID, nil
	}
	if err.Error() == "no rows in result set" || errors.Is(err, context.Canceled) {
		streamerID = generateCleanID()
		overlayToken := generateSecureToken()

		insertQuery := `
			INSERT INTO streamers (id, discord_id, display_name, email, overlay_token)
			VALUES ($1, $2, $3, $4, $5)
		`
		_, insertErr := dbPool.Exec(ctx, insertQuery, streamerID, discordID, username, email, overlayToken)
		return streamerID, insertErr
	}

	return "", err
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
