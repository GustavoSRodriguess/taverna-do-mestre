package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	sqlmock "github.com/DATA-DOG/go-sqlmock"
	"github.com/jmoiron/sqlx"

	"rpg-saas-backend/internal/db"
	"rpg-saas-backend/internal/models"
	"rpg-saas-backend/internal/python"
)

func newMockItemHandler(t *testing.T) (*ItemHandler, sqlmock.Sqlmock, func()) {
	t.Helper()
	rawDB, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create sqlmock: %v", err)
	}
	pdb := &db.PostgresDB{DB: sqlx.NewDb(rawDB, "postgres")}
	py := &python.Client{}
	return NewItemHandler(pdb, py), mock, func() { rawDB.Close() }
}

func TestItemHandler_GetTreasures(t *testing.T) {
	h, mock, cleanup := newMockItemHandler(t)
	defer cleanup()

	now := time.Now()
	treasureRows := sqlmock.NewRows([]string{"id", "level", "name", "total_value", "created_at"}).
		AddRow(1, 3, "Treasure", 100, now)
	mock.ExpectQuery(`SELECT \* FROM treasures`).WithArgs(20, 0).WillReturnRows(treasureRows)

	hoardRows := sqlmock.NewRows([]string{"id", "treasure_id", "value", "coins", "created_at"})
	mock.ExpectQuery(`SELECT \* FROM hoards WHERE treasure_id = \$1`).WithArgs(1).WillReturnRows(hoardRows)

	req := httptest.NewRequest(http.MethodGet, "/api/treasures", nil)
	rr := httptest.NewRecorder()

	h.GetTreasures(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestItemHandler_GetTreasureByID(t *testing.T) {
	h, mock, cleanup := newMockItemHandler(t)
	defer cleanup()

	now := time.Now()
	treasureRow := sqlmock.NewRows([]string{"id", "level", "name", "total_value", "created_at"}).
		AddRow(2, 5, "Boss Loot", 500, now)
	mock.ExpectQuery(`SELECT \* FROM treasures WHERE id = \$1`).WithArgs(2).WillReturnRows(treasureRow)

	hoardRows := sqlmock.NewRows([]string{"id", "treasure_id", "value", "coins", "created_at"})
	mock.ExpectQuery(`SELECT \* FROM hoards WHERE treasure_id = \$1`).WithArgs(2).WillReturnRows(hoardRows)

	req := httptest.NewRequest(http.MethodGet, "/api/treasures/2", nil)
	req = addChiURLParam(req, "id", "2")
	rr := httptest.NewRecorder()

	h.GetTreasureByID(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestItemHandler_CreateTreasure(t *testing.T) {
	h, mock, cleanup := newMockItemHandler(t)
	defer cleanup()

	mock.ExpectBegin()
	mock.ExpectQuery(`INSERT INTO treasures`).WithArgs(3, "New", 50).
		WillReturnRows(sqlmock.NewRows([]string{"id", "created_at"}).AddRow(5, time.Now()))
	mock.ExpectCommit()

	payload, _ := json.Marshal(models.Treasure{Level: 3, Name: "New", TotalValue: 50})
	req := httptest.NewRequest(http.MethodPost, "/api/treasures", bytes.NewBuffer(payload))
	rr := httptest.NewRecorder()

	h.CreateTreasure(rr, req)
	if rr.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d", rr.Code)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestItemHandler_DeleteTreasure(t *testing.T) {
	h, mock, cleanup := newMockItemHandler(t)
	defer cleanup()

	mock.ExpectExec(`DELETE FROM treasures WHERE id = \$1`).WithArgs(9).
		WillReturnResult(sqlmock.NewResult(0, 1))

	req := httptest.NewRequest(http.MethodDelete, "/api/treasures/9", nil)
	req = addChiURLParam(req, "id", "9")
	rr := httptest.NewRecorder()

	h.DeleteTreasure(rr, req)
	if rr.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d", rr.Code)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}
