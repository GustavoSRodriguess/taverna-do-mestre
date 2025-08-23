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
		       flaws, features, player_name, player_id, created_at
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
		       attributes, abilities, equipment, hp, ca, player_name, player_id, created_at
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
		(name, description, level, race, class, background, alignment, attributes, abilities, equipment, hp, ca, player_name, player_id, created_at) 
		VALUES 
		($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
		RETURNING id
	`

	now := time.Now()
	pc.CreatedAt = now

	row := p.DB.QueryRowContext(ctx, query,
		pc.Name, pc.Description, pc.Level, pc.Race, pc.Class, pc.Background, pc.Alignment,
		pc.Attributes, pc.Abilities, pc.Equipment, pc.HP, pc.CA, pc.PlayerName, pc.PlayerID, pc.CreatedAt,
	)

	return row.Scan(&pc.ID)
}

// UpdatePC atualiza um PC existente (apenas se pertence ao jogador)
func (p *PostgresDB) UpdatePC(ctx context.Context, pc *models.PC) error {
	query := `
		UPDATE pcs SET
		name = $1, description = $2, level = $3, race = $4, class = $5, background = $6, alignment = $7,
		attributes = $8, abilities = $9, equipment = $10, hp = $11, ca = $12, player_name = $13
		WHERE id = $14 AND player_id = $15
	`

	result, err := p.DB.ExecContext(ctx, query,
		pc.Name, pc.Description, pc.Level, pc.Race, pc.Class, pc.Background, pc.Alignment,
		pc.Attributes, pc.Abilities, pc.Equipment, pc.HP, pc.CA, pc.PlayerName, pc.ID, pc.PlayerID,
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
