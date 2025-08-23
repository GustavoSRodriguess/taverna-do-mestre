package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"

	"rpg-saas-backend/internal/db"
	"rpg-saas-backend/internal/models"
	"rpg-saas-backend/internal/python"
	"rpg-saas-backend/internal/utils"
)

type NPCHandler struct {
	DB        *db.PostgresDB
	Python    *python.Client
	Response  *utils.ResponseHandler
	Validator *utils.Validator
}

func NewNPCHandler(db *db.PostgresDB, python *python.Client) *NPCHandler {
	return &NPCHandler{
		DB:        db,
		Python:    python,
		Response:  utils.NewResponseHandler(),
		Validator: utils.NewValidator(),
	}
}

func (h *NPCHandler) GetNPCs(w http.ResponseWriter, r *http.Request) {
	// Extract pagination using utility
	pagination := utils.ExtractPagination(r, 20)

	npcs, err := h.DB.GetNPCs(r.Context(), pagination.Limit, pagination.Offset)
	if err != nil {
		h.Response.HandleDBError(w, err, "fetch NPCs")
		return
	}

	// Send paginated response using utility
	h.Response.SendPaginated(w, map[string]any{"npcs": npcs}, pagination, len(npcs), nil)
}

func (h *NPCHandler) GetNPCByID(w http.ResponseWriter, r *http.Request) {
	// Extract ID using utility
	id, err := utils.ExtractID(r)
	if err != nil {
		h.Response.SendBadRequest(w, err.Error())
		return
	}

	npc, err := h.DB.GetNPCByID(r.Context(), id)
	if err != nil {
		h.Response.HandleDBError(w, err, "fetch NPC")
		return
	}

	h.Response.SendJSON(w, npc, http.StatusOK)
}

func (h *NPCHandler) CreateNPC(w http.ResponseWriter, r *http.Request) {
	var npc models.NPC

	err := json.NewDecoder(r.Body).Decode(&npc)
	if err != nil {
		h.Response.SendBadRequest(w, "Invalid request body")
		return
	}

	// Validate using centralized validator
	validationErrors := h.Validator.BatchValidate(
		func() error { return h.Validator.ValidateName(npc.Name, "name") },
		func() error { return h.Validator.ValidateLevel(npc.Level) },
	)

	if validationErrors.HasErrors() {
		h.Response.SendValidationError(w, validationErrors.Error())
		return
	}

	err = h.DB.CreateNPC(r.Context(), &npc)
	if err != nil {
		h.Response.HandleDBError(w, err, "create NPC")
		return
	}

	h.Response.SendCreated(w, "NPC created successfully", npc)
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
		h.Response.SendBadRequest(w, "Invalid request body: "+err.Error())
		return
	}

	// Default attributes_method if not manual and not provided
	if !request.Manual && request.AttributesMethod == "" {
		request.AttributesMethod = "rolagem"
	}

	// Validate using centralized validator
	validationErrors := h.Validator.BatchValidate(
		func() error { return h.Validator.ValidateLevel(request.Level) },
		func() error {
			if !request.Manual || request.AttributesMethod != "" {
				return h.Validator.ValidateAttributeMethod(request.AttributesMethod)
			}
			return nil
		},
	)

	if validationErrors.HasErrors() {
		h.Response.SendValidationError(w, validationErrors.Error())
		return
	}

	npc, err := h.Python.GenerateNPC(r.Context(), request.Level, request.AttributesMethod, request.Manual, request.Race, request.Class, request.Background)
	if err != nil {
		h.Response.SendInternalError(w, "Failed to generate NPC: "+err.Error())
		return
	}

	err = h.DB.CreateNPC(r.Context(), npc) // Assuming npc is of type *models.NPC
	if err != nil {
		h.Response.HandleDBError(w, err, "save generated NPC")
		return
	}

	h.Response.SendCreated(w, "NPC generated and saved successfully", npc)
}
