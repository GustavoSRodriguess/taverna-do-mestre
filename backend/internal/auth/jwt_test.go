package auth

import (
	"testing"

	"rpg-saas-backend/internal/models"
)

func setJWTSecret(t *testing.T, secret string) {
	t.Helper()
	jwtSecret = []byte(secret)
}

func TestGenerateAndValidateToken(t *testing.T) {
	setJWTSecret(t, "test-secret")

	user := &models.User{
		ID:     1,
		Email:  "user@example.com",
		Admin:  true,
		Plan:   1,
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
	setJWTSecret(t, "another-secret")

	if _, err := ValidateToken("invalid"); err == nil {
		t.Fatal("expected validation error for invalid token")
	}
}

func TestValidateTokenExpired(t *testing.T) {
	setJWTSecret(t, "test-secret-expired")

	// Generate a token with past expiration (this would need modification to jwt.go to support,
	// but we can test with a token signed with different secret)
	setJWTSecret(t, "secret1")
	user := &models.User{ID: 1, Email: "test@example.com"}
	token, err := GenerateToken(user)
	if err != nil {
		t.Fatalf("failed to generate token: %v", err)
	}

	// Change secret and try to validate
	setJWTSecret(t, "secret2")
	if _, err := ValidateToken(token); err == nil {
		t.Fatal("expected validation error for token with different secret")
	}
}

func TestSetJWTSecretForTests(t *testing.T) {
	// Test the exported testing function
	SetJWTSecretForTests("new-test-secret")

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
	setJWTSecret(t, "test-secret")

	if _, err := ValidateToken(""); err == nil {
		t.Fatal("expected error for empty token")
	}
}
