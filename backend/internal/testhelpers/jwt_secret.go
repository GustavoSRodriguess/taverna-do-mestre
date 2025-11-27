package testhelpers

import (
	"crypto/rand"
	"encoding/hex"
	"testing"

	"rpg-saas-backend/internal/auth"
)

// SetRandomJWTSecret configures a fresh random JWT secret for tests to avoid hard-coded values.
func SetRandomJWTSecret(t testing.TB) string {
	t.Helper()

	secretBytes := make([]byte, 32)
	if _, err := rand.Read(secretBytes); err != nil {
		t.Fatalf("failed to generate random JWT secret: %v", err)
	}

	secret := hex.EncodeToString(secretBytes)
	auth.SetJWTSecretForTests(secret)

	return secret
}
