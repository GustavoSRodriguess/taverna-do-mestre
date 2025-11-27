package auth

import (
	"crypto/rand"
	"encoding/hex"
	"testing"

	"rpg-saas-backend/internal/models"
)

func randomSecret(t *testing.T) string {
	t.Helper()
	buf := make([]byte, 32)
	if _, err := rand.Read(buf); err != nil {
		t.Fatalf("failed to generate random secret: %v", err)
	}
	return hex.EncodeToString(buf)
}

func setJWTSecret(t *testing.T, secret string) {
	t.Helper()
	jwtSecret = []byte(secret)
}

func TestGenerateAndValidateToken(t *testing.T) {
	setJWTSecret(t, randomSecret(t))

	user := &models.User{
		ID:    1,
		Email: "user@example.com",
		Admin: true,
		Plan:  1,
	}

	token, err := GenerateToken(user)
	if err != nil {
		t.Fatalf("failed to generate token: %v", err)
	}

	claims, err := ValidateToken(token)
	if err != nil {
		t.Fatalf("failed to validate token: %v", err)
	}

	if claims.UserID != user.ID || claims.Email != user.Email || !claims.Admin {
		t.Fatalf("unexpected claims: %+v", claims)
	}
}

func TestGenerateTokenMissingSecret(t *testing.T) {
	setJWTSecret(t, "")

	if _, err := GenerateToken(&models.User{}); err == nil {
		t.Fatal("expected error when secret is missing")
	}
}

func TestValidateTokenInvalid(t *testing.T) {
	setJWTSecret(t, randomSecret(t))

	if _, err := ValidateToken("invalid"); err == nil {
		t.Fatal("expected validation error for invalid token")
	}
}

func TestValidateTokenExpired(t *testing.T) {
	secret1 := randomSecret(t)
	setJWTSecret(t, secret1)
	user := &models.User{ID: 1, Email: "test@example.com"}
	token, err := GenerateToken(user)
	if err != nil {
		t.Fatalf("failed to generate token: %v", err)
	}

	// Change secret and try to validate
	secret2 := randomSecret(t)
	if secret2 == secret1 {
		secret2 = randomSecret(t)
	}
	setJWTSecret(t, secret2)
	if _, err := ValidateToken(token); err == nil {
		t.Fatal("expected validation error for token with different secret")
	}
}

func TestSetJWTSecretForTests(t *testing.T) {
	// Test the exported testing function
	secret := randomSecret(t)
	SetJWTSecretForTests(secret)

	user := &models.User{ID: 99, Email: "exported@example.com", Admin: false, Plan: 2}
	token, err := GenerateToken(user)
	if err != nil {
		t.Fatalf("failed to generate token: %v", err)
	}

	claims, err := ValidateToken(token)
	if err != nil {
		t.Fatalf("failed to validate token: %v", err)
	}

	if claims.UserID != 99 || claims.Email != "exported@example.com" {
		t.Fatalf("unexpected claims after SetJWTSecretForTests: %+v", claims)
	}
}

func TestValidateTokenMissingSecret(t *testing.T) {
	setJWTSecret(t, "")

	if _, err := ValidateToken("any-token"); err == nil {
		t.Fatal("expected error when validating with empty secret")
	}
}

func TestValidateTokenEmpty(t *testing.T) {
	setJWTSecret(t, randomSecret(t))

	if _, err := ValidateToken(""); err == nil {
		t.Fatal("expected error for empty token")
	}
}
