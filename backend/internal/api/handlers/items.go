package handlers

import (
	"encoding/json"
	"net/http"

	"rpg-saas-backend/internal/db"
	"rpg-saas-backend/internal/models"
	"rpg-saas-backend/internal/python"
	"rpg-saas-backend/internal/utils"
)

type ItemHandler struct {
	DB        *db.PostgresDB
	Python    *python.Client
	Response  *utils.ResponseHandler
	Validator *utils.Validator
}

func NewItemHandler(db *db.PostgresDB, python *python.Client) *ItemHandler {
	return &ItemHandler{
		DB:        db,
		Python:    python,
		Response:  utils.NewResponseHandler(),
		Validator: utils.NewValidator(),
	}
}

func (h *ItemHandler) GetTreasures(w http.ResponseWriter, r *http.Request) {
	// Extract pagination using utility
	pagination := utils.ExtractPagination(r, 20)

	treasures, err := h.DB.GetTreasures(r.Context(), pagination.Limit, pagination.Offset)
	if err != nil {
		h.Response.HandleDBError(w, err, "fetch treasures")
		return
	}

	// Send paginated response using utility
	h.Response.SendPaginated(w, map[string]any{"treasures": treasures}, pagination, len(treasures), nil)
}

func (h *ItemHandler) GetTreasureByID(w http.ResponseWriter, r *http.Request) {
	// Extract ID using utility
	id, err := utils.ExtractID(r)
	if err != nil {
		h.Response.SendBadRequest(w, err.Error())
		return
	}

	treasure, err := h.DB.GetTreasureByID(r.Context(), id)
	if err != nil {
		h.Response.HandleDBError(w, err, "fetch treasure")
		return
	}

	h.Response.SendJSON(w, treasure, http.StatusOK)
}

func (h *ItemHandler) CreateTreasure(w http.ResponseWriter, r *http.Request) {
	var treasure models.Treasure

	err := json.NewDecoder(r.Body).Decode(&treasure)
	if err != nil {
		h.Response.SendBadRequest(w, "Invalid request body")
		return
	}

	err = h.DB.CreateTreasure(r.Context(), &treasure)
	if err != nil {
		h.Response.HandleDBError(w, err, "create treasure")
		return
	}

	h.Response.SendCreated(w, "Treasure created successfully", treasure)
}

func (h *ItemHandler) GenerateRandomTreasure(w http.ResponseWriter, r *http.Request) {
	var request models.TreasureRequest

	// Primeiro tenta decodificar o request
	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		// Se houver erro na decodificação, usa valores padrão
		request = models.TreasureRequest{
			Level:               1,
			CoinType:            "standard",
			ValuableType:        "standard",
			ItemType:            "standard",
			MoreRandomCoins:     false,
			Trade:               "none",
			Gems:                true,
			ArtObjects:          true,
			MagicItems:          true,
			PsionicItems:        false,
			ChaositechItems:     false,
			MagicItemCategories: []string{"armor", "weapons", "potions", "rings", "rods", "scrolls", "staves", "wands", "wondrous"},
			Ranks:               []string{"minor", "medium", "major"},
			MaxValue:            0,
			CombineHoards:       false,
			Quantity:            1,
		}
	}

	// Validate using centralized validator
	validationErrors := h.Validator.BatchValidate(
		func() error { return h.Validator.ValidateLevel(request.Level) },
		func() error { return h.Validator.ValidatePositive(request.Quantity, "quantity") },
	)

	if validationErrors.HasErrors() {
		h.Response.SendValidationError(w, validationErrors.Error())
		return
	}

	if request.Quantity < 1 {
		request.Quantity = 1
	}

	// Se não foram especificadas categorias e magic_items está true, usar todas
	if request.MagicItems && len(request.MagicItemCategories) == 0 {
		request.MagicItemCategories = []string{"armor", "weapons", "potions", "rings", "rods", "scrolls", "staves", "wands", "wondrous"}
	}

	// Se não foram especificados ranks, usar todos
	if len(request.Ranks) == 0 {
		request.Ranks = []string{"minor", "medium", "major"}
	}

	treasure, err := h.Python.GenerateTreasure(r.Context(), request)
	if err != nil {
		h.Response.SendInternalError(w, "Failed to generate treasure: "+err.Error())
		return
	}

	err = h.DB.CreateTreasure(r.Context(), treasure)
	if err != nil {
		h.Response.HandleDBError(w, err, "save generated treasure")
		return
	}

	h.Response.SendCreated(w, "Treasure generated and saved successfully", treasure)
}

func (h *ItemHandler) DeleteTreasure(w http.ResponseWriter, r *http.Request) {
	// Extract ID using utility
	id, err := utils.ExtractID(r)
	if err != nil {
		h.Response.SendBadRequest(w, err.Error())
		return
	}

	err = h.DB.DeleteTreasure(r.Context(), id)
	if err != nil {
		h.Response.HandleDBError(w, err, "delete treasure")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
