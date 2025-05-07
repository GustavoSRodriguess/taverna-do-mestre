package models

import (
	"time"
)

type NPC struct {
	ID          int       `json:"id" db:"id"`
	Name        string    `json:"name" db:"name"`
	Description string    `json:"description" db:"description"`
	Level       int       `json:"level" db:"level"`
	Race        string    `json:"race" db:"race"`
	Class       string    `json:"class" db:"class"`
	Background  string    `json:"background" db:"background"`
	Attributes  JSONB     `json:"attributes" db:"attributes"`
	Abilities   JSONB     `json:"abilities" db:"abilities"`
	Equipment   JSONB     `json:"equipment" db:"equipment"`
	HP          int       `json:"hp" db:"hp"`
	CA          int       `json:"ca" db:"ca"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

type PC struct {
	ID          int       `json:"id" db:"id"`
	Name        string    `json:"name" db:"name"`
	Description string    `json:"description" db:"description"`
	Level       int       `json:"level" db:"level"`
	Race        string    `json:"race" db:"race"`
	Class       string    `json:"class" db:"class"`
	Attributes  JSONB     `json:"attributes" db:"attributes"`
	Abilities   JSONB     `json:"abilities" db:"abilities"`
	Equipment   JSONB     `json:"equipment" db:"equipment"`
	HP          int       `json:"hp" db:"hp"`
	CA          int       `json:"ca" db:"ca"`
	PlayerName  string    `json:"player_name" db:"player_name"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

type Race struct {
	ID          int       `json:"id" db:"id"`
	Name        string    `json:"name" db:"name"`
	Description string    `json:"description" db:"description"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

type Class struct {
	ID          int       `json:"id" db:"id"`
	Name        string    `json:"name" db:"name"`
	Description string    `json:"description" db:"description"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

type Encounter struct {
	ID          int       `json:"id" db:"id"`
	Theme       string    `json:"theme" db:"theme"`
	Difficulty  string    `json:"difficulty" db:"difficulty"`
	TotalXP     int       `json:"total_xp" db:"total_xp"`
	PlayerLevel int       `json:"player_level" db:"player_level"`
	PlayerCount int       `json:"player_count" db:"player_count"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	Monsters    []Monster `json:"monsters,omitempty"`
}

type Monster struct {
	ID          int       `json:"id" db:"id"`
	EncounterID int       `json:"encounter_id" db:"encounter_id"`
	Name        string    `json:"name" db:"name"`
	XP          int       `json:"xp" db:"xp"`
	CR          float64   `json:"cr" db:"cr"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

type Map struct {
	ID        int       `json:"id" db:"id"`
	Name      string    `json:"name" db:"name"`
	Width     int       `json:"width" db:"width"`
	Height    int       `json:"height" db:"height"`
	Scale     float64   `json:"scale" db:"scale"`
	Data      JSONB     `json:"data" db:"data"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}
