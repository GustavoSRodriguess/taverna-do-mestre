// internal/utils/invite_code.go
package utils

import (
	"crypto/rand"
	"math/big"
	"strings"
)

const (
	codeLength = 8
	charset    = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
)

// GenerateInviteCode gera um código de convite único
func GenerateInviteCode() (string, error) {
	code := make([]byte, codeLength)

	for i := range code {
		num, err := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		if err != nil {
			return "", err
		}
		code[i] = charset[num.Int64()]
	}

	// Formata o código como XXXX-XXXX para melhor legibilidade
	result := string(code)
	return result[:4] + "-" + result[4:], nil
}

// ValidateInviteCode valida o formato do código de convite
func ValidateInviteCode(code string) bool {
	// Remove espaços e converte para maiúsculo
	code = strings.ToUpper(strings.TrimSpace(code))

	// Remove hífens para validação
	code = strings.ReplaceAll(code, "-", "")

	// Verifica se tem o tamanho correto
	if len(code) != codeLength {
		return false
	}

	// Verifica se contém apenas caracteres válidos
	for _, char := range code {
		if !strings.ContainsRune(charset, char) {
			return false
		}
	}

	return true
}

// NormalizeInviteCode normaliza o código removendo hífens e espaços
func NormalizeInviteCode(code string) string {
	code = strings.ToUpper(strings.TrimSpace(code))
	return strings.ReplaceAll(code, "-", "")
}
