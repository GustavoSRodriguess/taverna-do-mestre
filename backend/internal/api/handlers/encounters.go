package handlers

import (
	"encoding/json"
	"net/http"

	"rpg-saas-backend/internal/db"
	"rpg-saas-backend/internal/models"
	"rpg-saas-backend/internal/python"
	"rpg-saas-backend/internal/utils"
)

type EncounterHandler struct {
	DB        *db.PostgresDB
	Python    *python.Client
	Response  *utils.ResponseHandler
	Validator *utils.Validator
}

func NewEncounterHandler(db *db.PostgresDB, python *python.Client) *EncounterHandler {
	return &EncounterHandler{
		DB:        db,
		Python:    python,
		Response:  utils.NewResponseHandler(),
		Validator: utils.NewValidator(),
	}
}

func (h *EncounterHandler) GetEncounters(w http.ResponseWriter, r *http.Request) {
	// Extract pagination using utility
	pagination := utils.ExtractPagination(r, 20)

	encounters, err := h.DB.GetEncounters(r.Context(), pagination.Limit, pagination.Offset)
	if err != nil {
		h.Response.HandleDBError(w, err, "fetch encounters")
		return
	}

	// Send paginated response using utility
	h.Response.SendPaginated(w, map[string]any{"encounters": encounters}, pagination, len(encounters), nil)
}

func (h *EncounterHandler) GetEncounterByID(w http.ResponseWriter, r *http.Request) {
	// Extract ID using utility
	id, err := utils.ExtractID(r)
	if err != nil {
		h.Response.SendBadRequest(w, err.Error())
		return
	}

	encounter, err := h.DB.GetEncounterByID(r.Context(), id)
	if err != nil {
		h.Response.HandleDBError(w, err, "fetch encounter")
		return
	}

	h.Response.SendJSON(w, encounter, http.StatusOK)
}

func (h *EncounterHandler) CreateEncounter(w http.ResponseWriter, r *http.Request) {
	var encounter models.Encounter

	err := json.NewDecoder(r.Body).Decode(&encounter)
	if err != nil {
		h.Response.SendBadRequest(w, "Invalid request body")
		return
	}

	err = h.DB.CreateEncounter(r.Context(), &encounter)
	if err != nil {
		h.Response.HandleDBError(w, err, "create encounter")
		return
	}

	h.Response.SendCreated(w, "Encounter created successfully", encounter)
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

	// Set default difficulty if empty
	if request.Difficulty == "" {
		request.Difficulty = "m"
	}

	// Validate using centralized validator
	validationErrors := h.Validator.BatchValidate(
		func() error { return h.Validator.ValidateLevel(request.PlayerLevel) },
		func() error { return h.Validator.ValidatePlayerCount(request.PlayerCount) },
		func() error { return h.Validator.ValidateDifficulty(request.Difficulty) },
	)

	if validationErrors.HasErrors() {
		h.Response.SendValidationError(w, validationErrors.Error())
		return
	}

	encounter, err := h.Python.GenerateEncounter(r.Context(), request.PlayerLevel, request.PlayerCount, request.Difficulty)
	if err != nil {
		h.Response.SendInternalError(w, "Failed to generate encounter: "+err.Error())
		return
	}

	err = h.DB.CreateEncounter(r.Context(), encounter)
	if err != nil {
		h.Response.HandleDBError(w, err, "save generated encounter")
		return
	}

	h.Response.SendCreated(w, "Encounter generated and saved successfully", encounter)
}
