// internal/api/handlers/items.go
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

// ItemHandler contains the handlers related to items and treasure
type ItemHandler struct {
	DB     *db.PostgresDB
	Python *python.Client
}

// NewItemHandler creates a new item handler
func NewItemHandler(db *db.PostgresDB, python *python.Client) *ItemHandler {
	return &ItemHandler{
		DB:     db,
		Python: python,
	}
}

// GetTreasures returns a paginated list of treasures
func (h *ItemHandler) GetTreasures(w http.ResponseWriter, r *http.Request) {
	// Get pagination parameters
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	// Default values
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}

	// Fetch treasures from database
	treasures, err := h.DB.GetTreasures(r.Context(), limit, offset)
	if err != nil {
		http.Error(w, "Failed to fetch treasures: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Respond with JSON
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"treasures": treasures,
		"limit":     limit,
		"offset":    offset,
		"count":     len(treasures),
	})
}

// GetTreasureByID returns a specific treasure by ID
func (h *ItemHandler) GetTreasureByID(w http.ResponseWriter, r *http.Request) {
	// Get ID from URL
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	// Fetch treasure from database
	treasure, err := h.DB.GetTreasureByID(r.Context(), id)
	if err != nil {
		http.Error(w, "Treasure not found", http.StatusNotFound)
		return
	}

	// Respond with JSON
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(treasure)
}

// CreateTreasure creates a new treasure record
func (h *ItemHandler) CreateTreasure(w http.ResponseWriter, r *http.Request) {
	var treasure models.Treasure

	// Decode request body
	err := json.NewDecoder(r.Body).Decode(&treasure)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Create treasure in database
	err = h.DB.CreateTreasure(r.Context(), &treasure)
	if err != nil {
		http.Error(w, "Failed to create treasure: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Respond with JSON
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(treasure)
}

// GenerateRandomTreasure generates random treasure using the Python service
func (h *ItemHandler) GenerateRandomTreasure(w http.ResponseWriter, r *http.Request) {
	var request models.TreasureRequest

	// Decode request body
	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		// If no body, use default values
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

	// Validate level
	if request.Level < 1 || request.Level > 20 {
		http.Error(w, "Level must be between 1 and 20", http.StatusBadRequest)
		return
	}

	// Generate treasure using Python service
	treasure, err := h.Python.GenerateTreasure(r.Context(), request)
	if err != nil {
		http.Error(w, "Failed to generate treasure: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Save generated treasure to database
	err = h.DB.CreateTreasure(r.Context(), treasure)
	if err != nil {
		http.Error(w, "Failed to save generated treasure: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Respond with JSON
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(treasure)
}

// DeleteTreasure removes a treasure
func (h *ItemHandler) DeleteTreasure(w http.ResponseWriter, r *http.Request) {
	// Get ID from URL
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	// Remove treasure from database
	err = h.DB.DeleteTreasure(r.Context(), id)
	if err != nil {
		http.Error(w, "Failed to delete treasure: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Respond with success
	w.WriteHeader(http.StatusNoContent)
}
