package handlers

import (
	"bytes"
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	sqlmock "github.com/DATA-DOG/go-sqlmock"
	"github.com/jmoiron/sqlx"

	"rpg-saas-backend/internal/api/middleware"
	"rpg-saas-backend/internal/db"
	"rpg-saas-backend/internal/python"
)

func newMockEncounterHandler(t *testing.T) (*EncounterHandler, sqlmock.Sqlmock, func()) {
	t.Helper()
	rawDB, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create sqlmock: %v", err)
	}
	pdb := &db.PostgresDB{DB: sqlx.NewDb(rawDB, "postgres")}
	return NewEncounterHandler(pdb, &python.Client{}), mock, func() { rawDB.Close() }
}

func TestEncounterHandler_ListAndDetail(t *testing.T) {
	handler, mock, cleanup := newMockEncounterHandler(t)
	defer cleanup()

	now := time.Now()
	encCols := []string{"id", "theme", "difficulty", "total_xp", "player_level", "player_count", "created_at"}
	encRows := sqlmock.NewRows(encCols).AddRow(1, "Forest", "m", 500, 3, 4, now)
	mock.ExpectQuery(`SELECT \* FROM encounters`).WithArgs(20, 0).WillReturnRows(encRows)
	mock.ExpectQuery(`SELECT \* FROM encounter_monsters WHERE encounter_id = \$1`).WithArgs(1).
		WillReturnRows(sqlmock.NewRows([]string{"id", "encounter_id", "name", "xp", "cr", "created_at"}))

	req := httptest.NewRequest(http.MethodGet, "/api/encounters", nil)
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
	rec := httptest.NewRecorder()
	handler.GetEncounters(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	detailRows := sqlmock.NewRows(encCols).AddRow(1, "Forest", "m", 500, 3, 4, now)
	mock.ExpectQuery(`SELECT \* FROM encounters WHERE id = \$1`).WithArgs(1).WillReturnRows(detailRows)
	mock.ExpectQuery(`SELECT \* FROM encounter_monsters WHERE encounter_id = \$1`).WithArgs(1).
		WillReturnRows(sqlmock.NewRows([]string{"id", "encounter_id", "name", "xp", "cr", "created_at"}))

	reqDetail := httptest.NewRequest(http.MethodGet, "/api/encounters/1", nil)
	reqDetail = addChiURLParam(reqDetail, "id", "1")
	reqDetail = reqDetail.WithContext(context.WithValue(reqDetail.Context(), middleware.UserIDKey, 7))
	recDetail := httptest.NewRecorder()
	handler.GetEncounterByID(recDetail, reqDetail)
	if recDetail.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", recDetail.Code)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestEncounterHandler_Create(t *testing.T) {
	handler, mock, cleanup := newMockEncounterHandler(t)
	defer cleanup()

	mock.ExpectBegin()
	mock.ExpectQuery(`INSERT INTO encounters`).WithArgs("Cave", "m", 400, 2, 4, nil).
		WillReturnRows(sqlmock.NewRows([]string{"id", "created_at"}).AddRow(5, time.Now()))
	mock.ExpectCommit()

	body := `{"theme":"Cave","difficulty":"m","total_xp":400,"player_level":2,"player_count":4}`
	req := httptest.NewRequest(http.MethodPost, "/api/encounters", bytes.NewBufferString(body))
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
	rec := httptest.NewRecorder()
	handler.CreateEncounter(rec, req)
	if rec.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d", rec.Code)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}
