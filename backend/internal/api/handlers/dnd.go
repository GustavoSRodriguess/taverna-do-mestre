package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"

	"rpg-saas-backend/internal/db"
	"rpg-saas-backend/internal/models"
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

	var races []models.DnDRace
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
	json.NewEncoder(w).Encode(models.DnDListResponse{
		Results: races,
		Limit:   limit,
		Offset:  offset,
		Count:   len(races),
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

	var classes []models.DnDClass
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
	json.NewEncoder(w).Encode(models.DnDListResponse{
		Results: classes,
		Limit:   limit,
		Offset:  offset,
		Count:   len(classes),
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

	var spells []models.DnDSpell
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
	json.NewEncoder(w).Encode(models.DnDListResponse{
		Results: spells,
		Limit:   limit,
		Offset:  offset,
		Count:   len(spells),
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

	var equipment []models.DnDEquipment
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
	json.NewEncoder(w).Encode(models.DnDListResponse{
		Results: equipment,
		Limit:   limit,
		Offset:  offset,
		Count:   len(equipment),
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

	var monsters []models.DnDMonster
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
	json.NewEncoder(w).Encode(models.DnDListResponse{
		Results: monsters,
		Limit:   limit,
		Offset:  offset,
		Count:   len(monsters),
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

	var backgrounds []models.DnDBackground
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
	json.NewEncoder(w).Encode(models.DnDListResponse{
		Results: backgrounds,
		Limit:   limit,
		Offset:  offset,
		Count:   len(backgrounds),
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
	json.NewEncoder(w).Encode(models.DnDListResponse{
		Results: skills,
		Limit:   limit,
		Offset:  offset,
		Count:   len(skills),
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
	json.NewEncoder(w).Encode(models.DnDListResponse{
		Results: features,
		Limit:   limit,
		Offset:  offset,
		Count:   len(features),
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

// ========================================
// NOVAS ROTAS PARA ENTIDADES ADICIONAIS
// ========================================

// LANGUAGES HANDLERS
func (h *DnDHandler) GetLanguages(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	if limit <= 0 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}

	languages, err := h.DB.GetDnDLanguages(r.Context(), limit, offset)
	if err != nil {
		http.Error(w, "Failed to fetch languages: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(models.DnDListResponse{
		Results: languages,
		Limit:   limit,
		Offset:  offset,
		Count:   len(languages),
	})
}

// CONDITIONS HANDLERS
func (h *DnDHandler) GetConditions(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	if limit <= 0 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}

	conditions, err := h.DB.GetDnDConditions(r.Context(), limit, offset)
	if err != nil {
		http.Error(w, "Failed to fetch conditions: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(models.DnDListResponse{
		Results: conditions,
		Limit:   limit,
		Offset:  offset,
		Count:   len(conditions),
	})
}

// SUBRACES HANDLERS
func (h *DnDHandler) GetSubraces(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	if limit <= 0 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}

	subraces, err := h.DB.GetDnDSubraces(r.Context(), limit, offset)
	if err != nil {
		http.Error(w, "Failed to fetch subraces: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(models.DnDListResponse{
		Results: subraces,
		Limit:   limit,
		Offset:  offset,
		Count:   len(subraces),
	})
}

// MAGIC ITEMS HANDLERS
func (h *DnDHandler) GetMagicItems(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	rarity := r.URL.Query().Get("rarity")

	if limit <= 0 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}

	magicItems, err := h.DB.GetDnDMagicItems(r.Context(), limit, offset, rarity)
	if err != nil {
		http.Error(w, "Failed to fetch magic items: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(models.DnDListResponse{
		Results: magicItems,
		Limit:   limit,
		Offset:  offset,
		Count:   len(magicItems),
	})
}

// ========================================
// ENDPOINT DE ESTATÍSTICAS/OVERVIEW
// ========================================

func (h *DnDHandler) GetDnDStats(w http.ResponseWriter, r *http.Request) {
	stats := map[string]any{
		"message": "D&D 5e data is available",
		"endpoints": map[string]string{
			"races":       "/api/dnd/races",
			"classes":     "/api/dnd/classes",
			"spells":      "/api/dnd/spells",
			"equipment":   "/api/dnd/equipment",
			"monsters":    "/api/dnd/monsters",
			"backgrounds": "/api/dnd/backgrounds",
			"skills":      "/api/dnd/skills",
			"features":    "/api/dnd/features",
			"languages":   "/api/dnd/languages",
			"conditions":  "/api/dnd/conditions",
			"subraces":    "/api/dnd/subraces",
			"magic_items": "/api/dnd/magic-items",
		},
		"filters": map[string]any{
			"spells":      []string{"level", "school", "class"},
			"monsters":    []string{"challenge_rating", "type"},
			"equipment":   []string{"category"},
			"features":    []string{"class", "level"},
			"magic_items": []string{"rarity"},
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}
