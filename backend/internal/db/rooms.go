package db

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"rpg-saas-backend/internal/models"
)

func (p *PostgresDB) CreateRoom(ctx context.Context, room *models.Room) (*models.Room, error) {
	query := `
		INSERT INTO rooms (id, name, owner_id, campaign_id, scene_state, metadata, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, name, owner_id, campaign_id, scene_state, metadata, created_at, updated_at
	`

	result := models.Room{}
	if err := p.DB.QueryRowContext(ctx, query,
		room.ID,
		room.Name,
		room.OwnerID,
		room.CampaignID,
		room.SceneState,
		room.Metadata,
		room.CreatedAt,
		room.UpdatedAt,
	).Scan(
		&result.ID,
		&result.Name,
		&result.OwnerID,
		&result.CampaignID,
		&result.SceneState,
		&result.Metadata,
		&result.CreatedAt,
		&result.UpdatedAt,
	); err != nil {
		return nil, fmt.Errorf("failed to insert room: %w", err)
	}

	return &result, nil
}

func (p *PostgresDB) GetRoomByID(ctx context.Context, roomID string) (*models.Room, error) {
	query := `
		SELECT id, name, owner_id, campaign_id, scene_state, metadata, created_at, updated_at
		FROM rooms
		WHERE id = $1
	`

	var room models.Room
	if err := p.DB.GetContext(ctx, &room, query, roomID); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to fetch room %s: %w", roomID, err)
	}
	return &room, nil
}

func (p *PostgresDB) AddRoomMember(ctx context.Context, roomID string, userID int, role string) (models.RoomMember, error) {
	query := `
		INSERT INTO room_members (room_id, user_id, role, joined_at)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (room_id, user_id)
		DO UPDATE SET role = EXCLUDED.role
		RETURNING room_id, user_id, role, joined_at
	`

	member := models.RoomMember{}
	if err := p.DB.QueryRowContext(ctx, query, roomID, userID, role, time.Now().UTC()).Scan(
		&member.RoomID,
		&member.UserID,
		&member.Role,
		&member.JoinedAt,
	); err != nil {
		return member, fmt.Errorf("failed to add room member: %w", err)
	}

	return member, nil
}

func (p *PostgresDB) ListRoomMembers(ctx context.Context, roomID string) ([]models.RoomMember, error) {
	query := `
		SELECT room_id, user_id, role, joined_at
		FROM room_members
		WHERE room_id = $1
		ORDER BY joined_at ASC
	`

	members := []models.RoomMember{}
	if err := p.DB.SelectContext(ctx, &members, query, roomID); err != nil {
		return nil, fmt.Errorf("failed to list room members: %w", err)
	}
	return members, nil
}

func (p *PostgresDB) IsRoomMember(ctx context.Context, roomID string, userID int) (bool, error) {
	query := `
		SELECT EXISTS (
			SELECT 1 FROM room_members WHERE room_id = $1 AND user_id = $2
		)
	`
	var exists bool
	if err := p.DB.QueryRowContext(ctx, query, roomID, userID).Scan(&exists); err != nil {
		return false, fmt.Errorf("failed to check room membership: %w", err)
	}
	return exists, nil
}

func (p *PostgresDB) UpdateRoomScene(ctx context.Context, roomID string, scene models.JSONBFlexible, metadata map[string]any) (*models.Room, error) {
	var meta models.JSONB
	if metadata != nil {
		meta = models.JSONB(metadata)
	}
	query := `
		UPDATE rooms
		SET scene_state = $1,
		    metadata = $2,
		    updated_at = NOW()
		WHERE id = $3
		RETURNING id, name, owner_id, campaign_id, scene_state, metadata, created_at, updated_at
	`

	var room models.Room
	if err := p.DB.QueryRowContext(ctx, query, scene, meta, roomID).Scan(
		&room.ID,
		&room.Name,
		&room.OwnerID,
		&room.CampaignID,
		&room.SceneState,
		&room.Metadata,
		&room.CreatedAt,
		&room.UpdatedAt,
	); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to update room scene: %w", err)
	}

	return &room, nil
}
