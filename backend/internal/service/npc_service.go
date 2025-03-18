package service

import (
	"fmt"
	"log"

	"rpg-saas-backend/internal/models"
	"rpg-saas-backend/internal/repository"
)

// NPCService implementa a lógica de negócio para NPCs
type NPCService struct {
	repo         *repository.NPCRepository
	pythonClient *PythonClient
}

// NewNPCService cria um novo serviço para NPCs
func NewNPCService(repo *repository.NPCRepository, pythonClient *PythonClient) *NPCService {
	return &NPCService{
		repo:         repo,
		pythonClient: pythonClient,
	}
}

// GetAll retorna todos os NPCs
func (s *NPCService) GetAll() ([]models.NPC, error) {
	return s.repo.GetAll()
}

// GetByID retorna um NPC específico pelo ID
func (s *NPCService) GetByID(id int) (models.NPC, error) {
	return s.repo.GetByID(id)
}

// Create cria um novo NPC
func (s *NPCService) Create(npc models.NPC) (models.NPC, error) {
	id, err := s.repo.Create(npc)
	if err != nil {
		return models.NPC{}, err
	}
	
	npc.ID = id
	return npc, nil
}

// Update atualiza um NPC existente
func (s *NPCService) Update(id int, npc models.NPC) error {
	return s.repo.Update(id, npc)
}

// Delete remove um NPC
func (s *NPCService) Delete(id int) error {
	return s.repo.Delete(id)
}

// GenerateNPC gera um novo NPC usando a API Python
func (s *NPCService) GenerateNPC(req models.NPCGenRequest) (models.NPC, error) {
	// Validações básicas
	if req.Level < 1 {
		req.Level = 1
	} else if req.Level > 20 {
		req.Level = 20
	}

	if req.AttributesMethod == "" {
		req.AttributesMethod = "rolagem"
	}

	// Chama a API Python para gerar o NPC
	npc, err := s.pythonClient.GenerateNPC(req.Level, req.AttributesMethod, req.Manual)
	if err != nil {
		return models.NPC{}, fmt.Errorf("erro ao gerar NPC via Python: %w", err)
	}

	// Tenta salvar o NPC gerado
	id, err := s.repo.Create(npc)
	if err != nil {
		// Log do erro, mas continua retornando o NPC gerado
		log.Printf("Aviso: NPC gerado com sucesso, mas falha ao salvar no banco: %v", err)
		return npc, nil
	}

	npc.ID = id
	return npc, nil
}