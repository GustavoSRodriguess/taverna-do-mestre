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

type EncounterHandler struct {
	DB     *db.PostgresDB
	Python *python.Client
}

func NewEncounterHandler(db *db.PostgresDB, python *python.Client) *EncounterHandler {
	return &EncounterHandler{
		DB:     db,
		Python: python,
	}
}

func (h *EncounterHandler) GetEncounters(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}

	encounters, err := h.DB.GetEncounters(r.Context(), limit, offset)
	if err != nil {
		http.Error(w, "Failed to fetch encounters: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"encounters": encounters,
		"limit":      limit,
		"offset":     offset,
		"count":      len(encounters),
	})
}

func (h *EncounterHandler) GetEncounterByID(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	encounter, err := h.DB.GetEncounterByID(r.Context(), id)
	if err != nil {
		http.Error(w, "Encounter not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(encounter)
}

func (h *EncounterHandler) CreateEncounter(w http.ResponseWriter, r *http.Request) {
	var encounter models.Encounter

	err := json.NewDecoder(r.Body).Decode(&encounter)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	err = h.DB.CreateEncounter(r.Context(), &encounter)
	if err != nil {
		http.Error(w, "Failed to create encounter: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(encounter)
}

func (h *EncounterHandler) GenerateRandomEncounter(w http.ResponseWriter, r *http.Request) {
	var request struct {
		PlayerLevel int    `json:"player_level"`
		PlayerCount int    `json:"player_count"`
		Difficulty  string `json:"difficulty"`
	}

	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		request.PlayerLevel = 1
		request.PlayerCount = 4
		request.Difficulty = "m"
	}

	if request.PlayerLevel < 1 || request.PlayerLevel > 20 {
		http.Error(w, "Player level must be between 1 and 20", http.StatusBadRequest)
		return
	}

	if request.PlayerCount < 1 {
		http.Error(w, "Player count must be at least 1", http.StatusBadRequest)
		return
	}

	if request.Difficulty == "" {
		request.Difficulty = "m"
	}
	if request.Difficulty != "f" && request.Difficulty != "m" && request.Difficulty != "d" && request.Difficulty != "mo" {
		http.Error(w, "Invalid difficulty. Must be 'f', 'm', 'd', or 'mo'", http.StatusBadRequest)
		return
	}

	encounter, err := h.Python.GenerateEncounter(r.Context(), request.PlayerLevel, request.PlayerCount, request.Difficulty)
	if err != nil {
		http.Error(w, "Failed to generate encounter: "+err.Error(), http.StatusInternalServerError)
		return
	}

	err = h.DB.CreateEncounter(r.Context(), encounter)
	if err != nil {
		http.Error(w, "Failed to save generated encounter: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(encounter)
}
