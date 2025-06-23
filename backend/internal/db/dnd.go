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
	query := `
		SELECT id, api_index, name, 
		       COALESCE(speed, 30) as speed, 
		       COALESCE(size, '') as size, 
		       COALESCE(size_description, '') as size_description, 
		       COALESCE(ability_bonuses, '[]'::jsonb) as ability_bonuses, 
		       COALESCE(traits, '[]'::jsonb) as traits, 
		       COALESCE(languages, '[]'::jsonb) as languages, 
		       COALESCE(proficiencies, '[]'::jsonb) as proficiencies, 
		       COALESCE(subraces, ARRAY[]::text[]) as subraces, 
		       created_at, updated_at, 
		       COALESCE(api_version, '2014') as api_version
		FROM dnd_races 
		ORDER BY name 
		LIMIT $1 OFFSET $2
	`

	err := p.DB.SelectContext(ctx, &races, query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch D&D races: %w", err)
	}

	return races, nil
}

func (p *PostgresDB) GetDnDRaceByIndex(ctx context.Context, index string) (*models.DnDRace, error) {
	var race models.DnDRace
	query := `
		SELECT id, api_index, name, 
		       COALESCE(speed, 30) as speed, 
		       COALESCE(size, '') as size, 
		       COALESCE(size_description, '') as size_description, 
		       COALESCE(ability_bonuses, '[]'::jsonb) as ability_bonuses, 
		       COALESCE(traits, '[]'::jsonb) as traits, 
		       COALESCE(languages, '[]'::jsonb) as languages, 
		       COALESCE(proficiencies, '[]'::jsonb) as proficiencies, 
		       COALESCE(subraces, ARRAY[]::text[]) as subraces, 
		       created_at, updated_at, 
		       COALESCE(api_version, '2014') as api_version
		FROM dnd_races 
		WHERE api_index = $1
	`

	err := p.DB.GetContext(ctx, &race, query, index)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch D&D race with index %s: %w", index, err)
	}

	return &race, nil
}

func (p *PostgresDB) SearchDnDRaces(ctx context.Context, search string, limit, offset int) ([]models.DnDRace, error) {
	races := []models.DnDRace{}
	query := `
		SELECT id, api_index, name, 
		       COALESCE(speed, 30) as speed, 
		       COALESCE(size, '') as size, 
		       COALESCE(size_description, '') as size_description, 
		       COALESCE(ability_bonuses, '[]'::jsonb) as ability_bonuses, 
		       COALESCE(traits, '[]'::jsonb) as traits, 
		       COALESCE(languages, '[]'::jsonb) as languages, 
		       COALESCE(proficiencies, '[]'::jsonb) as proficiencies, 
		       COALESCE(subraces, ARRAY[]::text[]) as subraces, 
		       created_at, updated_at, 
		       COALESCE(api_version, '2014') as api_version
		FROM dnd_races 
		WHERE name ILIKE $1 
		ORDER BY name 
		LIMIT $2 OFFSET $3
	`

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
	query := `
		SELECT id, api_index, name, 
		       COALESCE(hit_die, 8) as hit_die, 
		       COALESCE(proficiencies, '{}'::jsonb) as proficiencies, 
		       COALESCE(saving_throws, ARRAY[]::text[]) as saving_throws, 
		       COALESCE(spellcasting, '{}'::jsonb) as spellcasting, 
		       COALESCE(spellcasting_ability, '') as spellcasting_ability, 
		       COALESCE(class_levels, '{}'::jsonb) as class_levels, 
		       created_at, updated_at, 
		       COALESCE(api_version, '2014') as api_version
		FROM dnd_classes 
		ORDER BY name 
		LIMIT $1 OFFSET $2
	`

	err := p.DB.SelectContext(ctx, &classes, query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch D&D classes: %w", err)
	}

	return classes, nil
}

func (p *PostgresDB) GetDnDClassByIndex(ctx context.Context, index string) (*models.DnDClass, error) {
	var class models.DnDClass
	query := `
		SELECT id, api_index, name, hit_die, proficiencies, saving_throws, 
		       spellcasting, spellcasting_ability, class_levels, created_at, updated_at, api_version
		FROM dnd_classes 
		WHERE api_index = $1
	`

	err := p.DB.GetContext(ctx, &class, query, index)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch D&D class with index %s: %w", index, err)
	}

	return &class, nil
}

func (p *PostgresDB) SearchDnDClasses(ctx context.Context, search string, limit, offset int) ([]models.DnDClass, error) {
	classes := []models.DnDClass{}
	query := `
		SELECT id, api_index, name, hit_die, proficiencies, saving_throws, 
		       spellcasting, spellcasting_ability, class_levels, created_at, updated_at, api_version
		FROM dnd_classes 
		WHERE name ILIKE $1 
		ORDER BY name 
		LIMIT $2 OFFSET $3
	`

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

	baseQuery := `
		SELECT id, api_index, name, 
		       COALESCE(level, 0) as level, 
		       COALESCE(school, '') as school, 
		       COALESCE(casting_time, '') as casting_time, 
		       COALESCE(range, '') as range, 
		       COALESCE(components, '') as components, 
		       COALESCE(duration, '') as duration,
		       COALESCE(concentration, false) as concentration, 
		       COALESCE(ritual, false) as ritual, 
		       COALESCE(description, '') as description, 
		       COALESCE(higher_level, '') as higher_level, 
		       COALESCE(material, '') as material, 
		       COALESCE(classes, ARRAY[]::text[]) as classes, 
		       created_at, updated_at, 
		       COALESCE(api_version, '2014') as api_version
		FROM dnd_spells WHERE 1=1
	`
	var conditions []string
	var args []interface{}
	argIndex := 1

	if level != nil {
		conditions = append(conditions, fmt.Sprintf("level = $%d", argIndex))
		args = append(args, *level)
		argIndex++
	}

	if school != "" {
		conditions = append(conditions, fmt.Sprintf("school ILIKE $%d", argIndex))
		args = append(args, "%"+school+"%")
		argIndex++
	}

	if class != "" {
		conditions = append(conditions, fmt.Sprintf("$%d = ANY(classes)", argIndex))
		args = append(args, strings.ToLower(class))
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
	query := `
		SELECT id, api_index, name, level, school, casting_time, range, components, duration,
		       concentration, ritual, description, higher_level, material, classes, 
		       created_at, updated_at, api_version
		FROM dnd_spells 
		WHERE api_index = $1
	`

	err := p.DB.GetContext(ctx, &spell, query, index)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch D&D spell with index %s: %w", index, err)
	}

	return &spell, nil
}

func (p *PostgresDB) SearchDnDSpells(ctx context.Context, search string, limit, offset int) ([]models.DnDSpell, error) {
	spells := []models.DnDSpell{}
	query := `
		SELECT id, api_index, name, level, school, casting_time, range, components, duration,
		       concentration, ritual, description, higher_level, material, classes, 
		       created_at, updated_at, api_version
		FROM dnd_spells 
		WHERE name ILIKE $1 
		ORDER BY level, name 
		LIMIT $2 OFFSET $3
	`

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

	baseQuery := `
		SELECT id, api_index, name, equipment_category, cost_quantity, cost_unit, weight,
		       weapon_category, weapon_range, damage, properties, armor_category, armor_class,
		       description, special, created_at, updated_at, api_version
		FROM dnd_equipment
	`
	var args []interface{}
	var whereClause string

	if category != "" {
		whereClause = " WHERE equipment_category ILIKE $1"
		args = append(args, "%"+category+"%")
		args = append(args, limit, offset)
	} else {
		args = append(args, limit, offset)
	}

	query := baseQuery + whereClause + fmt.Sprintf(" ORDER BY name LIMIT $%d OFFSET $%d", len(args)-1, len(args))

	err := p.DB.SelectContext(ctx, &equipment, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch D&D equipment: %w", err)
	}

	return equipment, nil
}

func (p *PostgresDB) GetDnDEquipmentByIndex(ctx context.Context, index string) (*models.DnDEquipment, error) {
	var equipment models.DnDEquipment
	query := `
		SELECT id, api_index, name, equipment_category, cost_quantity, cost_unit, weight,
		       weapon_category, weapon_range, damage, properties, armor_category, armor_class,
		       description, special, created_at, updated_at, api_version
		FROM dnd_equipment 
		WHERE api_index = $1
	`

	err := p.DB.GetContext(ctx, &equipment, query, index)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch D&D equipment with index %s: %w", index, err)
	}

	return &equipment, nil
}

func (p *PostgresDB) SearchDnDEquipment(ctx context.Context, search string, limit, offset int) ([]models.DnDEquipment, error) {
	equipment := []models.DnDEquipment{}
	query := `
		SELECT id, api_index, name, equipment_category, cost_quantity, cost_unit, weight,
		       weapon_category, weapon_range, damage, properties, armor_category, armor_class,
		       description, special, created_at, updated_at, api_version
		FROM dnd_equipment 
		WHERE name ILIKE $1 
		ORDER BY name 
		LIMIT $2 OFFSET $3
	`

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

	baseQuery := `
		SELECT id, api_index, name, 
		       COALESCE(size, '') as size, 
		       COALESCE(type, '') as type, 
		       COALESCE(subtype, '') as subtype, 
		       COALESCE(alignment, '') as alignment, 
		       COALESCE(armor_class, 10) as armor_class, 
		       COALESCE(hit_points, 1) as hit_points, 
		       COALESCE(hit_dice, '') as hit_dice,
		       COALESCE(speed, '{}'::jsonb) as speed, 
		       COALESCE(strength, 10) as strength, 
		       COALESCE(dexterity, 10) as dexterity, 
		       COALESCE(constitution, 10) as constitution, 
		       COALESCE(intelligence, 10) as intelligence, 
		       COALESCE(wisdom, 10) as wisdom, 
		       COALESCE(charisma, 10) as charisma,
		       COALESCE(challenge_rating, 0) as challenge_rating, 
		       COALESCE(xp, 0) as xp, 
		       COALESCE(proficiency_bonus, 2) as proficiency_bonus, 
		       COALESCE(damage_vulnerabilities, ARRAY[]::text[]) as damage_vulnerabilities, 
		       COALESCE(damage_resistances, ARRAY[]::text[]) as damage_resistances,
		       COALESCE(damage_immunities, ARRAY[]::text[]) as damage_immunities, 
		       COALESCE(condition_immunities, ARRAY[]::text[]) as condition_immunities, 
		       COALESCE(senses, '{}'::jsonb) as senses, 
		       COALESCE(languages, '') as languages, 
		       COALESCE(special_abilities, '[]'::jsonb) as special_abilities,
		       COALESCE(actions, '[]'::jsonb) as actions, 
		       COALESCE(legendary_actions, '[]'::jsonb) as legendary_actions, 
		       created_at, updated_at, 
		       COALESCE(api_version, '2014') as api_version
		FROM dnd_monsters WHERE 1=1
	`
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
	query := `
		SELECT id, api_index, name, size, type, subtype, alignment, armor_class, hit_points, hit_dice,
		       speed, strength, dexterity, constitution, intelligence, wisdom, charisma,
		       challenge_rating, xp, proficiency_bonus, damage_vulnerabilities, damage_resistances,
		       damage_immunities, condition_immunities, senses, languages, special_abilities,
		       actions, legendary_actions, created_at, updated_at, api_version
		FROM dnd_monsters 
		WHERE api_index = $1
	`

	err := p.DB.GetContext(ctx, &monster, query, index)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch D&D monster with index %s: %w", index, err)
	}

	return &monster, nil
}

func (p *PostgresDB) SearchDnDMonsters(ctx context.Context, search string, limit, offset int) ([]models.DnDMonster, error) {
	monsters := []models.DnDMonster{}
	query := `
		SELECT id, api_index, name, size, type, subtype, alignment, armor_class, hit_points, hit_dice,
		       speed, strength, dexterity, constitution, intelligence, wisdom, charisma,
		       challenge_rating, xp, proficiency_bonus, damage_vulnerabilities, damage_resistances,
		       damage_immunities, condition_immunities, senses, languages, special_abilities,
		       actions, legendary_actions, created_at, updated_at, api_version
		FROM dnd_monsters 
		WHERE name ILIKE $1 
		ORDER BY challenge_rating, name 
		LIMIT $2 OFFSET $3
	`

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
	query := `
		SELECT id, api_index, name, starting_proficiencies, language_options, starting_equipment,
		       starting_equipment_options, feature, personality_traits, ideals, bonds, flaws,
		       created_at, updated_at, api_version
		FROM dnd_backgrounds 
		ORDER BY name 
		LIMIT $1 OFFSET $2
	`

	err := p.DB.SelectContext(ctx, &backgrounds, query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch D&D backgrounds: %w", err)
	}

	return backgrounds, nil
}

func (p *PostgresDB) GetDnDBackgroundByIndex(ctx context.Context, index string) (*models.DnDBackground, error) {
	var background models.DnDBackground
	query := `
		SELECT id, api_index, name, starting_proficiencies, language_options, starting_equipment,
		       starting_equipment_options, feature, personality_traits, ideals, bonds, flaws,
		       created_at, updated_at, api_version
		FROM dnd_backgrounds 
		WHERE api_index = $1
	`

	err := p.DB.GetContext(ctx, &background, query, index)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch D&D background with index %s: %w", index, err)
	}

	return &background, nil
}

func (p *PostgresDB) SearchDnDBackgrounds(ctx context.Context, search string, limit, offset int) ([]models.DnDBackground, error) {
	backgrounds := []models.DnDBackground{}
	query := `
		SELECT id, api_index, name, starting_proficiencies, language_options, starting_equipment,
		       starting_equipment_options, feature, personality_traits, ideals, bonds, flaws,
		       created_at, updated_at, api_version
		FROM dnd_backgrounds 
		WHERE name ILIKE $1 
		ORDER BY name 
		LIMIT $2 OFFSET $3
	`

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
	query := `
		SELECT id, api_index, name, description, ability_score, created_at, updated_at, api_version
		FROM dnd_skills 
		ORDER BY name 
		LIMIT $1 OFFSET $2
	`

	err := p.DB.SelectContext(ctx, &skills, query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch D&D skills: %w", err)
	}

	return skills, nil
}

func (p *PostgresDB) GetDnDSkillByIndex(ctx context.Context, index string) (*models.DnDSkill, error) {
	var skill models.DnDSkill
	query := `
		SELECT id, api_index, name, description, ability_score, created_at, updated_at, api_version
		FROM dnd_skills 
		WHERE api_index = $1
	`

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

	baseQuery := `
		SELECT id, api_index, name, level, class_name, subclass_name, description, prerequisites,
		       created_at, updated_at, api_version
		FROM dnd_features WHERE 1=1
	`
	var conditions []string
	var args []interface{}
	argIndex := 1

	if class != "" {
		conditions = append(conditions, fmt.Sprintf("class_name ILIKE $%d", argIndex))
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
	query := `
		SELECT id, api_index, name, level, class_name, subclass_name, description, prerequisites,
		       created_at, updated_at, api_version
		FROM dnd_features 
		WHERE api_index = $1
	`

	err := p.DB.GetContext(ctx, &feature, query, index)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch D&D feature with index %s: %w", index, err)
	}

	return &feature, nil
}

// ========================================
// NOVAS OPERAÇÕES PARA DADOS IMPORTADOS
// ========================================

// GetDnDLanguages retorna os idiomas disponíveis
func (p *PostgresDB) GetDnDLanguages(ctx context.Context, limit, offset int) ([]models.DnDLanguage, error) {
	languages := []models.DnDLanguage{}
	query := `
		SELECT id, api_index, name, type, description, script, typical_speakers, 
		       created_at, updated_at, api_version
		FROM dnd_languages 
		ORDER BY name 
		LIMIT $1 OFFSET $2
	`

	err := p.DB.SelectContext(ctx, &languages, query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch D&D languages: %w", err)
	}

	return languages, nil
}

// GetDnDConditions retorna as condições disponíveis
func (p *PostgresDB) GetDnDConditions(ctx context.Context, limit, offset int) ([]models.DnDCondition, error) {
	conditions := []models.DnDCondition{}
	query := `
		SELECT id, api_index, name, description, created_at, updated_at, api_version
		FROM dnd_conditions 
		ORDER BY name 
		LIMIT $1 OFFSET $2
	`

	err := p.DB.SelectContext(ctx, &conditions, query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch D&D conditions: %w", err)
	}

	return conditions, nil
}

// GetDnDSubraces retorna as sub-raças disponíveis
func (p *PostgresDB) GetDnDSubraces(ctx context.Context, limit, offset int) ([]models.DnDSubrace, error) {
	subraces := []models.DnDSubrace{}
	query := `
		SELECT id, api_index, name, race_name, description, ability_bonuses, traits, proficiencies,
		       created_at, updated_at, api_version
		FROM dnd_subraces 
		ORDER BY race_name, name 
		LIMIT $1 OFFSET $2
	`

	err := p.DB.SelectContext(ctx, &subraces, query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch D&D subraces: %w", err)
	}

	return subraces, nil
}

// GetDnDMagicItems retorna os itens mágicos disponíveis
func (p *PostgresDB) GetDnDMagicItems(ctx context.Context, limit, offset int, rarity string) ([]models.DnDMagicItem, error) {
	magicItems := []models.DnDMagicItem{}

	baseQuery := `
		SELECT id, api_index, name, description, category, rarity, variants,
		       created_at, updated_at, api_version
		FROM dnd_magic_items
	`
	var args []interface{}
	var whereClause string

	if rarity != "" {
		whereClause = " WHERE rarity ILIKE $1"
		args = append(args, "%"+rarity+"%")
		args = append(args, limit, offset)
	} else {
		args = append(args, limit, offset)
	}

	query := baseQuery + whereClause + fmt.Sprintf(" ORDER BY name LIMIT $%d OFFSET $%d", len(args)-1, len(args))

	err := p.DB.SelectContext(ctx, &magicItems, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch D&D magic items: %w", err)
	}

	return magicItems, nil
}
