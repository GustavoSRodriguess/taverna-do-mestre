package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"

	"rpg-saas-backend/internal/api/middleware"
	"rpg-saas-backend/internal/db"
	"rpg-saas-backend/internal/models"
	"rpg-saas-backend/internal/python"
)

type PCHandler struct {
	DB     *db.PostgresDB
	Python *python.Client
}

func NewPCHandler(db *db.PostgresDB, python *python.Client) *PCHandler {
	return &PCHandler{
		DB:     db,
		Python: python,
	}
}

// GetPCs retorna os PCs do usuário logado
func (h *PCHandler) GetPCs(w http.ResponseWriter, r *http.Request) {
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

	pcs, err := h.DB.GetPCsByPlayer(r.Context(), userID, limit, offset)
	if err != nil {
		http.Error(w, "Failed to fetch PCs: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"pcs":    pcs,
		"limit":  limit,
		"offset": offset,
		"count":  len(pcs),
	})
}

// GetPCByID retorna um PC específico se pertence ao usuário
func (h *PCHandler) GetPCByID(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "User ID not found in context", http.StatusInternalServerError)
		return
	}

	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid PC ID", http.StatusBadRequest)
		return
	}

	pc, err := h.DB.GetPCByIDAndPlayer(r.Context(), id, userID)
	if err != nil {
		http.Error(w, "PC not found: "+err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(pc)
}

// CreatePC cria um novo PC para o usuário logado
func (h *PCHandler) CreatePC(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "User ID not found in context", http.StatusInternalServerError)
		return
	}

	var pc models.PC
	if err := json.NewDecoder(r.Body).Decode(&pc); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validações básicas
	if pc.Name == "" {
		http.Error(w, "PC name is required", http.StatusBadRequest)
		return
	}

	if pc.Level < 1 || pc.Level > 20 {
		http.Error(w, "PC level must be between 1 and 20", http.StatusBadRequest)
		return
	}

	if pc.Race == "" {
		http.Error(w, "PC race is required", http.StatusBadRequest)
		return
	}

	if pc.Class == "" {
		http.Error(w, "PC class is required", http.StatusBadRequest)
		return
	}

	// Definir valores padrão
	if pc.HP <= 0 {
		pc.HP = 10 + pc.Level*5 // Valor padrão baseado no nível
	}

	if pc.CA <= 0 {
		pc.CA = 10 // AC base
	}

	// Associar ao usuário logado
	pc.PlayerID = userID

	err := h.DB.CreatePC(r.Context(), &pc)
	if err != nil {
		http.Error(w, "Failed to create PC: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(pc)
}

// UpdatePC atualiza um PC existente
func (h *PCHandler) UpdatePC(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "User ID not found in context", http.StatusInternalServerError)
		return
	}

	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid PC ID", http.StatusBadRequest)
		return
	}

	var pc models.PC
	if err := json.NewDecoder(r.Body).Decode(&pc); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validações básicas
	if pc.Name == "" {
		http.Error(w, "PC name is required", http.StatusBadRequest)
		return
	}

	if pc.Level < 1 || pc.Level > 20 {
		http.Error(w, "PC level must be between 1 and 20", http.StatusBadRequest)
		return
	}

	// Definir IDs
	pc.ID = id
	pc.PlayerID = userID

	err = h.DB.UpdatePC(r.Context(), &pc)
	if err != nil {
		http.Error(w, "Failed to update PC: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(pc)
}

// DeletePC deleta um PC
func (h *PCHandler) DeletePC(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "User ID not found in context", http.StatusInternalServerError)
		return
	}

	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid PC ID", http.StatusBadRequest)
		return
	}

	err = h.DB.DeletePC(r.Context(), id, userID)
	if err != nil {
		http.Error(w, "Failed to delete PC: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// GetPCCampaigns retorna as campanhas de um PC
func (h *PCHandler) GetPCCampaigns(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "User ID not found in context", http.StatusInternalServerError)
		return
	}

	idStr := chi.URLParam(r, "id")
	pcID, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid PC ID", http.StatusBadRequest)
		return
	}

	// Verificar se o PC pertence ao usuário
	_, err = h.DB.GetPCByIDAndPlayer(r.Context(), pcID, userID)
	if err != nil {
		http.Error(w, "PC not found or access denied", http.StatusNotFound)
		return
	}

	campaigns, err := h.DB.GetPCCampaigns(r.Context(), pcID, userID)
	if err != nil {
		http.Error(w, "Failed to fetch PC campaigns: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"campaigns": campaigns,
		"count":     len(campaigns),
	})
}

// GenerateRandomPC gera um PC usando o serviço Python
func (h *PCHandler) GenerateRandomPC(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		http.Error(w, "User ID not found in context", http.StatusInternalServerError)
		return
	}

	var request struct {
		Level            int    `json:"level"`
		AttributesMethod string `json:"attributes_method,omitempty"`
		Manual           bool   `json:"manual"`
		Race             string `json:"race,omitempty"`
		Class            string `json:"class,omitempty"`
		Background       string `json:"background,omitempty"`
		PlayerName       string `json:"player_name,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Invalid request body: "+err.Error(), http.StatusBadRequest)
		return
	}

	if request.Level < 1 || request.Level > 20 {
		http.Error(w, "Level must be between 1 and 20", http.StatusBadRequest)
		return
	}

	// Default attributes_method se não for manual e não foi fornecido
	if !request.Manual && request.AttributesMethod == "" {
		request.AttributesMethod = "rolagem"
	}

	// Validar attributes_method
	if !request.Manual || request.AttributesMethod != "" {
		if request.AttributesMethod != "rolagem" && request.AttributesMethod != "array" && request.AttributesMethod != "compra" {
			http.Error(w, "Invalid attributes_method. Must be 'rolagem', 'array', or 'compra'", http.StatusBadRequest)
			return
		}
	}

	// Gerar NPC via Python (que será convertido para PC)
	npc, err := h.Python.GenerateNPC(r.Context(), request.Level, request.AttributesMethod, request.Manual, request.Race, request.Class, request.Background)
	if err != nil {
		http.Error(w, "Failed to generate PC: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Converter NPC para PC
	pc := &models.PC{
		Name:        npc.Name,
		Description: npc.Description,
		Level:       npc.Level,
		Race:        npc.Race,
		Class:       npc.Class,
		Background:  npc.Background,
		Attributes:  npc.Attributes,
		Abilities:   npc.Abilities,
		Equipment:   npc.Equipment,
		HP:          npc.HP,
		CA:          npc.CA,
		PlayerID:    userID,
		PlayerName:  request.PlayerName,
	}

	// Se o player_name não foi fornecido, usar um padrão
	if pc.PlayerName == "" {
		user, err := h.DB.GetUserByID(r.Context(), userID)
		if err == nil {
			pc.PlayerName = user.Username
		} else {
			pc.PlayerName = "Unknown Player"
		}
	}

	err = h.DB.CreatePC(r.Context(), pc)
	if err != nil {
		http.Error(w, "Failed to save generated PC: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(pc)
}
