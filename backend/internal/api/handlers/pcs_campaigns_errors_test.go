package handlers

import (
	"context"
	"database/sql"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	sqlmock "github.com/DATA-DOG/go-sqlmock"
	"github.com/lib/pq"

	"rpg-saas-backend/internal/api/middleware"
)

func TestPCHandler_GetPCCampaigns_Errors(t *testing.T) {
	handler, mock, cleanup := newMockPCHandler(t)
	defer cleanup()

	t.Run("invalid PC ID", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/pcs/invalid/campaigns", nil)
		req = addChiParam(req, "id", "invalid")
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		rec := httptest.NewRecorder()

		handler.GetPCCampaigns(rec, req)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rec.Code)
		}
	})

	t.Run("user ID not in context", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/pcs/1/campaigns", nil)
		req = addChiParam(req, "id", "1")
		rec := httptest.NewRecorder()

		handler.GetPCCampaigns(rec, req)
		if rec.Code != http.StatusInternalServerError {
			t.Fatalf("expected 500, got %d", rec.Code)
		}
	})

	t.Run("PC not found", func(t *testing.T) {
		mock.ExpectQuery(`FROM pcs`).WithArgs(999, 7).
			WillReturnError(sql.ErrNoRows)

		req := httptest.NewRequest(http.MethodGet, "/api/pcs/999/campaigns", nil)
		req = addChiParam(req, "id", "999")
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		rec := httptest.NewRecorder()

		handler.GetPCCampaigns(rec, req)
		// HandleDBError returns 500 for sql.ErrNoRows
		if rec.Code != http.StatusInternalServerError {
			t.Fatalf("expected 500, got %d", rec.Code)
		}
	})
}

func TestPCHandler_CheckUniquePCAvailability_Errors(t *testing.T) {
	handler, _, cleanup := newMockPCHandler(t)
	defer cleanup()

	t.Run("invalid PC ID", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/pcs/invalid/availability", nil)
		req = addChiParam(req, "id", "invalid")
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		rec := httptest.NewRecorder()

		handler.CheckUniquePCAvailability(rec, req)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rec.Code)
		}
	})

	t.Run("user ID not in context", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/pcs/1/availability", nil)
		req = addChiParam(req, "id", "1")
		rec := httptest.NewRecorder()

		handler.CheckUniquePCAvailability(rec, req)
		if rec.Code != http.StatusInternalServerError {
			t.Fatalf("expected 500, got %d", rec.Code)
		}
	})
}

func TestPCHandler_CheckUniquePCAvailability_AlreadyInCampaign(t *testing.T) {
	handler, mock, cleanup := newMockPCHandler(t)
	defer cleanup()

	now := time.Now()
	pcRow := sqlmock.NewRows([]string{
		"id", "name", "description", "level", "race", "class", "background", "alignment",
		"attributes", "abilities", "equipment", "hp", "current_hp", "ca", "proficiency_bonus",
		"inspiration", "skills", "attacks", "spells", "personality_traits", "ideals", "bonds",
		"flaws", "features", "player_name", "player_id", "is_homebrew", "is_unique", "created_at",
	}).AddRow(
		5, "Unique", "desc", 4, "elf", "wizard", "sage", "neutral",
		[]byte(`{}`), []byte(`{}`), []byte(`{}`), 18, 18, 14, 2, false,
		[]byte(`{}`), []byte(`{}`), []byte(`{}`), "brave", "ideal", "bond", "flaw", pq.StringArray{"feature"},
		"Player", 7, false, true, now,
	)
	mock.ExpectQuery(`FROM pcs`).WithArgs(5, 7).WillReturnRows(pcRow)

	// Mock that PC is already in a campaign - must return only campaign ID
	campaignRow := sqlmock.NewRows([]string{"campaign_id"}).
		AddRow(10)
	mock.ExpectQuery(`FROM campaign_characters cc`).WithArgs(5).
		WillReturnRows(campaignRow)

	// Expect COUNT query
	mock.ExpectQuery(`SELECT COUNT\(\*\)`).WithArgs(5).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(1))

	req := httptest.NewRequest(http.MethodGet, "/api/pcs/5/check-availability", nil)
	req = addChiParam(req, "id", "5")
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
	rec := httptest.NewRecorder()

	handler.CheckUniquePCAvailability(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}
