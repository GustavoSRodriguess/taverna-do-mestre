package models

import (
	"encoding/json"
	"testing"
	"time"
)

func TestTreasure_JSON(t *testing.T) {
	now := time.Now()
	treasure := Treasure{
		ID:         1,
		Name:       "Dragon's Hoard",
		Level:      10,
		TotalValue: 10000,
		CreatedAt:  now,
	}

	data, err := json.Marshal(treasure)
	if err != nil {
		t.Fatalf("failed to marshal treasure: %v", err)
	}

	var decoded Treasure
	if err := json.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("failed to unmarshal treasure: %v", err)
	}

	if decoded.ID != treasure.ID {
		t.Errorf("expected ID %d, got %d", treasure.ID, decoded.ID)
	}
	if decoded.Name != treasure.Name {
		t.Errorf("expected Name %s, got %s", treasure.Name, decoded.Name)
	}
	if decoded.TotalValue != treasure.TotalValue {
		t.Errorf("expected TotalValue %d, got %d", treasure.TotalValue, decoded.TotalValue)
	}
}

func TestHoard_JSON(t *testing.T) {
	now := time.Now()
	hoard := Hoard{
		ID:         1,
		TreasureID: 1,
		Value:      5000,
		Coins:      JSONB{},
		CreatedAt:  now,
	}

	data, err := json.Marshal(hoard)
	if err != nil {
		t.Fatalf("failed to marshal hoard: %v", err)
	}

	var decoded Hoard
	if err := json.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("failed to unmarshal hoard: %v", err)
	}

	if decoded.ID != hoard.ID {
		t.Errorf("expected ID %d, got %d", hoard.ID, decoded.ID)
	}
	if decoded.TreasureID != hoard.TreasureID {
		t.Errorf("expected TreasureID %d, got %d", hoard.TreasureID, decoded.TreasureID)
	}
	if decoded.Value != hoard.Value {
		t.Errorf("expected Value %f, got %f", hoard.Value, decoded.Value)
	}
}

func TestItem_JSON(t *testing.T) {
	now := time.Now()
	item := Item{
		ID:        1,
		HoardID:   1,
		Name:      "Longsword",
		Type:      "weapon",
		Category:  "martial",
		Value:     15,
		Rank:      "common",
		CreatedAt: now,
	}

	data, err := json.Marshal(item)
	if err != nil {
		t.Fatalf("failed to marshal item: %v", err)
	}

	var decoded Item
	if err := json.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("failed to unmarshal item: %v", err)
	}

	if decoded.ID != item.ID {
		t.Errorf("expected ID %d, got %d", item.ID, decoded.ID)
	}
	if decoded.Name != item.Name {
		t.Errorf("expected Name %s, got %s", item.Name, decoded.Name)
	}
	if decoded.Value != item.Value {
		t.Errorf("expected Value %f, got %f", item.Value, decoded.Value)
	}
}

func TestTreasureRequest(t *testing.T) {
	req := TreasureRequest{
		Level:               5,
		CoinType:            "gold",
		ValuableType:        "gems",
		ItemType:            "magic",
		MoreRandomCoins:     true,
		Trade:               "standard",
		Gems:                true,
		ArtObjects:          true,
		MagicItems:          true,
		PsionicItems:        false,
		ChaositechItems:     false,
		MagicItemCategories: []string{"weapon", "armor"},
		Ranks:               []string{"common", "uncommon"},
		MaxValue:            1000,
		CombineHoards:       false,
		Quantity:            1,
	}

	if req.Level != 5 {
		t.Errorf("expected Level 5, got %d", req.Level)
	}
	if req.CoinType != "gold" {
		t.Errorf("expected CoinType 'gold', got %s", req.CoinType)
	}
	if !req.Gems {
		t.Error("expected Gems to be true")
	}
}

func TestTreasure_WithHoards(t *testing.T) {
	treasure := Treasure{
		ID:         1,
		Name:       "Test Treasure",
		Level:      5,
		TotalValue: 1000,
		Hoards: []Hoard{
			{ID: 1, TreasureID: 1, Value: 500},
			{ID: 2, TreasureID: 1, Value: 500},
		},
	}

	if len(treasure.Hoards) != 2 {
		t.Errorf("expected 2 hoards, got %d", len(treasure.Hoards))
	}
	if treasure.Hoards[0].Value != 500 {
		t.Errorf("expected first hoard value 500, got %f", treasure.Hoards[0].Value)
	}
}

func TestHoard_WithItems(t *testing.T) {
	hoard := Hoard{
		ID:         1,
		TreasureID: 1,
		Value:      1000,
		Items: []Item{
			{ID: 1, Name: "Sword", Value: 50},
			{ID: 2, Name: "Shield", Value: 30},
		},
		Valuables: []Item{
			{ID: 3, Name: "Ruby", Value: 500},
		},
	}

	if len(hoard.Items) != 2 {
		t.Errorf("expected 2 items, got %d", len(hoard.Items))
	}
	if len(hoard.Valuables) != 1 {
		t.Errorf("expected 1 valuable, got %d", len(hoard.Valuables))
	}
}
