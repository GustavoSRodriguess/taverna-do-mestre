package handlers

import (
	"bytes"
	"context"
	"encoding/json"
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
	"rpg-saas-backend/internal/models"
)

func newMockCampaignHandler(t *testing.T) (*CampaignHandler, sqlmock.Sqlmock, func()) {
	t.Helper()

	rawDB, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create sqlmock: %v", err)
	}

	pdb := &db.PostgresDB{DB: sqlx.NewDb(rawDB, "postgres")}
	return NewCampaignHandler(pdb), mock, func() { rawDB.Close() }
}

func addChiURLParam(req *http.Request, key, value string) *http.Request {
	rctx, _ := req.Context().Value(chi.RouteCtxKey).(*chi.Context)
	if rctx == nil {
		rctx = chi.NewRouteContext()
	}
	rctx.URLParams.Add(key, value)
	return req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))
}

func TestCampaignHandler_GetCampaigns(t *testing.T) {
	handler, mock, cleanup := newMockCampaignHandler(t)
	defer cleanup()

	now := time.Now()
	rows := sqlmock.NewRows([]string{
		"id", "name", "description", "status", "allow_homebrew", "max_players", "current_session",
		"invite_code", "created_at", "updated_at", "dm_name", "player_count",
	}).AddRow(1, "Test", "desc", "planning", false, 5, 1, "CODE1234", now, now, "DM", 2)

	mock.ExpectQuery(`FROM campaigns`).WithArgs(7, 20, 0).WillReturnRows(rows)

	req := httptest.NewRequest(http.MethodGet, "/api/campaigns", nil)
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
	rr := httptest.NewRecorder()

	handler.GetCampaigns(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}

	var resp map[string]any
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	results := resp["results"].(map[string]any)
	if results["campaigns"] == nil {
		t.Fatalf("expected campaigns in response")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestCampaignHandler_CreateCampaign(t *testing.T) {
	handler, mock, cleanup := newMockCampaignHandler(t)
	defer cleanup()

	mock.ExpectQuery(`INSERT INTO campaigns`).
		WithArgs("New Campaign", "desc", 7, 6, "planning", false, sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg()).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(99))

	body := bytes.NewBufferString(`{"name":"New Campaign","description":"desc","max_players":6}`)
	req := httptest.NewRequest(http.MethodPost, "/api/campaigns", body)
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
	rr := httptest.NewRecorder()

	handler.CreateCampaign(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d", rr.Code)
	}

	var resp map[string]any
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if resp["message"] != "Campaign created successfully" {
		t.Fatalf("unexpected message: %v", resp["message"])
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestCampaignHandler_JoinAndLeaveCampaign(t *testing.T) {
	handler, mock, cleanup := newMockCampaignHandler(t)
	defer cleanup()

	now := time.Now()
	// Join flow expectations
	mock.ExpectQuery(`FROM campaigns\s+WHERE invite_code = \$1`).
		WithArgs("ABCD1234").
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "name", "description", "dm_id", "max_players", "current_session", "status", "allow_homebrew", "invite_code", "created_at", "updated_at",
		}).AddRow(5, "Joinable", "desc", 20, 5, 1, "planning", false, "ABCD1234", now, now))

	mock.ExpectQuery(`SELECT EXISTS\(SELECT 1 FROM campaign_players WHERE campaign_id = \$1 AND user_id = \$2\)`).
		WithArgs(5, 7).
		WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(false))

	mock.ExpectQuery(`SELECT COUNT\(cp.user_id\) as player_count`).
		WithArgs(5).
		WillReturnRows(sqlmock.NewRows([]string{"player_count"}).AddRow(1))

	mock.ExpectExec(`INSERT INTO campaign_players`).
		WithArgs(5, 7, sqlmock.AnyArg()).
		WillReturnResult(sqlmock.NewResult(1, 1))

	joinBody := bytes.NewBufferString(`{"invite_code":"ABCD-1234"}`)
	joinReq := httptest.NewRequest(http.MethodPost, "/api/campaigns/join", joinBody)
	joinReq = joinReq.WithContext(context.WithValue(joinReq.Context(), middleware.UserIDKey, 7))
	joinRec := httptest.NewRecorder()
	handler.JoinCampaign(joinRec, joinReq)
	if joinRec.Code != http.StatusOK {
		t.Fatalf("expected 200 for join, got %d", joinRec.Code)
	}

	// Leave flow expectations
	mock.ExpectExec(`DELETE FROM campaign_players WHERE campaign_id = \$1 AND user_id = \$2`).
		WithArgs(5, 7).
		WillReturnResult(sqlmock.NewResult(1, 1))

	leaveReq := httptest.NewRequest(http.MethodDelete, "/api/campaigns/5/leave", nil)
	leaveReq = leaveReq.WithContext(context.WithValue(leaveReq.Context(), middleware.UserIDKey, 7))
	leaveReq = addChiURLParam(leaveReq, "id", "5")
	leaveRec := httptest.NewRecorder()
	handler.LeaveCampaign(leaveRec, leaveReq)
	if leaveRec.Code != http.StatusNoContent {
		t.Fatalf("expected 204 for leave, got %d", leaveRec.Code)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestCampaignHandler_LeaveCampaignErrors(t *testing.T) {
	handler, mock, cleanup := newMockCampaignHandler(t)
	defer cleanup()

	t.Run("missing user ID in context", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodDelete, "/api/campaigns/5/leave", nil)
		req = addChiURLParam(req, "id", "5")
		rr := httptest.NewRecorder()

		handler.LeaveCampaign(rr, req)

		if rr.Code != http.StatusInternalServerError {
			t.Fatalf("expected 500, got %d", rr.Code)
		}
	})

	t.Run("invalid campaign ID", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodDelete, "/api/campaigns/invalid/leave", nil)
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		req = addChiURLParam(req, "id", "invalid")
		rr := httptest.NewRecorder()

		handler.LeaveCampaign(rr, req)

		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rr.Code)
		}
	})

	t.Run("database error", func(t *testing.T) {
		mock.ExpectExec(`DELETE FROM campaign_players WHERE campaign_id = \$1 AND user_id = \$2`).
			WithArgs(5, 7).
			WillReturnError(sqlmock.ErrCancelled)

		req := httptest.NewRequest(http.MethodDelete, "/api/campaigns/5/leave", nil)
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		req = addChiURLParam(req, "id", "5")
		rr := httptest.NewRecorder()

		handler.LeaveCampaign(rr, req)

		if rr.Code != http.StatusInternalServerError {
			t.Fatalf("expected 500, got %d", rr.Code)
		}

		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatalf("sql expectations not met: %v", err)
		}
	})
}

func TestCampaignHandler_GetInviteCode(t *testing.T) {
	handler, mock, cleanup := newMockCampaignHandler(t)
	defer cleanup()

	now := time.Now()
	campaignRow := sqlmock.NewRows([]string{
		"id", "name", "description", "dm_id", "max_players", "current_session",
		"status", "allow_homebrew", "invite_code", "created_at", "updated_at",
	}).AddRow(10, "Invite Campaign", "desc", 7, 5, 1, "planning", false, "CODE1234", now, now)

	mock.ExpectQuery(`FROM campaigns c`).
		WithArgs(10, 7).
		WillReturnRows(campaignRow)

	playerRows := sqlmock.NewRows([]string{"id", "campaign_id", "user_id", "joined_at", "status", "username", "email"})
	mock.ExpectQuery(`FROM campaign_players`).WithArgs(10).WillReturnRows(playerRows)

	characterCols := []string{
		"id", "campaign_id", "player_id", "source_pc_id", "status", "joined_at", "last_sync", "campaign_notes",
		"name", "description", "level", "race", "class", "background", "alignment", "attributes", "abilities",
		"equipment", "hp", "current_hp", "ca", "proficiency_bonus", "inspiration", "skills", "attacks", "spells",
		"personality_traits", "ideals", "bonds", "flaws", "features", "player_name", "player_username",
	}
	characterRows := sqlmock.NewRows(characterCols)
	mock.ExpectQuery(`FROM campaign_characters`).WithArgs(10).WillReturnRows(characterRows)

	req := httptest.NewRequest(http.MethodGet, "/api/campaigns/10/invite-code", nil)
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
	req = addChiURLParam(req, "id", "10")
	rr := httptest.NewRecorder()

	handler.GetInviteCode(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}

	var resp models.CampaignInviteResponse
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if resp.InviteCode != "CODE-1234" {
		t.Fatalf("unexpected invite code formatting: %s", resp.InviteCode)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestCampaignHandler_GetCampaignByID(t *testing.T) {
	handler, mock, cleanup := newMockCampaignHandler(t)
	defer cleanup()

	now := time.Now()
	campaignRow := sqlmock.NewRows([]string{
		"id", "name", "description", "dm_id", "max_players", "current_session",
		"status", "allow_homebrew", "invite_code", "created_at", "updated_at",
	}).AddRow(30, "Detail", "desc", 7, 5, 1, "active", false, "CODE1234", now, now)
	mock.ExpectQuery(`FROM campaigns`).WithArgs(30, 7).WillReturnRows(campaignRow)

	playerRows := sqlmock.NewRows([]string{"id", "campaign_id", "user_id", "joined_at", "status", "username", "email"})
	mock.ExpectQuery(`FROM campaign_players`).WithArgs(30).WillReturnRows(playerRows)

	characterCols := []string{
		"id", "campaign_id", "player_id", "source_pc_id", "status", "joined_at", "last_sync", "campaign_notes",
		"name", "description", "level", "race", "class", "background", "alignment", "attributes", "abilities",
		"equipment", "hp", "current_hp", "ca", "proficiency_bonus", "inspiration", "skills", "attacks", "spells",
		"personality_traits", "ideals", "bonds", "flaws", "features", "player_name", "player_username",
	}
	characterRows := sqlmock.NewRows(characterCols)
	mock.ExpectQuery(`FROM campaign_characters`).WithArgs(30).WillReturnRows(characterRows)

	req := httptest.NewRequest(http.MethodGet, "/api/campaigns/30", nil)
	req = addChiURLParam(req, "id", "30")
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
	rr := httptest.NewRecorder()

	handler.GetCampaignByID(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestCampaignHandler_UpdateAndDeleteCampaign(t *testing.T) {
	handler, mock, cleanup := newMockCampaignHandler(t)
	defer cleanup()

	mock.ExpectExec(`UPDATE campaigns SET`).WithArgs(
		"Updated", "desc", 6, 2, "active", false, sqlmock.AnyArg(), 15, 7,
	).WillReturnResult(sqlmock.NewResult(0, 1))

	updateReq := httptest.NewRequest(http.MethodPut, "/api/campaigns/15", bytes.NewBufferString(`{"name":"Updated","description":"desc","max_players":6,"current_session":2,"status":"active"}`))
	updateReq = addChiURLParam(updateReq, "id", "15")
	updateReq = updateReq.WithContext(context.WithValue(updateReq.Context(), middleware.UserIDKey, 7))
	updateRec := httptest.NewRecorder()
	handler.UpdateCampaign(updateRec, updateReq)
	if updateRec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", updateRec.Code)
	}

	mock.ExpectExec(`DELETE FROM campaigns WHERE id = \$1 AND dm_id = \$2`).WithArgs(15, 7).
		WillReturnResult(sqlmock.NewResult(0, 1))

	deleteReq := httptest.NewRequest(http.MethodDelete, "/api/campaigns/15", nil)
	deleteReq = addChiURLParam(deleteReq, "id", "15")
	deleteReq = deleteReq.WithContext(context.WithValue(deleteReq.Context(), middleware.UserIDKey, 7))
	deleteRec := httptest.NewRecorder()
	handler.DeleteCampaign(deleteRec, deleteReq)
	if deleteRec.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d", deleteRec.Code)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestCampaignHandler_GetAvailableCharacters(t *testing.T) {
	handler, mock, cleanup := newMockCampaignHandler(t)
	defer cleanup()

	now := time.Now()
	mock.ExpectQuery(`SELECT EXISTS\(`).WithArgs(50, 7).
		WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(true))

	pcs := sqlmock.NewRows([]string{
		"id", "name", "description", "level", "race", "class", "background", "alignment",
		"attributes", "abilities", "equipment", "hp", "ca", "player_name", "player_id", "created_at",
	}).AddRow(3, "PC", "desc", 4, "elf", "wizard", "sage", "neutral", []byte(`{}`), []byte(`{}`), []byte(`{}`), 20, 15, "Player", 7, now)
	mock.ExpectQuery(`FROM pcs`).WithArgs(7, 50).WillReturnRows(pcs)

	req := httptest.NewRequest(http.MethodGet, "/api/campaigns/50/available-characters", nil)
	req = addChiURLParam(req, "id", "50")
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
	rr := httptest.NewRecorder()
	handler.GetAvailableCharacters(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestCampaignHandler_GetAvailableCharactersErrors(t *testing.T) {
	handler, mock, cleanup := newMockCampaignHandler(t)
	defer cleanup()

	t.Run("missing user ID in context", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/campaigns/50/available-characters", nil)
		req = addChiURLParam(req, "id", "50")
		rr := httptest.NewRecorder()

		handler.GetAvailableCharacters(rr, req)

		if rr.Code != http.StatusInternalServerError {
			t.Fatalf("expected 500, got %d", rr.Code)
		}
	})

	t.Run("invalid campaign ID", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/campaigns/invalid/available-characters", nil)
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		req = addChiURLParam(req, "id", "invalid")
		rr := httptest.NewRecorder()

		handler.GetAvailableCharacters(rr, req)

		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rr.Code)
		}
	})

	t.Run("access denied - not in campaign", func(t *testing.T) {
		mock.ExpectQuery(`SELECT EXISTS\(`).WithArgs(50, 7).
			WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(false))

		req := httptest.NewRequest(http.MethodGet, "/api/campaigns/50/available-characters", nil)
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		req = addChiURLParam(req, "id", "50")
		rr := httptest.NewRecorder()

		handler.GetAvailableCharacters(rr, req)

		if rr.Code != http.StatusForbidden {
			t.Fatalf("expected 403, got %d", rr.Code)
		}

		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatalf("sql expectations not met: %v", err)
		}
	})

	t.Run("database error on access check", func(t *testing.T) {
		mock.ExpectQuery(`SELECT EXISTS\(`).WithArgs(50, 7).
			WillReturnError(sqlmock.ErrCancelled)

		req := httptest.NewRequest(http.MethodGet, "/api/campaigns/50/available-characters", nil)
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		req = addChiURLParam(req, "id", "50")
		rr := httptest.NewRecorder()

		handler.GetAvailableCharacters(rr, req)

		if rr.Code != http.StatusInternalServerError {
			t.Fatalf("expected 500, got %d", rr.Code)
		}

		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatalf("sql expectations not met: %v", err)
		}
	})

	t.Run("database error fetching PCs", func(t *testing.T) {
		mock.ExpectQuery(`SELECT EXISTS\(`).WithArgs(50, 7).
			WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(true))

		mock.ExpectQuery(`FROM pcs`).WithArgs(7, 50).
			WillReturnError(sqlmock.ErrCancelled)

		req := httptest.NewRequest(http.MethodGet, "/api/campaigns/50/available-characters", nil)
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		req = addChiURLParam(req, "id", "50")
		rr := httptest.NewRecorder()

		handler.GetAvailableCharacters(rr, req)

		if rr.Code != http.StatusInternalServerError {
			t.Fatalf("expected 500, got %d", rr.Code)
		}

		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatalf("sql expectations not met: %v", err)
		}
	})
}

func TestCampaignHandler_AddUpdateDeleteCharacter(t *testing.T) {
	handler, mock, cleanup := newMockCampaignHandler(t)
	defer cleanup()

	now := time.Now()
	// AddCharacterToCampaign flow
	pcRow := sqlmock.NewRows([]string{
		"id", "name", "description", "level", "race", "class", "background", "alignment",
		"attributes", "abilities", "equipment", "hp", "ca", "player_name", "player_id", "created_at",
	}).AddRow(4, "PC", "desc", 3, "elf", "wizard", "sage", "neutral", []byte(`{}`), []byte(`{}`), []byte(`{}`), 18, 14, "Player", 7, now)
	mock.ExpectQuery(`FROM pcs`).WithArgs(4).WillReturnRows(pcRow)

	mock.ExpectQuery(`SELECT EXISTS\(`).WithArgs(60, 7).WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(true))
	mock.ExpectQuery(`SELECT EXISTS\(SELECT 1 FROM campaign_characters`).WithArgs(60, 4).
		WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(false))

	mock.ExpectQuery(`INSERT INTO campaign_characters`).WithArgs(
		60, 7, 4, sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), // campaign_id, player_id, source_pc_id, status, joined_at, notes
		sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), // name..alignment
		sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), // attributes..ca
		sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(),
	).WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(99))

	addReq := httptest.NewRequest(http.MethodPost, "/api/campaigns/60/characters", bytes.NewBufferString(`{"source_pc_id":4}`))
	addReq = addChiURLParam(addReq, "id", "60")
	addReq = addReq.WithContext(context.WithValue(addReq.Context(), middleware.UserIDKey, 7))
	addRec := httptest.NewRecorder()
	handler.AddCharacterToCampaign(addRec, addReq)
	if addRec.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d", addRec.Code)
	}

	// UpdateCampaignCharacter flow
	charCols := []string{
		"id", "campaign_id", "player_id", "source_pc_id", "status", "joined_at", "last_sync", "campaign_notes",
		"name", "description", "level", "race", "class", "background", "alignment", "attributes", "abilities",
		"equipment", "hp", "current_hp", "ca", "proficiency_bonus", "inspiration", "skills", "attacks", "spells",
		"personality_traits", "ideals", "bonds", "flaws", "features", "player_name",
	}
	charRow := func() *sqlmock.Rows {
		return sqlmock.NewRows(charCols).AddRow(
			99, 60, 7, 4, "active", now, now, "note",
			"PC", "desc", 3, "elf", "wizard", "sage", "neutral",
			[]byte(`{}`), []byte(`{}`), []byte(`{}`), 18, 15, 14, 2, false,
			[]byte(`[]`), []byte(`[]`), []byte(`[]`), "brave", "ideal", "bond", "flaw", pq.StringArray{"feature"}, "Player",
		)
	}

	mock.ExpectQuery(`FROM campaign_characters cc`).WithArgs(99, 60, 7).WillReturnRows(charRow())

	mock.ExpectExec(`UPDATE campaign_characters SET`).WithArgs(
		sqlmock.AnyArg(), "inactive", "Updated notes", 99, 60,
	).WillReturnResult(sqlmock.NewResult(0, 1))

	updateReq := httptest.NewRequest(http.MethodPut, "/api/campaigns/60/characters/99", bytes.NewBufferString(`{"current_hp":10,"status":"inactive","campaign_notes":"Updated notes"}`))
	updateReq = addChiURLParam(updateReq, "id", "60")
	updateReq = addChiURLParam(updateReq, "characterId", "99")
	updateReq = updateReq.WithContext(context.WithValue(updateReq.Context(), middleware.UserIDKey, 7))
	updateRec := httptest.NewRecorder()
	handler.UpdateCampaignCharacter(updateRec, updateReq)
	if updateRec.Code != http.StatusOK {
		t.Fatalf("expected 200 for update, got %d body=%s", updateRec.Code, updateRec.Body.String())
	}

	// UpdateCampaignCharacterFull flow
	mock.ExpectQuery(`FROM campaign_characters cc`).WithArgs(99, 60, 7).WillReturnRows(charRow())
	mock.ExpectExec(`UPDATE campaign_characters SET`).WithArgs(
		sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(),
		sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(),
		sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(),
		sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(),
		sqlmock.AnyArg(), sqlmock.AnyArg(), 99, 60,
	).WillReturnResult(sqlmock.NewResult(0, 1))

	fullReq := httptest.NewRequest(http.MethodPut, "/api/campaigns/60/characters/99/full", bytes.NewBufferString(`{"name":"Full","level":4}`))
	fullReq = addChiURLParam(fullReq, "id", "60")
	fullReq = addChiURLParam(fullReq, "characterId", "99")
	fullReq = fullReq.WithContext(context.WithValue(fullReq.Context(), middleware.UserIDKey, 7))
	fullRec := httptest.NewRecorder()
	handler.UpdateCampaignCharacterFull(fullRec, fullReq)
	if fullRec.Code != http.StatusOK {
		t.Fatalf("expected 200 for full update, got %d body=%s", fullRec.Code, fullRec.Body.String())
	}

	// DeleteCampaignCharacter flow
	mock.ExpectQuery(`FROM campaign_characters cc`).WithArgs(99, 60, 7).WillReturnRows(charRow())
	mock.ExpectExec(`DELETE FROM campaign_characters`).WithArgs(99, 60).
		WillReturnResult(sqlmock.NewResult(0, 1))

	delReq := httptest.NewRequest(http.MethodDelete, "/api/campaigns/60/characters/99", nil)
	delReq = addChiURLParam(delReq, "id", "60")
	delReq = addChiURLParam(delReq, "characterId", "99")
	delReq = delReq.WithContext(context.WithValue(delReq.Context(), middleware.UserIDKey, 7))
	delRec := httptest.NewRecorder()
	handler.DeleteCampaignCharacter(delRec, delReq)
	if delRec.Code != http.StatusNoContent {
		t.Fatalf("expected 204 for delete, got %d body=%s", delRec.Code, delRec.Body.String())
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestCampaignHandler_DeleteCampaignCharacterErrors(t *testing.T) {
	handler, mock, cleanup := newMockCampaignHandler(t)
	defer cleanup()

	t.Run("missing user ID in context", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodDelete, "/api/campaigns/60/characters/99", nil)
		req = addChiURLParam(req, "id", "60")
		req = addChiURLParam(req, "characterId", "99")
		rr := httptest.NewRecorder()

		handler.DeleteCampaignCharacter(rr, req)

		if rr.Code != http.StatusInternalServerError {
			t.Fatalf("expected 500, got %d", rr.Code)
		}
	})

	t.Run("invalid campaign ID", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodDelete, "/api/campaigns/invalid/characters/99", nil)
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		req = addChiURLParam(req, "id", "invalid")
		req = addChiURLParam(req, "characterId", "99")
		rr := httptest.NewRecorder()

		handler.DeleteCampaignCharacter(rr, req)

		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rr.Code)
		}
	})

	t.Run("invalid character ID", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodDelete, "/api/campaigns/60/characters/invalid", nil)
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		req = addChiURLParam(req, "id", "60")
		req = addChiURLParam(req, "characterId", "invalid")
		rr := httptest.NewRecorder()

		handler.DeleteCampaignCharacter(rr, req)

		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rr.Code)
		}
	})

	t.Run("character not found or access denied", func(t *testing.T) {
		mock.ExpectQuery(`FROM campaign_characters cc`).WithArgs(99, 60, 7).
			WillReturnError(sqlmock.ErrCancelled)

		req := httptest.NewRequest(http.MethodDelete, "/api/campaigns/60/characters/99", nil)
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		req = addChiURLParam(req, "id", "60")
		req = addChiURLParam(req, "characterId", "99")
		rr := httptest.NewRecorder()

		handler.DeleteCampaignCharacter(rr, req)

		if rr.Code != http.StatusNotFound {
			t.Fatalf("expected 404, got %d", rr.Code)
		}

		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatalf("sql expectations not met: %v", err)
		}
	})

	t.Run("database error on delete", func(t *testing.T) {
		now := time.Now()
		charCols := []string{
			"id", "campaign_id", "player_id", "source_pc_id", "status", "joined_at", "last_sync", "campaign_notes",
			"name", "description", "level", "race", "class", "background", "alignment", "attributes", "abilities",
			"equipment", "hp", "current_hp", "ca", "proficiency_bonus", "inspiration", "skills", "attacks", "spells",
			"personality_traits", "ideals", "bonds", "flaws", "features", "player_name",
		}
		charRow := sqlmock.NewRows(charCols).AddRow(
			99, 60, 7, 4, "active", now, now, "note",
			"PC", "desc", 3, "elf", "wizard", "sage", "neutral",
			[]byte(`{}`), []byte(`{}`), []byte(`{}`), 18, 15, 14, 2, false,
			[]byte(`[]`), []byte(`[]`), []byte(`[]`), "brave", "ideal", "bond", "flaw", pq.StringArray{"feature"}, "Player",
		)

		mock.ExpectQuery(`FROM campaign_characters cc`).WithArgs(99, 60, 7).WillReturnRows(charRow)
		mock.ExpectExec(`DELETE FROM campaign_characters`).WithArgs(99, 60).
			WillReturnError(sqlmock.ErrCancelled)

		req := httptest.NewRequest(http.MethodDelete, "/api/campaigns/60/characters/99", nil)
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		req = addChiURLParam(req, "id", "60")
		req = addChiURLParam(req, "characterId", "99")
		rr := httptest.NewRecorder()

		handler.DeleteCampaignCharacter(rr, req)

		if rr.Code != http.StatusInternalServerError {
			t.Fatalf("expected 500, got %d", rr.Code)
		}

		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatalf("sql expectations not met: %v", err)
		}
	})
}

func TestCampaignHandler_GetCampaignCharactersAndSingle(t *testing.T) {
	handler, mock, cleanup := newMockCampaignHandler(t)
	defer cleanup()

	now := time.Now()
	campaignRow := sqlmock.NewRows([]string{
		"id", "name", "description", "dm_id", "max_players", "current_session",
		"status", "allow_homebrew", "invite_code", "created_at", "updated_at",
	}).AddRow(70, "Camp", "desc", 7, 5, 1, "active", false, "CODE1234", now, now)
	mock.ExpectQuery(`FROM campaigns`).WithArgs(70, 7).WillReturnRows(campaignRow)
	mock.ExpectQuery(`FROM campaign_players`).WithArgs(70).
		WillReturnRows(sqlmock.NewRows([]string{"id", "campaign_id", "user_id", "joined_at", "status", "username", "email"}))

	charCols := []string{
		"id", "campaign_id", "player_id", "source_pc_id", "status", "joined_at", "last_sync", "campaign_notes",
		"name", "description", "level", "race", "class", "background", "alignment", "attributes", "abilities",
		"equipment", "hp", "current_hp", "ca", "proficiency_bonus", "inspiration", "skills", "attacks", "spells",
		"personality_traits", "ideals", "bonds", "flaws", "features", "player_name", "player_username",
	}
	characterRows := sqlmock.NewRows(charCols).AddRow(
		5, 70, 7, 3, "active", now, now, "note",
		"PC", "desc", 3, "elf", "wizard", "sage", "neutral", []byte(`{}`), []byte(`{}`),
		[]byte(`{}`), 20, 18, 14, 2, false, []byte(`[]`), []byte(`[]`), []byte(`[]`),
		"brave", "ideal", "bond", "flaw", pq.StringArray{"feature"}, "Player", "player_username",
	)
	mock.ExpectQuery(`FROM campaign_characters`).WithArgs(70).WillReturnRows(characterRows)
	mock.ExpectQuery(`FROM campaign_characters`).WithArgs(70).WillReturnRows(characterRows)

	req := httptest.NewRequest(http.MethodGet, "/api/campaigns/70/characters", nil)
	req = addChiURLParam(req, "id", "70")
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
	rec := httptest.NewRecorder()
	handler.GetCampaignCharacters(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	// Single character
	charSingleCols := []string{
		"id", "campaign_id", "player_id", "source_pc_id", "status", "joined_at", "last_sync", "campaign_notes",
		"name", "description", "level", "race", "class", "background", "alignment", "attributes", "abilities",
		"equipment", "hp", "current_hp", "ca", "proficiency_bonus", "inspiration", "skills", "attacks", "spells",
		"personality_traits", "ideals", "bonds", "flaws", "features", "player_name",
	}
	characterSingle := sqlmock.NewRows(charSingleCols).AddRow(
		5, 70, 7, 3, "active", now, now, "note",
		"PC", "desc", 3, "elf", "wizard", "sage", "neutral", []byte(`{}`), []byte(`{}`),
		[]byte(`{}`), 20, 18, 14, 2, false, []byte(`[]`), []byte(`[]`), []byte(`[]`),
		"brave", "ideal", "bond", "flaw", pq.StringArray{"feature"}, "Player",
	)
	mock.ExpectQuery(`FROM campaign_characters cc`).WithArgs(5, 70, 7).WillReturnRows(characterSingle)
	reqSingle := httptest.NewRequest(http.MethodGet, "/api/campaigns/70/characters/5", nil)
	reqSingle = addChiURLParam(reqSingle, "id", "70")
	reqSingle = addChiURLParam(reqSingle, "characterId", "5")
	reqSingle = reqSingle.WithContext(context.WithValue(reqSingle.Context(), middleware.UserIDKey, 7))
	recSingle := httptest.NewRecorder()
	handler.GetSingleCampaignCharacter(recSingle, reqSingle)
	if recSingle.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", recSingle.Code)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestCampaignHandler_GetCampaignCharactersErrors(t *testing.T) {
	handler, mock, cleanup := newMockCampaignHandler(t)
	defer cleanup()

	now := time.Now()

	t.Run("missing user ID in context", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/campaigns/70/characters", nil)
		req = addChiURLParam(req, "id", "70")
		rr := httptest.NewRecorder()

		handler.GetCampaignCharacters(rr, req)

		if rr.Code != http.StatusInternalServerError {
			t.Fatalf("expected 500, got %d", rr.Code)
		}
	})

	t.Run("invalid campaign ID", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/campaigns/invalid/characters", nil)
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		req = addChiURLParam(req, "id", "invalid")
		rr := httptest.NewRecorder()

		handler.GetCampaignCharacters(rr, req)

		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rr.Code)
		}
	})

	t.Run("campaign not found or access denied", func(t *testing.T) {
		mock.ExpectQuery(`FROM campaigns`).WithArgs(999, 7).
			WillReturnError(sqlmock.ErrCancelled)

		req := httptest.NewRequest(http.MethodGet, "/api/campaigns/999/characters", nil)
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		req = addChiURLParam(req, "id", "999")
		rr := httptest.NewRecorder()

		handler.GetCampaignCharacters(rr, req)

		if rr.Code != http.StatusNotFound {
			t.Fatalf("expected 404, got %d", rr.Code)
		}

		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatalf("sql expectations not met: %v", err)
		}
	})

	t.Run("database error fetching characters", func(t *testing.T) {
		campaignRow := sqlmock.NewRows([]string{
			"id", "name", "description", "dm_id", "max_players", "current_session",
			"status", "allow_homebrew", "invite_code", "created_at", "updated_at",
		}).AddRow(70, "Camp", "desc", 7, 5, 1, "active", false, "CODE1234", now, now)
		mock.ExpectQuery(`FROM campaigns`).WithArgs(70, 7).WillReturnRows(campaignRow)
		mock.ExpectQuery(`FROM campaign_players`).WithArgs(70).
			WillReturnRows(sqlmock.NewRows([]string{"id", "campaign_id", "user_id", "joined_at", "status", "username", "email"}))

		charCols := []string{
			"id", "campaign_id", "player_id", "source_pc_id", "status", "joined_at", "last_sync", "campaign_notes",
			"name", "description", "level", "race", "class", "background", "alignment", "attributes", "abilities",
			"equipment", "hp", "current_hp", "ca", "proficiency_bonus", "inspiration", "skills", "attacks", "spells",
			"personality_traits", "ideals", "bonds", "flaws", "features", "player_name", "player_username",
		}
		mock.ExpectQuery(`FROM campaign_characters`).WithArgs(70).WillReturnRows(sqlmock.NewRows(charCols))

		mock.ExpectQuery(`FROM campaign_characters`).WithArgs(70).
			WillReturnError(sqlmock.ErrCancelled)

		req := httptest.NewRequest(http.MethodGet, "/api/campaigns/70/characters", nil)
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		req = addChiURLParam(req, "id", "70")
		rr := httptest.NewRecorder()

		handler.GetCampaignCharacters(rr, req)

		if rr.Code != http.StatusInternalServerError {
			t.Fatalf("expected 500, got %d", rr.Code)
		}

		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatalf("sql expectations not met: %v", err)
		}
	})
}

func TestCampaignHandler_RegenerateInviteCodeErrors(t *testing.T) {
	handler, mock, cleanup := newMockCampaignHandler(t)
	defer cleanup()

	now := time.Now()

	t.Run("missing user ID in context", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/campaigns/80/regenerate-code", nil)
		req = addChiURLParam(req, "id", "80")
		rr := httptest.NewRecorder()

		handler.RegenerateInviteCode(rr, req)

		if rr.Code != http.StatusInternalServerError {
			t.Fatalf("expected 500, got %d", rr.Code)
		}
	})

	t.Run("invalid campaign ID", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/campaigns/invalid/regenerate-code", nil)
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		req = addChiURLParam(req, "id", "invalid")
		rr := httptest.NewRecorder()

		handler.RegenerateInviteCode(rr, req)

		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rr.Code)
		}
	})

	t.Run("campaign not found", func(t *testing.T) {
		mock.ExpectQuery(`FROM campaigns`).WithArgs(999, 7).
			WillReturnError(sqlmock.ErrCancelled)

		req := httptest.NewRequest(http.MethodPost, "/api/campaigns/999/regenerate-code", nil)
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		req = addChiURLParam(req, "id", "999")
		rr := httptest.NewRecorder()

		handler.RegenerateInviteCode(rr, req)

		if rr.Code != http.StatusNotFound {
			t.Fatalf("expected 404, got %d", rr.Code)
		}

		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatalf("sql expectations not met: %v", err)
		}
	})

	t.Run("not DM - forbidden", func(t *testing.T) {
		campaignRow := sqlmock.NewRows([]string{
			"id", "name", "description", "dm_id", "max_players", "current_session",
			"status", "allow_homebrew", "invite_code", "created_at", "updated_at",
		}).AddRow(80, "Camp", "desc", 99, 5, 1, "active", false, "CODE1234", now, now)
		mock.ExpectQuery(`FROM campaigns`).WithArgs(80, 7).WillReturnRows(campaignRow)
		mock.ExpectQuery(`FROM campaign_players`).WithArgs(80).
			WillReturnRows(sqlmock.NewRows([]string{"id", "campaign_id", "user_id", "joined_at", "status", "username", "email"}))
		mock.ExpectQuery(`FROM campaign_characters`).WithArgs(80).
			WillReturnRows(sqlmock.NewRows([]string{
				"id", "campaign_id", "player_id", "source_pc_id", "status", "joined_at", "last_sync", "campaign_notes",
				"name", "description", "level", "race", "class", "background", "alignment", "attributes", "abilities",
				"equipment", "hp", "current_hp", "ca", "proficiency_bonus", "inspiration", "skills", "attacks", "spells",
				"personality_traits", "ideals", "bonds", "flaws", "features", "player_name", "player_username",
			}))

		req := httptest.NewRequest(http.MethodPost, "/api/campaigns/80/regenerate-code", nil)
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		req = addChiURLParam(req, "id", "80")
		rr := httptest.NewRecorder()

		handler.RegenerateInviteCode(rr, req)

		if rr.Code != http.StatusForbidden {
			t.Fatalf("expected 403, got %d", rr.Code)
		}

		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatalf("sql expectations not met: %v", err)
		}
	})

	t.Run("database error on update", func(t *testing.T) {
		campaignRow := sqlmock.NewRows([]string{
			"id", "name", "description", "dm_id", "max_players", "current_session",
			"status", "allow_homebrew", "invite_code", "created_at", "updated_at",
		}).AddRow(80, "Camp", "desc", 7, 5, 1, "active", false, "CODE1234", now, now)
		mock.ExpectQuery(`FROM campaigns`).WithArgs(80, 7).WillReturnRows(campaignRow)
		mock.ExpectQuery(`FROM campaign_players`).WithArgs(80).
			WillReturnRows(sqlmock.NewRows([]string{"id", "campaign_id", "user_id", "joined_at", "status", "username", "email"}))
		mock.ExpectQuery(`FROM campaign_characters`).WithArgs(80).
			WillReturnRows(sqlmock.NewRows([]string{
				"id", "campaign_id", "player_id", "source_pc_id", "status", "joined_at", "last_sync", "campaign_notes",
				"name", "description", "level", "race", "class", "background", "alignment", "attributes", "abilities",
				"equipment", "hp", "current_hp", "ca", "proficiency_bonus", "inspiration", "skills", "attacks", "spells",
				"personality_traits", "ideals", "bonds", "flaws", "features", "player_name", "player_username",
			}))

		mock.ExpectExec(`UPDATE campaigns SET invite_code =`).WithArgs(sqlmock.AnyArg(), sqlmock.AnyArg(), 80).
			WillReturnError(sqlmock.ErrCancelled)

		req := httptest.NewRequest(http.MethodPost, "/api/campaigns/80/regenerate-code", nil)
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		req = addChiURLParam(req, "id", "80")
		rr := httptest.NewRecorder()

		handler.RegenerateInviteCode(rr, req)

		if rr.Code != http.StatusInternalServerError {
			t.Fatalf("expected 500, got %d", rr.Code)
		}

		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatalf("sql expectations not met: %v", err)
		}
	})
}

func TestCampaignHandler_GetSingleCampaignCharacterErrors(t *testing.T) {
	handler, mock, cleanup := newMockCampaignHandler(t)
	defer cleanup()

	t.Run("missing user ID in context", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/campaigns/70/characters/5", nil)
		req = addChiURLParam(req, "id", "70")
		req = addChiURLParam(req, "characterId", "5")
		rr := httptest.NewRecorder()

		handler.GetSingleCampaignCharacter(rr, req)

		if rr.Code != http.StatusInternalServerError {
			t.Fatalf("expected 500, got %d", rr.Code)
		}
	})

	t.Run("invalid campaign ID", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/campaigns/invalid/characters/5", nil)
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		req = addChiURLParam(req, "id", "invalid")
		req = addChiURLParam(req, "characterId", "5")
		rr := httptest.NewRecorder()

		handler.GetSingleCampaignCharacter(rr, req)

		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rr.Code)
		}
	})

	t.Run("invalid character ID", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/campaigns/70/characters/invalid", nil)
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		req = addChiURLParam(req, "id", "70")
		req = addChiURLParam(req, "characterId", "invalid")
		rr := httptest.NewRecorder()

		handler.GetSingleCampaignCharacter(rr, req)

		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rr.Code)
		}
	})

	t.Run("character not found or access denied", func(t *testing.T) {
		mock.ExpectQuery(`FROM campaign_characters cc`).WithArgs(999, 70, 7).
			WillReturnError(sqlmock.ErrCancelled)

		req := httptest.NewRequest(http.MethodGet, "/api/campaigns/70/characters/999", nil)
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		req = addChiURLParam(req, "id", "70")
		req = addChiURLParam(req, "characterId", "999")
		rr := httptest.NewRecorder()

		handler.GetSingleCampaignCharacter(rr, req)

		if rr.Code != http.StatusNotFound {
			t.Fatalf("expected 404, got %d", rr.Code)
		}

		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatalf("sql expectations not met: %v", err)
		}
	})
}

func TestCampaignHandler_RegenerateInviteAndSync(t *testing.T) {
	handler, mock, cleanup := newMockCampaignHandler(t)
	defer cleanup()

	now := time.Now()
	campaignRow := sqlmock.NewRows([]string{
		"id", "name", "description", "dm_id", "max_players", "current_session",
		"status", "allow_homebrew", "invite_code", "created_at", "updated_at",
	}).AddRow(80, "Camp", "desc", 7, 5, 1, "active", false, "CODE1234", now, now)
	mock.ExpectQuery(`FROM campaigns`).WithArgs(80, 7).WillReturnRows(campaignRow)
	mock.ExpectQuery(`FROM campaign_players`).WithArgs(80).
		WillReturnRows(sqlmock.NewRows([]string{"id", "campaign_id", "user_id", "joined_at", "status", "username", "email"}))
	mock.ExpectQuery(`FROM campaign_characters`).WithArgs(80).
		WillReturnRows(sqlmock.NewRows([]string{
			"id", "campaign_id", "player_id", "source_pc_id", "status", "joined_at", "last_sync", "campaign_notes",
			"name", "description", "level", "race", "class", "background", "alignment", "attributes", "abilities",
			"equipment", "hp", "current_hp", "ca", "proficiency_bonus", "inspiration", "skills", "attacks", "spells",
			"personality_traits", "ideals", "bonds", "flaws", "features", "player_name", "player_username",
		}))

	mock.ExpectExec(`UPDATE campaigns SET invite_code =`).WithArgs(sqlmock.AnyArg(), sqlmock.AnyArg(), 80).
		WillReturnResult(sqlmock.NewResult(0, 1))

	req := httptest.NewRequest(http.MethodPost, "/api/campaigns/80/regenerate-code", nil)
	req = addChiURLParam(req, "id", "80")
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
	rec := httptest.NewRecorder()
	handler.RegenerateInviteCode(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	// SyncCampaignCharacter (no-op path)
	charCols := []string{
		"id", "campaign_id", "player_id", "source_pc_id", "status", "joined_at", "last_sync", "campaign_notes",
		"name", "description", "level", "race", "class", "background", "alignment", "attributes", "abilities",
		"equipment", "hp", "current_hp", "ca", "proficiency_bonus", "inspiration", "skills", "attacks", "spells",
		"personality_traits", "ideals", "bonds", "flaws", "features", "player_name",
	}
	charRow := sqlmock.NewRows(charCols).AddRow(
		5, 80, 7, 3, "active", now, now, "note", "PC", "desc", 3, "elf", "wizard", "sage", "neutral",
		[]byte(`{}`), []byte(`{}`), []byte(`{}`), 20, 18, 14, 2, false, []byte(`[]`), []byte(`[]`), []byte(`[]`),
		"brave", "ideal", "bond", "flaw", pq.StringArray{"feature"}, "Player",
	)
	mock.ExpectQuery(`FROM campaign_characters cc`).WithArgs(5, 80, 7).WillReturnRows(charRow)

	reqSync := httptest.NewRequest(http.MethodPost, "/api/campaigns/80/characters/5/sync", bytes.NewBufferString(`{"sync_to_other_campaigns":true}`))
	reqSync = addChiURLParam(reqSync, "id", "80")
	reqSync = addChiURLParam(reqSync, "characterId", "5")
	reqSync = reqSync.WithContext(context.WithValue(reqSync.Context(), middleware.UserIDKey, 7))
	recSync := httptest.NewRecorder()
	handler.SyncCampaignCharacter(recSync, reqSync)
	if recSync.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", recSync.Code)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

