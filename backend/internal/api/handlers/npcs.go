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

type NPCHandler struct {
	DB     *db.PostgresDB
	Python *python.Client
}

func NewNPCHandler(db *db.PostgresDB, python *python.Client) *NPCHandler {
	return &NPCHandler{
		DB:     db,
		Python: python,
	}
}

func (h *NPCHandler) GetNPCs(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}

	npcs, err := h.DB.GetNPCs(r.Context(), limit, offset)
	if err != nil {
		http.Error(w, "Failed to fetch NPCs: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"npcs":   npcs,
		"limit":  limit,
		"offset": offset,
		"count":  len(npcs),
	})
}

func (h *NPCHandler) GetNPCByID(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	npc, err := h.DB.GetNPCByID(r.Context(), id)
	if err != nil {
		http.Error(w, "NPC not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(npc)
}

func (h *NPCHandler) CreateNPC(w http.ResponseWriter, r *http.Request) {
	var npc models.NPC

	err := json.NewDecoder(r.Body).Decode(&npc)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	err = h.DB.CreateNPC(r.Context(), &npc)
	if err != nil {
		http.Error(w, "Failed to create NPC: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(npc)
}

func (h *NPCHandler) UpdateNPC(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	var npc models.NPC

	err = json.NewDecoder(r.Body).Decode(&npc)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	npc.ID = id

	err = h.DB.UpdateNPC(r.Context(), &npc)
	if err != nil {
		http.Error(w, "Failed to update NPC: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(npc)
}

func (h *NPCHandler) DeleteNPC(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	err = h.DB.DeleteNPC(r.Context(), id)
	if err != nil {
		http.Error(w, "Failed to delete NPC: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// GenerateRandomNPC handles requests for generating NPCs, both random and manual.
func (h *NPCHandler) GenerateRandomNPC(w http.ResponseWriter, r *http.Request) {
	var request struct {
		Level            int    `json:"level"`
		AttributesMethod string `json:"attributes_method,omitempty"`
		Manual           bool   `json:"manual"`
		Race             string `json:"race,omitempty"`
		Class            string `json:"class,omitempty"`      // Frontend sends 'class', ensure this matches
		Background       string `json:"background,omitempty"` // Frontend sends 'background'
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Invalid request body: "+err.Error(), http.StatusBadRequest)
		return
	}

	if request.Level < 1 || request.Level > 20 {
		http.Error(w, "Level must be between 1 and 20", http.StatusBadRequest)
		return
	}

	// Default attributes_method if not manual and not provided
	if !request.Manual && request.AttributesMethod == "" {
		request.AttributesMethod = "rolagem"
	}

	// Validate attributes_method only if not manual or if provided
	if !request.Manual || request.AttributesMethod != "" {
		if request.AttributesMethod != "rolagem" && request.AttributesMethod != "array" && request.AttributesMethod != "compra" {
			http.Error(w, "Invalid attributes_method. Must be 'rolagem', 'array', or 'compra'", http.StatusBadRequest)
			return
		}
	}

	// If manual, ensure race, class, and background are provided (or handle defaults in Python service)
	if request.Manual {
		if request.Race == "" || request.Class == "" || request.Background == "" {
			// Consider if these should be strictly required or if Python service can handle defaults
			// For now, let it pass, Python service might have defaults.
		}
		// For manual generation, attributes_method might be implicitly handled by Python or could be required.
		// If Python service needs it for manual, ensure it's passed or defaulted.
		// Current frontend sends it for PCs (manual=true).
	}

	npc, err := h.Python.GenerateNPC(r.Context(), request.Level, request.AttributesMethod, request.Manual, request.Race, request.Class, request.Background)
	if err != nil {
		http.Error(w, "Failed to generate NPC: "+err.Error(), http.StatusInternalServerError)
		return
	}

	err = h.DB.CreateNPC(r.Context(), npc) // Assuming npc is of type *models.NPC
	if err != nil {
		http.Error(w, "Failed to save generated NPC: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(npc)
}
