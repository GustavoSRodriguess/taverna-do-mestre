package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"rpg-saas-backend/internal/models"
	"rpg-saas-backend/internal/service"
)

// NPCHandler gerencia requisições HTTP para NPCs
type NPCHandler struct {
	service *service.NPCService
}

// NewNPCHandler cria um novo handler para NPCs
func NewNPCHandler(service *service.NPCService) *NPCHandler {
	return &NPCHandler{service: service}
}

// GetAll lista todos os NPCs
func (h *NPCHandler) GetAll(c *gin.Context) {
	npcs, err := h.service.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status": "error",
			"message": "Erro ao buscar NPCs",
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data": npcs,
	})
}

// GetByID busca um NPC específico pelo ID
func (h *NPCHandler) GetByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": "error",
			"message": "ID inválido",
		})
		return
	}

	npc, err := h.service.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"status": "error",
			"message": "NPC não encontrado",
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data": npc,
	})
}

// Create cria um novo NPC
func (h *NPCHandler) Create(c *gin.Context) {
	var npc models.NPC
	if err := c.ShouldBindJSON(&npc); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": "error",
			"message": "Dados inválidos",
			"error": err.Error(),
		})
		return
	}

	// Validações básicas
	if npc.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": "error",
			"message": "Nome do NPC é obrigatório",
		})
		return
	}

	createdNPC, err := h.service.Create(npc)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status": "error",
			"message": "Erro ao criar NPC",
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"status": "success",
		"message": "NPC criado com sucesso",
		"data": createdNPC,
	})
}

// Update atualiza um NPC existente
func (h *NPCHandler) Update(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": "error",
			"message": "ID inválido",
		})
		return
	}

	var npc models.NPC
	if err := c.ShouldBindJSON(&npc); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": "error",
			"message": "Dados inválidos",
			"error": err.Error(),
		})
		return
	}

	if err := h.service.Update(id, npc); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status": "error",
			"message": "Erro ao atualizar NPC",
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"message": "NPC atualizado com sucesso",
	})
}

// Delete remove um NPC
func (h *NPCHandler) Delete(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": "error",
			"message": "ID inválido",
		})
		return
	}

	if err := h.service.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status": "error",
			"message": "Erro ao excluir NPC",
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"message": "NPC excluído com sucesso",
	})
}

// GenerateNPC gera um novo NPC usando a API Python
func (h *NPCHandler) GenerateNPC(c *gin.Context) {
	var req models.NPCGenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		// Define valores padrão se não forem fornecidos
		req.Level = 1
		req.AttributesMethod = "rolagem"
		req.Manual = false
	}

	npc, err := h.service.GenerateNPC(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status": "error",
			"message": "Erro ao gerar NPC",
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"message": "NPC gerado com sucesso",
		"data": npc,
	})
}