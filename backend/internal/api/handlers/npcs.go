// internal/api/handlers/npcs.go
package handlers

import (
	//"context"
	"encoding/json"
	"net/http"
	"strconv"
	
	"github.com/go-chi/chi/v5"
	
	"rpg-saas-backend/internal/db"
	"rpg-saas-backend/internal/models"
	"rpg-saas-backend/internal/python"
)

// NPCHandler contém os handlers relacionados aos NPCs
type NPCHandler struct {
	DB     *db.PostgresDB
	Python *python.Client
}

// NewNPCHandler cria um novo handler de NPCs
func NewNPCHandler(db *db.PostgresDB, python *python.Client) *NPCHandler {
	return &NPCHandler{
		DB:     db,
		Python: python,
	}
}

// GetNPCs retorna uma lista paginada de NPCs
func (h *NPCHandler) GetNPCs(w http.ResponseWriter, r *http.Request) {
	// Obter parâmetros de paginação
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	
	// Valores padrão
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}
	
	// Buscar NPCs do banco
	npcs, err := h.DB.GetNPCs(r.Context(), limit, offset)
	if err != nil {
		http.Error(w, "Failed to fetch NPCs: "+err.Error(), http.StatusInternalServerError)
		return
	}
	
	// Responder com JSON
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"npcs":  npcs,
		"limit": limit,
		"offset": offset,
		"count": len(npcs),
	})
}

// GetNPCByID retorna um NPC específico pelo ID
func (h *NPCHandler) GetNPCByID(w http.ResponseWriter, r *http.Request) {
	// Obter ID da URL
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}
	
	// Buscar NPC do banco
	npc, err := h.DB.GetNPCByID(r.Context(), id)
	if err != nil {
		http.Error(w, "NPC not found", http.StatusNotFound)
		return
	}
	
	// Responder com JSON
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(npc)
}

// CreateNPC cria um novo NPC
func (h *NPCHandler) CreateNPC(w http.ResponseWriter, r *http.Request) {
	var npc models.NPC
	
	// Decodificar corpo da requisição
	err := json.NewDecoder(r.Body).Decode(&npc)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	
	// Criar NPC no banco
	err = h.DB.CreateNPC(r.Context(), &npc)
	if err != nil {
		http.Error(w, "Failed to create NPC: "+err.Error(), http.StatusInternalServerError)
		return
	}
	
	// Responder com JSON
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(npc)
}

// UpdateNPC atualiza um NPC existente
func (h *NPCHandler) UpdateNPC(w http.ResponseWriter, r *http.Request) {
	// Obter ID da URL
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}
	
	var npc models.NPC
	
	// Decodificar corpo da requisição
	err = json.NewDecoder(r.Body).Decode(&npc)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	
	// Verificar se o ID da URL corresponde ao ID no corpo
	npc.ID = id
	
	// Atualizar NPC no banco
	err = h.DB.UpdateNPC(r.Context(), &npc)
	if err != nil {
		http.Error(w, "Failed to update NPC: "+err.Error(), http.StatusInternalServerError)
		return
	}
	
	// Responder com JSON
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(npc)
}

// DeleteNPC remove um NPC
func (h *NPCHandler) DeleteNPC(w http.ResponseWriter, r *http.Request) {
	// Obter ID da URL
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}
	
	// Remover NPC do banco
	err = h.DB.DeleteNPC(r.Context(), id)
	if err != nil {
		http.Error(w, "Failed to delete NPC: "+err.Error(), http.StatusInternalServerError)
		return
	}
	
	// Responder com sucesso
	w.WriteHeader(http.StatusNoContent)
}

// GenerateRandomNPC gera um NPC aleatório usando o serviço Python
func (h *NPCHandler) GenerateRandomNPC(w http.ResponseWriter, r *http.Request) {
	var request struct {
		Level            int    `json:"level"`
		AttributesMethod string `json:"attributes_method"`
		Manual           bool   `json:"manual"`
	}
	
	// Decodificar corpo da requisição
	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		// Se não houver corpo, usar valores padrão
		request.Level = 1
		request.AttributesMethod = "rolagem"
		request.Manual = false
	}
	
	// Validar nível
	if request.Level < 1 || request.Level > 20 {
		http.Error(w, "Level must be between 1 and 20", http.StatusBadRequest)
		return
	}
	
	// Validar método de atributos
	if request.AttributesMethod == "" {
		request.AttributesMethod = "rolagem"
	}
	if request.AttributesMethod != "rolagem" && request.AttributesMethod != "array" && request.AttributesMethod != "compra" {
		http.Error(w, "Invalid attributes method. Must be 'rolagem', 'array' or 'compra'", http.StatusBadRequest)
		return
	}
	
	// Gerar NPC usando o serviço Python
	npc, err := h.Python.GenerateNPC(r.Context(), request.Level, request.AttributesMethod, request.Manual)
	if err != nil {
		http.Error(w, "Failed to generate NPC: "+err.Error(), http.StatusInternalServerError)
		return
	}
	
	// Salvar o NPC gerado no banco
	err = h.DB.CreateNPC(r.Context(), npc)
	if err != nil {
		http.Error(w, "Failed to save generated NPC: "+err.Error(), http.StatusInternalServerError)
		return
	}
	
	// Responder com JSON
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(npc)
}