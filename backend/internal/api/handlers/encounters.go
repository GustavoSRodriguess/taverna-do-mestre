// internal/api/handlers/encounters.go
package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	
	"github.com/go-chi/chi/v5"
	
	"rpg-saas-backend/internal/db"
	"rpg-saas-backend/internal/models"
	"rpg-saas-backend/internal/python"
)

// EncounterHandler contém os handlers relacionados aos encontros
type EncounterHandler struct {
	DB     *db.PostgresDB
	Python *python.Client
}

// NewEncounterHandler cria um novo handler de encontros
func NewEncounterHandler(db *db.PostgresDB, python *python.Client) *EncounterHandler {
	return &EncounterHandler{
		DB:     db,
		Python: python,
	}
}

// GetEncounters retorna uma lista paginada de encontros
func (h *EncounterHandler) GetEncounters(w http.ResponseWriter, r *http.Request) {
	// Obter parâmetros de paginação
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	
	// Valores padrão
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}
	
	// Buscar encontros do banco
	encounters, err := h.DB.GetEncounters(r.Context(), limit, offset)
	if err != nil {
		http.Error(w, "Failed to fetch encounters: "+err.Error(), http.StatusInternalServerError)
		return
	}
	
	// Responder com JSON
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"encounters": encounters,
		"limit":      limit,
		"offset":     offset,
		"count":      len(encounters),
	})
}

// GetEncounterByID retorna um encontro específico pelo ID
func (h *EncounterHandler) GetEncounterByID(w http.ResponseWriter, r *http.Request) {
	// Obter ID da URL
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}
	
	// Buscar encontro do banco
	encounter, err := h.DB.GetEncounterByID(r.Context(), id)
	if err != nil {
		http.Error(w, "Encounter not found", http.StatusNotFound)
		return
	}
	
	// Responder com JSON
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(encounter)
}

// CreateEncounter cria um novo encontro
func (h *EncounterHandler) CreateEncounter(w http.ResponseWriter, r *http.Request) {
	var encounter models.Encounter
	
	// Decodificar corpo da requisição
	err := json.NewDecoder(r.Body).Decode(&encounter)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	
	// Criar encontro no banco
	err = h.DB.CreateEncounter(r.Context(), &encounter)
	if err != nil {
		http.Error(w, "Failed to create encounter: "+err.Error(), http.StatusInternalServerError)
		return
	}
	
	// Responder com JSON
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(encounter)
}

// GenerateRandomEncounter gera um encontro aleatório usando o serviço Python
func (h *EncounterHandler) GenerateRandomEncounter(w http.ResponseWriter, r *http.Request) {
	var request struct {
		PlayerLevel int    `json:"player_level"`
		PlayerCount int    `json:"player_count"`
		Difficulty  string `json:"difficulty"`
	}
	
	// Decodificar corpo da requisição
	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		// Se não houver corpo, usar valores padrão
		request.PlayerLevel = 1
		request.PlayerCount = 4
		request.Difficulty = "m"
	}
	
	// Validar nível dos jogadores
	if request.PlayerLevel < 1 || request.PlayerLevel > 20 {
		http.Error(w, "Player level must be between 1 and 20", http.StatusBadRequest)
		return
	}
	
	// Validar quantidade de jogadores
	if request.PlayerCount < 1 {
		http.Error(w, "Player count must be at least 1", http.StatusBadRequest)
		return
	}
	
	// Validar dificuldade
	if request.Difficulty == "" {
		request.Difficulty = "m"
	}
	if request.Difficulty != "f" && request.Difficulty != "m" && request.Difficulty != "d" && request.Difficulty != "mo" {
		http.Error(w, "Invalid difficulty. Must be 'f', 'm', 'd', or 'mo'", http.StatusBadRequest)
		return
	}
	
	// Gerar encontro usando o serviço Python
	encounter, err := h.Python.GenerateEncounter(r.Context(), request.PlayerLevel, request.PlayerCount, request.Difficulty)
	if err != nil {
		http.Error(w, "Failed to generate encounter: "+err.Error(), http.StatusInternalServerError)
		return
	}
	
	// Salvar o encontro gerado no banco
	err = h.DB.CreateEncounter(r.Context(), encounter)
	if err != nil {
		http.Error(w, "Failed to save generated encounter: "+err.Error(), http.StatusInternalServerError)
		return
	}
	
	// Responder com JSON
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(encounter)
}