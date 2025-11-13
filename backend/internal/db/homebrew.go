package db

import (
	"context"
	"fmt"

	"rpg-saas-backend/internal/models"
)

// ========================================
// HOMEBREW RACES OPERATIONS
// ========================================

func (p *PostgresDB) GetHomebrewRaces(ctx context.Context, userID, limit, offset int) ([]models.HomebrewRaceWithOwner, int, error) {
	races := []models.HomebrewRaceWithOwner{}
	query := `
		SELECT hr.*, u.username as owner_username
		FROM homebrew_races hr
		LEFT JOIN users u ON hr.user_id = u.id
		WHERE hr.is_public = true OR hr.user_id = $1
		ORDER BY hr.created_at DESC
		LIMIT $2 OFFSET $3
	`

	err := p.DB.SelectContext(ctx, &races, query, userID, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to fetch homebrew races: %w", err)
	}

	// Count total
	var count int
	countQuery := `SELECT COUNT(*) FROM homebrew_races WHERE is_public = true OR user_id = $1`
	p.DB.GetContext(ctx, &count, countQuery, userID)

	return races, count, nil
}

func (p *PostgresDB) GetHomebrewRaceByID(ctx context.Context, id, userID int) (*models.HomebrewRaceWithOwner, error) {
	var race models.HomebrewRaceWithOwner
	query := `
		SELECT hr.*, u.username as owner_username
		FROM homebrew_races hr
		LEFT JOIN users u ON hr.user_id = u.id
		WHERE hr.id = $1 AND (hr.is_public = true OR hr.user_id = $2)
	`

	err := p.DB.GetContext(ctx, &race, query, id, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch homebrew race with ID %d: %w", id, err)
	}

	return &race, nil
}

func (p *PostgresDB) CreateHomebrewRace(ctx context.Context, race *models.HomebrewRace) error {
	query := `
		INSERT INTO homebrew_races
		(name, description, speed, size, languages, traits, abilities, proficiencies, user_id, is_public)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id, created_at, updated_at
	`

	err := p.DB.QueryRowContext(ctx, query,
		race.Name, race.Description, race.Speed, race.Size,
		race.Languages, race.Traits, race.Abilities, race.Proficiencies,
		race.UserID, race.IsPublic,
	).Scan(&race.ID, &race.CreatedAt, &race.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to create homebrew race: %w", err)
	}

	return nil
}

func (p *PostgresDB) UpdateHomebrewRace(ctx context.Context, race *models.HomebrewRace) error {
	query := `
		UPDATE homebrew_races SET
		name = $1, description = $2, speed = $3, size = $4,
		languages = $5, traits = $6, abilities = $7, proficiencies = $8,
		is_public = $9
		WHERE id = $10 AND user_id = $11
	`

	result, err := p.DB.ExecContext(ctx, query,
		race.Name, race.Description, race.Speed, race.Size,
		race.Languages, race.Traits, race.Abilities, race.Proficiencies,
		race.IsPublic, race.ID, race.UserID,
	)

	if err != nil {
		return fmt.Errorf("failed to update homebrew race with ID %d: %w", race.ID, err)
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("homebrew race not found or user not authorized")
	}

	return nil
}

func (p *PostgresDB) DeleteHomebrewRace(ctx context.Context, id, userID int) error {
	query := `DELETE FROM homebrew_races WHERE id = $1 AND user_id = $2`

	result, err := p.DB.ExecContext(ctx, query, id, userID)
	if err != nil {
		return fmt.Errorf("failed to delete homebrew race with ID %d: %w", id, err)
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("homebrew race not found or user not authorized")
	}

	return nil
}

// ========================================
// HOMEBREW CLASSES OPERATIONS
// ========================================

func (p *PostgresDB) GetHomebrewClasses(ctx context.Context, userID, limit, offset int) ([]models.HomebrewClassWithOwner, int, error) {
	classes := []models.HomebrewClassWithOwner{}
	query := `
		SELECT hc.*, u.username as owner_username
		FROM homebrew_classes hc
		LEFT JOIN users u ON hc.user_id = u.id
		WHERE hc.is_public = true OR hc.user_id = $1
		ORDER BY hc.created_at DESC
		LIMIT $2 OFFSET $3
	`

	err := p.DB.SelectContext(ctx, &classes, query, userID, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to fetch homebrew classes: %w", err)
	}

	// Count total
	var count int
	countQuery := `SELECT COUNT(*) FROM homebrew_classes WHERE is_public = true OR user_id = $1`
	p.DB.GetContext(ctx, &count, countQuery, userID)

	return classes, count, nil
}

func (p *PostgresDB) GetHomebrewClassByID(ctx context.Context, id, userID int) (*models.HomebrewClassWithOwner, error) {
	var class models.HomebrewClassWithOwner
	query := `
		SELECT hc.*, u.username as owner_username
		FROM homebrew_classes hc
		LEFT JOIN users u ON hc.user_id = u.id
		WHERE hc.id = $1 AND (hc.is_public = true OR hc.user_id = $2)
	`

	err := p.DB.GetContext(ctx, &class, query, id, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch homebrew class with ID %d: %w", id, err)
	}

	return &class, nil
}

func (p *PostgresDB) CreateHomebrewClass(ctx context.Context, class *models.HomebrewClass) error {
	query := `
		INSERT INTO homebrew_classes
		(name, description, hit_die, primary_ability, saving_throws, armor_proficiency,
		 weapon_proficiency, tool_proficiency, skill_choices, features, spellcasting, user_id, is_public)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
		RETURNING id, created_at, updated_at
	`

	err := p.DB.QueryRowContext(ctx, query,
		class.Name, class.Description, class.HitDie, class.PrimaryAbility,
		class.SavingThrows, class.ArmorProficiency, class.WeaponProficiency,
		class.ToolProficiency, class.SkillChoices, class.Features, class.Spellcasting,
		class.UserID, class.IsPublic,
	).Scan(&class.ID, &class.CreatedAt, &class.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to create homebrew class: %w", err)
	}

	return nil
}

func (p *PostgresDB) UpdateHomebrewClass(ctx context.Context, class *models.HomebrewClass) error {
	query := `
		UPDATE homebrew_classes SET
		name = $1, description = $2, hit_die = $3, primary_ability = $4,
		saving_throws = $5, armor_proficiency = $6, weapon_proficiency = $7,
		tool_proficiency = $8, skill_choices = $9, features = $10, spellcasting = $11,
		is_public = $12
		WHERE id = $13 AND user_id = $14
	`

	result, err := p.DB.ExecContext(ctx, query,
		class.Name, class.Description, class.HitDie, class.PrimaryAbility,
		class.SavingThrows, class.ArmorProficiency, class.WeaponProficiency,
		class.ToolProficiency, class.SkillChoices, class.Features, class.Spellcasting,
		class.IsPublic, class.ID, class.UserID,
	)

	if err != nil {
		return fmt.Errorf("failed to update homebrew class with ID %d: %w", class.ID, err)
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("homebrew class not found or user not authorized")
	}

	return nil
}

func (p *PostgresDB) DeleteHomebrewClass(ctx context.Context, id, userID int) error {
	query := `DELETE FROM homebrew_classes WHERE id = $1 AND user_id = $2`

	result, err := p.DB.ExecContext(ctx, query, id, userID)
	if err != nil {
		return fmt.Errorf("failed to delete homebrew class with ID %d: %w", id, err)
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("homebrew class not found or user not authorized")
	}

	return nil
}

// ========================================
// HOMEBREW BACKGROUNDS OPERATIONS
// ========================================

func (p *PostgresDB) GetHomebrewBackgrounds(ctx context.Context, userID, limit, offset int) ([]models.HomebrewBackgroundWithOwner, int, error) {
	backgrounds := []models.HomebrewBackgroundWithOwner{}
	query := `
		SELECT hb.*, u.username as owner_username
		FROM homebrew_backgrounds hb
		LEFT JOIN users u ON hb.user_id = u.id
		WHERE hb.is_public = true OR hb.user_id = $1
		ORDER BY hb.created_at DESC
		LIMIT $2 OFFSET $3
	`

	err := p.DB.SelectContext(ctx, &backgrounds, query, userID, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to fetch homebrew backgrounds: %w", err)
	}

	// Count total
	var count int
	countQuery := `SELECT COUNT(*) FROM homebrew_backgrounds WHERE is_public = true OR user_id = $1`
	p.DB.GetContext(ctx, &count, countQuery, userID)

	return backgrounds, count, nil
}

func (p *PostgresDB) GetHomebrewBackgroundByID(ctx context.Context, id, userID int) (*models.HomebrewBackgroundWithOwner, error) {
	var bg models.HomebrewBackgroundWithOwner
	query := `
		SELECT hb.*, u.username as owner_username
		FROM homebrew_backgrounds hb
		LEFT JOIN users u ON hb.user_id = u.id
		WHERE hb.id = $1 AND (hb.is_public = true OR hb.user_id = $2)
	`

	err := p.DB.GetContext(ctx, &bg, query, id, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch homebrew background with ID %d: %w", id, err)
	}

	return &bg, nil
}

func (p *PostgresDB) CreateHomebrewBackground(ctx context.Context, bg *models.HomebrewBackground) error {
	query := `
		INSERT INTO homebrew_backgrounds
		(name, description, skill_proficiencies, tool_proficiencies, languages,
		 equipment, feature, suggested_traits, user_id, is_public)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id, created_at, updated_at
	`

	err := p.DB.QueryRowContext(ctx, query,
		bg.Name, bg.Description, bg.SkillProficiencies, bg.ToolProficiencies,
		bg.Languages, bg.Equipment, bg.Feature, bg.SuggestedTraits,
		bg.UserID, bg.IsPublic,
	).Scan(&bg.ID, &bg.CreatedAt, &bg.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to create homebrew background: %w", err)
	}

	return nil
}

func (p *PostgresDB) UpdateHomebrewBackground(ctx context.Context, bg *models.HomebrewBackground) error {
	query := `
		UPDATE homebrew_backgrounds SET
		name = $1, description = $2, skill_proficiencies = $3, tool_proficiencies = $4,
		languages = $5, equipment = $6, feature = $7, suggested_traits = $8,
		is_public = $9
		WHERE id = $10 AND user_id = $11
	`

	result, err := p.DB.ExecContext(ctx, query,
		bg.Name, bg.Description, bg.SkillProficiencies, bg.ToolProficiencies,
		bg.Languages, bg.Equipment, bg.Feature, bg.SuggestedTraits,
		bg.IsPublic, bg.ID, bg.UserID,
	)

	if err != nil {
		return fmt.Errorf("failed to update homebrew background with ID %d: %w", bg.ID, err)
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("homebrew background not found or user not authorized")
	}

	return nil
}

func (p *PostgresDB) DeleteHomebrewBackground(ctx context.Context, id, userID int) error {
	query := `DELETE FROM homebrew_backgrounds WHERE id = $1 AND user_id = $2`

	result, err := p.DB.ExecContext(ctx, query, id, userID)
	if err != nil {
		return fmt.Errorf("failed to delete homebrew background with ID %d: %w", id, err)
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("homebrew background not found or user not authorized")
	}

	return nil
}

// ========================================
// FAVORITES OPERATIONS
// ========================================

func (p *PostgresDB) AddFavorite(ctx context.Context, userID int, contentType string, contentID int) error {
	query := `
		INSERT INTO homebrew_favorites (user_id, content_type, content_id)
		VALUES ($1, $2, $3)
		ON CONFLICT (user_id, content_type, content_id) DO NOTHING
	`

	_, err := p.DB.ExecContext(ctx, query, userID, contentType, contentID)
	if err != nil {
		return fmt.Errorf("failed to add favorite: %w", err)
	}

	return nil
}

func (p *PostgresDB) RemoveFavorite(ctx context.Context, userID int, contentType string, contentID int) error {
	query := `DELETE FROM homebrew_favorites WHERE user_id = $1 AND content_type = $2 AND content_id = $3`

	_, err := p.DB.ExecContext(ctx, query, userID, contentType, contentID)
	if err != nil {
		return fmt.Errorf("failed to remove favorite: %w", err)
	}

	return nil
}

func (p *PostgresDB) IsFavorited(ctx context.Context, userID int, contentType string, contentID int) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM homebrew_favorites WHERE user_id = $1 AND content_type = $2 AND content_id = $3)`

	err := p.DB.GetContext(ctx, &exists, query, userID, contentType, contentID)
	if err != nil {
		return false, fmt.Errorf("failed to check favorite status: %w", err)
	}

	return exists, nil
}

func (p *PostgresDB) GetUserFavorites(ctx context.Context, userID int, contentType string, limit, offset int) ([]int, error) {
	var contentIDs []int
	query := `
		SELECT content_id FROM homebrew_favorites
		WHERE user_id = $1 AND content_type = $2
		ORDER BY created_at DESC
		LIMIT $3 OFFSET $4
	`

	err := p.DB.SelectContext(ctx, &contentIDs, query, userID, contentType, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch user favorites: %w", err)
	}

	return contentIDs, nil
}

// ========================================
// RATINGS OPERATIONS
// ========================================

func (p *PostgresDB) AddOrUpdateRating(ctx context.Context, rating *models.HomebrewRating) error {
	query := `
		INSERT INTO homebrew_ratings (user_id, content_type, content_id, rating)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (user_id, content_type, content_id)
		DO UPDATE SET rating = $4, updated_at = CURRENT_TIMESTAMP
		RETURNING id, created_at, updated_at
	`

	err := p.DB.QueryRowContext(ctx, query,
		rating.UserID, rating.ContentType, rating.ContentID, rating.Rating,
	).Scan(&rating.ID, &rating.CreatedAt, &rating.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to add/update rating: %w", err)
	}

	return nil
}

func (p *PostgresDB) GetUserRating(ctx context.Context, userID int, contentType string, contentID int) (*models.HomebrewRating, error) {
	var rating models.HomebrewRating
	query := `SELECT * FROM homebrew_ratings WHERE user_id = $1 AND content_type = $2 AND content_id = $3`

	err := p.DB.GetContext(ctx, &rating, query, userID, contentType, contentID)
	if err != nil {
		return nil, err // Return nil if no rating found (not an error)
	}

	return &rating, nil
}

func (p *PostgresDB) RemoveRating(ctx context.Context, userID int, contentType string, contentID int) error {
	query := `DELETE FROM homebrew_ratings WHERE user_id = $1 AND content_type = $2 AND content_id = $3`

	_, err := p.DB.ExecContext(ctx, query, userID, contentType, contentID)
	if err != nil {
		return fmt.Errorf("failed to remove rating: %w", err)
	}

	return nil
}
