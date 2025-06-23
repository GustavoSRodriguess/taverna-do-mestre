package models

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"time"

	"github.com/lib/pq"
)

// ========================================
// TIPOS AUXILIARES PARA COMPATIBILIDADE
// ========================================

// JSONBFlexible pode ser tanto array quanto object
type JSONBFlexible json.RawMessage

func (j JSONBFlexible) Value() (driver.Value, error) {
	if j == nil {
		return nil, nil
	}
	return string(j), nil
}

func (j *JSONBFlexible) Scan(value interface{}) error {
	if value == nil {
		*j = nil
		return nil
	}

	switch v := value.(type) {
	case []byte:
		*j = JSONBFlexible(v)
		return nil
	case string:
		*j = JSONBFlexible(v)
		return nil
	default:
		return fmt.Errorf("cannot scan %T into JSONBFlexible", value)
	}
}

// ========================================
// STRUCTS BASEADAS NO SCHEMA SQL REAL
// ========================================

// DnDRace representa uma raça do D&D (baseado na tabela dnd_races)
type DnDRace struct {
	ID              int            `json:"id" db:"id"`
	APIIndex        string         `json:"api_index" db:"api_index"`
	Name            string         `json:"name" db:"name"`
	Speed           int            `json:"speed" db:"speed"`
	Size            string         `json:"size" db:"size"`
	SizeDescription string         `json:"size_description" db:"size_description"`
	AbilityBonuses  JSONBFlexible  `json:"ability_bonuses" db:"ability_bonuses"`
	Traits          JSONBFlexible  `json:"traits" db:"traits"`
	Languages       JSONBFlexible  `json:"languages" db:"languages"`
	Proficiencies   JSONBFlexible  `json:"proficiencies" db:"proficiencies"`
	Subraces        pq.StringArray `json:"subraces" db:"subraces"`
	CreatedAt       time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at" db:"updated_at"`
	APIVersion      string         `json:"api_version" db:"api_version"`
}

// DnDClass representa uma classe do D&D (baseado na tabela dnd_classes)
type DnDClass struct {
	ID                  int            `json:"id" db:"id"`
	APIIndex            string         `json:"api_index" db:"api_index"`
	Name                string         `json:"name" db:"name"`
	HitDie              int            `json:"hit_die" db:"hit_die"`
	Proficiencies       JSONBFlexible  `json:"proficiencies" db:"proficiencies"`
	SavingThrows        pq.StringArray `json:"saving_throws" db:"saving_throws"`
	Spellcasting        JSONBFlexible  `json:"spellcasting" db:"spellcasting"`
	SpellcastingAbility string         `json:"spellcasting_ability" db:"spellcasting_ability"`
	ClassLevels         JSONBFlexible  `json:"class_levels" db:"class_levels"`
	CreatedAt           time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt           time.Time      `json:"updated_at" db:"updated_at"`
	APIVersion          string         `json:"api_version" db:"api_version"`
}

// DnDSpell representa uma magia do D&D (baseado na tabela dnd_spells)
type DnDSpell struct {
	ID            int            `json:"id" db:"id"`
	APIIndex      string         `json:"api_index" db:"api_index"`
	Name          string         `json:"name" db:"name"`
	Level         int            `json:"level" db:"level"`
	School        string         `json:"school" db:"school"`
	CastingTime   string         `json:"casting_time" db:"casting_time"`
	Range         string         `json:"range" db:"range"`
	Components    string         `json:"components" db:"components"`
	Duration      string         `json:"duration" db:"duration"`
	Concentration bool           `json:"concentration" db:"concentration"`
	Ritual        bool           `json:"ritual" db:"ritual"`
	Description   string         `json:"description" db:"description"`
	HigherLevel   string         `json:"higher_level" db:"higher_level"`
	Material      string         `json:"material" db:"material"`
	Classes       pq.StringArray `json:"classes" db:"classes"`
	CreatedAt     time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at" db:"updated_at"`
	APIVersion    string         `json:"api_version" db:"api_version"`
}

// DnDEquipment representa equipamento do D&D (baseado na tabela dnd_equipment)
type DnDEquipment struct {
	ID                int            `json:"id" db:"id"`
	APIIndex          string         `json:"api_index" db:"api_index"`
	Name              string         `json:"name" db:"name"`
	EquipmentCategory string         `json:"equipment_category" db:"equipment_category"`
	CostQuantity      int            `json:"cost_quantity" db:"cost_quantity"`
	CostUnit          string         `json:"cost_unit" db:"cost_unit"`
	Weight            float64        `json:"weight" db:"weight"`
	WeaponCategory    string         `json:"weapon_category" db:"weapon_category"`
	WeaponRange       string         `json:"weapon_range" db:"weapon_range"`
	Damage            JSONBFlexible  `json:"damage" db:"damage"`
	Properties        pq.StringArray `json:"properties" db:"properties"`
	ArmorCategory     string         `json:"armor_category" db:"armor_category"`
	ArmorClass        JSONBFlexible  `json:"armor_class" db:"armor_class"`
	Description       string         `json:"description" db:"description"`
	Special           pq.StringArray `json:"special" db:"special"`
	CreatedAt         time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at" db:"updated_at"`
	APIVersion        string         `json:"api_version" db:"api_version"`
}

// DnDMonster representa um monstro do D&D (baseado na tabela dnd_monsters)
type DnDMonster struct {
	ID                    int            `json:"id" db:"id"`
	APIIndex              string         `json:"api_index" db:"api_index"`
	Name                  string         `json:"name" db:"name"`
	Size                  string         `json:"size" db:"size"`
	Type                  string         `json:"type" db:"type"`
	Subtype               string         `json:"subtype" db:"subtype"`
	Alignment             string         `json:"alignment" db:"alignment"`
	ArmorClass            int            `json:"armor_class" db:"armor_class"`
	HitPoints             int            `json:"hit_points" db:"hit_points"`
	HitDice               string         `json:"hit_dice" db:"hit_dice"`
	Speed                 JSONBFlexible  `json:"speed" db:"speed"`
	Strength              int            `json:"strength" db:"strength"`
	Dexterity             int            `json:"dexterity" db:"dexterity"`
	Constitution          int            `json:"constitution" db:"constitution"`
	Intelligence          int            `json:"intelligence" db:"intelligence"`
	Wisdom                int            `json:"wisdom" db:"wisdom"`
	Charisma              int            `json:"charisma" db:"charisma"`
	ChallengeRating       float64        `json:"challenge_rating" db:"challenge_rating"`
	XP                    int            `json:"xp" db:"xp"`
	ProficiencyBonus      int            `json:"proficiency_bonus" db:"proficiency_bonus"`
	DamageVulnerabilities pq.StringArray `json:"damage_vulnerabilities" db:"damage_vulnerabilities"`
	DamageResistances     pq.StringArray `json:"damage_resistances" db:"damage_resistances"`
	DamageImmunities      pq.StringArray `json:"damage_immunities" db:"damage_immunities"`
	ConditionImmunities   pq.StringArray `json:"condition_immunities" db:"condition_immunities"`
	Senses                JSONBFlexible  `json:"senses" db:"senses"`
	Languages             string         `json:"languages" db:"languages"`
	SpecialAbilities      JSONBFlexible  `json:"special_abilities" db:"special_abilities"`
	Actions               JSONBFlexible  `json:"actions" db:"actions"`
	LegendaryActions      JSONBFlexible  `json:"legendary_actions" db:"legendary_actions"`
	CreatedAt             time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt             time.Time      `json:"updated_at" db:"updated_at"`
	APIVersion            string         `json:"api_version" db:"api_version"`
}

// DnDBackground representa um background do D&D (baseado na tabela dnd_backgrounds)
type DnDBackground struct {
	ID                       int           `json:"id" db:"id"`
	APIIndex                 string        `json:"api_index" db:"api_index"`
	Name                     string        `json:"name" db:"name"`
	StartingProficiencies    JSONBFlexible `json:"starting_proficiencies" db:"starting_proficiencies"`
	LanguageOptions          JSONBFlexible `json:"language_options" db:"language_options"`
	StartingEquipment        JSONBFlexible `json:"starting_equipment" db:"starting_equipment"`
	StartingEquipmentOptions JSONBFlexible `json:"starting_equipment_options" db:"starting_equipment_options"`
	Feature                  JSONBFlexible `json:"feature" db:"feature"`
	PersonalityTraits        JSONBFlexible `json:"personality_traits" db:"personality_traits"`
	Ideals                   JSONBFlexible `json:"ideals" db:"ideals"`
	Bonds                    JSONBFlexible `json:"bonds" db:"bonds"`
	Flaws                    JSONBFlexible `json:"flaws" db:"flaws"`
	CreatedAt                time.Time     `json:"created_at" db:"created_at"`
	UpdatedAt                time.Time     `json:"updated_at" db:"updated_at"`
	APIVersion               string        `json:"api_version" db:"api_version"`
}

// DnDSkill representa uma skill do D&D (baseado na tabela dnd_skills)
type DnDSkill struct {
	ID           int       `json:"id" db:"id"`
	APIIndex     string    `json:"api_index" db:"api_index"`
	Name         string    `json:"name" db:"name"`
	Description  string    `json:"description" db:"description"`
	AbilityScore string    `json:"ability_score" db:"ability_score"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
	APIVersion   string    `json:"api_version" db:"api_version"`
}

// DnDFeature representa uma feature do D&D (baseado na tabela dnd_features)
type DnDFeature struct {
	ID            int           `json:"id" db:"id"`
	APIIndex      string        `json:"api_index" db:"api_index"`
	Name          string        `json:"name" db:"name"`
	Level         int           `json:"level" db:"level"`
	ClassName     string        `json:"class_name" db:"class_name"`
	SubclassName  string        `json:"subclass_name" db:"subclass_name"`
	Description   string        `json:"description" db:"description"`
	Prerequisites JSONBFlexible `json:"prerequisites" db:"prerequisites"`
	CreatedAt     time.Time     `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time     `json:"updated_at" db:"updated_at"`
	APIVersion    string        `json:"api_version" db:"api_version"`
}

// DnDLanguage representa um idioma do D&D (baseado na tabela dnd_languages)
type DnDLanguage struct {
	ID              int            `json:"id" db:"id"`
	APIIndex        string         `json:"api_index" db:"api_index"`
	Name            string         `json:"name" db:"name"`
	Type            string         `json:"type" db:"type"`
	Description     string         `json:"description" db:"description"`
	Script          string         `json:"script" db:"script"`
	TypicalSpeakers pq.StringArray `json:"typical_speakers" db:"typical_speakers"`
	CreatedAt       time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at" db:"updated_at"`
	APIVersion      string         `json:"api_version" db:"api_version"`
}

// DnDCondition representa uma condição do D&D (baseado na tabela dnd_conditions)
type DnDCondition struct {
	ID          int       `json:"id" db:"id"`
	APIIndex    string    `json:"api_index" db:"api_index"`
	Name        string    `json:"name" db:"name"`
	Description string    `json:"description" db:"description"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
	APIVersion  string    `json:"api_version" db:"api_version"`
}

// DnDSubrace representa uma sub-raça do D&D (baseado na tabela dnd_subraces)
type DnDSubrace struct {
	ID             int           `json:"id" db:"id"`
	APIIndex       string        `json:"api_index" db:"api_index"`
	Name           string        `json:"name" db:"name"`
	RaceName       string        `json:"race_name" db:"race_name"`
	Description    string        `json:"description" db:"description"`
	AbilityBonuses JSONBFlexible `json:"ability_bonuses" db:"ability_bonuses"`
	Traits         JSONBFlexible `json:"traits" db:"traits"`
	Proficiencies  JSONBFlexible `json:"proficiencies" db:"proficiencies"`
	CreatedAt      time.Time     `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time     `json:"updated_at" db:"updated_at"`
	APIVersion     string        `json:"api_version" db:"api_version"`
}

// DnDMagicItem representa um item mágico do D&D (baseado na tabela dnd_magic_items)
type DnDMagicItem struct {
	ID          int           `json:"id" db:"id"`
	APIIndex    string        `json:"api_index" db:"api_index"`
	Name        string        `json:"name" db:"name"`
	Description string        `json:"description" db:"description"`
	Category    string        `json:"category" db:"category"`
	Rarity      string        `json:"rarity" db:"rarity"`
	Variants    JSONBFlexible `json:"variants" db:"variants"`
	CreatedAt   time.Time     `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time     `json:"updated_at" db:"updated_at"`
	APIVersion  string        `json:"api_version" db:"api_version"`
}

// ========================================
// RESPONSE STRUCTS PARA LISTAGENS
// ========================================

type DnDListResponse struct {
	Results interface{} `json:"results"`
	Limit   int         `json:"limit"`
	Offset  int         `json:"offset"`
	Count   int         `json:"count,omitempty"`
}

// ========================================
// HELPERS E MÉTODOS AUXILIARES
// ========================================

// GetModifier calcula o modificador de um atributo
func GetModifier(score int) int {
	return (score - 10) / 2
}

// FormatChallengeRating formata o challenge rating para exibição
func (m *DnDMonster) FormatChallengeRating() string {
	if m.ChallengeRating < 1 {
		if m.ChallengeRating == 0.125 {
			return "1/8"
		} else if m.ChallengeRating == 0.25 {
			return "1/4"
		} else if m.ChallengeRating == 0.5 {
			return "1/2"
		}
	}
	return fmt.Sprintf("%.0f", m.ChallengeRating)
}

// GetSpellLevelName retorna o nome do nível da magia
func (s *DnDSpell) GetSpellLevelName() string {
	switch s.Level {
	case 0:
		return "Cantrip"
	case 1:
		return "1st Level"
	case 2:
		return "2nd Level"
	case 3:
		return "3rd Level"
	default:
		return fmt.Sprintf("%dth Level", s.Level)
	}
}
