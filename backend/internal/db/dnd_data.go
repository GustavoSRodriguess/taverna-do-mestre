// internal/db/dnd_data.go
package db

import (
	"context"
	"fmt"
	"strings"

	"github.com/lib/pq"
)

// DNDMonster representa um monstro do D&D 5e
type DNDMonster struct {
	ID               int                    `db:"id"`
	APIIndex         string                 `db:"api_index"`
	Name             string                 `db:"name"`
	Size             string                 `db:"size"`
	Type             string                 `db:"type"`
	Subtype          string                 `db:"subtype"`
	Alignment        string                 `db:"alignment"`
	ArmorClass       int                    `db:"armor_class"`
	HitPoints        int                    `db:"hit_points"`
	HitDice          string                 `db:"hit_dice"`
	Speed            map[string]interface{} `db:"speed"`
	Strength         int                    `db:"strength"`
	Dexterity        int                    `db:"dexterity"`
	Constitution     int                    `db:"constitution"`
	Intelligence     int                    `db:"intelligence"`
	Wisdom           int                    `db:"wisdom"`
	Charisma         int                    `db:"charisma"`
	ChallengeRating  float64                `db:"challenge_rating"`
	XP               int                    `db:"xp"`
	ProficiencyBonus int                    `db:"proficiency_bonus"`
	Languages        string                 `db:"languages"`
}

// DNDSpell representa uma magia do D&D 5e
type DNDSpell struct {
	ID            int      `db:"id"`
	APIIndex      string   `db:"api_index"`
	Name          string   `db:"name"`
	Level         int      `db:"level"`
	School        string   `db:"school"`
	CastingTime   string   `db:"casting_time"`
	Range         string   `db:"range"`
	Components    string   `db:"components"`
	Duration      string   `db:"duration"`
	Concentration bool     `db:"concentration"`
	Ritual        bool     `db:"ritual"`
	Description   string   `db:"description"`
	HigherLevel   string   `db:"higher_level"`
	Material      string   `db:"material"`
	Classes       []string `db:"classes"`
}

// DNDClass representa uma classe do D&D 5e
type DNDClass struct {
	ID                  int      `db:"id"`
	APIIndex            string   `db:"api_index"`
	Name                string   `db:"name"`
	HitDie              int      `db:"hit_die"`
	SavingThrows        []string `db:"saving_throws"`
	SpellcastingAbility string   `db:"spellcasting_ability"`
}

// DNDRace representa uma raça do D&D 5e
type DNDRace struct {
	ID              int      `db:"id"`
	APIIndex        string   `db:"api_index"`
	Name            string   `db:"name"`
	Speed           int      `db:"speed"`
	Size            string   `db:"size"`
	SizeDescription string   `db:"size_description"`
	Subraces        []string `db:"subraces"`
}

// GetDNDMonsters busca monstros com filtros
func (p *PostgresDB) GetDNDMonsters(ctx context.Context, filters DNDMonsterFilters) ([]DNDMonster, error) {
	query := `
		SELECT id, api_index, name, size, type, subtype, alignment, armor_class, hit_points, 
		       hit_dice, speed, strength, dexterity, constitution, intelligence, wisdom, charisma,
		       challenge_rating, xp, proficiency_bonus, languages
		FROM dnd_monsters 
		WHERE 1=1
	`

	args := []interface{}{}
	argCount := 0

	// Filtro por tipo
	if len(filters.Types) > 0 {
		argCount++
		query += fmt.Sprintf(" AND type = ANY($%d)", argCount)
		args = append(args, pq.Array(filters.Types))
	}

	// Filtro por CR
	if filters.MinCR > 0 {
		argCount++
		query += fmt.Sprintf(" AND challenge_rating >= $%d", argCount)
		args = append(args, filters.MinCR)
	}

	if filters.MaxCR > 0 {
		argCount++
		query += fmt.Sprintf(" AND challenge_rating <= $%d", argCount)
		args = append(args, filters.MaxCR)
	}

	// Filtro por nome
	if filters.NameSearch != "" {
		argCount++
		query += fmt.Sprintf(" AND name ILIKE $%d", argCount)
		args = append(args, "%"+filters.NameSearch+"%")
	}

	// Ordenação e limite
	query += " ORDER BY challenge_rating, name"

	if filters.Limit > 0 {
		argCount++
		query += fmt.Sprintf(" LIMIT $%d", argCount)
		args = append(args, filters.Limit)
	}

	monsters := []DNDMonster{}
	err := p.DB.SelectContext(ctx, &monsters, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch D&D monsters: %w", err)
	}

	return monsters, nil
}

// GetDNDMonsterByIndex busca um monstro específico por índice
func (p *PostgresDB) GetDNDMonsterByIndex(ctx context.Context, index string) (*DNDMonster, error) {
	var monster DNDMonster
	query := `
		SELECT id, api_index, name, size, type, subtype, alignment, armor_class, hit_points, 
		       hit_dice, speed, strength, dexterity, constitution, intelligence, wisdom, charisma,
		       challenge_rating, xp, proficiency_bonus, languages
		FROM dnd_monsters 
		WHERE api_index = $1
	`

	err := p.DB.GetContext(ctx, &monster, query, index)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch D&D monster %s: %w", index, err)
	}

	return &monster, nil
}

// GetDNDSpells busca magias com filtros
func (p *PostgresDB) GetDNDSpells(ctx context.Context, filters DNDSpellFilters) ([]DNDSpell, error) {
	query := `
		SELECT id, api_index, name, level, school, casting_time, range, components, duration,
		       concentration, ritual, description, higher_level, material, classes
		FROM dnd_spells 
		WHERE 1=1
	`

	args := []interface{}{}
	argCount := 0

	// Filtro por nível
	if filters.Level >= 0 {
		argCount++
		query += fmt.Sprintf(" AND level = $%d", argCount)
		args = append(args, filters.Level)
	}

	// Filtro por classe
	if filters.Class != "" {
		argCount++
		query += fmt.Sprintf(" AND $%d = ANY(classes)", argCount)
		args = append(args, strings.ToLower(filters.Class))
	}

	// Filtro por escola
	if filters.School != "" {
		argCount++
		query += fmt.Sprintf(" AND school = $%d", argCount)
		args = append(args, strings.ToLower(filters.School))
	}

	// Filtro por nome
	if filters.NameSearch != "" {
		argCount++
		query += fmt.Sprintf(" AND name ILIKE $%d", argCount)
		args = append(args, "%"+filters.NameSearch+"%")
	}

	query += " ORDER BY level, name"

	if filters.Limit > 0 {
		argCount++
		query += fmt.Sprintf(" LIMIT $%d", argCount)
		args = append(args, filters.Limit)
	}

	spells := []DNDSpell{}
	err := p.DB.SelectContext(ctx, &spells, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch D&D spells: %w", err)
	}

	return spells, nil
}

// GetDNDClasses busca todas as classes
func (p *PostgresDB) GetDNDClasses(ctx context.Context) ([]DNDClass, error) {
	classes := []DNDClass{}
	query := `
		SELECT id, api_index, name, hit_die, saving_throws, spellcasting_ability
		FROM dnd_classes 
		ORDER BY name
	`

	err := p.DB.SelectContext(ctx, &classes, query)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch D&D classes: %w", err)
	}

	return classes, nil
}

// GetDNDClassByIndex busca uma classe específica
func (p *PostgresDB) GetDNDClassByIndex(ctx context.Context, index string) (*DNDClass, error) {
	var class DNDClass
	query := `
		SELECT id, api_index, name, hit_die, saving_throws, spellcasting_ability
		FROM dnd_classes 
		WHERE api_index = $1
	`

	err := p.DB.GetContext(ctx, &class, query, index)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch D&D class %s: %w", index, err)
	}

	return &class, nil
}

// GetDNDRaces busca todas as raças
func (p *PostgresDB) GetDNDRaces(ctx context.Context) ([]DNDRace, error) {
	races := []DNDRace{}
	query := `
		SELECT id, api_index, name, speed, size, size_description, subraces
		FROM dnd_races 
		ORDER BY name
	`

	err := p.DB.SelectContext(ctx, &races, query)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch D&D races: %w", err)
	}

	return races, nil
}

// GetDNDRaceByIndex busca uma raça específica
func (p *PostgresDB) GetDNDRaceByIndex(ctx context.Context, index string) (*DNDRace, error) {
	var race DNDRace
	query := `
		SELECT id, api_index, name, speed, size, size_description, subraces
		FROM dnd_races 
		WHERE api_index = $1
	`

	err := p.DB.GetContext(ctx, &race, query, index)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch D&D race %s: %w", index, err)
	}

	return &race, nil
}

// Structs para filtros
type DNDMonsterFilters struct {
	Types      []string
	MinCR      float64
	MaxCR      float64
	NameSearch string
	Limit      int
}

type DNDSpellFilters struct {
	Level      int // -1 para todos os níveis
	Class      string
	School     string
	NameSearch string
	Limit      int
}

// Métodos auxiliares para geração de encontros usando dados locais
func (p *PostgresDB) GetMonstersForEncounter(ctx context.Context, playerLevel int, theme string) ([]DNDMonster, error) {
	// Calcula CR apropriado baseado no nível dos jogadores
	maxCR := float64(playerLevel) * 0.75
	if maxCR > 30 {
		maxCR = 30
	}

	filters := DNDMonsterFilters{
		MaxCR: maxCR,
		Limit: 50, // Limite para performance
	}

	// Mapear tema para tipos de monstros
	switch strings.ToLower(theme) {
	case "goblinóides", "goblinoids":
		filters.Types = []string{"humanoid"}
	case "mortos-vivos", "undead":
		filters.Types = []string{"undead"}
	case "dragões", "dragons":
		filters.Types = []string{"dragon"}
	case "demônios", "demons", "fiends":
		filters.Types = []string{"fiend"}
	case "gigantes", "giants":
		filters.Types = []string{"giant"}
	case "animais mágicos", "beasts":
		filters.Types = []string{"beast", "monstrosity"}
	case "aberrações", "aberrations":
		filters.Types = []string{"aberration"}
	case "elementais", "elementals":
		filters.Types = []string{"elemental"}
	case "fadas", "fey":
		filters.Types = []string{"fey"}
	case "constructos", "constructs":
		filters.Types = []string{"construct"}
	}

	return p.GetDNDMonsters(ctx, filters)
}
