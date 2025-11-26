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
)

func TestCampaignHandler_GetCampaignByID_InvalidID(t *testing.T) {
	h, _, cleanup := newMockCampaignHandler(t)
	defer cleanup()

	req := httptest.NewRequest(http.MethodGet, "/api/campaigns/abc", nil)
	req = addChiURLParam(req, "id", "abc")
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 1))
	rec := httptest.NewRecorder()

	h.GetCampaignByID(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rec.Code)
	}
}

func TestCampaignHandler_AddCharacter_NotInCampaign(t *testing.T) {
	rawDB, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create sqlmock: %v", err)
	}
	defer rawDB.Close()

	pdb := &db.PostgresDB{DB: sqlx.NewDb(rawDB, "postgres")}
	h := NewCampaignHandler(pdb)

	now := time.Now()
	pcRow := sqlmock.NewRows([]string{
		"id", "name", "description", "level", "race", "class", "background", "alignment",
		"attributes", "abilities", "equipment", "hp", "ca", "player_name", "player_id", "created_at",
	}).AddRow(4, "PC", "desc", 3, "elf", "wizard", "sage", "neutral", []byte(`{}`), []byte(`{}`), []byte(`{}`), 18, 14, "Player", 1, now)
	mock.ExpectQuery(`FROM pcs`).WithArgs(4).WillReturnRows(pcRow)
	mock.ExpectQuery(`SELECT EXISTS`).WithArgs(70, 1).WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(false))

	body := `{"source_pc_id":4}`
	req := httptest.NewRequest(http.MethodPost, "/api/campaigns/70/characters", bytes.NewBufferString(body))
	req = addChiURLParam(req, "id", "70")
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 1))
	rec := httptest.NewRecorder()

	h.AddCharacterToCampaign(rec, req)
	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", rec.Code)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestCampaignHandler_AddCharacter_AlreadyInCampaign(t *testing.T) {
	rawDB, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create sqlmock: %v", err)
	}
	defer rawDB.Close()

	pdb := &db.PostgresDB{DB: sqlx.NewDb(rawDB, "postgres")}
	h := NewCampaignHandler(pdb)

	now := time.Now()
	pcRow := sqlmock.NewRows([]string{
		"id", "name", "description", "level", "race", "class", "background", "alignment",
		"attributes", "abilities", "equipment", "hp", "ca", "player_name", "player_id", "created_at",
	}).AddRow(4, "PC", "desc", 3, "elf", "wizard", "sage", "neutral", []byte(`{}`), []byte(`{}`), []byte(`{}`), 18, 14, "Player", 1, now)
	mock.ExpectQuery(`FROM pcs`).WithArgs(4).WillReturnRows(pcRow)

	mock.ExpectQuery(`SELECT EXISTS`).WithArgs(70, 1).WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(true))
	mock.ExpectQuery(`SELECT EXISTS\(SELECT 1 FROM campaign_characters`).WithArgs(70, 4).
		WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(true))

	body := `{"source_pc_id":4}`
	req := httptest.NewRequest(http.MethodPost, "/api/campaigns/70/characters", bytes.NewBufferString(body))
	req = addChiURLParam(req, "id", "70")
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 1))
	rec := httptest.NewRecorder()

	h.AddCharacterToCampaign(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 when PC already in campaign, got %d", rec.Code)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestCampaignHandler_AddCharacter_InvalidCampaignID(t *testing.T) {
	h, _, cleanup := newMockCampaignHandler(t)
	defer cleanup()

	req := httptest.NewRequest(http.MethodPost, "/api/campaigns/abc/characters", bytes.NewBufferString(`{"source_pc_id":1}`))
	req = addChiURLParam(req, "id", "abc")
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 1))
	rec := httptest.NewRecorder()

	h.AddCharacterToCampaign(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for invalid campaign id, got %d", rec.Code)
	}
}

func TestCampaignHandler_UpdateCampaignCharacterFull_BadJSON(t *testing.T) {
	h, _, cleanup := newMockCampaignHandler(t)
	defer cleanup()

	req := httptest.NewRequest(http.MethodPut, "/api/campaigns/1/characters/1/full", bytes.NewBufferString(`{invalid`))
	req = addChiURLParam(req, "id", "1")
	req = addChiURLParam(req, "characterId", "1")
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 1))
	rec := httptest.NewRecorder()

	h.UpdateCampaignCharacterFull(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for bad json, got %d", rec.Code)
	}
}

func TestEncounterHandler_CreateEncounter_InvalidJSON(t *testing.T) {
	h, _, cleanup := newMockEncounterHandler(t)
	defer cleanup()

	req := httptest.NewRequest(http.MethodPost, "/api/encounters", bytes.NewBufferString(`{invalid`))
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 1))
	rec := httptest.NewRecorder()

	h.CreateEncounter(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rec.Code)
	}
}

func TestItemHandler_CreateTreasure_InvalidJSON(t *testing.T) {
	h, _, cleanup := newMockItemHandler(t)
	defer cleanup()

	req := httptest.NewRequest(http.MethodPost, "/api/treasures", bytes.NewBufferString(`{invalid`))
	rec := httptest.NewRecorder()

	h.CreateTreasure(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rec.Code)
	}
}
