package python

import (
	"context"
	"fmt"
	"net/http"

	"rpg-saas-backend/internal/models"
)

func (c *Client) GenerateTreasure(ctx context.Context, request models.TreasureRequest) (*models.Treasure, error) {
	// Mapeamento correto para o formato esperado pelo Python
	pythonRequest := map[string]interface{}{
		"level":             request.Level,
		"coin_type":         request.CoinType,
		"valuable_type":     request.ValuableType,
		"item_type":         request.ItemType,
		"more_random_coins": request.MoreRandomCoins,
		"trade":             request.Trade,
		"gems":              request.Gems,
		"art_objects":       request.ArtObjects,
		"magic_items":       request.MagicItems,
		"psionic_items":     request.PsionicItems,
		"chaositech_items":  request.ChaositechItems,
		"ranks":             request.Ranks,
		"max_value":         request.MaxValue,
		"combine_hoards":    request.CombineHoards,
		"quantity":          request.Quantity,
	}

	// CORREÇÃO: Só adicionar magic_item_categories se magic_items for true
	if request.MagicItems && len(request.MagicItemCategories) > 0 {
		pythonRequest["magic_item_categories"] = request.MagicItemCategories
	} else if request.MagicItems {
		// Se magic_items é true mas não há categorias especificadas, usar todas
		pythonRequest["magic_item_categories"] = []string{"armor", "weapons", "potions", "rings", "rods", "scrolls", "staves", "wands", "wondrous"}
	} else {
		// Se magic_items é false, enviar lista vazia
		pythonRequest["magic_item_categories"] = []string{}
	}

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

	if err := c.makeRequest(ctx, http.MethodPost, "/generate-loot", pythonRequest, &response); err != nil {
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
			Valuables: make([]models.Item, 0),
			Items:     make([]models.Item, 0),
		}

		// Adicionar coins
		for coinType, amount := range responseHoard.Coins {
			hoard.Coins[coinType] = amount
		}

		// Adicionar valuables (gems e art objects)
		for _, valuable := range responseHoard.Valuables {
			hoard.Valuables = append(hoard.Valuables, models.Item{
				Name:  valuable.Name,
				Type:  valuable.Type,
				Value: valuable.Value,
				Rank:  valuable.Rank,
			})
		}

		// Adicionar magic items
		for _, item := range responseHoard.Items {
			hoard.Items = append(hoard.Items, models.Item{
				Name:     item.Name,
				Type:     item.Type,
				Category: item.Category,
				Rank:     item.Rank,
				Value:    0, // Magic items não têm valor direto em GP
			})
		}

		treasure.Hoards[i] = hoard
	}

	return treasure, nil
}
