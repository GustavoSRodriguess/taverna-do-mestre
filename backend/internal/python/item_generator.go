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
			} `json:"valuables"`
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
		Name:       fmt.Sprintf("Level %d Treasure", response.Level),
		Hoards:     make([]models.Hoard, len(response.Hoards)),
	}

	for i, responseHoard := range response.Hoards {
		hoard := models.Hoard{
			Value:     responseHoard.Value,
			Coins:     models.JSONB{},
			Valuables: make([]models.Item, len(responseHoard.Valuables)),
			Items:     make([]models.Item, len(responseHoard.Items)),
		}

		for coinType, amount := range responseHoard.Coins {
			hoard.Coins[coinType] = amount
		}

		for j, valuable := range responseHoard.Valuables {
			hoard.Valuables[j] = models.Item{
				Name:  valuable.Name,
				Type:  valuable.Type,
				Value: valuable.Value,
				Rank:  valuable.Rank,
			}
		}

		for j, item := range responseHoard.Items {
			hoard.Items[j] = models.Item{
				Name:     item.Name,
				Type:     item.Type,
				Category: item.Category,
				Rank:     item.Rank,
				Value:    0, // Magic items might not have a direct GP value here, depends on Python service
				// HoardID and ID will be set when saving to DB
			}
		}
		treasure.Hoards[i] = hoard
	}

	return treasure, nil
}
