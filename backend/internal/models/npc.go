// internal/models/npc.go
package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"
)

// JSONB é um tipo personalizado para lidar com JSONB do PostgreSQL
type JSONB map[string]interface{}

// Value converte JSONB para formato adequado para o driver do BD
func (j JSONB) Value() (driver.Value, error) {
	if j == nil {
		return nil, nil
	}
	return json.Marshal(j)
}

// Scan converte do formato do BD para JSONB
func (j *JSONB) Scan(value interface{}) error {
	if value == nil {
		*j = nil
		return nil
	}
	
	s, ok := value.([]byte)
	if !ok {
		return errors.New("invalid scan source for JSONB")
	}
	
	return json.Unmarshal(s, j)
}

// NPC representa um personagem não jogável
type NPC struct {
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
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

// PC representa um personagem jogável
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

// Race representa uma raça de personagem
type Race struct {
	ID          int       `json:"id" db:"id"`
	Name        string    `json:"name" db:"name"`
	Description string    `json:"description" db:"description"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

// Class representa uma classe de personagem
type Class struct {
	ID          int       `json:"id" db:"id"`
	Name        string    `json:"name" db:"name"`
	Description string    `json:"description" db:"description"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

// Encounter representa um encontro
type Encounter struct {
	ID          int       `json:"id" db:"id"`
	Theme       string    `json:"theme" db:"theme"`
	Difficulty  string    `json:"difficulty" db:"difficulty"`
	TotalXP     int       `json:"total_xp" db:"total_xp"`
	PlayerLevel int       `json:"player_level" db:"player_level"`
	PlayerCount int       `json:"player_count" db:"player_count"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	Monsters    []Monster `json:"monsters,omitempty"` // Relacionamento
}

// Monster representa um monstro em um encontro
type Monster struct {
	ID          int       `json:"id" db:"id"`
	EncounterID int       `json:"encounter_id" db:"encounter_id"`
	Name        string    `json:"name" db:"name"`
	XP          int       `json:"xp" db:"xp"`
	CR          float64   `json:"cr" db:"cr"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

// Map representa um mapa do jogo
type Map struct {
	ID        int       `json:"id" db:"id"`
	Name      string    `json:"name" db:"name"`
	Width     int       `json:"width" db:"width"`
	Height    int       `json:"height" db:"height"`
	Scale     float64   `json:"scale" db:"scale"`
	Data      JSONB     `json:"data" db:"data"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}