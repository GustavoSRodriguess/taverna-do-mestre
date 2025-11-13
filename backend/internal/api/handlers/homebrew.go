package handlers

import (
	"encoding/json"
	"net/http"

	"rpg-saas-backend/internal/db"
	"rpg-saas-backend/internal/models"
	"rpg-saas-backend/internal/utils"
)

type HomebrewHandler struct {
	DB        *db.PostgresDB
	Response  *utils.ResponseHandler
	Validator *utils.Validator
}

func NewHomebrewHandler(database *db.PostgresDB) *HomebrewHandler {
	return &HomebrewHandler{
		DB:        database,
		Response:  utils.NewResponseHandler(),
		Validator: utils.NewValidator(),
	}
}

// ========================================
// HOMEBREW RACES
// ========================================

func (h *HomebrewHandler) GetHomebrewRaces(w http.ResponseWriter, r *http.Request) {
	userID, err := utils.ExtractUserID(r)
	if err != nil {
		h.Response.SendInternalError(w, "User ID not found in context")
		return
	}

	pagination := utils.ExtractPagination(r, 50)

	races, count, err := h.DB.GetHomebrewRaces(r.Context(), userID, pagination.Limit, pagination.Offset)
	if err != nil {
		h.Response.HandleDBError(w, err, "fetch homebrew races")
		return
	}

	h.Response.SendPaginated(w, map[string]any{"races": races}, pagination, count, nil)
}

func (h *HomebrewHandler) GetHomebrewRaceByID(w http.ResponseWriter, r *http.Request) {
	userID, err := utils.ExtractUserID(r)
	if err != nil {
		h.Response.SendInternalError(w, "User ID not found in context")
		return
	}

	id, err := utils.ExtractID(r)
	if err != nil {
		h.Response.SendBadRequest(w, err.Error())
		return
	}

	race, err := h.DB.GetHomebrewRaceByID(r.Context(), id, userID)
	if err != nil {
		h.Response.HandleDBError(w, err, "fetch homebrew race")
		return
	}

	h.Response.SendJSON(w, race, http.StatusOK)
}

func (h *HomebrewHandler) CreateHomebrewRace(w http.ResponseWriter, r *http.Request) {
	userID, err := utils.ExtractUserID(r)
	if err != nil {
		h.Response.SendInternalError(w, "User ID not found in context")
		return
	}

	var req models.CreateHomebrewRaceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.Response.SendBadRequest(w, "Invalid request body: "+err.Error())
		return
	}

	// Validate
	validationErrors := h.Validator.BatchValidate(
		func() error { return h.Validator.ValidateRequired(req.Name, "name") },
		func() error { return h.Validator.ValidateRequired(req.Description, "description") },
		func() error { return h.Validator.ValidateRequired(req.Size, "size") },
	)

	if validationErrors.HasErrors() {
		h.Response.SendValidationError(w, validationErrors.Error())
		return
	}

	race := &models.HomebrewRace{
		Name:          req.Name,
		Description:   req.Description,
		Speed:         req.Speed,
		Size:          req.Size,
		Languages:     req.Languages,
		Traits:        req.Traits,
		Abilities:     req.Abilities,
		Proficiencies: req.Proficiencies,
		UserID:        userID,
		IsPublic:      req.IsPublic,
	}

	err = h.DB.CreateHomebrewRace(r.Context(), race)
	if err != nil {
		h.Response.HandleDBError(w, err, "create homebrew race")
		return
	}

	h.Response.SendCreated(w, "Homebrew race created successfully", race)
}

func (h *HomebrewHandler) UpdateHomebrewRace(w http.ResponseWriter, r *http.Request) {
	userID, err := utils.ExtractUserID(r)
	if err != nil {
		h.Response.SendInternalError(w, "User ID not found in context")
		return
	}

	id, err := utils.ExtractID(r)
	if err != nil {
		h.Response.SendBadRequest(w, err.Error())
		return
	}

	var req models.UpdateHomebrewRaceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.Response.SendBadRequest(w, "Invalid request body: "+err.Error())
		return
	}

	race := &models.HomebrewRace{
		ID:            id,
		Name:          req.Name,
		Description:   req.Description,
		Speed:         req.Speed,
		Size:          req.Size,
		Languages:     req.Languages,
		Traits:        req.Traits,
		Abilities:     req.Abilities,
		Proficiencies: req.Proficiencies,
		UserID:        userID,
		IsPublic:      req.IsPublic,
	}

	err = h.DB.UpdateHomebrewRace(r.Context(), race)
	if err != nil {
		h.Response.HandleDBError(w, err, "update homebrew race")
		return
	}

	h.Response.SendJSON(w, race, http.StatusOK)
}

func (h *HomebrewHandler) DeleteHomebrewRace(w http.ResponseWriter, r *http.Request) {
	userID, err := utils.ExtractUserID(r)
	if err != nil {
		h.Response.SendInternalError(w, "User ID not found in context")
		return
	}

	id, err := utils.ExtractID(r)
	if err != nil {
		h.Response.SendBadRequest(w, err.Error())
		return
	}

	err = h.DB.DeleteHomebrewRace(r.Context(), id, userID)
	if err != nil {
		h.Response.HandleDBError(w, err, "delete homebrew race")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// ========================================
// HOMEBREW CLASSES
// ========================================

func (h *HomebrewHandler) GetHomebrewClasses(w http.ResponseWriter, r *http.Request) {
	userID, err := utils.ExtractUserID(r)
	if err != nil {
		h.Response.SendInternalError(w, "User ID not found in context")
		return
	}

	pagination := utils.ExtractPagination(r, 50)

	classes, count, err := h.DB.GetHomebrewClasses(r.Context(), userID, pagination.Limit, pagination.Offset)
	if err != nil {
		h.Response.HandleDBError(w, err, "fetch homebrew classes")
		return
	}

	h.Response.SendPaginated(w, map[string]any{"classes": classes}, pagination, count, nil)
}

func (h *HomebrewHandler) GetHomebrewClassByID(w http.ResponseWriter, r *http.Request) {
	userID, err := utils.ExtractUserID(r)
	if err != nil {
		h.Response.SendInternalError(w, "User ID not found in context")
		return
	}

	id, err := utils.ExtractID(r)
	if err != nil {
		h.Response.SendBadRequest(w, err.Error())
		return
	}

	class, err := h.DB.GetHomebrewClassByID(r.Context(), id, userID)
	if err != nil {
		h.Response.HandleDBError(w, err, "fetch homebrew class")
		return
	}

	h.Response.SendJSON(w, class, http.StatusOK)
}

func (h *HomebrewHandler) CreateHomebrewClass(w http.ResponseWriter, r *http.Request) {
	userID, err := utils.ExtractUserID(r)
	if err != nil {
		h.Response.SendInternalError(w, "User ID not found in context")
		return
	}

	var req models.CreateHomebrewClassRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.Response.SendBadRequest(w, "Invalid request body: "+err.Error())
		return
	}

	// Validate
	validationErrors := h.Validator.BatchValidate(
		func() error { return h.Validator.ValidateRequired(req.Name, "name") },
		func() error { return h.Validator.ValidateRequired(req.Description, "description") },
		func() error { return h.Validator.ValidateRequired(req.PrimaryAbility, "primary_ability") },
	)

	if validationErrors.HasErrors() {
		h.Response.SendValidationError(w, validationErrors.Error())
		return
	}

	class := &models.HomebrewClass{
		Name:              req.Name,
		Description:       req.Description,
		HitDie:            req.HitDie,
		PrimaryAbility:    req.PrimaryAbility,
		SavingThrows:      req.SavingThrows,
		ArmorProficiency:  req.ArmorProficiency,
		WeaponProficiency: req.WeaponProficiency,
		ToolProficiency:   req.ToolProficiency,
		SkillChoices:      req.SkillChoices,
		Features:          req.Features,
		Spellcasting:      req.Spellcasting,
		UserID:            userID,
		IsPublic:          req.IsPublic,
	}

	err = h.DB.CreateHomebrewClass(r.Context(), class)
	if err != nil {
		h.Response.HandleDBError(w, err, "create homebrew class")
		return
	}

	h.Response.SendCreated(w, "Homebrew class created successfully", class)
}

func (h *HomebrewHandler) UpdateHomebrewClass(w http.ResponseWriter, r *http.Request) {
	userID, err := utils.ExtractUserID(r)
	if err != nil {
		h.Response.SendInternalError(w, "User ID not found in context")
		return
	}

	id, err := utils.ExtractID(r)
	if err != nil {
		h.Response.SendBadRequest(w, err.Error())
		return
	}

	var req models.UpdateHomebrewClassRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.Response.SendBadRequest(w, "Invalid request body: "+err.Error())
		return
	}

	class := &models.HomebrewClass{
		ID:                id,
		Name:              req.Name,
		Description:       req.Description,
		HitDie:            req.HitDie,
		PrimaryAbility:    req.PrimaryAbility,
		SavingThrows:      req.SavingThrows,
		ArmorProficiency:  req.ArmorProficiency,
		WeaponProficiency: req.WeaponProficiency,
		ToolProficiency:   req.ToolProficiency,
		SkillChoices:      req.SkillChoices,
		Features:          req.Features,
		Spellcasting:      req.Spellcasting,
		UserID:            userID,
		IsPublic:          req.IsPublic,
	}

	err = h.DB.UpdateHomebrewClass(r.Context(), class)
	if err != nil {
		h.Response.HandleDBError(w, err, "update homebrew class")
		return
	}

	h.Response.SendJSON(w, class, http.StatusOK)
}

func (h *HomebrewHandler) DeleteHomebrewClass(w http.ResponseWriter, r *http.Request) {
	userID, err := utils.ExtractUserID(r)
	if err != nil {
		h.Response.SendInternalError(w, "User ID not found in context")
		return
	}

	id, err := utils.ExtractID(r)
	if err != nil {
		h.Response.SendBadRequest(w, err.Error())
		return
	}

	err = h.DB.DeleteHomebrewClass(r.Context(), id, userID)
	if err != nil {
		h.Response.HandleDBError(w, err, "delete homebrew class")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// ========================================
// HOMEBREW BACKGROUNDS
// ========================================

func (h *HomebrewHandler) GetHomebrewBackgrounds(w http.ResponseWriter, r *http.Request) {
	userID, err := utils.ExtractUserID(r)
	if err != nil {
		h.Response.SendInternalError(w, "User ID not found in context")
		return
	}

	pagination := utils.ExtractPagination(r, 50)

	backgrounds, count, err := h.DB.GetHomebrewBackgrounds(r.Context(), userID, pagination.Limit, pagination.Offset)
	if err != nil {
		h.Response.HandleDBError(w, err, "fetch homebrew backgrounds")
		return
	}

	h.Response.SendPaginated(w, map[string]any{"backgrounds": backgrounds}, pagination, count, nil)
}

func (h *HomebrewHandler) GetHomebrewBackgroundByID(w http.ResponseWriter, r *http.Request) {
	userID, err := utils.ExtractUserID(r)
	if err != nil {
		h.Response.SendInternalError(w, "User ID not found in context")
		return
	}

	id, err := utils.ExtractID(r)
	if err != nil {
		h.Response.SendBadRequest(w, err.Error())
		return
	}

	bg, err := h.DB.GetHomebrewBackgroundByID(r.Context(), id, userID)
	if err != nil {
		h.Response.HandleDBError(w, err, "fetch homebrew background")
		return
	}

	h.Response.SendJSON(w, bg, http.StatusOK)
}

func (h *HomebrewHandler) CreateHomebrewBackground(w http.ResponseWriter, r *http.Request) {
	userID, err := utils.ExtractUserID(r)
	if err != nil {
		h.Response.SendInternalError(w, "User ID not found in context")
		return
	}

	var req models.CreateHomebrewBackgroundRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.Response.SendBadRequest(w, "Invalid request body: "+err.Error())
		return
	}

	// Validate
	validationErrors := h.Validator.BatchValidate(
		func() error { return h.Validator.ValidateRequired(req.Name, "name") },
		func() error { return h.Validator.ValidateRequired(req.Description, "description") },
	)

	if validationErrors.HasErrors() {
		h.Response.SendValidationError(w, validationErrors.Error())
		return
	}

	bg := &models.HomebrewBackground{
		Name:               req.Name,
		Description:        req.Description,
		SkillProficiencies: req.SkillProficiencies,
		ToolProficiencies:  req.ToolProficiencies,
		Languages:          req.Languages,
		Equipment:          req.Equipment,
		Feature:            req.Feature,
		SuggestedTraits:    req.SuggestedTraits,
		UserID:             userID,
		IsPublic:           req.IsPublic,
	}

	err = h.DB.CreateHomebrewBackground(r.Context(), bg)
	if err != nil {
		h.Response.HandleDBError(w, err, "create homebrew background")
		return
	}

	h.Response.SendCreated(w, "Homebrew background created successfully", bg)
}

func (h *HomebrewHandler) UpdateHomebrewBackground(w http.ResponseWriter, r *http.Request) {
	userID, err := utils.ExtractUserID(r)
	if err != nil {
		h.Response.SendInternalError(w, "User ID not found in context")
		return
	}

	id, err := utils.ExtractID(r)
	if err != nil {
		h.Response.SendBadRequest(w, err.Error())
		return
	}

	var req models.UpdateHomebrewBackgroundRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.Response.SendBadRequest(w, "Invalid request body: "+err.Error())
		return
	}

	bg := &models.HomebrewBackground{
		ID:                 id,
		Name:               req.Name,
		Description:        req.Description,
		SkillProficiencies: req.SkillProficiencies,
		ToolProficiencies:  req.ToolProficiencies,
		Languages:          req.Languages,
		Equipment:          req.Equipment,
		Feature:            req.Feature,
		SuggestedTraits:    req.SuggestedTraits,
		UserID:             userID,
		IsPublic:           req.IsPublic,
	}

	err = h.DB.UpdateHomebrewBackground(r.Context(), bg)
	if err != nil {
		h.Response.HandleDBError(w, err, "update homebrew background")
		return
	}

	h.Response.SendJSON(w, bg, http.StatusOK)
}

func (h *HomebrewHandler) DeleteHomebrewBackground(w http.ResponseWriter, r *http.Request) {
	userID, err := utils.ExtractUserID(r)
	if err != nil {
		h.Response.SendInternalError(w, "User ID not found in context")
		return
	}

	id, err := utils.ExtractID(r)
	if err != nil {
		h.Response.SendBadRequest(w, err.Error())
		return
	}

	err = h.DB.DeleteHomebrewBackground(r.Context(), id, userID)
	if err != nil {
		h.Response.HandleDBError(w, err, "delete homebrew background")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
