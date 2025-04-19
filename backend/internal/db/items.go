// internal/db/items.go
package db

import (
	"context"
	"fmt"

	"github.com/jmoiron/sqlx"

	"rpg-saas-backend/internal/models"
)

// GetTreasures returns all treasures paginated
func (p *PostgresDB) GetTreasures(ctx context.Context, limit, offset int) ([]models.Treasure, error) {
	treasures := []models.Treasure{}
	query := `SELECT * FROM treasures ORDER BY id LIMIT $1 OFFSET $2`

	err := p.DB.SelectContext(ctx, &treasures, query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch treasures: %w", err)
	}

	// For each treasure, fetch its hoards
	for i := range treasures {
		hoards, err := p.GetHoardsByTreasureID(ctx, treasures[i].ID)
		if err != nil {
			return nil, err
		}
		treasures[i].Hoards = hoards
	}

	return treasures, nil
}

// GetTreasureByID returns a treasure by ID
func (p *PostgresDB) GetTreasureByID(ctx context.Context, id int) (*models.Treasure, error) {
	var treasure models.Treasure
	query := `SELECT * FROM treasures WHERE id = $1`

	err := p.DB.GetContext(ctx, &treasure, query, id)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch treasure with ID %d: %w", id, err)
	}

	// Fetch this treasure's hoards
	hoards, err := p.GetHoardsByTreasureID(ctx, id)
	if err != nil {
		return nil, err
	}
	treasure.Hoards = hoards

	return &treasure, nil
}

// GetHoardsByTreasureID returns all hoards for a specific treasure
func (p *PostgresDB) GetHoardsByTreasureID(ctx context.Context, treasureID int) ([]models.Hoard, error) {
	hoards := []models.Hoard{}
	query := `SELECT * FROM hoards WHERE treasure_id = $1`

	err := p.DB.SelectContext(ctx, &hoards, query, treasureID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch hoards for treasure ID %d: %w", treasureID, err)
	}

	// For each hoard, fetch its items
	for i := range hoards {
		_, err := p.GetItemsByHoardID(ctx, hoards[i].ID)
		if err != nil {
			return nil, err
		}

		// We don't have a direct items field in the Hoard struct,
		// but we could store the count or other metadata if needed
	}

	return hoards, nil
}

// GetItemsByHoardID returns all items for a specific hoard
func (p *PostgresDB) GetItemsByHoardID(ctx context.Context, hoardID int) ([]models.Item, error) {
	items := []models.Item{}
	query := `SELECT * FROM items WHERE hoard_id = $1`

	err := p.DB.SelectContext(ctx, &items, query, hoardID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch items for hoard ID %d: %w", hoardID, err)
	}

	return items, nil
}

// CreateTreasure creates a new treasure with its hoards and items
func (p *PostgresDB) CreateTreasure(ctx context.Context, treasure *models.Treasure) error {
	// Start a transaction
	tx, err := p.DB.BeginTxx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Insert the treasure
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

	// Insert the hoards associated with this treasure
	for i := range treasure.Hoards {
		treasure.Hoards[i].TreasureID = treasure.ID
		err = p.createHoardTx(ctx, tx, &treasure.Hoards[i])
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

// createHoardTx inserts a hoard in a transaction
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

	// If needed, insert items associated with this hoard here

	return nil
}

// createItemTx inserts an item in a transaction
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

// DeleteTreasure removes a treasure by ID (cascades to hoards and items)
func (p *PostgresDB) DeleteTreasure(ctx context.Context, id int) error {
	query := `DELETE FROM treasures WHERE id = $1`

	_, err := p.DB.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete treasure with ID %d: %w", id, err)
	}

	return nil
}
