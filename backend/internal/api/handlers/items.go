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

type ItemHandler struct {
	DB     *db.PostgresDB
	Python *python.Client
}

func NewItemHandler(db *db.PostgresDB, python *python.Client) *ItemHandler {
	return &ItemHandler{
		DB:     db,
		Python: python,
	}
}

func (h *ItemHandler) GetTreasures(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}

	treasures, err := h.DB.GetTreasures(r.Context(), limit, offset)
	if err != nil {
		http.Error(w, "Failed to fetch treasures: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"treasures": treasures,
		"limit":     limit,
		"offset":    offset,
		"count":     len(treasures),
	})
}

func (h *ItemHandler) GetTreasureByID(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	treasure, err := h.DB.GetTreasureByID(r.Context(), id)
	if err != nil {
		http.Error(w, "Treasure not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(treasure)
}

func (h *ItemHandler) CreateTreasure(w http.ResponseWriter, r *http.Request) {
	var treasure models.Treasure

	err := json.NewDecoder(r.Body).Decode(&treasure)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	err = h.DB.CreateTreasure(r.Context(), &treasure)
	if err != nil {
		http.Error(w, "Failed to create treasure: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(treasure)
}

func (h *ItemHandler) GenerateRandomTreasure(w http.ResponseWriter, r *http.Request) {
	var request models.TreasureRequest

	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
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

	if request.Level < 1 || request.Level > 20 {
		http.Error(w, "Level must be between 1 and 20", http.StatusBadRequest)
		return
	}

	treasure, err := h.Python.GenerateTreasure(r.Context(), request)
	if err != nil {
		http.Error(w, "Failed to generate treasure: "+err.Error(), http.StatusInternalServerError)
		return
	}

	err = h.DB.CreateTreasure(r.Context(), treasure)
	if err != nil {
		http.Error(w, "Failed to save generated treasure: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(treasure)
}

func (h *ItemHandler) DeleteTreasure(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	err = h.DB.DeleteTreasure(r.Context(), id)
	if err != nil {
		http.Error(w, "Failed to delete treasure: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
