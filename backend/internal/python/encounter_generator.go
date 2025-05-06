package python

import (
	"context"
	"fmt"
	"net/http"

	"rpg-saas-backend/internal/models"
)

type EncounterRequest struct {
	PlayerLevel int    `json:"player_level"`
	PlayerCount int    `json:"player_count"`
	Difficulty  string `json:"difficulty"`
}

type MonsterResponse struct {
	Name string  `json:"name"`
	XP   int     `json:"xp"`
	CR   float64 `json:"cr"`
}

type EncounterResponse struct {
	Theme       string            `json:"theme"`
	Difficulty  string            `json:"difficulty"`
	TotalXP     int               `json:"total_xp"`
	PlayerLevel int               `json:"player_level"`
	PlayerCount int               `json:"player_count"`
	Monsters    []MonsterResponse `json:"monsters"`
}

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

	encounter := &models.Encounter{
		Theme:       response.Theme,
		Difficulty:  response.Difficulty,
		TotalXP:     response.TotalXP,
		PlayerLevel: response.PlayerLevel,
		PlayerCount: response.PlayerCount,
		Monsters:    make([]models.Monster, len(response.Monsters)),
	}

	for i, monster := range response.Monsters {
		encounter.Monsters[i] = models.Monster{
			Name: monster.Name,
			XP:   monster.XP,
			CR:   monster.CR,
		}
	}

	return encounter, nil
}
