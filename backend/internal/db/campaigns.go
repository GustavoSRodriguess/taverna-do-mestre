package db

import (
	"context"
	"fmt"
	"time"

	"rpg-saas-backend/internal/models"
)

func (p *PostgresDB) GetCampaigns(ctx context.Context, userID int, limit, offset int) ([]models.CampaignSummary, error) {
	campaigns := []models.CampaignSummary{}
	query := `
		SELECT 
			c.id, c.name, c.description, c.status, c.max_players, 
			c.current_session, c.created_at,
			u.username as dm_name,
			COUNT(cp.user_id) as player_count
		FROM campaigns c
		LEFT JOIN users u ON c.dm_id = u.id
		LEFT JOIN campaign_players cp ON c.id = cp.campaign_id AND cp.status = 'active'
		WHERE c.dm_id = $1 OR c.id IN (
			SELECT campaign_id FROM campaign_players 
			WHERE user_id = $1 AND status = 'active'
		)
		GROUP BY c.id, u.username
		ORDER BY c.updated_at DESC
		LIMIT $2 OFFSET $3
	`

	err := p.DB.SelectContext(ctx, &campaigns, query, userID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch campaigns: %w", err)
	}

	return campaigns, nil
}

func (p *PostgresDB) GetCampaignByID(ctx context.Context, id, userID int) (*models.Campaign, error) {
	var campaign models.Campaign
	query := `
		SELECT c.id, c.name, c.description, c.dm_id, c.max_players, c.current_session, 
		       c.status, c.invite_code, c.created_at, c.updated_at
		FROM campaigns c
		WHERE c.id = $1 AND (
			c.dm_id = $2 OR c.id IN (
				SELECT campaign_id FROM campaign_players 
				WHERE user_id = $2 AND status = 'active'
			)
		)
	`

	err := p.DB.GetContext(ctx, &campaign, query, id, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch campaign with ID %d: %w", id, err)
	}

	players, err := p.GetCampaignPlayers(ctx, id)
	if err != nil {
		return nil, err
	}
	campaign.Players = players

	characters, err := p.GetCampaignCharacters(ctx, id)
	if err != nil {
		return nil, err
	}
	campaign.Characters = characters

	return &campaign, nil
}

func (p *PostgresDB) CreateCampaign(ctx context.Context, campaign *models.Campaign) error {
	query := `
		INSERT INTO campaigns (name, description, dm_id, max_players, status, invite_code, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id
	`

	now := time.Now()
	campaign.CreatedAt = now
	campaign.UpdatedAt = now

	if campaign.Status == "" {
		campaign.Status = "planning"
	}
	if campaign.MaxPlayers == 0 {
		campaign.MaxPlayers = 6
	}

	row := p.DB.QueryRowContext(ctx, query,
		campaign.Name, campaign.Description, campaign.DMID,
		campaign.MaxPlayers, campaign.Status, campaign.InviteCode,
		campaign.CreatedAt, campaign.UpdatedAt,
	)

	return row.Scan(&campaign.ID)
}

func (p *PostgresDB) UpdateCampaign(ctx context.Context, campaign *models.Campaign) error {
	query := `
		UPDATE campaigns SET
		name = $1, description = $2, max_players = $3, 
		current_session = $4, status = $5, updated_at = $6
		WHERE id = $7 AND dm_id = $8
	`

	campaign.UpdatedAt = time.Now()

	result, err := p.DB.ExecContext(ctx, query,
		campaign.Name, campaign.Description, campaign.MaxPlayers,
		campaign.CurrentSession, campaign.Status, campaign.UpdatedAt,
		campaign.ID, campaign.DMID,
	)

	if err != nil {
		return fmt.Errorf("failed to update campaign: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get affected rows: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("campaign not found or user not authorized")
	}

	return nil
}

func (p *PostgresDB) DeleteCampaign(ctx context.Context, id, dmID int) error {
	query := `DELETE FROM campaigns WHERE id = $1 AND dm_id = $2`

	result, err := p.DB.ExecContext(ctx, query, id, dmID)
	if err != nil {
		return fmt.Errorf("failed to delete campaign: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get affected rows: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("campaign not found or user not authorized")
	}

	return nil
}

func (p *PostgresDB) GetCampaignPlayers(ctx context.Context, campaignID int) ([]models.CampaignPlayer, error) {
	players := []models.CampaignPlayer{}
	query := `
		SELECT cp.*, u.username, u.email
		FROM campaign_players cp
		LEFT JOIN users u ON cp.user_id = u.id
		WHERE cp.campaign_id = $1
		ORDER BY cp.joined_at ASC
	`

	rows, err := p.DB.QueryContext(ctx, query, campaignID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch campaign players: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var player models.CampaignPlayer
		var user models.User

		err := rows.Scan(
			&player.ID, &player.CampaignID, &player.UserID,
			&player.JoinedAt, &player.Status,
			&user.Username, &user.Email,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan campaign player: %w", err)
		}

		user.ID = player.UserID
		player.User = &user
		players = append(players, player)
	}

	return players, nil
}

func (p *PostgresDB) GetCampaignByInviteCode(ctx context.Context, inviteCode string) (*models.Campaign, error) {
	var campaign models.Campaign
	query := `
		SELECT id, name, description, dm_id, max_players, current_session, status, invite_code, created_at, updated_at
		FROM campaigns 
		WHERE invite_code = $1
	`

	err := p.DB.GetContext(ctx, &campaign, query, inviteCode)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch campaign with invite code %s: %w", inviteCode, err)
	}

	return &campaign, nil
}

func (p *PostgresDB) JoinCampaignByCode(ctx context.Context, inviteCode string, userID int) error {
	campaign, err := p.GetCampaignByInviteCode(ctx, inviteCode)
	if err != nil {
		return fmt.Errorf("invalid invite code")
	}

	var exists bool
	checkQuery := `SELECT EXISTS(SELECT 1 FROM campaign_players WHERE campaign_id = $1 AND user_id = $2)`
	err = p.DB.GetContext(ctx, &exists, checkQuery, campaign.ID, userID)
	if err != nil {
		return fmt.Errorf("failed to check if player exists: %w", err)
	}

	if exists {
		return fmt.Errorf("player already in campaign")
	}

	var playerCount int
	countQuery := `
		SELECT COUNT(cp.user_id) as player_count
		FROM campaign_players cp
		WHERE cp.campaign_id = $1 AND cp.status = 'active'
	`
	err = p.DB.GetContext(ctx, &playerCount, countQuery, campaign.ID)
	if err != nil {
		return fmt.Errorf("failed to check campaign capacity: %w", err)
	}

	if playerCount >= campaign.MaxPlayers {
		return fmt.Errorf("campaign is full")
	}

	if campaign.DMID == userID {
		return fmt.Errorf("DM cannot join their own campaign as a player")
	}

	query := `
		INSERT INTO campaign_players (campaign_id, user_id, joined_at, status)
		VALUES ($1, $2, $3, 'active')
	`

	_, err = p.DB.ExecContext(ctx, query, campaign.ID, userID, time.Now())
	if err != nil {
		return fmt.Errorf("failed to add player to campaign: %w", err)
	}

	return nil
}

func (p *PostgresDB) AddPlayerToCampaign(ctx context.Context, campaignID, userID int) error {
	var exists bool
	checkQuery := `SELECT EXISTS(SELECT 1 FROM campaign_players WHERE campaign_id = $1 AND user_id = $2)`
	err := p.DB.GetContext(ctx, &exists, checkQuery, campaignID, userID)
	if err != nil {
		return fmt.Errorf("failed to check if player exists: %w", err)
	}

	if exists {
		return fmt.Errorf("player already in campaign")
	}

	var playerCount, maxPlayers int
	countQuery := `
		SELECT 
			COUNT(cp.user_id) as player_count,
			c.max_players
		FROM campaigns c
		LEFT JOIN campaign_players cp ON c.id = cp.campaign_id AND cp.status = 'active'
		WHERE c.id = $1
		GROUP BY c.max_players
	`
	err = p.DB.QueryRowContext(ctx, countQuery, campaignID).Scan(&playerCount, &maxPlayers)
	if err != nil {
		return fmt.Errorf("failed to check campaign capacity: %w", err)
	}

	if playerCount >= maxPlayers {
		return fmt.Errorf("campaign is full")
	}

	query := `
		INSERT INTO campaign_players (campaign_id, user_id, joined_at, status)
		VALUES ($1, $2, $3, 'active')
	`

	_, err = p.DB.ExecContext(ctx, query, campaignID, userID, time.Now())
	if err != nil {
		return fmt.Errorf("failed to add player to campaign: %w", err)
	}

	return nil
}

func (p *PostgresDB) RemovePlayerFromCampaign(ctx context.Context, campaignID, userID int) error {
	query := `DELETE FROM campaign_players WHERE campaign_id = $1 AND user_id = $2`

	result, err := p.DB.ExecContext(ctx, query, campaignID, userID)
	if err != nil {
		return fmt.Errorf("failed to remove player from campaign: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get affected rows: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("player not found in campaign")
	}

	return nil
}

func (p *PostgresDB) IsPlayerInCampaign(ctx context.Context, campaignID, userID int) (bool, error) {
	var exists bool
	query := `
		SELECT EXISTS(
			SELECT 1 FROM campaign_players 
			WHERE campaign_id = $1 AND user_id = $2 AND status = 'active'
		)
	`
	err := p.DB.GetContext(ctx, &exists, query, campaignID, userID)
	if err != nil {
		return false, fmt.Errorf("failed to check if player is in campaign: %w", err)
	}

	return exists, nil
}

func (p *PostgresDB) GetCampaignCharacters(ctx context.Context, campaignID int) ([]models.CampaignCharacter, error) {
	characters := []models.CampaignCharacter{}
	query := `
		SELECT 
			cc.id, cc.campaign_id, cc.player_id, cc.pc_id, cc.status, 
			cc.joined_at, cc.current_hp, cc.temp_ac, cc.campaign_notes,
			u.username as player_username,
			pc.name, pc.race, pc.class, pc.level, pc.hp as max_hp, pc.ca as base_ac,
			pc.attributes, pc.abilities, pc.equipment, pc.description, pc.background
		FROM campaign_characters cc
		LEFT JOIN users u ON cc.player_id = u.id
		LEFT JOIN pcs pc ON cc.pc_id = pc.id
		WHERE cc.campaign_id = $1 AND cc.status != 'removed'
		ORDER BY cc.joined_at ASC
	`

	rows, err := p.DB.QueryContext(ctx, query, campaignID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch campaign characters: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var character models.CampaignCharacter
		var pc models.PC
		var playerUsername string

		err := rows.Scan(
			&character.ID, &character.CampaignID, &character.PlayerID, &character.PCID,
			&character.Status, &character.JoinedAt, &character.CurrentHP, &character.TempAC,
			&character.Notes, &playerUsername,
			&pc.Name, &pc.Race, &pc.Class, &pc.Level, &pc.HP, &pc.CA,
			&pc.Attributes, &pc.Abilities, &pc.Equipment, &pc.Description, &pc.Background,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan campaign character: %w", err)
		}

		pc.ID = character.PCID
		character.PC = &pc

		if playerUsername != "" {
			character.Player = &models.User{
				ID:       character.PlayerID,
				Username: playerUsername,
			}
		}

		characters = append(characters, character)
	}

	return characters, nil
}

func (p *PostgresDB) GetAvailablePCs(ctx context.Context, userID, campaignID int) ([]models.PC, error) {
	var pcs []models.PC
	query := `
		SELECT pc.* 
		FROM pcs pc
		WHERE pc.id NOT IN (
			SELECT cc.pc_id 
			FROM campaign_characters cc 
			WHERE cc.campaign_id = $1 AND cc.status IN ('active', 'inactive')
		)
		ORDER BY pc.name
	`

	err := p.DB.SelectContext(ctx, &pcs, query, campaignID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch available PCs: %w", err)
	}

	return pcs, nil
}

func (p *PostgresDB) AddPCToCampaign(ctx context.Context, campaignChar *models.CampaignCharacter) error {
	query := `
		INSERT INTO campaign_characters (campaign_id, player_id, pc_id, status, current_hp, temp_ac, campaign_notes, joined_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id
	`

	err := p.DB.QueryRowContext(ctx, query,
		campaignChar.CampaignID,
		campaignChar.PlayerID,
		campaignChar.PCID,
		campaignChar.Status,
		campaignChar.CurrentHP,
		campaignChar.TempAC,
		campaignChar.Notes,
		campaignChar.JoinedAt,
	).Scan(&campaignChar.ID)

	if err != nil {
		return fmt.Errorf("failed to add PC to campaign: %w", err)
	}

	return nil
}

func (p *PostgresDB) IsPCInCampaign(ctx context.Context, campaignID, pcID int) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM campaign_characters WHERE campaign_id = $1 AND pc_id = $2 AND status IN ('active', 'inactive'))`

	err := p.DB.GetContext(ctx, &exists, query, campaignID, pcID)
	if err != nil {
		return false, fmt.Errorf("failed to check if PC is in campaign: %w", err)
	}

	return exists, nil
}

func (p *PostgresDB) GetCampaignCharacter(ctx context.Context, charID, campaignID, userID int) (*models.CampaignCharacter, error) {
	var character models.CampaignCharacter
	query := `
		SELECT cc.id, cc.campaign_id, cc.player_id, cc.pc_id, cc.status, 
		       cc.joined_at, cc.current_hp, cc.temp_ac, cc.campaign_notes
		FROM campaign_characters cc
		JOIN campaigns c ON cc.campaign_id = c.id
		WHERE cc.id = $1 AND cc.campaign_id = $2 
		AND (cc.player_id = $3 OR c.dm_id = $3)
	`

	err := p.DB.GetContext(ctx, &character, query, charID, campaignID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch campaign character: %w", err)
	}

	return &character, nil
}

func (p *PostgresDB) UpdateCampaignCharacter(ctx context.Context, character *models.CampaignCharacter) error {
	query := `
		UPDATE campaign_characters SET
		current_hp = $1, temp_ac = $2, status = $3, campaign_notes = $4
		WHERE id = $5 AND campaign_id = $6
	`

	result, err := p.DB.ExecContext(ctx, query,
		character.CurrentHP, character.TempAC, character.Status, character.Notes,
		character.ID, character.CampaignID,
	)

	if err != nil {
		return fmt.Errorf("failed to update campaign character: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get affected rows: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("character not found in campaign")
	}

	return nil
}

func (p *PostgresDB) DeleteCampaignCharacter(ctx context.Context, id, campaignID int) error {
	query := `DELETE FROM campaign_characters WHERE id = $1 AND campaign_id = $2`

	result, err := p.DB.ExecContext(ctx, query, id, campaignID)
	if err != nil {
		return fmt.Errorf("failed to delete campaign character: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get affected rows: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("character not found in campaign")
	}

	return nil
}
