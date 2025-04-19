package python

import (
	"context"
	"fmt"
	"net/http"

	"rpg-saas-backend/internal/models"
)

func (c *Client) GenerateTreasure(ctx context.Context, request models.TreasureRequest) (*models.Treasure, error) {
	var response struct {
		Level      int     `json:"level"`
		TotalValue float64 `json:"total_value"`
		Hoards     []struct {
			Coins     map[string]int `json:"coins"`
			Valuables []struct {
				Type  string  `json:"type"`
				Name  string  `json:"name"`
				Value float64 `json:"value"`
				Rank  string  `json:"rank"`
			} `json:"valueables"`
			Items []struct {
				Type     string `json:"type"`
				Category string `json:"category"`
				Name     string `json:"name"`
				Rank     string `json:"rank"`
			} `json:"items"`
			Value float64 `json:"value"`
		} `json:"hoards"`
	}

	if err := c.makeRequest(ctx, http.MethodPost, "/generate-loot", request, &response); err != nil {
		return nil, fmt.Errorf("error generating treasure: %w", err)
	}

	treasure := &models.Treasure{
		Level:      response.Level,
		TotalValue: int(response.TotalValue),
		Name:       fmt.Sprintf("Level %d Treasute", response.Level),
		Hoards:     make([]models.Hoard, len(response.Hoards)),
	}

	// Process each hoard
	for i, responseHoard := range response.Hoards {
		hoard := models.Hoard{
			Value: responseHoard.Value,
			Coins: models.JSONB{},
		}

		// Add coins
		for coinType, amount := range responseHoard.Coins {
			hoard.Coins[coinType] = amount
		}

		treasure.Hoards[i] = hoard
	}

	return treasure, nil
}
