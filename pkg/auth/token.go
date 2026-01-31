package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"time"
)

const (
	// Token durations
	MagicLinkDuration       = 15 * time.Minute
	InviteRecruiterDuration = 7 * 24 * time.Hour  // 7 days
	InviteCandidateDuration = 14 * 24 * time.Hour // 14 days
	SessionDuration         = 30 * 24 * time.Hour // 30 days

	// Cookie settings
	SessionCookieName = "baara_session"
)

// GenerateToken creates a cryptographically secure random token
// Returns the raw token (to send to user) and its SHA256 hash (to store in DB)
func GenerateToken() (token string, hash string, err error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", "", err
	}
	token = base64.URLEncoding.EncodeToString(bytes)
	hash = HashToken(token)
	return token, hash, nil
}

// HashToken returns the SHA256 hex hash of a token
func HashToken(token string) string {
	h := sha256.Sum256([]byte(token))
	return hex.EncodeToString(h[:])
}

// GenerateSlug creates a URL-safe slug from a string
func GenerateSlug(s string) string {
	bytes := make([]byte, 4)
	if _, err := rand.Read(bytes); err != nil {
		return ""
	}
	suffix := hex.EncodeToString(bytes)
	return suffix
}
