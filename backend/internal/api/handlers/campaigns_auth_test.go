package handlers

import (
	"bytes"
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	sqlmock "github.com/DATA-DOG/go-sqlmock"
	"github.com/jmoiron/sqlx"
	"database/sql"

	"rpg-saas-backend/internal/api/middleware"
	"rpg-saas-backend/internal/db"
)

func TestCampaignHandler_CreateCampaign_NoUser(t *testing.T) {
	h, _, cleanup := newMockCampaignHandler(t)
	defer cleanup()

	req := httptest.NewRequest(http.MethodPost, "/api/campaigns", bytes.NewBufferString(`{"name":"X"}`))
	rec := httptest.NewRecorder()

	h.CreateCampaign(rec, req)
	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500 when user missing, got %d", rec.Code)
	}
}

func TestCampaignHandler_AddCharacter_PCNotFound(t *testing.T) {
	rawDB, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create sqlmock: %v", err)
	}
	defer rawDB.Close()
	pdb := &db.PostgresDB{DB: sqlx.NewDb(rawDB, "postgres")}
	h := NewCampaignHandler(pdb)

	mock.ExpectQuery(`FROM pcs`).WithArgs(99).WillReturnError(sql.ErrNoRows)

	req := httptest.NewRequest(http.MethodPost, "/api/campaigns/1/characters", bytes.NewBufferString(`{"source_pc_id":99}`))
	req = addChiURLParam(req, "id", "1")
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 1))
	rec := httptest.NewRecorder()

	h.AddCharacterToCampaign(rec, req)
	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected 404 when PC not found, got %d", rec.Code)
	}
}

func TestCampaignHandler_JoinCampaign_InvalidCode(t *testing.T) {
	h, _, cleanup := newMockCampaignHandler(t)
	defer cleanup()

	req := httptest.NewRequest(http.MethodPost, "/api/campaigns/join", bytes.NewBufferString(`{"invite_code":""}`))
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 1))
	rec := httptest.NewRecorder()

	h.JoinCampaign(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for invalid invite code, got %d", rec.Code)
	}
}
