// backend/internal/models/dnd.go
package models

import (
	"time"
)

// Race representa uma raça do D&D
type DnDRace struct {
	Id              string    `json:"id" db:"id"`
	Name            string    `json:"name" db:"name"`
	Speed           int       `json:"speed" db:"speed"`
	Size            string    `json:"size" db:"size"`
	SizeDescription string    `json:"size_description" db:"size_description"`
	Age             string    `json:"age" db:"age"`
	Alignment       string    `json:"alignment" db:"alignment"`
	LanguageDesc    string    `json:"language_desc" db:"language_desc"`
	AbilityBonuses  JSONB     `json:"ability_bonuses" db:"ability_bonuses"`
	Proficiencies   JSONB     `json:"proficiencies" db:"proficiencies"`
	Languages       JSONB     `json:"languages" db:"languages"`
	Traits          JSONB     `json:"traits" db:"traits"`
	Subraces        JSONB     `json:"subraces" db:"subraces"`
	URL             string    `json:"url" db:"url"`
	CreatedAt       time.Time `json:"created_at" db:"created_at"`
}

// Class representa uma classe do D&D
type DnDClass struct {
	Id                 string    `json:"id" db:"id"`
	Name               string    `json:"name" db:"name"`
	HitDie             int       `json:"hit_die" db:"hit_die"`
	PrimaryAbility     JSONB     `json:"primary_ability" db:"primary_ability"`
	SavingThrows       JSONB     `json:"saving_throws" db:"saving_throws"`
	Proficiencies      JSONB     `json:"proficiencies" db:"proficiencies"`
	ProficiencyChoices JSONB     `json:"proficiency_choices" db:"proficiency_choices"`
	StartingEquipment  JSONB     `json:"starting_equipment" db:"starting_equipment"`
	ClassLevels        JSONB     `json:"class_levels" db:"class_levels"`
	Multiclassing      JSONB     `json:"multiclassing" db:"multiclassing"`
	Subclasses         JSONB     `json:"subclasses" db:"subclasses"`
	SpellCasting       JSONB     `json:"spellcasting" db:"spellcasting"`
	Spells             JSONB     `json:"spells" db:"spells"`
	URL                string    `json:"url" db:"url"`
	CreatedAt          time.Time `json:"created_at" db:"created_at"`
}

// Spell representa uma magia do D&D
type DnDSpell struct {
	Id            string    `json:"id" db:"id"`
	Name          string    `json:"name" db:"name"`
	Description   JSONB     `json:"description" db:"description"`
	HigherLevel   JSONB     `json:"higher_level" db:"higher_level"`
	Range         string    `json:"range" db:"range"`
	Components    JSONB     `json:"components" db:"components"`
	Material      string    `json:"material" db:"material"`
	Ritual        bool      `json:"ritual" db:"ritual"`
	Duration      string    `json:"duration" db:"duration"`
	Concentration bool      `json:"concentration" db:"concentration"`
	CastingTime   string    `json:"casting_time" db:"casting_time"`
	Level         int       `json:"level" db:"level"`
	AttackType    string    `json:"attack_type" db:"attack_type"`
	Damage        JSONB     `json:"damage" db:"damage"`
	School        JSONB     `json:"school" db:"school"`
	Classes       JSONB     `json:"classes" db:"classes"`
	Subclasses    JSONB     `json:"subclasses" db:"subclasses"`
	URL           string    `json:"url" db:"url"`
	CreatedAt     time.Time `json:"created_at" db:"created_at"`
}

// Equipment representa um equipamento do D&D
type DnDEquipment struct {
	Id                  string    `json:"id" db:"id"`
	Name                string    `json:"name" db:"name"`
	EquipmentCategory   JSONB     `json:"equipment_category" db:"equipment_category"`
	GearCategory        JSONB     `json:"gear_category" db:"gear_category"`
	Cost                JSONB     `json:"cost" db:"cost"`
	Damage              JSONB     `json:"damage" db:"damage"`
	Range               JSONB     `json:"range" db:"range"`
	Weight              float64   `json:"weight" db:"weight"`
	Properties          JSONB     `json:"properties" db:"properties"`
	WeaponCategory      string    `json:"weapon_category" db:"weapon_category"`
	WeaponRange         string    `json:"weapon_range" db:"weapon_range"`
	CategoryRange       string    `json:"category_range" db:"category_range"`
	ThrowRange          JSONB     `json:"throw_range" db:"throw_range"`
	TwoHandedDamage     JSONB     `json:"two_handed_damage" db:"two_handed_damage"`
	ArmorCategory       string    `json:"armor_category" db:"armor_category"`
	ArmorClass          JSONB     `json:"armor_class" db:"armor_class"`
	StrMinimum          int       `json:"str_minimum" db:"str_minimum"`
	StealthDisadvantage bool      `json:"stealth_disadvantage" db:"stealth_disadvantage"`
	Contents            JSONB     `json:"contents" db:"contents"`
	Description         JSONB     `json:"description" db:"description"`
	SpecialAbilities    JSONB     `json:"special_abilities" db:"special_abilities"`
	URL                 string    `json:"url" db:"url"`
	CreatedAt           time.Time `json:"created_at" db:"created_at"`
}

// Monster representa um monstro do D&D
type DnDMonster struct {
	Id                    string    `json:"id" db:"id"`
	Name                  string    `json:"name" db:"name"`
	Size                  string    `json:"size" db:"size"`
	Type                  string    `json:"type" db:"type"`
	Subtype               string    `json:"subtype" db:"subtype"`
	Alignment             string    `json:"alignment" db:"alignment"`
	ArmorClass            int       `json:"armor_class" db:"armor_class"`
	HitPoints             int       `json:"hit_points" db:"hit_points"`
	HitDice               string    `json:"hit_dice" db:"hit_dice"`
	HitPointsRoll         string    `json:"hit_points_roll" db:"hit_points_roll"`
	Speed                 JSONB     `json:"speed" db:"speed"`
	Strength              int       `json:"strength" db:"strength"`
	Dexterity             int       `json:"dexterity" db:"dexterity"`
	Constitution          int       `json:"constitution" db:"constitution"`
	Intelligence          int       `json:"intelligence" db:"intelligence"`
	Wisdom                int       `json:"wisdom" db:"wisdom"`
	Charisma              int       `json:"charisma" db:"charisma"`
	Proficiencies         JSONB     `json:"proficiencies" db:"proficiencies"`
	DamageVulnerabilities JSONB     `json:"damage_vulnerabilities" db:"damage_vulnerabilities"`
	DamageResistances     JSONB     `json:"damage_resistances" db:"damage_resistances"`
	DamageImmunities      JSONB     `json:"damage_immunities" db:"damage_immunities"`
	ConditionImmunities   JSONB     `json:"condition_immunities" db:"condition_immunities"`
	Senses                JSONB     `json:"senses" db:"senses"`
	Languages             string    `json:"languages" db:"languages"`
	ChallengeRating       float64   `json:"challenge_rating" db:"challenge_rating"`
	ProficiencyBonus      int       `json:"proficiency_bonus" db:"proficiency_bonus"`
	XP                    int       `json:"xp" db:"xp"`
	SpecialAbilities      JSONB     `json:"special_abilities" db:"special_abilities"`
	Actions               JSONB     `json:"actions" db:"actions"`
	LegendaryActions      JSONB     `json:"legendary_actions" db:"legendary_actions"`
	Image                 string    `json:"image" db:"image"`
	URL                   string    `json:"url" db:"url"`
	CreatedAt             time.Time `json:"created_at" db:"created_at"`
}

// Background representa um background do D&D
type DnDBackground struct {
	Id                     string    `json:"id" db:"id"`
	Name                   string    `json:"name" db:"name"`
	SkillProficiencies     JSONB     `json:"skill_proficiencies" db:"skill_proficiencies"`
	LanguageProficiencies  JSONB     `json:"language_proficiencies" db:"language_proficiencies"`
	EquipmentProficiencies JSONB     `json:"equipment_proficiencies" db:"equipment_proficiencies"`
	StartingEquipment      JSONB     `json:"starting_equipment" db:"starting_equipment"`
	LanguageOptions        JSONB     `json:"language_options" db:"language_options"`
	EquipmentOptions       JSONB     `json:"equipment_options" db:"equipment_options"`
	Feature                JSONB     `json:"feature" db:"feature"`
	PersonalityTraits      JSONB     `json:"personality_traits" db:"personality_traits"`
	Ideals                 JSONB     `json:"ideals" db:"ideals"`
	Bonds                  JSONB     `json:"bonds" db:"bonds"`
	Flaws                  JSONB     `json:"flaws" db:"flaws"`
	URL                    string    `json:"url" db:"url"`
	CreatedAt              time.Time `json:"created_at" db:"created_at"`
}

// Skill representa uma skill do D&D
type DnDSkill struct {
	Id           string    `json:"id" db:"id"`
	Name         string    `json:"name" db:"name"`
	Description  JSONB     `json:"description" db:"description"`
	AbilityScore JSONB     `json:"ability_score" db:"ability_score"`
	URL          string    `json:"url" db:"url"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
}

// Feature representa uma feature/trait do D&D
type DnDFeature struct {
	Id            string    `json:"id" db:"id"`
	Name          string    `json:"name" db:"name"`
	Level         int       `json:"level" db:"level"`
	Description   JSONB     `json:"description" db:"description"`
	Class         JSONB     `json:"class" db:"class"`
	Subclass      JSONB     `json:"subclass" db:"subclass"`
	Parent        JSONB     `json:"parent" db:"parent"`
	Prerequisites JSONB     `json:"prerequisites" db:"prerequisites"`
	URL           string    `json:"url" db:"url"`
	CreatedAt     time.Time `json:"created_at" db:"created_at"`
}
