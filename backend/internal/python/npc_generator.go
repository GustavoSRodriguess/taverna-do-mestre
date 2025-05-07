package python

import (
	"context"
	"fmt"
	"net/http"

	"rpg-saas-backend/internal/models"
)

// NPCRequest defines the structure for the request to the Python NPC generation service.
// It includes fields for both automatic and manual generation.
type NPCRequest struct {
	Level            int    `json:"level"`
	AttributesMethod string `json:"attributes_method,omitempty"` // Used for non-manual generation
	Manual           bool   `json:"manual"`
	Race             string `json:"race,omitempty"`       // Used for manual generation
	Class            string `json:"class,omitempty"`      // Used for manual generation
	Background       string `json:"background,omitempty"` // Used for manual generation
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

// GenerateNPC calls the Python service to generate an NPC.
// It now accepts race, class, and background for manual generation.
func (c *Client) GenerateNPC(ctx context.Context, level int, attributesMethod string, manual bool, race string, class string, background string) (*models.NPC, error) {
	request := NPCRequest{
		Level:            level,
		AttributesMethod: attributesMethod,
		Manual:           manual,
	}

	if manual {
		request.Race = race
		request.Class = class
		request.Background = background
		// attributesMethod might still be relevant for manual if Python service uses it
		// or it could be ignored by Python if manual implies specific stat handling.
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
		Background:  response.Background, // Ensure this is populated from response
		Attributes:  attributes,
		Abilities:   abilities,
		Equipment:   equipment,
		HP:          response.HP,
		CA:          response.CA,
	}

	return npc, nil
}
