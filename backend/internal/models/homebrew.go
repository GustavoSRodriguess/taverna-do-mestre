package models

import (
	"time"

	"github.com/lib/pq"
)

// ========================================
// HOMEBREW MODELS
// ========================================

// HomebrewRace representa uma raça customizada criada pelo usuário
type HomebrewRace struct {
	ID              int            `json:"id" db:"id"`
	Name            string         `json:"name" db:"name"`
	Description     string         `json:"description" db:"description"`
	Speed           int            `json:"speed" db:"speed"`
	Size            string         `json:"size" db:"size"`
	Languages       pq.StringArray `json:"languages" db:"languages"`
	Traits          JSONBFlexible  `json:"traits" db:"traits"`           // [{name, description}]
	Abilities       JSONBFlexible  `json:"abilities" db:"abilities"`     // {strength: 2, dexterity: 1}
	Proficiencies   JSONBFlexible  `json:"proficiencies" db:"proficiencies"` // {weapons: [], armor: [], tools: [], skills: []}
	UserID          int            `json:"user_id" db:"user_id"`
	IsPublic        bool           `json:"is_public" db:"is_public"`
	AverageRating   float64        `json:"average_rating" db:"average_rating"`
	RatingCount     int            `json:"rating_count" db:"rating_count"`
	FavoritesCount  int            `json:"favorites_count" db:"favorites_count"`
	CreatedAt       time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at" db:"updated_at"`
}

// HomebrewClass representa uma classe customizada criada pelo usuário
type HomebrewClass struct {
	ID                int            `json:"id" db:"id"`
	Name              string         `json:"name" db:"name"`
	Description       string         `json:"description" db:"description"`
	HitDie            int            `json:"hit_die" db:"hit_die"`
	PrimaryAbility    string         `json:"primary_ability" db:"primary_ability"`
	SavingThrows      pq.StringArray `json:"saving_throws" db:"saving_throws"`
	ArmorProficiency  pq.StringArray `json:"armor_proficiency" db:"armor_proficiency"`
	WeaponProficiency pq.StringArray `json:"weapon_proficiency" db:"weapon_proficiency"`
	ToolProficiency   pq.StringArray `json:"tool_proficiency" db:"tool_proficiency"`
	SkillChoices      JSONBFlexible  `json:"skill_choices" db:"skill_choices"` // {count: 2, options: [...]}
	Features          JSONBFlexible  `json:"features" db:"features"`           // {1: [{name, description}], 2: [...]}
	Spellcasting      JSONBFlexible  `json:"spellcasting" db:"spellcasting"`   // {ability: "int", ...}
	UserID            int            `json:"user_id" db:"user_id"`
	IsPublic          bool           `json:"is_public" db:"is_public"`
	AverageRating     float64        `json:"average_rating" db:"average_rating"`
	RatingCount       int            `json:"rating_count" db:"rating_count"`
	FavoritesCount    int            `json:"favorites_count" db:"favorites_count"`
	CreatedAt         time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at" db:"updated_at"`
}

// HomebrewBackground representa um antecedente customizado criado pelo usuário
type HomebrewBackground struct {
	ID                 int            `json:"id" db:"id"`
	Name               string         `json:"name" db:"name"`
	Description        string         `json:"description" db:"description"`
	SkillProficiencies pq.StringArray `json:"skill_proficiencies" db:"skill_proficiencies"`
	ToolProficiencies  pq.StringArray `json:"tool_proficiencies" db:"tool_proficiencies"`
	Languages          int            `json:"languages" db:"languages"`
	Equipment          JSONBFlexible  `json:"equipment" db:"equipment"`        // [{name, quantity}]
	Feature            JSONBFlexible  `json:"feature" db:"feature"`            // {name, description}
	SuggestedTraits    JSONBFlexible  `json:"suggested_traits" db:"suggested_traits"` // {personality: [], ideals: [], bonds: [], flaws: []}
	UserID             int            `json:"user_id" db:"user_id"`
	IsPublic           bool           `json:"is_public" db:"is_public"`
	AverageRating      float64        `json:"average_rating" db:"average_rating"`
	RatingCount        int            `json:"rating_count" db:"rating_count"`
	FavoritesCount     int            `json:"favorites_count" db:"favorites_count"`
	CreatedAt          time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt          time.Time      `json:"updated_at" db:"updated_at"`
}

// ========================================
// REQUEST MODELS - RACES
// ========================================

type CreateHomebrewRaceRequest struct {
	Name          string        `json:"name" binding:"required"`
	Description   string        `json:"description" binding:"required"`
	Speed         int           `json:"speed" binding:"required,min=0"`
	Size          string        `json:"size" binding:"required"`
	Languages     []string      `json:"languages"`
	Traits        JSONBFlexible `json:"traits"`
	Abilities     JSONBFlexible `json:"abilities"`
	Proficiencies JSONBFlexible `json:"proficiencies"`
	IsPublic      bool          `json:"is_public"`
}

type UpdateHomebrewRaceRequest struct {
	Name          string        `json:"name"`
	Description   string        `json:"description"`
	Speed         int           `json:"speed"`
	Size          string        `json:"size"`
	Languages     []string      `json:"languages"`
	Traits        JSONBFlexible `json:"traits"`
	Abilities     JSONBFlexible `json:"abilities"`
	Proficiencies JSONBFlexible `json:"proficiencies"`
	IsPublic      bool          `json:"is_public"`
}

// ========================================
// REQUEST MODELS - CLASSES
// ========================================

type CreateHomebrewClassRequest struct {
	Name              string        `json:"name" binding:"required"`
	Description       string        `json:"description" binding:"required"`
	HitDie            int           `json:"hit_die" binding:"required,oneof=6 8 10 12"`
	PrimaryAbility    string        `json:"primary_ability" binding:"required"`
	SavingThrows      []string      `json:"saving_throws" binding:"required,min=2,max=2"`
	ArmorProficiency  []string      `json:"armor_proficiency"`
	WeaponProficiency []string      `json:"weapon_proficiency"`
	ToolProficiency   []string      `json:"tool_proficiency"`
	SkillChoices      JSONBFlexible `json:"skill_choices"`
	Features          JSONBFlexible `json:"features"`
	Spellcasting      JSONBFlexible `json:"spellcasting"`
	IsPublic          bool          `json:"is_public"`
}

type UpdateHomebrewClassRequest struct {
	Name              string        `json:"name"`
	Description       string        `json:"description"`
	HitDie            int           `json:"hit_die"`
	PrimaryAbility    string        `json:"primary_ability"`
	SavingThrows      []string      `json:"saving_throws"`
	ArmorProficiency  []string      `json:"armor_proficiency"`
	WeaponProficiency []string      `json:"weapon_proficiency"`
	ToolProficiency   []string      `json:"tool_proficiency"`
	SkillChoices      JSONBFlexible `json:"skill_choices"`
	Features          JSONBFlexible `json:"features"`
	Spellcasting      JSONBFlexible `json:"spellcasting"`
	IsPublic          bool          `json:"is_public"`
}

// ========================================
// REQUEST MODELS - BACKGROUNDS
// ========================================

type CreateHomebrewBackgroundRequest struct {
	Name               string        `json:"name" binding:"required"`
	Description        string        `json:"description" binding:"required"`
	SkillProficiencies []string      `json:"skill_proficiencies"`
	ToolProficiencies  []string      `json:"tool_proficiencies"`
	Languages          int           `json:"languages"`
	Equipment          JSONBFlexible `json:"equipment"`
	Feature            JSONBFlexible `json:"feature"`
	SuggestedTraits    JSONBFlexible `json:"suggested_traits"`
	IsPublic           bool          `json:"is_public"`
}

type UpdateHomebrewBackgroundRequest struct {
	Name               string        `json:"name"`
	Description        string        `json:"description"`
	SkillProficiencies []string      `json:"skill_proficiencies"`
	ToolProficiencies  []string      `json:"tool_proficiencies"`
	Languages          int           `json:"languages"`
	Equipment          JSONBFlexible `json:"equipment"`
	Feature            JSONBFlexible `json:"feature"`
	SuggestedTraits    JSONBFlexible `json:"suggested_traits"`
	IsPublic           bool          `json:"is_public"`
}

// ========================================
// RESPONSE MODELS
// ========================================

// HomebrewRaceWithOwner adiciona informações do dono ao race
type HomebrewRaceWithOwner struct {
	HomebrewRace
	OwnerUsername string `json:"owner_username,omitempty" db:"owner_username"`
}

// HomebrewClassWithOwner adiciona informações do dono à classe
type HomebrewClassWithOwner struct {
	HomebrewClass
	OwnerUsername string `json:"owner_username,omitempty" db:"owner_username"`
}

// HomebrewBackgroundWithOwner adiciona informações do dono ao background
type HomebrewBackgroundWithOwner struct {
	HomebrewBackground
	OwnerUsername string `json:"owner_username,omitempty" db:"owner_username"`
}

// HomebrewListResponse representa a resposta de listagem de conteúdo homebrew
type HomebrewListResponse struct {
	Items interface{} `json:"items"`
	Count int         `json:"count"`
	Limit int         `json:"limit"`
	Offset int        `json:"offset"`
}

// ========================================
// FAVORITES AND RATINGS
// ========================================

// HomebrewFavorite representa um favorito de conteúdo homebrew
type HomebrewFavorite struct {
	ID          int       `json:"id" db:"id"`
	UserID      int       `json:"user_id" db:"user_id"`
	ContentType string    `json:"content_type" db:"content_type"` // "race", "class", "background"
	ContentID   int       `json:"content_id" db:"content_id"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

// HomebrewRating representa uma avaliação de conteúdo homebrew
type HomebrewRating struct {
	ID          int       `json:"id" db:"id"`
	UserID      int       `json:"user_id" db:"user_id"`
	ContentType string    `json:"content_type" db:"content_type"` // "race", "class", "background"
	ContentID   int       `json:"content_id" db:"content_id"`
	Rating      int       `json:"rating" db:"rating"` // 1-5
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

// HomebrewRatingRequest representa uma requisição de avaliação
type HomebrewRatingRequest struct {
	Rating int `json:"rating" binding:"required,min=1,max=5"`
}