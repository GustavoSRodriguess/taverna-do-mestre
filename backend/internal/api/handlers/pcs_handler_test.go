package handlers

import (
	"bytes"
	"context"
	"database/sql"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	sqlmock "github.com/DATA-DOG/go-sqlmock"
	"github.com/go-chi/chi/v5"
	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"

	"rpg-saas-backend/internal/api/middleware"
	"rpg-saas-backend/internal/db"
	"rpg-saas-backend/internal/python"
)

func newMockPCHandler(t *testing.T) (*PCHandler, sqlmock.Sqlmock, func()) {
	t.Helper()
	rawDB, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create sqlmock: %v", err)
	}
	pdb := &db.PostgresDB{DB: sqlx.NewDb(rawDB, "postgres")}
	return NewPCHandler(pdb, &python.Client{}), mock, func() { rawDB.Close() }
}

func addChiParam(req *http.Request, key, value string) *http.Request {
	rctx, _ := req.Context().Value(chi.RouteCtxKey).(*chi.Context)
	if rctx == nil {
		rctx = chi.NewRouteContext()
	}
	rctx.URLParams.Add(key, value)
	return req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))
}

func TestPCHandler_GetPCsAndByID(t *testing.T) {
	handler, mock, cleanup := newMockPCHandler(t)
	defer cleanup()

	now := time.Now()
	pcCols := []string{
		"id", "name", "description", "level", "race", "class", "background", "alignment",
		"attributes", "abilities", "equipment", "hp", "current_hp", "ca", "proficiency_bonus",
		"inspiration", "skills", "attacks", "spells", "personality_traits", "ideals", "bonds",
		"flaws", "features", "player_name", "player_id", "is_homebrew", "is_unique", "created_at",
	}
	pcRow := sqlmock.NewRows(pcCols).AddRow(
		1, "Hero", "desc", 3, "elf", "wizard", "sage", "neutral",
		[]byte(`{}`), []byte(`{}`), []byte(`{}`), 18, 18, 14, 2, false,
		[]byte(`{}`), []byte(`{}`), []byte(`{}`), "brave", "ideal", "bond", "flaw", pq.StringArray{"feature"},
		"Player", 7, false, true, now,
	)

	mock.ExpectQuery(`FROM pcs`).WithArgs(7, 20, 0).WillReturnRows(pcRow)

	req := httptest.NewRequest(http.MethodGet, "/api/pcs", nil)
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
	rr := httptest.NewRecorder()
	handler.GetPCs(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200 for list, got %d", rr.Code)
	}

	pcRowByID := sqlmock.NewRows(pcCols).AddRow(
		1, "Hero", "desc", 3, "elf", "wizard", "sage", "neutral",
		[]byte(`{}`), []byte(`{}`), []byte(`{}`), 18, 18, 14, 2, false,
		[]byte(`{}`), []byte(`{}`), []byte(`{}`), "brave", "ideal", "bond", "flaw", pq.StringArray{"feature"},
		"Player", 7, false, true, now,
	)
	mock.ExpectQuery(`FROM pcs`).WithArgs(1, 7).WillReturnRows(pcRowByID)
	reqByID := httptest.NewRequest(http.MethodGet, "/api/pcs/1", nil)
	reqByID = addChiParam(reqByID, "id", "1")
	reqByID = reqByID.WithContext(context.WithValue(reqByID.Context(), middleware.UserIDKey, 7))
	rrByID := httptest.NewRecorder()
	handler.GetPCByID(rrByID, reqByID)
	if rrByID.Code != http.StatusOK {
		t.Fatalf("expected 200 for detail, got %d", rrByID.Code)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestPCHandler_CreateUpdateDelete(t *testing.T) {
	handler, mock, cleanup := newMockPCHandler(t)
	defer cleanup()

	// Create
	mock.ExpectQuery(`INSERT INTO pcs`).WithArgs(
		"New", "desc", 2, "elf", "wizard", "sage", "", sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(),
		sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), 7, false, false, sqlmock.AnyArg(),
	).WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(10))

	createBody := `{"name":"New","description":"desc","level":2,"race":"elf","class":"wizard","background":"sage"}`
	reqCreate := httptest.NewRequest(http.MethodPost, "/api/pcs", bytes.NewBufferString(createBody))
	reqCreate = reqCreate.WithContext(context.WithValue(reqCreate.Context(), middleware.UserIDKey, 7))
	recCreate := httptest.NewRecorder()
	handler.CreatePC(recCreate, reqCreate)
	if recCreate.Code != http.StatusCreated {
		t.Fatalf("expected 201 for create, got %d", recCreate.Code)
	}

	// Update
	mock.ExpectExec(`UPDATE pcs SET`).WillReturnResult(sqlmock.NewResult(0, 1))
	updateBody := `{"name":"Upd","description":"desc","level":3,"race":"elf","class":"wizard"}`
	reqUpdate := httptest.NewRequest(http.MethodPut, "/api/pcs/10", bytes.NewBufferString(updateBody))
	reqUpdate = addChiParam(reqUpdate, "id", "10")
	reqUpdate = reqUpdate.WithContext(context.WithValue(reqUpdate.Context(), middleware.UserIDKey, 7))
	recUpdate := httptest.NewRecorder()
	handler.UpdatePC(recUpdate, reqUpdate)
	if recUpdate.Code != http.StatusOK {
		t.Fatalf("expected 200 for update, got %d", recUpdate.Code)
	}

	// Delete
	mock.ExpectQuery(`SELECT COUNT\(\*\)`).WithArgs(10).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(0))
	mock.ExpectExec(`DELETE FROM pcs WHERE id = \$1 AND player_id = \$2`).WithArgs(10, 7).
		WillReturnResult(sqlmock.NewResult(0, 1))

	reqDelete := httptest.NewRequest(http.MethodDelete, "/api/pcs/10", nil)
	reqDelete = addChiParam(reqDelete, "id", "10")
	reqDelete = reqDelete.WithContext(context.WithValue(reqDelete.Context(), middleware.UserIDKey, 7))
	recDelete := httptest.NewRecorder()
	handler.DeletePC(recDelete, reqDelete)
	if recDelete.Code != http.StatusNoContent {
		t.Fatalf("expected 204 for delete, got %d", recDelete.Code)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestPCHandler_GetPCCampaigns(t *testing.T) {
	handler, mock, cleanup := newMockPCHandler(t)
	defer cleanup()

	now := time.Now()
	pcRow := sqlmock.NewRows([]string{
		"id", "name", "description", "level", "race", "class", "background", "alignment",
		"attributes", "abilities", "equipment", "hp", "current_hp", "ca", "proficiency_bonus",
		"inspiration", "skills", "attacks", "spells", "personality_traits", "ideals", "bonds",
		"flaws", "features", "player_name", "player_id", "is_homebrew", "is_unique", "created_at",
	}).AddRow(
		2, "Hero", "desc", 3, "elf", "wizard", "sage", "neutral",
		[]byte(`{}`), []byte(`{}`), []byte(`{}`), 18, 18, 14, 2, false,
		[]byte(`{}`), []byte(`{}`), []byte(`{}`), "brave", "ideal", "bond", "flaw", pq.StringArray{"feature"},
		"Player", 7, true, true, now,
	)
	mock.ExpectQuery(`FROM pcs`).WithArgs(2, 7).WillReturnRows(pcRow)

	campaignRow := sqlmock.NewRows([]string{
		"id", "name", "description", "status", "max_players", "current_session",
		"created_at", "updated_at", "dm_name", "character_status", "current_hp", "player_count",
	}).AddRow(
		5, "Camp", "desc", "active", 5, 2, now, now, "DM", "active", 10, 3,
	)
	mock.ExpectQuery(`FROM campaigns c`).WithArgs(2, 7).WillReturnRows(campaignRow)

	req := httptest.NewRequest(http.MethodGet, "/api/pcs/2/campaigns", nil)
	req = addChiParam(req, "id", "2")
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
	rec := httptest.NewRecorder()
	handler.GetPCCampaigns(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 for campaigns, got %d", rec.Code)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestPCHandler_CheckUniquePCAvailability(t *testing.T) {
	handler, mock, cleanup := newMockPCHandler(t)
	defer cleanup()

	now := time.Now()
	pcRow := sqlmock.NewRows([]string{
		"id", "name", "description", "level", "race", "class", "background", "alignment",
		"attributes", "abilities", "equipment", "hp", "current_hp", "ca", "proficiency_bonus",
		"inspiration", "skills", "attacks", "spells", "personality_traits", "ideals", "bonds",
		"flaws", "features", "player_name", "player_id", "is_homebrew", "is_unique", "created_at",
	}).AddRow(
		3, "Unique", "desc", 4, "elf", "wizard", "sage", "neutral",
		[]byte(`{}`), []byte(`{}`), []byte(`{}`), 18, 18, 14, 2, false,
		[]byte(`{}`), []byte(`{}`), []byte(`{}`), "brave", "ideal", "bond", "flaw", pq.StringArray{"feature"},
		"Player", 7, false, true, now,
	)
	mock.ExpectQuery(`FROM pcs`).WithArgs(3, 7).WillReturnRows(pcRow)

	mock.ExpectQuery(`FROM campaign_characters cc`).WithArgs(3).
		WillReturnError(sql.ErrNoRows)
	mock.ExpectQuery(`SELECT COUNT\(\*\)`).WithArgs(3).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(0))

	req := httptest.NewRequest(http.MethodGet, "/api/pcs/3/check-availability", nil)
	req = addChiParam(req, "id", "3")
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
	rec := httptest.NewRecorder()
	handler.CheckUniquePCAvailability(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 for availability, got %d", rec.Code)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestPCHandler_GetPCByID_Errors(t *testing.T) {
	handler, _, cleanup := newMockPCHandler(t)
	defer cleanup()

	t.Run("invalid ID", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/pcs/invalid", nil)
		req = addChiParam(req, "id", "invalid")
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		rec := httptest.NewRecorder()

		handler.GetPCByID(rec, req)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rec.Code)
		}
	})

	t.Run("user ID not in context", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/pcs/1", nil)
		req = addChiParam(req, "id", "1")
		rec := httptest.NewRecorder()

		handler.GetPCByID(rec, req)
		if rec.Code != http.StatusInternalServerError {
			t.Fatalf("expected 500, got %d", rec.Code)
		}
	})
}

func TestPCHandler_DeletePC_Errors(t *testing.T) {
	t.Run("invalid ID", func(t *testing.T) {
		handler, _, cleanup := newMockPCHandler(t)
		defer cleanup()

		req := httptest.NewRequest(http.MethodDelete, "/api/pcs/invalid", nil)
		req = addChiParam(req, "id", "invalid")
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		rec := httptest.NewRecorder()

		handler.DeletePC(rec, req)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rec.Code)
		}
	})

	t.Run("PC in active campaign", func(t *testing.T) {
		handler, mock, cleanup := newMockPCHandler(t)
		defer cleanup()

		// Mock COUNT query showing PC is in a campaign
		mock.ExpectQuery(`SELECT COUNT\(\*\)`).WithArgs(1).
			WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(1))

		req := httptest.NewRequest(http.MethodDelete, "/api/pcs/1", nil)
		req = addChiParam(req, "id", "1")
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		rec := httptest.NewRecorder()

		handler.DeletePC(rec, req)
		// The error is returned as 500 from HandleDBError
		if rec.Code != http.StatusInternalServerError {
			t.Fatalf("expected 500, got %d", rec.Code)
		}
	})
}

func TestPCHandler_CreatePC_Errors(t *testing.T) {
	t.Run("invalid JSON body", func(t *testing.T) {
		handler, _, cleanup := newMockPCHandler(t)
		defer cleanup()

		req := httptest.NewRequest(http.MethodPost, "/api/pcs", bytes.NewBufferString("invalid-json"))
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		rec := httptest.NewRecorder()

		handler.CreatePC(rec, req)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rec.Code)
		}
	})

	t.Run("missing required fields", func(t *testing.T) {
		handler, _, cleanup := newMockPCHandler(t)
		defer cleanup()

		body := `{"name":"","level":0}`
		req := httptest.NewRequest(http.MethodPost, "/api/pcs", bytes.NewBufferString(body))
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		rec := httptest.NewRecorder()

		handler.CreatePC(rec, req)
		if rec.Code != http.StatusUnprocessableEntity {
			t.Fatalf("expected 422, got %d", rec.Code)
		}
	})
}

func TestPCHandler_UpdatePC_Errors(t *testing.T) {
	t.Run("invalid ID", func(t *testing.T) {
		handler, _, cleanup := newMockPCHandler(t)
		defer cleanup()

		body := `{"name":"Test"}`
		req := httptest.NewRequest(http.MethodPut, "/api/pcs/invalid", bytes.NewBufferString(body))
		req = addChiParam(req, "id", "invalid")
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		rec := httptest.NewRecorder()

		handler.UpdatePC(rec, req)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rec.Code)
		}
	})

	t.Run("invalid JSON body", func(t *testing.T) {
		handler, _, cleanup := newMockPCHandler(t)
		defer cleanup()

		req := httptest.NewRequest(http.MethodPut, "/api/pcs/1", bytes.NewBufferString("invalid-json"))
		req = addChiParam(req, "id", "1")
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		rec := httptest.NewRecorder()

		handler.UpdatePC(rec, req)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rec.Code)
		}
	})
}

func TestPCHandler_CheckUniquePCAvailability_NonUnique(t *testing.T) {
	handler, mock, cleanup := newMockPCHandler(t)
	defer cleanup()

	now := time.Now()
	// Non-unique path
	nonUnique := sqlmock.NewRows([]string{
		"id", "name", "description", "level", "race", "class", "background", "alignment",
		"attributes", "abilities", "equipment", "hp", "current_hp", "ca", "proficiency_bonus",
		"inspiration", "skills", "attacks", "spells", "personality_traits", "ideals", "bonds",
		"flaws", "features", "player_name", "player_id", "is_homebrew", "is_unique", "created_at",
	}).AddRow(
		4, "NonUnique", "desc", 1, "human", "fighter", "soldier", "neutral",
		[]byte(`{}`), []byte(`{}`), []byte(`{}`), 12, 12, 14, 2, false,
		[]byte(`{}`), []byte(`{}`), []byte(`{}`), "brave", "ideal", "bond", "flaw", pq.StringArray{"feature"},
		"Player", 7, false, false, now,
	)
	mock.ExpectQuery(`FROM pcs`).WithArgs(4, 7).WillReturnRows(nonUnique)

	reqNonUnique := httptest.NewRequest(http.MethodGet, "/api/pcs/4/check-availability", nil)
	reqNonUnique = addChiParam(reqNonUnique, "id", "4")
	reqNonUnique = reqNonUnique.WithContext(context.WithValue(reqNonUnique.Context(), middleware.UserIDKey, 7))
	recNonUnique := httptest.NewRecorder()
	handler.CheckUniquePCAvailability(recNonUnique, reqNonUnique)
	if recNonUnique.Code != http.StatusOK {
		t.Fatalf("expected 200 for non-unique availability, got %d", recNonUnique.Code)
	}
}
