package models

import (
	"time"

	"github.com/lib/pq"
)

type PC struct {
	ID                int            `json:"id" db:"id"`
	Name              string         `json:"name" db:"name"`
	Description       string         `json:"description" db:"description"`
	Level             int            `json:"level" db:"level"`
	Race              string         `json:"race" db:"race"`
	Class             string         `json:"class" db:"class"`
	Background        string         `json:"background" db:"background"`
	Alignment         string         `json:"alignment" db:"alignment"`
	Attributes        JSONB          `json:"attributes" db:"attributes"`
	Abilities         JSONB          `json:"abilities" db:"abilities"`
	Equipment         JSONB          `json:"equipment" db:"equipment"`
	HP                int            `json:"hp" db:"hp"`
	CurrentHP         *int           `json:"current_hp" db:"current_hp"`
	CA                int            `json:"ca" db:"ca"`
	ProficiencyBonus  int            `json:"proficiency_bonus" db:"proficiency_bonus"`
	Inspiration       bool           `json:"inspiration" db:"inspiration"`
	Skills            JSONB          `json:"skills" db:"skills"`
	Attacks           JSONB          `json:"attacks" db:"attacks"`
	Spells            JSONB          `json:"spells" db:"spells"`
	PersonalityTraits string         `json:"personality_traits" db:"personality_traits"`
	Ideals            string         `json:"ideals" db:"ideals"`
	Bonds             string         `json:"bonds" db:"bonds"`
	Flaws             string         `json:"flaws" db:"flaws"`
	Features          pq.StringArray `json:"features" db:"features"`
	PlayerName        string         `json:"player_name" db:"player_name"`
	PlayerID          int            `json:"player_id" db:"player_id"`
	CreatedAt         time.Time      `json:"created_at" db:"created_at"`
}

// Requests para criação e atualização de PCs
type CreatePCRequest struct {
	Name              string   `json:"name" binding:"required"`
	Description       string   `json:"description"`
	Level             int      `json:"level" binding:"required,min=1,max=20"`
	Race              string   `json:"race" binding:"required"`
	Class             string   `json:"class" binding:"required"`
	Background        string   `json:"background"`
	Alignment         string   `json:"alignment"`
	Attributes        JSONB    `json:"attributes"`
	Abilities         JSONB    `json:"abilities"`
	Equipment         JSONB    `json:"equipment"`
	HP                int      `json:"hp"`
	CurrentHP         *int     `json:"current_hp"`
	CA                int      `json:"ca"`
	ProficiencyBonus  int      `json:"proficiency_bonus"`
	Inspiration       bool     `json:"inspiration"`
	Skills            JSONB    `json:"skills"`
	Attacks           JSONB    `json:"attacks"`
	Spells            JSONB    `json:"spells"`
	PersonalityTraits string   `json:"personality_traits"`
	Ideals            string   `json:"ideals"`
	Bonds             string   `json:"bonds"`
	Flaws             string   `json:"flaws"`
	Features          []string `json:"features"`
	PlayerName        string   `json:"player_name"`
}

type UpdatePCRequest struct {
	Name              string   `json:"name"`
	Description       string   `json:"description"`
	Level             int      `json:"level"`
	Race              string   `json:"race"`
	Class             string   `json:"class"`
	Background        string   `json:"background"`
	Alignment         string   `json:"alignment"`
	Attributes        JSONB    `json:"attributes"`
	Abilities         JSONB    `json:"abilities"`
	Equipment         JSONB    `json:"equipment"`
	HP                int      `json:"hp"`
	CurrentHP         *int     `json:"current_hp"`
	CA                int      `json:"ca"`
	ProficiencyBonus  int      `json:"proficiency_bonus"`
	Inspiration       bool     `json:"inspiration"`
	Skills            JSONB    `json:"skills"`
	Attacks           JSONB    `json:"attacks"`
	Spells            JSONB    `json:"spells"`
	PersonalityTraits string   `json:"personality_traits"`
	Ideals            string   `json:"ideals"`
	Bonds             string   `json:"bonds"`
	Flaws             string   `json:"flaws"`
	Features          []string `json:"features"`
	PlayerName        string   `json:"player_name"`
}

type GeneratePCRequest struct {
	Level            int    `json:"level" binding:"required,min=1,max=20"`
	AttributesMethod string `json:"attributes_method,omitempty"` // "rolagem", "array", "compra"
	Manual           bool   `json:"manual"`
	Race             string `json:"race,omitempty"`
	Class            string `json:"class,omitempty"`
	Background       string `json:"background,omitempty"`
	PlayerName       string `json:"player_name,omitempty"`
}

// PCWithCampaigns combina PC com informações de campanhas
type PCWithCampaigns struct {
	PC        `json:",inline"`
	Campaigns []CampaignSummary `json:"campaigns,omitempty"`
}

// PCStats representa estatísticas calculadas de um PC
type PCStats struct {
	PCID               int                    `json:"pc_id"`
	Name               string                 `json:"name"`
	Level              int                    `json:"level"`
	Class              string                 `json:"class"`
	Race               string                 `json:"race"`
	TotalCampaigns     int                    `json:"total_campaigns"`
	ActiveCampaigns    int                    `json:"active_campaigns"`
	AttributeModifiers map[string]int         `json:"attribute_modifiers"`
	Skills             map[string]interface{} `json:"skills,omitempty"`
}

// Funções auxiliares para calcular modificadores
func CalculateModifier(score int) int {
	return (score - 10) / 2
}

// GetAttributeModifiers retorna os modificadores calculados dos atributos
func (pc *PC) GetAttributeModifiers() map[string]int {
	modifiers := make(map[string]int)

	if pc.Attributes == nil {
		return modifiers
	}

	attributes := []string{"strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"}

	for _, attr := range attributes {
		if value, exists := pc.Attributes[attr]; exists {
			if score, ok := value.(float64); ok {
				modifiers[attr] = CalculateModifier(int(score))
			} else if score, ok := value.(int); ok {
				modifiers[attr] = CalculateModifier(score)
			}
		}
	}

	return modifiers
}

// IsValidLevel verifica se o nível do PC é válido
func (pc *PC) IsValidLevel() bool {
	return pc.Level >= 1 && pc.Level <= 20
}

// GetProficiencyBonus retorna o bônus de proficiência baseado no nível
func (pc *PC) GetProficiencyBonus() int {
	switch {
	case pc.Level >= 17:
		return 6
	case pc.Level >= 13:
		return 5
	case pc.Level >= 9:
		return 4
	case pc.Level >= 5:
		return 3
	default:
		return 2
	}
}
