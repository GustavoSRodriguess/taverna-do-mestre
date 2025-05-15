package middleware

import (
	"context"
	"net/http"
	"strings"

	"rpg-saas-backend/internal/auth"
)

// ContextKey é um tipo usado para chaves de contexto para evitar colisões.
type ContextKey string

// UserIDKey é a chave para armazenar o ID do usuário no contexto da requisição.
const UserIDKey ContextKey = "userID"

// AuthMiddleware é um middleware para verificar a validade do token JWT.
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Token de autorização não fornecido", http.StatusUnauthorized)
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			http.Error(w, "Token de autorização mal formatado", http.StatusUnauthorized)
			return
		}

		tokenString := parts[1]
		claims, err := auth.ValidateToken(tokenString)
		if err != nil {
			http.Error(w, "Token inválido ou expirado: "+err.Error(), http.StatusUnauthorized)
			return
		}

		// Adicionar o UserID (e outros claims se necessário) ao contexto da requisição
		ctx := context.WithValue(r.Context(), UserIDKey, claims.UserID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
