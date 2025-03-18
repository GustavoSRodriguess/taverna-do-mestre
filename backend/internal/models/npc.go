package models

import "time"

type NPC struct {
	ID          int                `json:"id,omitempty"`
	Name        string             `json:"name"`
	Description string             `json:"description"`
	Level       int                `json:"level"`
	Race        string             `json:"race"`
	Class       string             `json:"class"`
	Attributes  map[string]int     `json:"attributes"`
	Abilities   []string           `json:"abilities"`
	Equipment   []string           `json:"equipment"`
	HP          int                `json:"hp"`
	CA          int                `json:"ca"`
	CreatedAt   time.Time          `json:"created_at,omitempty"`
}

type NPCGenRequest struct {
	Level            int    `json:"level"`
	AttributesMethod string `json:"attributes_method"`
	Manual           bool   `json:"manual"`
}