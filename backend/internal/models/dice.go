package models

import "time"

// DiceRollRequest representa uma requisição de rolagem de dados
type DiceRollRequest struct {
	Notation   string `json:"notation" binding:"required"` // "2d6+3", "1d20", etc
	Label      string `json:"label,omitempty"`             // Descrição opcional da rolagem
	Advantage  bool   `json:"advantage,omitempty"`         // Rolar com vantagem (2d20, pegar maior)
	Disadvantage bool `json:"disadvantage,omitempty"`      // Rolar com desvantagem (2d20, pegar menor)
}

// DiceRollResponse representa o resultado de uma rolagem de dados
type DiceRollResponse struct {
	Notation     string    `json:"notation"`            // Notação original
	Quantity     int       `json:"quantity"`            // Quantidade de dados
	Sides        int       `json:"sides"`               // Número de lados do dado
	Modifier     int       `json:"modifier"`            // Modificador (+/-)
	Rolls        []int     `json:"rolls"`               // Resultado de cada dado individual
	Total        int       `json:"total"`               // Total da rolagem (soma + modificador)
	Timestamp    time.Time `json:"timestamp"`           // Quando foi rolado
	Label        string    `json:"label,omitempty"`     // Label opcional
	Advantage    bool      `json:"advantage,omitempty"` // Se foi rolado com vantagem
	Disadvantage bool      `json:"disadvantage,omitempty"` // Se foi rolado com desvantagem
	DroppedRolls []int     `json:"dropped_rolls,omitempty"` // Dados descartados (vantagem/desvantagem)
}

// ParsedDice representa a notação de dados parseada
type ParsedDice struct {
	Quantity int // Quantidade de dados
	Sides    int // Lados do dado
	Modifier int // Modificador
}