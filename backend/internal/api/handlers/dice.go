package handlers

import (
	"crypto/rand"
	"encoding/json"
	"fmt"
	"math/big"
	"net/http"
	"regexp"
	"strconv"
	"time"

	"rpg-saas-backend/internal/models"
)

// DiceHandler gerencia operações de rolagem de dados
type DiceHandler struct{}

// NewDiceHandler cria um novo handler de dados
func NewDiceHandler() *DiceHandler {
	return &DiceHandler{}
}

// parseDiceNotation faz o parse da notação de dados (ex: "2d6+3", "1d20", "3d8-2")
func parseDiceNotation(notation string) (*models.ParsedDice, error) {
	// Regex para capturar XdY+Z ou XdY-Z ou XdY
	// Exemplos: 2d6, 1d20+5, 3d8-2
	re := regexp.MustCompile(`^(\d+)d(\d+)([+-]\d+)?$`)
	matches := re.FindStringSubmatch(notation)

	if len(matches) < 3 {
		return nil, fmt.Errorf("notação inválida: %s (use o formato XdY ou XdY+Z)", notation)
	}

	quantity, err := strconv.Atoi(matches[1])
	if err != nil || quantity < 1 || quantity > 100 {
		return nil, fmt.Errorf("quantidade de dados inválida (1-100)")
	}

	sides, err := strconv.Atoi(matches[2])
	if err != nil || sides < 2 || sides > 100 {
		return nil, fmt.Errorf("número de lados inválido (2-100)")
	}

	modifier := 0
	if len(matches) > 3 && matches[3] != "" {
		modifier, err = strconv.Atoi(matches[3])
		if err != nil {
			return nil, fmt.Errorf("modificador inválido")
		}
	}

	return &models.ParsedDice{
		Quantity: quantity,
		Sides:    sides,
		Modifier: modifier,
	}, nil
}

// rollDice rola os dados e retorna os resultados individuais e o total
func rollDice(quantity, sides, modifier int) ([]int, int, error) {
	rolls := make([]int, quantity)
	total := modifier

	for i := 0; i < quantity; i++ {
		// Usar crypto/rand para aleatoriedade mais segura
		n, err := rand.Int(rand.Reader, big.NewInt(int64(sides)))
		if err != nil {
			return nil, 0, fmt.Errorf("erro ao gerar número aleatório: %w", err)
		}
		roll := int(n.Int64()) + 1 // +1 porque rand retorna 0 a sides-1
		rolls[i] = roll
		total += roll
	}

	return rolls, total, nil
}

// RollDice rola dados baseado na notação fornecida
func (h *DiceHandler) RollDice(w http.ResponseWriter, r *http.Request) {
	var req models.DiceRollRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error": "Requisição inválida"}`, http.StatusBadRequest)
		return
	}

	// Validar vantagem/desvantagem
	if req.Advantage && req.Disadvantage {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Não é possível rolar com vantagem e desvantagem ao mesmo tempo"})
		return
	}

	// Parse da notação
	parsed, err := parseDiceNotation(req.Notation)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	var rolls []int
	var total int
	var droppedRolls []int

	// Se for vantagem ou desvantagem e for 1d20, rolar 2d20
	if (req.Advantage || req.Disadvantage) && parsed.Quantity == 1 && parsed.Sides == 20 {
		// Rolar 2d20
		allRolls, _, err := rollDice(2, parsed.Sides, 0)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Erro ao rolar dados: " + err.Error()})
			return
		}

		if req.Advantage {
			// Vantagem: pegar o maior
			if allRolls[0] > allRolls[1] {
				rolls = []int{allRolls[0]}
				droppedRolls = []int{allRolls[1]}
			} else {
				rolls = []int{allRolls[1]}
				droppedRolls = []int{allRolls[0]}
			}
		} else {
			// Desvantagem: pegar o menor
			if allRolls[0] < allRolls[1] {
				rolls = []int{allRolls[0]}
				droppedRolls = []int{allRolls[1]}
			} else {
				rolls = []int{allRolls[1]}
				droppedRolls = []int{allRolls[0]}
			}
		}
		total = rolls[0] + parsed.Modifier
	} else {
		// Rolagem normal
		rolls, total, err = rollDice(parsed.Quantity, parsed.Sides, parsed.Modifier)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Erro ao rolar dados: " + err.Error()})
			return
		}
	}

	// Preparar resposta
	response := models.DiceRollResponse{
		Notation:     req.Notation,
		Quantity:     parsed.Quantity,
		Sides:        parsed.Sides,
		Modifier:     parsed.Modifier,
		Rolls:        rolls,
		Total:        total,
		Timestamp:    time.Now(),
		Label:        req.Label,
		Advantage:    req.Advantage,
		Disadvantage: req.Disadvantage,
		DroppedRolls: droppedRolls,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// RollMultiple permite rolar múltiplas notações de dados de uma vez
func (h *DiceHandler) RollMultiple(w http.ResponseWriter, r *http.Request) {
	var requests []models.DiceRollRequest
	if err := json.NewDecoder(r.Body).Decode(&requests); err != nil {
		http.Error(w, `{"error": "Requisição inválida"}`, http.StatusBadRequest)
		return
	}

	if len(requests) == 0 || len(requests) > 20 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Número de rolagens deve estar entre 1 e 20"})
		return
	}

	responses := make([]models.DiceRollResponse, 0, len(requests))

	for _, req := range requests {
		// Parse da notação
		parsed, err := parseDiceNotation(req.Notation)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{
				"error": fmt.Sprintf("Erro na notação '%s': %s", req.Notation, err.Error()),
			})
			return
		}

		// Rolar os dados
		rolls, total, err := rollDice(parsed.Quantity, parsed.Sides, parsed.Modifier)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Erro ao rolar dados: " + err.Error()})
			return
		}

		// Adicionar à lista de respostas
		response := models.DiceRollResponse{
			Notation:  req.Notation,
			Quantity:  parsed.Quantity,
			Sides:     parsed.Sides,
			Modifier:  parsed.Modifier,
			Rolls:     rolls,
			Total:     total,
			Timestamp: time.Now(),
			Label:     req.Label,
		}
		responses = append(responses, response)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(responses)
}
