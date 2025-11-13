package db

import (
	"context"
	"fmt"
	"log"
	"time"

	"rpg-saas-backend/internal/models"
)

// GetPCsByPlayer retorna todos os PCs de um jogador específico
func (p *PostgresDB) GetPCsByPlayer(ctx context.Context, playerID int, limit, offset int) ([]models.PC, error) {
	pcs := []models.PC{}
	log.Printf("Fetching PCs for player ID: %d with limit: %d and offset: %d", playerID, limit, offset)

	query := `
		SELECT id, name, description, level, race, class, background, alignment,
		       attributes, abilities, equipment, hp, current_hp, ca, proficiency_bonus,
		       inspiration, skills, attacks, spells, personality_traits, ideals, bonds,
		       flaws, features, player_name, player_id, is_homebrew, created_at
		FROM pcs
		WHERE player_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`

	err := p.DB.SelectContext(ctx, &pcs, query, playerID, limit, offset)
	if err != nil {
		log.Printf("Error fetching PCs: %v", err)
		return nil, fmt.Errorf("failed to fetch PCs for player %d: %w", playerID, err)
	}

	log.Printf("Successfully fetched %d PCs", len(pcs))
	return pcs, nil
}

// GetPCByIDAndPlayer retorna um PC específico se pertence ao jogador
func (p *PostgresDB) GetPCByIDAndPlayer(ctx context.Context, id, playerID int) (*models.PC, error) {
	var pc models.PC
	query := `
		SELECT id, name, description, level, race, class, background, alignment,
		       attributes, abilities, equipment, hp, current_hp, ca, proficiency_bonus,
		       inspiration, skills, attacks, spells, personality_traits, ideals, bonds,
		       flaws, features, player_name, player_id, is_homebrew, created_at
		FROM pcs
		WHERE id = $1 AND player_id = $2
	`

	err := p.DB.GetContext(ctx, &pc, query, id, playerID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch PC with ID %d for player %d: %w", id, playerID, err)
	}

	return &pc, nil
}

// CreatePC cria um novo PC para um jogador
func (p *PostgresDB) CreatePC(ctx context.Context, pc *models.PC) error {
	query := `
		INSERT INTO pcs
		(name, description, level, race, class, background, alignment, attributes, abilities, equipment, hp, ca, player_name, player_id, is_homebrew, created_at)
		VALUES
		($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
		RETURNING id
	`

	now := time.Now()
	pc.CreatedAt = now

	row := p.DB.QueryRowContext(ctx, query,
		pc.Name, pc.Description, pc.Level, pc.Race, pc.Class, pc.Background, pc.Alignment,
		pc.Attributes, pc.Abilities, pc.Equipment, pc.HP, pc.CA, pc.PlayerName, pc.PlayerID, pc.IsHomebrew, pc.CreatedAt,
	)

	return row.Scan(&pc.ID)
}

// UpdatePC atualiza um PC existente (apenas se pertence ao jogador)
func (p *PostgresDB) UpdatePC(ctx context.Context, pc *models.PC) error {
	query := `
		UPDATE pcs SET
		name = $1, description = $2, level = $3, race = $4, class = $5, background = $6, alignment = $7,
		attributes = $8, abilities = $9, equipment = $10, hp = $11, current_hp = $12, ca = $13,
		proficiency_bonus = $14, inspiration = $15, skills = $16, attacks = $17, spells = $18,
		personality_traits = $19, ideals = $20, bonds = $21, flaws = $22, features = $23, player_name = $24,
		is_homebrew = $25
		WHERE id = $26 AND player_id = $27
	`

	log.Printf("Executando UPDATE para PC ID: %d", pc.ID)
	log.Printf("Spells being saved: %+v", pc.Spells)

	result, err := p.DB.ExecContext(ctx, query,
		pc.Name, pc.Description, pc.Level, pc.Race, pc.Class, pc.Background, pc.Alignment,
		pc.Attributes, pc.Abilities, pc.Equipment, pc.HP, pc.CurrentHP, pc.CA,
		pc.ProficiencyBonus, pc.Inspiration, pc.Skills, pc.Attacks, pc.Spells,
		pc.PersonalityTraits, pc.Ideals, pc.Bonds, pc.Flaws, pc.Features, pc.PlayerName,
		pc.IsHomebrew,
		pc.ID, pc.PlayerID,
	)

	if err != nil {
		return fmt.Errorf("failed to update PC with ID %d: %w", pc.ID, err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get affected rows: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("PC not found or user not authorized")
	}

	return nil
}

// DeletePC deleta um PC (apenas se pertence ao jogador e não está em campanhas ativas)
func (p *PostgresDB) DeletePC(ctx context.Context, id, playerID int) error {
	// Primeiro verifica se o PC está em alguma campanha ativa
	var campaignCount int
	checkQuery := `
		SELECT COUNT(*) 
		FROM campaign_characters 
		WHERE source_pc_id = $1 AND status IN ('active', 'inactive')
	`
	err := p.DB.GetContext(ctx, &campaignCount, checkQuery, id)
	if err != nil {
		return fmt.Errorf("failed to check campaign usage: %w", err)
	}

	if campaignCount > 0 {
		return fmt.Errorf("cannot delete PC that is in active campaigns")
	}

	// Deleta o PC
	query := `DELETE FROM pcs WHERE id = $1 AND player_id = $2`

	result, err := p.DB.ExecContext(ctx, query, id, playerID)
	if err != nil {
		return fmt.Errorf("failed to delete PC with ID %d: %w", id, err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get affected rows: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("PC not found or user not authorized")
	}

	return nil
}

// GetPCCampaigns retorna as campanhas em que um PC está participando
func (p *PostgresDB) GetPCCampaigns(ctx context.Context, pcID, playerID int) ([]models.CampaignSummary, error) {
	campaigns := []models.CampaignSummary{}
	query := `
		SELECT 
			c.id, c.name, c.description, c.status, c.max_players, 
			c.current_session, c.created_at, c.updated_at,
			u.username as dm_name,
			cc.status as character_status,
			cc.current_hp,
			COUNT(cp.user_id) as player_count
		FROM campaigns c
		LEFT JOIN users u ON c.dm_id = u.id
		LEFT JOIN campaign_players cp ON c.id = cp.campaign_id AND cp.status = 'active'
		JOIN campaign_characters cc ON c.id = cc.campaign_id
		WHERE cc.source_pc_id = $1 AND cc.player_id = $2 AND cc.status != 'removed'
		GROUP BY c.id, u.username, c.name, c.description, c.status, c.max_players, 
		         c.current_session, c.created_at, c.updated_at, cc.status, cc.current_hp
		ORDER BY c.updated_at DESC
	`

	rows, err := p.DB.QueryContext(ctx, query, pcID, playerID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch campaigns for PC %d: %w", pcID, err)
	}
	defer rows.Close()

	for rows.Next() {
		var campaign models.CampaignSummary
		var characterStatus string
		var currentHP *int

		err := rows.Scan(
			&campaign.ID, &campaign.Name, &campaign.Description, &campaign.Status,
			&campaign.MaxPlayers, &campaign.CurrentSession, &campaign.CreatedAt,
			&campaign.UpdatedAt, &campaign.DMName, &characterStatus, &currentHP,
			&campaign.PlayerCount,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan campaign: %w", err)
		}

		campaigns = append(campaigns, campaign)
	}

	return campaigns, nil
}
