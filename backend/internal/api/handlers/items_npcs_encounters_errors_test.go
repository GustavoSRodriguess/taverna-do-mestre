package handlers

import (
	"bytes"
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	sqlmock "github.com/DATA-DOG/go-sqlmock"
	"github.com/jmoiron/sqlx"

	"rpg-saas-backend/internal/api/middleware"
	"rpg-saas-backend/internal/db"
	"rpg-saas-backend/internal/python"
)

// Items Handler Errors
func TestItemHandler_GetTreasureByID_Errors(t *testing.T) {
	rawDB, mock, _ := sqlmock.New()
	defer rawDB.Close()
	pdb := &db.PostgresDB{DB: sqlx.NewDb(rawDB, "postgres")}
	handler := NewItemHandler(pdb, &python.Client{})

	t.Run("invalid treasure ID", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/treasures/invalid", nil)
		req = addChiURLParam(req, "id", "invalid")
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		rec := httptest.NewRecorder()

		handler.GetTreasureByID(rec, req)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rec.Code)
		}
	})

	t.Run("treasure not found", func(t *testing.T) {
		mock.ExpectQuery(`FROM treasures`).WithArgs(999, 7).
			WillReturnError(fmt.Errorf("treasure not found"))

		req := httptest.NewRequest(http.MethodGet, "/api/treasures/999", nil)
		req = addChiURLParam(req, "id", "999")
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		rec := httptest.NewRecorder()

		handler.GetTreasureByID(rec, req)
		if rec.Code != http.StatusInternalServerError {
			t.Fatalf("expected 500, got %d", rec.Code)
		}
	})
}

func TestItemHandler_CreateTreasure_Errors(t *testing.T) {
	rawDB, _, _ := sqlmock.New()
	defer rawDB.Close()
	pdb := &db.PostgresDB{DB: sqlx.NewDb(rawDB, "postgres")}
	handler := NewItemHandler(pdb, &python.Client{})

	t.Run("invalid JSON body", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/treasures", bytes.NewBufferString("invalid"))
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		rec := httptest.NewRecorder()

		handler.CreateTreasure(rec, req)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rec.Code)
		}
	})

}

func TestItemHandler_DeleteTreasure_Errors(t *testing.T) {
	rawDB, _, _ := sqlmock.New()
	defer rawDB.Close()
	pdb := &db.PostgresDB{DB: sqlx.NewDb(rawDB, "postgres")}
	handler := NewItemHandler(pdb, &python.Client{})

	t.Run("invalid treasure ID", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodDelete, "/api/treasures/invalid", nil)
		req = addChiURLParam(req, "id", "invalid")
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		rec := httptest.NewRecorder()

		handler.DeleteTreasure(rec, req)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rec.Code)
		}
	})
}

// NPC Handler Errors
func TestNPCHandler_GetNPCByID_Errors(t *testing.T) {
	rawDB, mock, _ := sqlmock.New()
	defer rawDB.Close()
	pdb := &db.PostgresDB{DB: sqlx.NewDb(rawDB, "postgres")}
	handler := NewNPCHandler(pdb, &python.Client{})

	t.Run("invalid NPC ID", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/npcs/invalid", nil)
		req = addChiURLParam(req, "id", "invalid")
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		rec := httptest.NewRecorder()

		handler.GetNPCByID(rec, req)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rec.Code)
		}
	})

	t.Run("NPC not found", func(t *testing.T) {
		mock.ExpectQuery(`FROM npcs`).WithArgs(999, 7).
			WillReturnError(fmt.Errorf("npc not found"))

		req := httptest.NewRequest(http.MethodGet, "/api/npcs/999", nil)
		req = addChiURLParam(req, "id", "999")
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		rec := httptest.NewRecorder()

		handler.GetNPCByID(rec, req)
		if rec.Code != http.StatusInternalServerError {
			t.Fatalf("expected 500, got %d", rec.Code)
		}
	})
}

func TestNPCHandler_CreateNPC_Errors(t *testing.T) {
	rawDB, _, _ := sqlmock.New()
	defer rawDB.Close()
	pdb := &db.PostgresDB{DB: sqlx.NewDb(rawDB, "postgres")}
	handler := NewNPCHandler(pdb, &python.Client{})

	t.Run("invalid JSON body", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/npcs", bytes.NewBufferString("invalid"))
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		rec := httptest.NewRecorder()

		handler.CreateNPC(rec, req)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rec.Code)
		}
	})

	t.Run("missing name", func(t *testing.T) {
		body := bytes.NewBufferString(`{"name":""}`)
		req := httptest.NewRequest(http.MethodPost, "/api/npcs", body)
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		rec := httptest.NewRecorder()

		handler.CreateNPC(rec, req)
		if rec.Code != http.StatusUnprocessableEntity {
			t.Fatalf("expected 422, got %d", rec.Code)
		}
	})
}

func TestNPCHandler_UpdateNPC_Errors(t *testing.T) {
	rawDB, _, _ := sqlmock.New()
	defer rawDB.Close()
	pdb := &db.PostgresDB{DB: sqlx.NewDb(rawDB, "postgres")}
	handler := NewNPCHandler(pdb, &python.Client{})

	t.Run("invalid NPC ID", func(t *testing.T) {
		body := bytes.NewBufferString(`{"name":"Test"}`)
		req := httptest.NewRequest(http.MethodPut, "/api/npcs/invalid", body)
		req = addChiURLParam(req, "id", "invalid")
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		rec := httptest.NewRecorder()

		handler.UpdateNPC(rec, req)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rec.Code)
		}
	})

	t.Run("invalid JSON body", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPut, "/api/npcs/1", bytes.NewBufferString("invalid"))
		req = addChiURLParam(req, "id", "1")
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		rec := httptest.NewRecorder()

		handler.UpdateNPC(rec, req)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rec.Code)
		}
	})
}

func TestNPCHandler_DeleteNPC_Errors(t *testing.T) {
	rawDB, _, _ := sqlmock.New()
	defer rawDB.Close()
	pdb := &db.PostgresDB{DB: sqlx.NewDb(rawDB, "postgres")}
	handler := NewNPCHandler(pdb, &python.Client{})

	t.Run("invalid NPC ID", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodDelete, "/api/npcs/invalid", nil)
		req = addChiURLParam(req, "id", "invalid")
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		rec := httptest.NewRecorder()

		handler.DeleteNPC(rec, req)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rec.Code)
		}
	})
}

// Encounter Handler Errors
func TestEncounterHandler_GetEncounterByID_Errors(t *testing.T) {
	rawDB, mock, _ := sqlmock.New()
	defer rawDB.Close()
	pdb := &db.PostgresDB{DB: sqlx.NewDb(rawDB, "postgres")}
	handler := NewEncounterHandler(pdb, &python.Client{})

	t.Run("invalid encounter ID", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/encounters/invalid", nil)
		req = addChiURLParam(req, "id", "invalid")
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		rec := httptest.NewRecorder()

		handler.GetEncounterByID(rec, req)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rec.Code)
		}
	})

	t.Run("encounter not found", func(t *testing.T) {
		mock.ExpectQuery(`FROM encounters`).WithArgs(999, 7).
			WillReturnError(fmt.Errorf("encounter not found"))

		req := httptest.NewRequest(http.MethodGet, "/api/encounters/999", nil)
		req = addChiURLParam(req, "id", "999")
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		rec := httptest.NewRecorder()

		handler.GetEncounterByID(rec, req)
		if rec.Code != http.StatusInternalServerError {
			t.Fatalf("expected 500, got %d", rec.Code)
		}
	})
}

func TestEncounterHandler_CreateEncounter_Errors(t *testing.T) {
	rawDB, _, _ := sqlmock.New()
	defer rawDB.Close()
	pdb := &db.PostgresDB{DB: sqlx.NewDb(rawDB, "postgres")}
	handler := NewEncounterHandler(pdb, &python.Client{})

	t.Run("invalid JSON body", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/encounters", bytes.NewBufferString("invalid"))
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		rec := httptest.NewRecorder()

		handler.CreateEncounter(rec, req)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rec.Code)
		}
	})

}
