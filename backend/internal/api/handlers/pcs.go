package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"rpg-saas-backend/internal/db"
	"rpg-saas-backend/internal/models"
	"rpg-saas-backend/internal/python"
	"rpg-saas-backend/internal/utils"
)

type PCHandler struct {
	DB        *db.PostgresDB
	Python    *python.Client
	Response  *utils.ResponseHandler
	Validator *utils.Validator
}

func NewPCHandler(db *db.PostgresDB, python *python.Client) *PCHandler {
	return &PCHandler{
		DB:        db,
		Python:    python,
		Response:  utils.NewResponseHandler(),
		Validator: utils.NewValidator(),
	}
}

// GetPCs retorna os PCs do usuário logado
func (h *PCHandler) GetPCs(w http.ResponseWriter, r *http.Request) {
	// Extract user ID using utility
	userID, err := utils.ExtractUserID(r)
	if err != nil {
		h.Response.SendInternalError(w, "User ID not found in context")
		return
	}

	// Extract pagination using utility
	pagination := utils.ExtractPagination(r, 20)

	pcs, err := h.DB.GetPCsByPlayer(r.Context(), userID, pagination.Limit, pagination.Offset)
	log.Printf("Fetching PCs for user ID: %d with limit: %d and offset: %d", userID, pagination.Limit, pagination.Offset)
	if err != nil {
		h.Response.HandleDBError(w, err, "fetch PCs")
		return
	}

	log.Printf("Total PCs found: %d", len(pcs))

	// Send paginated response using utility
	h.Response.SendPaginated(w, map[string]any{"pcs": pcs}, pagination, len(pcs), nil)
}

// GetPCByID retorna um PC específico se pertence ao usuário
func (h *PCHandler) GetPCByID(w http.ResponseWriter, r *http.Request) {
	// Extract user ID using utility
	userID, err := utils.ExtractUserID(r)
	if err != nil {
		h.Response.SendInternalError(w, "User ID not found in context")
		return
	}

	// Extract ID using utility
	id, err := utils.ExtractID(r)
	if err != nil {
		h.Response.SendBadRequest(w, err.Error())
		return
	}

	pc, err := h.DB.GetPCByIDAndPlayer(r.Context(), id, userID)
	if err != nil {
		h.Response.HandleDBError(w, err, "fetch PC")
		return
	}

	h.Response.SendJSON(w, pc, http.StatusOK)
}

func (h *PCHandler) CreatePC(w http.ResponseWriter, r *http.Request) {
	// Extract user ID using utility
	userID, err := utils.ExtractUserID(r)
	if err != nil {
		h.Response.SendInternalError(w, "User ID not found in context")
		return
	}

	var pc models.PC
	if err := json.NewDecoder(r.Body).Decode(&pc); err != nil {
		fmt.Printf("Erro ao decodificar JSON: %v", err)
		h.Response.SendBadRequest(w, "Invalid request body: "+err.Error())
		return
	}

	// fmt do JSON recebido para debug
	fmt.Printf("JSON recebido para criação: %+v", pc)

	// Validate using centralized validator
	validationErrors := h.Validator.BatchValidate(
		func() error { return h.Validator.ValidateRequired(pc.Name, "name") },
		func() error { return h.Validator.ValidateLevel(pc.Level) },
		func() error { return h.Validator.ValidateRequired(pc.Race, "race") },
		func() error { return h.Validator.ValidateRequired(pc.Class, "class") },
	)

	if validationErrors.HasErrors() {
		h.Response.SendValidationError(w, validationErrors.Error())
		return
	}

	// Definir valores padrão se não fornecidos
	if pc.HP <= 0 {
		pc.HP = 10 + pc.Level*5
	}

	if pc.CA <= 0 {
		pc.CA = 10
	}

	// Garantir que campos JSONBFlexible existam com valores padrão válidos
	if pc.Abilities.Data == nil {
		pc.Abilities = models.JSONBFlexible{Data: map[string]any{}}
	}

	if pc.Attributes.Data == nil {
		pc.Attributes = models.JSONBFlexible{Data: map[string]any{
			"strength":     10,
			"dexterity":    10,
			"constitution": 10,
			"intelligence": 10,
			"wisdom":       10,
			"charisma":     10,
		}}
	}

	if pc.Skills.Data == nil {
		pc.Skills = models.JSONBFlexible{Data: map[string]any{}}
	}

	if pc.Attacks.Data == nil {
		pc.Attacks = models.JSONBFlexible{Data: []any{}}
	}

	if pc.Spells.Data == nil {
		pc.Spells = models.JSONBFlexible{Data: map[string]any{
			"spell_slots":  map[string]any{},
			"known_spells": []any{},
		}}
	}

	if pc.Equipment.Data == nil {
		pc.Equipment = models.JSONBFlexible{Data: []any{}}
	}

	// Associar ao usuário fmtado
	pc.PlayerID = userID

	err = h.DB.CreatePC(r.Context(), &pc)
	if err != nil {
		fmt.Printf("Erro ao criar PC no banco: %v", err)
		h.Response.HandleDBError(w, err, "create PC")
		return
	}

	fmt.Printf("PC criado com sucesso: ID=%d", pc.ID)

	h.Response.SendCreated(w, "PC created successfully", pc)
}

// UpdatePC atualiza um PC existente
func (h *PCHandler) UpdatePC(w http.ResponseWriter, r *http.Request) {
	// Extract user ID using utility
	userID, err := utils.ExtractUserID(r)
	if err != nil {
		h.Response.SendInternalError(w, "User ID not found in context")
		return
	}

	// Extract ID using utility
	id, err := utils.ExtractID(r)
	if err != nil {
		h.Response.SendBadRequest(w, err.Error())
		return
	}

	var pc models.PC
	if err := json.NewDecoder(r.Body).Decode(&pc); err != nil {
		fmt.Printf("Erro ao decodificar JSON para update: %v", err)
		h.Response.SendBadRequest(w, "Invalid request body: "+err.Error())
		return
	}

	// fmt do JSON recebido para debug
	fmt.Printf("JSON recebido para atualização: %+v", pc)

	// Validate using centralized validator
	validationErrors := h.Validator.BatchValidate(
		func() error { return h.Validator.ValidateRequired(pc.Name, "name") },
		func() error { return h.Validator.ValidateLevel(pc.Level) },
	)

	if validationErrors.HasErrors() {
		h.Response.SendValidationError(w, validationErrors.Error())
		return
	}

	// Garantir que campos JSONBFlexible existam com valores padrão válidos
	if pc.Abilities.Data == nil {
		pc.Abilities = models.JSONBFlexible{Data: map[string]any{}}
	}

	if pc.Skills.Data == nil {
		pc.Skills = models.JSONBFlexible{Data: map[string]any{}}
	}

	if pc.Attacks.Data == nil {
		pc.Attacks = models.JSONBFlexible{Data: []any{}}
	}

	if pc.Spells.Data == nil {
		pc.Spells = models.JSONBFlexible{Data: map[string]any{
			"spell_slots":  map[string]any{},
			"known_spells": []any{},
		}}
	}

	if pc.Equipment.Data == nil {
		pc.Equipment = models.JSONBFlexible{Data: []any{}}
	}

	// Definir IDs
	pc.ID = id
	pc.PlayerID = userID

	err = h.DB.UpdatePC(r.Context(), &pc)
	if err != nil {
		fmt.Printf("Erro ao atualizar PC no banco: %v", err)
		h.Response.HandleDBError(w, err, "update PC")
		return
	}

	fmt.Printf("PC atualizado com sucesso: ID=%d", pc.ID)

	h.Response.SendJSON(w, pc, http.StatusOK)
}

// DeletePC deleta um PC
func (h *PCHandler) DeletePC(w http.ResponseWriter, r *http.Request) {
	// Extract user ID using utility
	userID, err := utils.ExtractUserID(r)
	if err != nil {
		h.Response.SendInternalError(w, "User ID not found in context")
		return
	}

	// Extract ID using utility
	id, err := utils.ExtractID(r)
	if err != nil {
		h.Response.SendBadRequest(w, err.Error())
		return
	}

	err = h.DB.DeletePC(r.Context(), id, userID)
	if err != nil {
		h.Response.HandleDBError(w, err, "delete PC")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// GetPCCampaigns retorna as campanhas de um PC
func (h *PCHandler) GetPCCampaigns(w http.ResponseWriter, r *http.Request) {
	// Extract user ID using utility
	userID, err := utils.ExtractUserID(r)
	if err != nil {
		h.Response.SendInternalError(w, "User ID not found in context")
		return
	}

	// Extract ID using utility
	pcID, err := utils.ExtractID(r)
	if err != nil {
		h.Response.SendBadRequest(w, err.Error())
		return
	}

	// Verificar se o PC pertence ao usuário
	_, err = h.DB.GetPCByIDAndPlayer(r.Context(), pcID, userID)
	if err != nil {
		h.Response.HandleDBError(w, err, "verify PC ownership")
		return
	}

	campaigns, err := h.DB.GetPCCampaigns(r.Context(), pcID, userID)
	if err != nil {
		h.Response.HandleDBError(w, err, "fetch PC campaigns")
		return
	}

	h.Response.SendJSON(w, map[string]any{
		"campaigns": campaigns,
		"count":     len(campaigns),
	}, http.StatusOK)
}

// CheckUniquePCAvailability verifica se um PC único pode ser adicionado a uma campanha
func (h *PCHandler) CheckUniquePCAvailability(w http.ResponseWriter, r *http.Request) {
	// Extract user ID using utility
	userID, err := utils.ExtractUserID(r)
	if err != nil {
		h.Response.SendInternalError(w, "User ID not found in context")
		return
	}

	// Extract ID using utility
	pcID, err := utils.ExtractID(r)
	if err != nil {
		h.Response.SendBadRequest(w, err.Error())
		return
	}

	// Verificar se o PC pertence ao usuário e é único
	pc, err := h.DB.GetPCByIDAndPlayer(r.Context(), pcID, userID)
	if err != nil {
		h.Response.HandleDBError(w, err, "verify PC ownership")
		return
	}

	// Se não for único, sempre disponível
	if !pc.IsUnique {
		h.Response.SendJSON(w, map[string]any{
			"available":    true,
			"is_unique":    false,
			"campaign_id":  nil,
			"campaign_count": 0,
		}, http.StatusOK)
		return
	}

	// Verificar se já está em alguma campanha
	inCampaign, campaignID, err := h.DB.CheckUniquePCInCampaign(r.Context(), pcID)
	if err != nil {
		h.Response.HandleDBError(w, err, "check unique PC availability")
		return
	}

	// Contar total de campanhas
	campaignCount, err := h.DB.CountPCCampaigns(r.Context(), pcID)
	if err != nil {
		h.Response.HandleDBError(w, err, "count PC campaigns")
		return
	}

	var campaignIDPtr *int
	if inCampaign {
		campaignIDPtr = &campaignID
	}

	h.Response.SendJSON(w, map[string]any{
		"available":      !inCampaign,
		"is_unique":      true,
		"campaign_id":    campaignIDPtr,
		"campaign_count": campaignCount,
	}, http.StatusOK)
}

// GenerateRandomPC gera um PC usando o serviço Python
// func (h *PCHandler) GenerateRandomPC(w http.ResponseWriter, r *http.Request) {
// 	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
// 	if !ok {
// 		http.Error(w, "User ID not found in context", http.StatusInternalServerError)
// 		return
// 	}

// 	var request struct {
// 		Level            int    `json:"level"`
// 		AttributesMethod string `json:"attributes_method,omitempty"`
// 		Manual           bool   `json:"manual"`
// 		Race             string `json:"race,omitempty"`
// 		Class            string `json:"class,omitempty"`
// 		Background       string `json:"background,omitempty"`
// 		PlayerName       string `json:"player_name,omitempty"`
// 	}

// 	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
// 		http.Error(w, "Invalid request body: "+err.Error(), http.StatusBadRequest)
// 		return
// 	}

// 	if request.Level < 1 || request.Level > 20 {
// 		http.Error(w, "Level must be between 1 and 20", http.StatusBadRequest)
// 		return
// 	}

// 	// Default attributes_method se não for manual e não foi fornecido
// 	if !request.Manual && request.AttributesMethod == "" {
// 		request.AttributesMethod = "rolagem"
// 	}

// 	// Validar attributes_method
// 	if !request.Manual || request.AttributesMethod != "" {
// 		if request.AttributesMethod != "rolagem" && request.AttributesMethod != "array" && request.AttributesMethod != "compra" {
// 			http.Error(w, "Invalid attributes_method. Must be 'rolagem', 'array', or 'compra'", http.StatusBadRequest)
// 			return
// 		}
// 	}

// 	// Gerar NPC via Python (que será convertido para PC)
// 	npc, err := h.Python.GenerateNPC(r.Context(), request.Level, request.AttributesMethod, request.Manual, request.Race, request.Class, request.Background)
// 	if err != nil {
// 		http.Error(w, "Failed to generate PC: "+err.Error(), http.StatusInternalServerError)
// 		return
// 	}

// 	// Converter NPC para PC
// 	pc := &models.PC{
// 		Name:        npc.Name,
// 		Description: npc.Description,
// 		Level:       npc.Level,
// 		Race:        npc.Race,
// 		Class:       npc.Class,
// 		Background:  npc.Background,
// 		Attributes:  npc.Attributes,
// 		Abilities:   npc.Abilities,
// 		Equipment:   npc.Equipment,
// 		HP:          npc.HP,
// 		CA:          npc.CA,
// 		PlayerID:    userID,
// 		PlayerName:  request.PlayerName,
// 	}

// 	// Se o player_name não foi fornecido, usar um padrão
// 	if pc.PlayerName == "" {
// 		user, err := h.DB.GetUserByID(r.Context(), userID)
// 		if err == nil {
// 			pc.PlayerName = user.Username
// 		} else {
// 			pc.PlayerName = "Unknown Player"
// 		}
// 	}

// 	err = h.DB.CreatePC(r.Context(), pc)
// 	if err != nil {
// 		http.Error(w, "Failed to save generated PC: "+err.Error(), http.StatusInternalServerError)
// 		return
// 	}

// 	w.Header().Set("Content-Type", "application/json")
// 	w.WriteHeader(http.StatusCreated)
// 	json.NewEncoder(w).Encode(pc)
// }
