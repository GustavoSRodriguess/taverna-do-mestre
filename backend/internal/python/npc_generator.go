package python

import (
	"context"
	"fmt"
	"net/http"

	"rpg-saas-backend/internal/models"
)

type NPCRequest struct {
	Level            int    `json:"level"`
	AttributesMethod string `json:"attributes_method"`
	Manual           bool   `json:"manual"`
}

type NPCResponse struct {
	Name        string              `json:"name"`
	Description string              `json:"description"`
	Level       int                 `json:"level"`
	Race        string              `json:"race"`
	Class       string              `json:"class"`
	Background  string              `json:"background"`
	Attributes  map[string]int      `json:"attributes"`
	Modifiers   map[string]int      `json:"modifiers"`
	Abilities   []string            `json:"abilities"`
	Equipment   []string            `json:"equipment"`
	HP          int                 `json:"hp"`
	CA          int                 `json:"ca"`
	Spells      map[string][]string `json:"spells,omitempty"`
}

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

	attributes := models.JSONB{}
	for k, v := range response.Attributes {
		attributes[k] = v
	}

	abilities := models.JSONB{
		"abilities": response.Abilities,
	}

	equipment := models.JSONB{
		"items": response.Equipment,
	}

	if len(response.Spells) > 0 {
		abilities["spells"] = response.Spells
	}

	npc := &models.NPC{
		Name:        response.Name,
		Description: response.Description,
		Level:       response.Level,
		Race:        response.Race,
		Class:       response.Class,
		Attributes:  attributes,
		Abilities:   abilities,
		Equipment:   equipment,
		HP:          response.HP,
		CA:          response.CA,
	}

	return npc, nil
}
