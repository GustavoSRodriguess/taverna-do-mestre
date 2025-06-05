package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"

	"rpg-saas-backend/internal/api/middleware"
	"rpg-saas-backend/internal/db"
	"rpg-saas-backend/internal/models"
	"rpg-saas-backend/internal/utils"
)

type CampaignHandler struct {
	DB *db.PostgresDB
}

func NewCampaignHandler(db *db.PostgresDB) *CampaignHandler {
	return &CampaignHandler{DB: db}
}

// GetCampaigns retorna as campanhas do usuário (como DM ou player)
func (h *CampaignHandler) GetCampaigns(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "User ID not found in context", http.StatusInternalServerError)
		return
	}

	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}

	campaigns, err := h.DB.GetCampaigns(r.Context(), userID, limit, offset)
	if err != nil {
		http.Error(w, "Failed to fetch campaigns: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"campaigns": campaigns,
		"limit":     limit,
		"offset":    offset,
		"count":     len(campaigns),
	})
}

// GetCampaignByID retorna uma campanha específica
func (h *CampaignHandler) GetCampaignByID(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "User ID not found in context", http.StatusInternalServerError)
		return
	}

	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid campaign ID", http.StatusBadRequest)
		return
	}

	campaign, err := h.DB.GetCampaignByID(r.Context(), id, userID)
	if err != nil {
		http.Error(w, "Campaign not found: "+err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(campaign)
}

// CreateCampaign cria uma nova campanha
func (h *CampaignHandler) CreateCampaign(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "User ID not found in context", http.StatusInternalServerError)
		return
	}

	var req models.CreateCampaignRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Name == "" {
		http.Error(w, "Campaign name is required", http.StatusBadRequest)
		return
	}

	if req.MaxPlayers <= 0 {
		req.MaxPlayers = 6
	}

	// Gerar código de convite único
	inviteCode, err := utils.GenerateInviteCode()
	if err != nil {
		http.Error(w, "Failed to generate invite code", http.StatusInternalServerError)
		return
	}

	// Normalizar o código (remove hífen para salvar no banco)
	normalizedCode := utils.NormalizeInviteCode(inviteCode)

	campaign := &models.Campaign{
		Name:        req.Name,
		Description: req.Description,
		DMID:        userID,
		MaxPlayers:  req.MaxPlayers,
		Status:      "planning",
		InviteCode:  normalizedCode,
	}

	err = h.DB.CreateCampaign(r.Context(), campaign)
	if err != nil {
		http.Error(w, "Failed to create campaign: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Retornar com código formatado para exibição
	campaign.InviteCode = inviteCode

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(campaign)
}

// UpdateCampaign atualiza uma campanha existente
func (h *CampaignHandler) UpdateCampaign(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "User ID not found in context", http.StatusInternalServerError)
		return
	}

	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid campaign ID", http.StatusBadRequest)
		return
	}

	var req models.UpdateCampaignRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	campaign := &models.Campaign{
		ID:             id,
		Name:           req.Name,
		Description:    req.Description,
		DMID:           userID,
		MaxPlayers:     req.MaxPlayers,
		CurrentSession: req.CurrentSession,
		Status:         req.Status,
	}

	err = h.DB.UpdateCampaign(r.Context(), campaign)
	if err != nil {
		http.Error(w, "Failed to update campaign: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(campaign)
}

// DeleteCampaign deleta uma campanha
func (h *CampaignHandler) DeleteCampaign(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "User ID not found in context", http.StatusInternalServerError)
		return
	}

	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid campaign ID", http.StatusBadRequest)
		return
	}

	err = h.DB.DeleteCampaign(r.Context(), id, userID)
	if err != nil {
		http.Error(w, "Failed to delete campaign: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// JoinCampaign adiciona o usuário atual à uma campanha usando código de convite
func (h *CampaignHandler) JoinCampaign(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "User ID not found in context", http.StatusInternalServerError)
		return
	}

	var req models.JoinCampaignRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.InviteCode == "" {
		http.Error(w, "Invite code is required", http.StatusBadRequest)
		return
	}

	// Validar e normalizar o código
	if !utils.ValidateInviteCode(req.InviteCode) {
		http.Error(w, "Invalid invite code format", http.StatusBadRequest)
		return
	}

	normalizedCode := utils.NormalizeInviteCode(req.InviteCode)

	err := h.DB.JoinCampaignByCode(r.Context(), normalizedCode, userID)
	if err != nil {
		http.Error(w, "Failed to join campaign: "+err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Successfully joined campaign"})
}

// LeaveCampaign remove o usuário atual de uma campanha
func (h *CampaignHandler) LeaveCampaign(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "User ID not found in context", http.StatusInternalServerError)
		return
	}

	idStr := chi.URLParam(r, "id")
	campaignID, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid campaign ID", http.StatusBadRequest)
		return
	}

	err = h.DB.RemovePlayerFromCampaign(r.Context(), campaignID, userID)
	if err != nil {
		http.Error(w, "Failed to leave campaign: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// GetInviteCode retorna o código de convite da campanha (apenas para DM)
func (h *CampaignHandler) GetInviteCode(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "User ID not found in context", http.StatusInternalServerError)
		return
	}

	idStr := chi.URLParam(r, "id")
	campaignID, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid campaign ID", http.StatusBadRequest)
		return
	}

	campaign, err := h.DB.GetCampaignByID(r.Context(), campaignID, userID)
	if err != nil {
		http.Error(w, "Campaign not found", http.StatusNotFound)
		return
	}

	if campaign.DMID != userID {
		http.Error(w, "Only the DM can view the invite code", http.StatusForbidden)
		return
	}

	// Formatar o código para exibição (adicionar hífen)
	formattedCode := campaign.InviteCode
	if len(campaign.InviteCode) == 8 {
		formattedCode = campaign.InviteCode[:4] + "-" + campaign.InviteCode[4:]
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(models.CampaignInviteResponse{
		InviteCode: formattedCode,
		Message:    "Share this code with players to invite them to your campaign",
	})
}

// RegenerateInviteCode gera um novo código de convite (apenas para DM)
func (h *CampaignHandler) RegenerateInviteCode(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "User ID not found in context", http.StatusInternalServerError)
		return
	}

	idStr := chi.URLParam(r, "id")
	campaignID, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid campaign ID", http.StatusBadRequest)
		return
	}

	campaign, err := h.DB.GetCampaignByID(r.Context(), campaignID, userID)
	if err != nil {
		http.Error(w, "Campaign not found", http.StatusNotFound)
		return
	}

	if campaign.DMID != userID {
		http.Error(w, "Only the DM can regenerate the invite code", http.StatusForbidden)
		return
	}

	// Gerar novo código
	newCode, err := utils.GenerateInviteCode()
	if err != nil {
		http.Error(w, "Failed to generate new invite code", http.StatusInternalServerError)
		return
	}

	// Atualizar no banco
	normalizedCode := utils.NormalizeInviteCode(newCode)
	query := `UPDATE campaigns SET invite_code = $1, updated_at = $2 WHERE id = $3`
	_, err = h.DB.DB.ExecContext(r.Context(), query, normalizedCode, time.Now(), campaignID)
	if err != nil {
		http.Error(w, "Failed to update invite code", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(models.CampaignInviteResponse{
		InviteCode: newCode,
		Message:    "New invite code generated successfully",
	})
}

// ========================================
// NOVA FUNCIONALIDADE: GERENCIAR PERSONAGENS
// ========================================

// GetAvailableCharacters lista PCs do jogador que podem ser adicionados à campanha
func (h *CampaignHandler) GetAvailableCharacters(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "User ID not found in context", http.StatusInternalServerError)
		return
	}

	idStr := chi.URLParam(r, "id")
	campaignID, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid campaign ID", http.StatusBadRequest)
		return
	}

	// Verificar se o usuário está na campanha
	inCampaign, err := h.DB.IsPlayerInCampaign(r.Context(), campaignID, userID)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	if !inCampaign {
		http.Error(w, "Access denied - not in campaign", http.StatusForbidden)
		return
	}

	// Buscar PCs do usuário que NÃO estão na campanha
	pcs, err := h.DB.GetAvailablePCs(r.Context(), userID, campaignID)
	if err != nil {
		http.Error(w, "Failed to fetch available characters: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"available_characters": pcs,
		"count":                len(pcs),
	})
}

// GetCampaignCharacters retorna os personagens de uma campanha
func (h *CampaignHandler) GetCampaignCharacters(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "User ID not found in context", http.StatusInternalServerError)
		return
	}

	idStr := chi.URLParam(r, "id")
	campaignID, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid campaign ID", http.StatusBadRequest)
		return
	}

	// Verificar se o usuário tem acesso à campanha
	_, err = h.DB.GetCampaignByID(r.Context(), campaignID, userID)
	if err != nil {
		http.Error(w, "Campaign not found or access denied", http.StatusNotFound)
		return
	}

	characters, err := h.DB.GetCampaignCharacters(r.Context(), campaignID)
	if err != nil {
		http.Error(w, "Failed to fetch characters: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"characters": characters,
		"count":      len(characters),
	})
}

// AddCharacterToCampaign adiciona PC existente à campanha
func (h *CampaignHandler) AddCharacterToCampaign(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "User ID not found in context", http.StatusInternalServerError)
		return
	}

	campaignIDStr := chi.URLParam(r, "id")
	campaignID, err := strconv.Atoi(campaignIDStr)
	if err != nil {
		http.Error(w, "Invalid campaign ID", http.StatusBadRequest)
		return
	}

	var req models.AddCharacterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Verificar se o PC pertence ao usuário
	pc, err := h.DB.GetPCByID(r.Context(), req.PCID)
	if err != nil {
		http.Error(w, "PC not found", http.StatusNotFound)
		return
	}

	// Verificar se o usuário está na campanha
	inCampaign, err := h.DB.IsPlayerInCampaign(r.Context(), campaignID, userID)
	if err != nil || !inCampaign {
		http.Error(w, "Access denied - not in campaign", http.StatusForbidden)
		return
	}

	// Verificar se o PC já está na campanha
	exists, err := h.DB.IsPCInCampaign(r.Context(), campaignID, req.PCID)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	if exists {
		http.Error(w, "Character already in campaign", http.StatusBadRequest)
		return
	}

	// Adicionar PC à campanha
	campaignChar := &models.CampaignCharacter{
		CampaignID: campaignID,
		PlayerID:   userID,
		PCID:       req.PCID,
		Status:     "active",
		CurrentHP:  &pc.HP, // Começa com HP máximo
		JoinedAt:   time.Now(),
	}

	err = h.DB.AddPCToCampaign(r.Context(), campaignChar)
	if err != nil {
		http.Error(w, "Failed to add character to campaign: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Retornar com dados do PC
	campaignChar.PC = pc

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(campaignChar)
}

// UpdateCampaignCharacter atualiza status específico da campanha
func (h *CampaignHandler) UpdateCampaignCharacter(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "User ID not found in context", http.StatusInternalServerError)
		return
	}

	campaignIDStr := chi.URLParam(r, "id")
	campaignID, err := strconv.Atoi(campaignIDStr)
	if err != nil {
		http.Error(w, "Invalid campaign ID", http.StatusBadRequest)
		return
	}

	charIDStr := chi.URLParam(r, "characterId")
	charID, err := strconv.Atoi(charIDStr)
	if err != nil {
		http.Error(w, "Invalid character ID", http.StatusBadRequest)
		return
	}

	var req models.UpdateCharacterStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Verificar acesso
	campaignChar, err := h.DB.GetCampaignCharacter(r.Context(), charID, campaignID, userID)
	if err != nil {
		http.Error(w, "Character not found or access denied", http.StatusNotFound)
		return
	}

	// Atualizar campos específicos da campanha
	if req.CurrentHP != nil {
		campaignChar.CurrentHP = req.CurrentHP
	}
	if req.TempAC != nil {
		campaignChar.TempAC = req.TempAC
	}
	if req.Status != "" {
		campaignChar.Status = req.Status
	}
	if req.Notes != "" {
		campaignChar.Notes = req.Notes
	}

	err = h.DB.UpdateCampaignCharacter(r.Context(), campaignChar)
	if err != nil {
		http.Error(w, "Failed to update character: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(campaignChar)
}

// DeleteCampaignCharacter remove um personagem da campanha
func (h *CampaignHandler) DeleteCampaignCharacter(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "User ID not found in context", http.StatusInternalServerError)
		return
	}

	campaignIDStr := chi.URLParam(r, "id")
	campaignID, err := strconv.Atoi(campaignIDStr)
	if err != nil {
		http.Error(w, "Invalid campaign ID", http.StatusBadRequest)
		return
	}

	characterIDStr := chi.URLParam(r, "characterId")
	characterID, err := strconv.Atoi(characterIDStr)
	if err != nil {
		http.Error(w, "Invalid character ID", http.StatusBadRequest)
		return
	}

	// Verificar se o usuário tem permissão para deletar (dono do personagem ou DM)
	_, err = h.DB.GetCampaignCharacter(r.Context(), characterID, campaignID, userID)
	if err != nil {
		http.Error(w, "Character not found or access denied", http.StatusNotFound)
		return
	}

	err = h.DB.DeleteCampaignCharacter(r.Context(), characterID, campaignID)
	if err != nil {
		http.Error(w, "Failed to delete character: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
