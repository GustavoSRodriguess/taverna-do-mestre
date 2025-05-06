package db

import (
	"context"
	"fmt"

	"github.com/jmoiron/sqlx"

	"rpg-saas-backend/internal/models"
)

func (p *PostgresDB) GetTreasures(ctx context.Context, limit, offset int) ([]models.Treasure, error) {
	treasures := []models.Treasure{}
	query := `SELECT * FROM treasures ORDER BY id LIMIT $1 OFFSET $2`

	err := p.DB.SelectContext(ctx, &treasures, query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch treasures: %w", err)
	}

	for i := range treasures {
		hoards, err := p.GetHoardsByTreasureID(ctx, treasures[i].ID)
		if err != nil {
			return nil, err
		}
		treasures[i].Hoards = hoards
	}

	return treasures, nil
}

func (p *PostgresDB) GetTreasureByID(ctx context.Context, id int) (*models.Treasure, error) {
	var treasure models.Treasure
	query := `SELECT * FROM treasures WHERE id = $1`

	err := p.DB.GetContext(ctx, &treasure, query, id)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch treasure with ID %d: %w", id, err)
	}

	hoards, err := p.GetHoardsByTreasureID(ctx, id)
	if err != nil {
		return nil, err
	}
	treasure.Hoards = hoards

	return &treasure, nil
}

func (p *PostgresDB) GetHoardsByTreasureID(ctx context.Context, treasureID int) ([]models.Hoard, error) {
	hoards := []models.Hoard{}
	query := `SELECT * FROM hoards WHERE treasure_id = $1`

	err := p.DB.SelectContext(ctx, &hoards, query, treasureID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch hoards for treasure ID %d: %w", treasureID, err)
	}

	for i := range hoards {
		_, err := p.GetItemsByHoardID(ctx, hoards[i].ID)
		if err != nil {
			return nil, err
		}

	}

	return hoards, nil
}

func (p *PostgresDB) GetItemsByHoardID(ctx context.Context, hoardID int) ([]models.Item, error) {
	items := []models.Item{}
	query := `SELECT * FROM items WHERE hoard_id = $1`

	err := p.DB.SelectContext(ctx, &items, query, hoardID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch items for hoard ID %d: %w", hoardID, err)
	}

	return items, nil
}

func (p *PostgresDB) CreateTreasure(ctx context.Context, treasure *models.Treasure) error {
	tx, err := p.DB.BeginTxx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	query := `
		INSERT INTO treasures 
		(level, name, total_value) 
		VALUES 
		($1, $2, $3)
		RETURNING id, created_at
	`

	row := tx.QueryRowContext(ctx, query,
		treasure.Level, treasure.Name, treasure.TotalValue,
	)

	err = row.Scan(&treasure.ID, &treasure.CreatedAt)
	if err != nil {
		return fmt.Errorf("failed to insert treasure: %w", err)
	}

	for i := range treasure.Hoards {
		treasure.Hoards[i].TreasureID = treasure.ID
		err = p.createHoardTx(ctx, tx, &treasure.Hoards[i])
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (p *PostgresDB) createHoardTx(ctx context.Context, tx *sqlx.Tx, hoard *models.Hoard) error {
	query := `
		INSERT INTO hoards 
		(treasure_id, value, coins) 
		VALUES 
		($1, $2, $3)
		RETURNING id, created_at
	`

	row := tx.QueryRowContext(ctx, query,
		hoard.TreasureID, hoard.Value, hoard.Coins,
	)

	err := row.Scan(&hoard.ID, &hoard.CreatedAt)
	if err != nil {
		return fmt.Errorf("failed to insert hoard: %w", err)
	}

	return nil
}

func (p *PostgresDB) createItemTx(ctx context.Context, tx *sqlx.Tx, item *models.Item) error {
	query := `
		INSERT INTO items 
		(hoard_id, name, type, category, value, rank) 
		VALUES 
		($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at
	`

	row := tx.QueryRowContext(ctx, query,
		item.HoardID, item.Name, item.Type, item.Category, item.Value, item.Rank,
	)

	return row.Scan(&item.ID, &item.CreatedAt)
}

func (p *PostgresDB) DeleteTreasure(ctx context.Context, id int) error {
	query := `DELETE FROM treasures WHERE id = $1`

	_, err := p.DB.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete treasure with ID %d: %w", id, err)
	}

	return nil
}
