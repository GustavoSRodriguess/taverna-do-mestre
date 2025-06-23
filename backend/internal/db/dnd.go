package db

import (
	"context"
	"fmt"
	"strings"

	"rpg-saas-backend/internal/models"
)

// ========================================
// RACES OPERATIONS
// ========================================

func (p *PostgresDB) GetDnDRaces(ctx context.Context, limit, offset int) ([]models.DnDRace, error) {
	races := []models.DnDRace{}
	query := `SELECT * FROM dnd_races ORDER BY name LIMIT $1 OFFSET $2`

	err := p.DB.SelectContext(ctx, &races, query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch D&D races: %w", err)
	}

	return races, nil
}

func (p *PostgresDB) GetDnDRaceByIndex(ctx context.Context, index string) (*models.DnDRace, error) {
	var race models.DnDRace
	query := `SELECT * FROM dnd_races WHERE index = $1`

	err := p.DB.GetContext(ctx, &race, query, index)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch D&D race with index %s: %w", index, err)
	}

	return &race, nil
}

func (p *PostgresDB) SearchDnDRaces(ctx context.Context, search string, limit, offset int) ([]models.DnDRace, error) {
	races := []models.DnDRace{}
	query := `SELECT * FROM dnd_races WHERE name ILIKE $1 ORDER BY name LIMIT $2 OFFSET $3`

	err := p.DB.SelectContext(ctx, &races, query, "%"+search+"%", limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to search D&D races: %w", err)
	}

	return races, nil
}

// ========================================
// CLASSES OPERATIONS
// ========================================

func (p *PostgresDB) GetDnDClasses(ctx context.Context, limit, offset int) ([]models.DnDClass, error) {
	classes := []models.DnDClass{}
	query := `SELECT * FROM dnd_classes ORDER BY name LIMIT $1 OFFSET $2`

	err := p.DB.SelectContext(ctx, &classes, query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch D&D classes: %w", err)
	}

	return classes, nil
}

func (p *PostgresDB) GetDnDClassByIndex(ctx context.Context, index string) (*models.DnDClass, error) {
	var class models.DnDClass
	query := `SELECT * FROM dnd_classes WHERE index = $1`

	err := p.DB.GetContext(ctx, &class, query, index)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch D&D class with index %s: %w", index, err)
	}

	return &class, nil
}

func (p *PostgresDB) SearchDnDClasses(ctx context.Context, search string, limit, offset int) ([]models.DnDClass, error) {
	classes := []models.DnDClass{}
	query := `SELECT * FROM dnd_classes WHERE name ILIKE $1 ORDER BY name LIMIT $2 OFFSET $3`

	err := p.DB.SelectContext(ctx, &classes, query, "%"+search+"%", limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to search D&D classes: %w", err)
	}

	return classes, nil
}

// ========================================
// SPELLS OPERATIONS
// ========================================

func (p *PostgresDB) GetDnDSpells(ctx context.Context, limit, offset int, level *int, school string, class string) ([]models.DnDSpell, error) {
	spells := []models.DnDSpell{}

	baseQuery := `SELECT * FROM dnd_spells WHERE 1=1`
	var conditions []string
	var args []interface{}
	argIndex := 1

	if level != nil {
		conditions = append(conditions, fmt.Sprintf("level = $%d", argIndex))
		args = append(args, *level)
		argIndex++
	}

	if school != "" {
		conditions = append(conditions, fmt.Sprintf("school->>'name' ILIKE $%d", argIndex))
		args = append(args, "%"+school+"%")
		argIndex++
	}

	if class != "" {
		conditions = append(conditions, fmt.Sprintf("classes::text ILIKE $%d", argIndex))
		args = append(args, "%"+class+"%")
		argIndex++
	}

	if len(conditions) > 0 {
		baseQuery += " AND " + strings.Join(conditions, " AND ")
	}

	query := baseQuery + fmt.Sprintf(" ORDER BY level, name LIMIT $%d OFFSET $%d", argIndex, argIndex+1)
	args = append(args, limit, offset)

	err := p.DB.SelectContext(ctx, &spells, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch D&D spells: %w", err)
	}

	return spells, nil
}

func (p *PostgresDB) GetDnDSpellByIndex(ctx context.Context, index string) (*models.DnDSpell, error) {
	var spell models.DnDSpell
	query := `SELECT * FROM dnd_spells WHERE index = $1`

	err := p.DB.GetContext(ctx, &spell, query, index)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch D&D spell with index %s: %w", index, err)
	}

	return &spell, nil
}

func (p *PostgresDB) SearchDnDSpells(ctx context.Context, search string, limit, offset int) ([]models.DnDSpell, error) {
	spells := []models.DnDSpell{}
	query := `SELECT * FROM dnd_spells WHERE name ILIKE $1 ORDER BY level, name LIMIT $2 OFFSET $3`

	err := p.DB.SelectContext(ctx, &spells, query, "%"+search+"%", limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to search D&D spells: %w", err)
	}

	return spells, nil
}

// ========================================
// EQUIPMENT OPERATIONS
// ========================================

func (p *PostgresDB) GetDnDEquipment(ctx context.Context, limit, offset int, category string) ([]models.DnDEquipment, error) {
	equipment := []models.DnDEquipment{}

	var query string
	var args []interface{}

	if category != "" {
		query = `SELECT * FROM dnd_equipment WHERE equipment_category->>'name' ILIKE $1 ORDER BY name LIMIT $2 OFFSET $3`
		args = []interface{}{"%" + category + "%", limit, offset}
	} else {
		query = `SELECT * FROM dnd_equipment ORDER BY name LIMIT $1 OFFSET $2`
		args = []interface{}{limit, offset}
	}

	err := p.DB.SelectContext(ctx, &equipment, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch D&D equipment: %w", err)
	}

	return equipment, nil
}

func (p *PostgresDB) GetDnDEquipmentByIndex(ctx context.Context, index string) (*models.DnDEquipment, error) {
	var equipment models.DnDEquipment
	query := `SELECT * FROM dnd_equipment WHERE index = $1`

	err := p.DB.GetContext(ctx, &equipment, query, index)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch D&D equipment with index %s: %w", index, err)
	}

	return &equipment, nil
}

func (p *PostgresDB) SearchDnDEquipment(ctx context.Context, search string, limit, offset int) ([]models.DnDEquipment, error) {
	equipment := []models.DnDEquipment{}
	query := `SELECT * FROM dnd_equipment WHERE name ILIKE $1 ORDER BY name LIMIT $2 OFFSET $3`

	err := p.DB.SelectContext(ctx, &equipment, query, "%"+search+"%", limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to search D&D equipment: %w", err)
	}

	return equipment, nil
}

// ========================================
// MONSTERS OPERATIONS
// ========================================

func (p *PostgresDB) GetDnDMonsters(ctx context.Context, limit, offset int, challengeRating *float64, monsterType string) ([]models.DnDMonster, error) {
	monsters := []models.DnDMonster{}

	baseQuery := `SELECT * FROM dnd_monsters WHERE 1=1`
	var conditions []string
	var args []interface{}
	argIndex := 1

	if challengeRating != nil {
		conditions = append(conditions, fmt.Sprintf("challenge_rating = $%d", argIndex))
		args = append(args, *challengeRating)
		argIndex++
	}

	if monsterType != "" {
		conditions = append(conditions, fmt.Sprintf("type ILIKE $%d", argIndex))
		args = append(args, "%"+monsterType+"%")
		argIndex++
	}

	if len(conditions) > 0 {
		baseQuery += " AND " + strings.Join(conditions, " AND ")
	}

	query := baseQuery + fmt.Sprintf(" ORDER BY challenge_rating, name LIMIT $%d OFFSET $%d", argIndex, argIndex+1)
	args = append(args, limit, offset)

	err := p.DB.SelectContext(ctx, &monsters, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch D&D monsters: %w", err)
	}

	return monsters, nil
}

func (p *PostgresDB) GetDnDMonsterByIndex(ctx context.Context, index string) (*models.DnDMonster, error) {
	var monster models.DnDMonster
	query := `SELECT * FROM dnd_monsters WHERE index = $1`

	err := p.DB.GetContext(ctx, &monster, query, index)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch D&D monster with index %s: %w", index, err)
	}

	return &monster, nil
}

func (p *PostgresDB) SearchDnDMonsters(ctx context.Context, search string, limit, offset int) ([]models.DnDMonster, error) {
	monsters := []models.DnDMonster{}
	query := `SELECT * FROM dnd_monsters WHERE name ILIKE $1 ORDER BY challenge_rating, name LIMIT $2 OFFSET $3`

	err := p.DB.SelectContext(ctx, &monsters, query, "%"+search+"%", limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to search D&D monsters: %w", err)
	}

	return monsters, nil
}

// ========================================
// BACKGROUNDS OPERATIONS
// ========================================

func (p *PostgresDB) GetDnDBackgrounds(ctx context.Context, limit, offset int) ([]models.DnDBackground, error) {
	backgrounds := []models.DnDBackground{}
	query := `SELECT * FROM dnd_backgrounds ORDER BY name LIMIT $1 OFFSET $2`

	err := p.DB.SelectContext(ctx, &backgrounds, query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch D&D backgrounds: %w", err)
	}

	return backgrounds, nil
}

func (p *PostgresDB) GetDnDBackgroundByIndex(ctx context.Context, index string) (*models.DnDBackground, error) {
	var background models.DnDBackground
	query := `SELECT * FROM dnd_backgrounds WHERE index = $1`

	err := p.DB.GetContext(ctx, &background, query, index)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch D&D background with index %s: %w", index, err)
	}

	return &background, nil
}

func (p *PostgresDB) SearchDnDBackgrounds(ctx context.Context, search string, limit, offset int) ([]models.DnDBackground, error) {
	backgrounds := []models.DnDBackground{}
	query := `SELECT * FROM dnd_backgrounds WHERE name ILIKE $1 ORDER BY name LIMIT $2 OFFSET $3`

	err := p.DB.SelectContext(ctx, &backgrounds, query, "%"+search+"%", limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to search D&D backgrounds: %w", err)
	}

	return backgrounds, nil
}

// ========================================
// SKILLS OPERATIONS
// ========================================

func (p *PostgresDB) GetDnDSkills(ctx context.Context, limit, offset int) ([]models.DnDSkill, error) {
	skills := []models.DnDSkill{}
	query := `SELECT * FROM dnd_skills ORDER BY name LIMIT $1 OFFSET $2`

	err := p.DB.SelectContext(ctx, &skills, query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch D&D skills: %w", err)
	}

	return skills, nil
}

func (p *PostgresDB) GetDnDSkillByIndex(ctx context.Context, index string) (*models.DnDSkill, error) {
	var skill models.DnDSkill
	query := `SELECT * FROM dnd_skills WHERE index = $1`

	err := p.DB.GetContext(ctx, &skill, query, index)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch D&D skill with index %s: %w", index, err)
	}

	return &skill, nil
}

// ========================================
// FEATURES OPERATIONS
// ========================================

func (p *PostgresDB) GetDnDFeatures(ctx context.Context, limit, offset int, class string, level *int) ([]models.DnDFeature, error) {
	features := []models.DnDFeature{}

	baseQuery := `SELECT * FROM dnd_features WHERE 1=1`
	var conditions []string
	var args []interface{}
	argIndex := 1

	if class != "" {
		conditions = append(conditions, fmt.Sprintf("class->>'name' ILIKE $%d", argIndex))
		args = append(args, "%"+class+"%")
		argIndex++
	}

	if level != nil {
		conditions = append(conditions, fmt.Sprintf("level = $%d", argIndex))
		args = append(args, *level)
		argIndex++
	}

	if len(conditions) > 0 {
		baseQuery += " AND " + strings.Join(conditions, " AND ")
	}

	query := baseQuery + fmt.Sprintf(" ORDER BY level, name LIMIT $%d OFFSET $%d", argIndex, argIndex+1)
	args = append(args, limit, offset)

	err := p.DB.SelectContext(ctx, &features, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch D&D features: %w", err)
	}

	return features, nil
}

func (p *PostgresDB) GetDnDFeatureByIndex(ctx context.Context, index string) (*models.DnDFeature, error) {
	var feature models.DnDFeature
	query := `SELECT * FROM dnd_features WHERE index = $1`

	err := p.DB.GetContext(ctx, &feature, query, index)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch D&D feature with index %s: %w", index, err)
	}

	return &feature, nil
}
