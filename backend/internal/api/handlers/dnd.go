package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"

	"rpg-saas-backend/internal/db"
)

type DnDHandler struct {
	DB *db.PostgresDB
}

func NewDnDHandler(db *db.PostgresDB) *DnDHandler {
	return &DnDHandler{DB: db}
}

// ========================================
// RACES HANDLERS
// ========================================

func (h *DnDHandler) GetRaces(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	search := r.URL.Query().Get("search")

	if limit <= 0 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}

	var races interface{}
	var err error

	if search != "" {
		races, err = h.DB.SearchDnDRaces(r.Context(), search, limit, offset)
	} else {
		races, err = h.DB.GetDnDRaces(r.Context(), limit, offset)
	}

	if err != nil {
		http.Error(w, "Failed to fetch races: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"results": races,
		"limit":   limit,
		"offset":  offset,
	})
}

func (h *DnDHandler) GetRaceByIndex(w http.ResponseWriter, r *http.Request) {
	index := chi.URLParam(r, "index")
	if index == "" {
		http.Error(w, "Race index is required", http.StatusBadRequest)
		return
	}

	race, err := h.DB.GetDnDRaceByIndex(r.Context(), index)
	if err != nil {
		http.Error(w, "Race not found: "+err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(race)
}

// ========================================
// CLASSES HANDLERS
// ========================================

func (h *DnDHandler) GetClasses(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	search := r.URL.Query().Get("search")

	if limit <= 0 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}

	var classes interface{}
	var err error

	if search != "" {
		classes, err = h.DB.SearchDnDClasses(r.Context(), search, limit, offset)
	} else {
		classes, err = h.DB.GetDnDClasses(r.Context(), limit, offset)
	}

	if err != nil {
		http.Error(w, "Failed to fetch classes: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"results": classes,
		"limit":   limit,
		"offset":  offset,
	})
}

func (h *DnDHandler) GetClassByIndex(w http.ResponseWriter, r *http.Request) {
	index := chi.URLParam(r, "index")
	if index == "" {
		http.Error(w, "Class index is required", http.StatusBadRequest)
		return
	}

	class, err := h.DB.GetDnDClassByIndex(r.Context(), index)
	if err != nil {
		http.Error(w, "Class not found: "+err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(class)
}

// ========================================
// SPELLS HANDLERS
// ========================================

func (h *DnDHandler) GetSpells(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	search := r.URL.Query().Get("search")
	levelStr := r.URL.Query().Get("level")
	school := r.URL.Query().Get("school")
	class := r.URL.Query().Get("class")

	if limit <= 0 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}

	var level *int
	if levelStr != "" {
		if lvl, err := strconv.Atoi(levelStr); err == nil {
			level = &lvl
		}
	}

	var spells interface{}
	var err error

	if search != "" {
		spells, err = h.DB.SearchDnDSpells(r.Context(), search, limit, offset)
	} else {
		spells, err = h.DB.GetDnDSpells(r.Context(), limit, offset, level, school, class)
	}

	if err != nil {
		http.Error(w, "Failed to fetch spells: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"results": spells,
		"limit":   limit,
		"offset":  offset,
	})
}

func (h *DnDHandler) GetSpellByIndex(w http.ResponseWriter, r *http.Request) {
	index := chi.URLParam(r, "index")
	if index == "" {
		http.Error(w, "Spell index is required", http.StatusBadRequest)
		return
	}

	spell, err := h.DB.GetDnDSpellByIndex(r.Context(), index)
	if err != nil {
		http.Error(w, "Spell not found: "+err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(spell)
}

// ========================================
// EQUIPMENT HANDLERS
// ========================================

func (h *DnDHandler) GetEquipment(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	search := r.URL.Query().Get("search")
	category := r.URL.Query().Get("category")

	if limit <= 0 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}

	var equipment interface{}
	var err error

	if search != "" {
		equipment, err = h.DB.SearchDnDEquipment(r.Context(), search, limit, offset)
	} else {
		equipment, err = h.DB.GetDnDEquipment(r.Context(), limit, offset, category)
	}

	if err != nil {
		http.Error(w, "Failed to fetch equipment: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"results": equipment,
		"limit":   limit,
		"offset":  offset,
	})
}

func (h *DnDHandler) GetEquipmentByIndex(w http.ResponseWriter, r *http.Request) {
	index := chi.URLParam(r, "index")
	if index == "" {
		http.Error(w, "Equipment index is required", http.StatusBadRequest)
		return
	}

	equipment, err := h.DB.GetDnDEquipmentByIndex(r.Context(), index)
	if err != nil {
		http.Error(w, "Equipment not found: "+err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(equipment)
}

// ========================================
// MONSTERS HANDLERS
// ========================================

func (h *DnDHandler) GetMonsters(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	search := r.URL.Query().Get("search")
	crStr := r.URL.Query().Get("challenge_rating")
	monsterType := r.URL.Query().Get("type")

	if limit <= 0 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}

	var challengeRating *float64
	if crStr != "" {
		if cr, err := strconv.ParseFloat(crStr, 64); err == nil {
			challengeRating = &cr
		}
	}

	var monsters interface{}
	var err error

	if search != "" {
		monsters, err = h.DB.SearchDnDMonsters(r.Context(), search, limit, offset)
	} else {
		monsters, err = h.DB.GetDnDMonsters(r.Context(), limit, offset, challengeRating, monsterType)
	}

	if err != nil {
		http.Error(w, "Failed to fetch monsters: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"results": monsters,
		"limit":   limit,
		"offset":  offset,
	})
}

func (h *DnDHandler) GetMonsterByIndex(w http.ResponseWriter, r *http.Request) {
	index := chi.URLParam(r, "index")
	if index == "" {
		http.Error(w, "Monster index is required", http.StatusBadRequest)
		return
	}

	monster, err := h.DB.GetDnDMonsterByIndex(r.Context(), index)
	if err != nil {
		http.Error(w, "Monster not found: "+err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(monster)
}

// ========================================
// BACKGROUNDS HANDLERS
// ========================================

func (h *DnDHandler) GetBackgrounds(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	search := r.URL.Query().Get("search")

	if limit <= 0 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}

	var backgrounds interface{}
	var err error

	if search != "" {
		backgrounds, err = h.DB.SearchDnDBackgrounds(r.Context(), search, limit, offset)
	} else {
		backgrounds, err = h.DB.GetDnDBackgrounds(r.Context(), limit, offset)
	}

	if err != nil {
		http.Error(w, "Failed to fetch backgrounds: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"results": backgrounds,
		"limit":   limit,
		"offset":  offset,
	})
}

func (h *DnDHandler) GetBackgroundByIndex(w http.ResponseWriter, r *http.Request) {
	index := chi.URLParam(r, "index")
	if index == "" {
		http.Error(w, "Background index is required", http.StatusBadRequest)
		return
	}

	background, err := h.DB.GetDnDBackgroundByIndex(r.Context(), index)
	if err != nil {
		http.Error(w, "Background not found: "+err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(background)
}

// ========================================
// SKILLS HANDLERS
// ========================================

func (h *DnDHandler) GetSkills(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	if limit <= 0 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}

	skills, err := h.DB.GetDnDSkills(r.Context(), limit, offset)
	if err != nil {
		http.Error(w, "Failed to fetch skills: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"results": skills,
		"limit":   limit,
		"offset":  offset,
	})
}

func (h *DnDHandler) GetSkillByIndex(w http.ResponseWriter, r *http.Request) {
	index := chi.URLParam(r, "index")
	if index == "" {
		http.Error(w, "Skill index is required", http.StatusBadRequest)
		return
	}

	skill, err := h.DB.GetDnDSkillByIndex(r.Context(), index)
	if err != nil {
		http.Error(w, "Skill not found: "+err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(skill)
}

// ========================================
// FEATURES HANDLERS
// ========================================

func (h *DnDHandler) GetFeatures(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	class := r.URL.Query().Get("class")
	levelStr := r.URL.Query().Get("level")

	if limit <= 0 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}

	var level *int
	if levelStr != "" {
		if lvl, err := strconv.Atoi(levelStr); err == nil {
			level = &lvl
		}
	}

	features, err := h.DB.GetDnDFeatures(r.Context(), limit, offset, class, level)
	if err != nil {
		http.Error(w, "Failed to fetch features: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"results": features,
		"limit":   limit,
		"offset":  offset,
	})
}

func (h *DnDHandler) GetFeatureByIndex(w http.ResponseWriter, r *http.Request) {
	index := chi.URLParam(r, "index")
	if index == "" {
		http.Error(w, "Feature index is required", http.StatusBadRequest)
		return
	}

	feature, err := h.DB.GetDnDFeatureByIndex(r.Context(), index)
	if err != nil {
		http.Error(w, "Feature not found: "+err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(feature)
}
