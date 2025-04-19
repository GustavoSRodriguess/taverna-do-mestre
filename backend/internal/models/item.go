package models

import (
	"time"
)

type Treasure struct {
	ID         int       `json:"id" db:"id"`
	Level      int       `json:"level" db:"level"`
	Name       string    `json:"name" db:"name"`
	TotalValue int       `json:"total_value" db:"total_value"`
	Hoards     []Hoard   `json:"hoards,omitempty"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
}

type Hoard struct {
	ID         int       `json:"id" db:"id"`
	TreasureID int       `json:"treasure_id" db:"treasure_id"`
	Value      float64   `json:"value" db:"value"`
	Coins      JSONB     `json:"coins" db:"coins"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
}

type Item struct {
	ID        int       `json:"id" db:"id"`
	HoardID   int       `json:"hoard_id" db:"hoard_id"`
	Name      string    `json:"name" db:"name"`
	Type      string    `json:"type" db:"type"`         // "magic_item", "gem", "art_object"
	Category  string    `json:"category" db:"category"` // For magic items: armor, weapon, etc.
	Value     float64   `json:"value" db:"value"`
	Rank      string    `json:"rank" db:"rank"` // minor, medium, major
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

type TreasureRequest struct {
	Level               int      `json:"level"`
	CoinType            string   `json:"coin_type"`
	ValuableType        string   `json:"valuable_type"`
	ItemType            string   `json:"item_type"`
	MoreRandomCoins     bool     `json:"more_random_coins"`
	Trade               string   `json:"trade"`
	Gems                bool     `json:"gems"`
	ArtObjects          bool     `json:"art_objects"`
	MagicItems          bool     `json:"magic_items"`
	PsionicItems        bool     `json:"psionic_items"`
	ChaositechItems     bool     `json:"chaositech_items"`
	MagicItemCategories []string `json:"magic_item_categories"`
	Ranks               []string `json:"ranks"`
	MaxValue            int      `json:"max_value"`
	CombineHoards       bool     `json:"combine_hoards"`
	Quantity            int      `json:"quantity"`
}
