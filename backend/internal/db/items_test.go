package db

import (
	"context"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"rpg-saas-backend/internal/models"
)

func TestGetTreasures(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	now := time.Now()
	treasureRows := sqlmock.NewRows([]string{
		"id", "level", "name", "total_value", "created_at",
	}).AddRow(1, 5, "Dragon Hoard", 10000, now)

	mock.ExpectQuery(`SELECT \* FROM treasures ORDER BY id LIMIT \$1 OFFSET \$2`).
		WithArgs(10, 0).
		WillReturnRows(treasureRows)

	// Mock hoards query for the treasure
	hoardRows := sqlmock.NewRows([]string{
		"id", "treasure_id", "value", "coins", "created_at",
	})
	mock.ExpectQuery(`SELECT \* FROM hoards WHERE treasure_id = \$1`).
		WithArgs(1).
		WillReturnRows(hoardRows)

	treasures, err := pdb.GetTreasures(context.Background(), 10, 0)
	if err != nil {
		t.Fatalf("GetTreasures error: %v", err)
	}
	if len(treasures) != 1 || treasures[0].Name != "Dragon Hoard" {
		t.Fatalf("unexpected treasures: %+v", treasures)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestGetTreasureByID(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	now := time.Now()
	// Mock treasure query
	treasureRow := sqlmock.NewRows([]string{
		"id", "level", "name", "total_value", "created_at",
	}).AddRow(1, 3, "Chest", 500, now)

	mock.ExpectQuery(`SELECT \* FROM treasures WHERE id = \$1`).
		WithArgs(1).
		WillReturnRows(treasureRow)

	// Mock hoards query
	hoardRows := sqlmock.NewRows([]string{
		"id", "treasure_id", "value", "coins", "created_at",
	}).AddRow(10, 1, 500.0, []byte(`{"gold":100}`), now)

	mock.ExpectQuery(`SELECT \* FROM hoards WHERE treasure_id = \$1`).
		WithArgs(1).
		WillReturnRows(hoardRows)

	// Mock items query for first hoard (valuables)
	valuableRows := sqlmock.NewRows([]string{
		"id", "hoard_id", "name", "type", "category", "value", "rank", "created_at",
	})
	mock.ExpectQuery(`SELECT \* FROM items WHERE hoard_id = \$1`).
		WithArgs(10).
		WillReturnRows(valuableRows)

	treasure, err := pdb.GetTreasureByID(context.Background(), 1)
	if err != nil {
		t.Fatalf("GetTreasureByID error: %v", err)
	}
	if treasure.Name != "Chest" {
		t.Fatalf("unexpected treasure: %+v", treasure)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestGetHoardsByTreasureID(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	now := time.Now()
	hoardRows := sqlmock.NewRows([]string{
		"id", "treasure_id", "value", "coins", "created_at",
	}).AddRow(1, 5, 1000.0, []byte(`{"gold":100,"silver":500}`), now)

	mock.ExpectQuery(`SELECT \* FROM hoards WHERE treasure_id = \$1`).
		WithArgs(5).
		WillReturnRows(hoardRows)

	// Mock items query for the hoard
	itemRows := sqlmock.NewRows([]string{
		"id", "hoard_id", "name", "type", "category", "value", "rank", "created_at",
	})
	mock.ExpectQuery(`SELECT \* FROM items WHERE hoard_id = \$1`).
		WithArgs(1).
		WillReturnRows(itemRows)

	hoards, err := pdb.GetHoardsByTreasureID(context.Background(), 5)
	if err != nil {
		t.Fatalf("GetHoardsByTreasureID error: %v", err)
	}
	if len(hoards) != 1 || hoards[0].Value != 1000.0 {
		t.Fatalf("unexpected hoards: %+v", hoards)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestGetItemsByHoardID(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	now := time.Now()
	rows := sqlmock.NewRows([]string{
		"id", "hoard_id", "name", "type", "category", "value", "rank", "created_at",
	}).AddRow(1, 3, "Magic Sword", "item", "weapon", 500.0, "rare", now)

	mock.ExpectQuery(`SELECT \* FROM items WHERE hoard_id = \$1`).
		WithArgs(3).
		WillReturnRows(rows)

	items, err := pdb.GetItemsByHoardID(context.Background(), 3)
	if err != nil {
		t.Fatalf("GetItemsByHoardID error: %v", err)
	}
	if len(items) != 1 || items[0].Name != "Magic Sword" {
		t.Fatalf("unexpected items: %+v", items)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestDeleteTreasure(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	mock.ExpectExec(`DELETE FROM treasures WHERE id = \$1`).
		WithArgs(1).
		WillReturnResult(sqlmock.NewResult(0, 1))

	err := pdb.DeleteTreasure(context.Background(), 1)
	if err != nil {
		t.Fatalf("DeleteTreasure error: %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestCreateTreasure(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	now := time.Now()

	// Mock BeginTx
	mock.ExpectBegin()

	// Mock treasure insert (order: level, name, total_value)
	mock.ExpectQuery(`INSERT INTO treasures`).
		WithArgs(5, "New Treasure", 0).
		WillReturnRows(sqlmock.NewRows([]string{"id", "created_at"}).
			AddRow(100, now))

	// Mock hoard insert (order: treasure_id, value, coins)
	mock.ExpectQuery(`INSERT INTO hoards`).
		WithArgs(100, 500.0, sqlmock.AnyArg()).
		WillReturnRows(sqlmock.NewRows([]string{"id", "created_at"}).AddRow(200, now))

	// Mock commit
	mock.ExpectCommit()

	treasure := &models.Treasure{
		Name:  "New Treasure",
		Level: 5,
		Hoards: []models.Hoard{
			{
				Value: 500.0,
				Coins: models.JSONB{"gold": 100},
				Items: []models.Item{
					{
						Name:     "Item 1",
						Type:     "item",
						Category: "weapon",
						Value:    10.0,
						Rank:     "common",
					},
				},
			},
		},
	}

	err := pdb.CreateTreasure(context.Background(), treasure)
	if err != nil {
		t.Fatalf("CreateTreasure error: %v", err)
	}
	if treasure.ID != 100 {
		t.Fatalf("expected treasure ID 100, got %d", treasure.ID)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}
