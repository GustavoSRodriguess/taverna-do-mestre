// internal/python/encounter_generator.go
package python

import (
	"context"
	"fmt"
	"net/http"
	
	"rpg-saas-backend/internal/models"
)

// EncounterRequest contém os parâmetros para gerar um encontro
type EncounterRequest struct {
	PlayerLevel int    `json:"player_level"`
	PlayerCount int    `json:"player_count"`
	Difficulty  string `json:"difficulty"`
}

// MonsterResponse contém dados de um monstro no formato da resposta do Python
type MonsterResponse struct {
	Name string  `json:"name"`
	XP   int     `json:"xp"`
	CR   float64 `json:"cr"`
}

// EncounterResponse contém a resposta da API de geração de encontro
type EncounterResponse struct {
	Theme       string            `json:"theme"`
	Difficulty  string            `json:"difficulty"`
	TotalXP     int               `json:"total_xp"`
	PlayerLevel int               `json:"player_level"`
	PlayerCount int               `json:"player_count"`
	Monsters    []MonsterResponse `json:"monsters"`
}

// GenerateEncounter chama o serviço Python para gerar um encontro
func (c *Client) GenerateEncounter(ctx context.Context, playerLevel, playerCount int, difficulty string) (*models.Encounter, error) {
	request := EncounterRequest{
		PlayerLevel: playerLevel,
		PlayerCount: playerCount,
		Difficulty:  difficulty,
	}
	
	var response EncounterResponse
	if err := c.makeRequest(ctx, http.MethodPost, "/generate-encounter", request, &response); err != nil {
		return nil, fmt.Errorf("failed to generate encounter: %w", err)
	}
	
	// Converte a resposta para o modelo Encounter
	encounter := &models.Encounter{
		Theme:       response.Theme,
		Difficulty:  response.Difficulty,
		TotalXP:     response.TotalXP,
		PlayerLevel: response.PlayerLevel,
		PlayerCount: response.PlayerCount,
		Monsters:    make([]models.Monster, len(response.Monsters)),
	}
	
	// Converte cada monstro
	for i, monster := range response.Monsters {
		encounter.Monsters[i] = models.Monster{
			Name: monster.Name,
			XP:   monster.XP,
			CR:   monster.CR,
		}
	}
	
	return encounter, nil
}