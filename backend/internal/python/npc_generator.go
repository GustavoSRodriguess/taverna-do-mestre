package python

import (
	"context"
	"fmt"
	"net/http"
	
	"rpg-saas-backend/internal/models"
)

// NPCRequest contém os parâmetros para gerar um NPC
type NPCRequest struct {
	Level            int    `json:"level"`
	AttributesMethod string `json:"attributes_method"`
	Manual           bool   `json:"manual"`
}

// NPCResponse contém a resposta da API de geração de NPC
type NPCResponse struct {
	Name        string              `json:"name"`
	Description string              `json:"description"`
	Level       int                 `json:"level"`
	Race        string              `json:"race"`
	Class       string              `json:"class"`
	Attributes  models.JSONB        `json:"attributes"`
	Abilities   models.JSONB        `json:"abilities"`
	Equipment   models.JSONB        `json:"equipment"`
	HP          int                 `json:"hp"`
	CA          int                 `json:"ca"`
	Spells      []string            `json:"spells,omitempty"`
}

// GenerateNPC chama o serviço Python para gerar um NPC
func (c *Client) GenerateNPC(ctx context.Context, level int, attributesMethod string, manual bool) (*models.NPC, error) {
	request := NPCRequest{
		Level:            level,
		AttributesMethod: attributesMethod,
		Manual:           manual,
	}
	
	var response NPCResponse
	if err := c.makeRequest(ctx, http.MethodPost, "/generate-npc", request, &response); err != nil {
		return nil, fmt.Errorf("failed to generate NPC: %w", err)
	}
	
	// Converte a resposta para o modelo NPC
	npc := &models.NPC{
		Name:        response.Name,
		Description: response.Description,
		Level:       response.Level,
		Race:        response.Race,
		Class:       response.Class,
		Attributes:  response.Attributes,
		Abilities:   response.Abilities,
		Equipment:   response.Equipment,
		HP:          response.HP,
		CA:          response.CA,
	}
	
	// Se houver magias, adiciona ao campo abilities
	if len(response.Spells) > 0 {
		if npc.Abilities == nil {
			npc.Abilities = models.JSONB{}
		}
		npc.Abilities["spells"] = response.Spells
	}
	
	return npc, nil
}