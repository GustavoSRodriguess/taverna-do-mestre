package auth

import (
	"fmt"
	"os"
	"time"

	"rpg-saas-backend/internal/models"

	"github.com/golang-jwt/jwt/v5"
)

var jwtSecret = []byte(os.Getenv("JWT_SECRET"))

const tokenExpirationHours = 24 // O token expira em 24 horas

// Claims define a estrutura do payload do JWT
type Claims struct {
	UserID int    `json:"user_id"`
	Email  string `json:"email"`
	Admin  bool   `json:"admin"`
	jwt.RegisteredClaims
}

// GenerateToken gera um novo token JWT para um usuário
func GenerateToken(user *models.User) (string, error) {
	if len(jwtSecret) == 0 {
		return "", fmt.Errorf("JWT_SECRET não configurada nas variáveis de ambiente")
	}

	expirationTime := time.Now().Add(tokenExpirationHours * time.Hour)

	claims := &Claims{
		UserID: user.ID,
		Email:  user.Email,
		Admin:  user.Admin,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "taverna-do-mestre", // Emissor do token
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		return "", fmt.Errorf("erro ao assinar o token: %w", err)
	}

	return tokenString, nil
}

// ValidateToken valida um token JWT e retorna os claims se o token for válido
func ValidateToken(tokenString string) (*Claims, error) {
	if len(jwtSecret) == 0 {
		return nil, fmt.Errorf("JWT_SECRET não configurada nas variáveis de ambiente")
	}

	claims := &Claims{}

	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("método de assinatura inesperado: %v", token.Header["alg"])
		}
		return jwtSecret, nil
	})

	if err != nil {
		return nil, fmt.Errorf("erro ao fazer parse do token: %w", err)
	}

	if !token.Valid {
		return nil, fmt.Errorf("token inválido")
	}

	return claims, nil
}
