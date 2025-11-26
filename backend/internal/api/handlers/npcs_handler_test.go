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

func newMockNPCHandler(t *testing.T) (*NPCHandler, sqlmock.Sqlmock, func()) {
	t.Helper()
	rawDB, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create sqlmock: %v", err)
	}
	pdb := &db.PostgresDB{DB: sqlx.NewDb(rawDB, "postgres")}
	return NewNPCHandler(pdb, &python.Client{}), mock, func() { rawDB.Close() }
}

func TestNPCHandler_ListAndDetail(t *testing.T) {
	handler, mock, cleanup := newMockNPCHandler(t)
	defer cleanup()

	now := time.Now()
	npcCols := []string{"id", "name", "description", "level", "race", "class", "background", "attributes", "abilities", "equipment", "hp", "ca", "created_at"}
	rows := sqlmock.NewRows(npcCols).AddRow(1, "NPC", "desc", 2, "elf", "wizard", "sage", []byte(`{}`), []byte(`{}`), []byte(`{}`), 12, 14, now)
	mock.ExpectQuery(`SELECT \* FROM npcs`).WithArgs(20, 0).WillReturnRows(rows)

	req := httptest.NewRequest(http.MethodGet, "/api/npcs", nil)
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
	rr := httptest.NewRecorder()
	handler.GetNPCs(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}

	detailRows := sqlmock.NewRows(npcCols).AddRow(1, "NPC", "desc", 2, "elf", "wizard", "sage", []byte(`{}`), []byte(`{}`), []byte(`{}`), 12, 14, now)
	mock.ExpectQuery(`SELECT \* FROM npcs WHERE id = \$1`).WithArgs(1).WillReturnRows(detailRows)

	reqDetail := httptest.NewRequest(http.MethodGet, "/api/npcs/1", nil)
	reqDetail = addChiURLParam(reqDetail, "id", "1")
	reqDetail = reqDetail.WithContext(context.WithValue(reqDetail.Context(), middleware.UserIDKey, 7))
	rrDetail := httptest.NewRecorder()
	handler.GetNPCByID(rrDetail, reqDetail)
	if rrDetail.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rrDetail.Code)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestNPCHandler_GenerateRandomNPC_InvalidAttributesMethod(t *testing.T) {
	h, _, cleanup := newMockNPCHandler(t)
	defer cleanup()

	req := httptest.NewRequest(http.MethodPost, "/api/npcs/generate", bytes.NewBufferString(`{"level":1,"attributes_method":"invalid"}`))
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 1))
	rec := httptest.NewRecorder()

	h.GenerateRandomNPC(rec, req)
	if rec.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected 422 for invalid attributes_method, got %d", rec.Code)
	}
}

func TestNPCHandler_GenerateRandomNPC(t *testing.T) {
	rawDB, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create sqlmock: %v", err)
	}
	defer rawDB.Close()

	// Stub Python generate endpoint
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{
			"name":"Stub NPC",
			"description":"desc",
			"level":2,
			"race":"elf",
			"class":"wizard",
			"attributes":{},
			"abilities":[],
			"equipment":[],
			"hp":12,
			"ca":14
		}`))
	}))
	defer server.Close()

	pdb := &db.PostgresDB{DB: sqlx.NewDb(rawDB, "postgres")}
	pyClient := &python.Client{BaseURL: server.URL, HTTPClient: server.Client()}
	handler := NewNPCHandler(pdb, pyClient)

	mock.ExpectQuery(`INSERT INTO npcs`).WillReturnRows(sqlmock.NewRows([]string{"id", "created_at"}).AddRow(99, time.Now()))

	req := httptest.NewRequest(http.MethodPost, "/api/npcs/generate", bytes.NewBufferString(`{"level":2}`))
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
	rec := httptest.NewRecorder()

	handler.GenerateRandomNPC(rec, req)
	if rec.Code != http.StatusCreated {
		t.Fatalf("expected 201 for generate npc, got %d body=%s", rec.Code, rec.Body.String())
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestNPCHandler_CreateUpdateDelete(t *testing.T) {
	handler, mock, cleanup := newMockNPCHandler(t)
	defer cleanup()

	mock.ExpectQuery(`INSERT INTO npcs`).WillReturnRows(sqlmock.NewRows([]string{"id", "created_at"}).AddRow(5, time.Now()))

	createBody := `{"name":"New NPC","description":"desc","level":1,"race":"human","class":"fighter","hp":10,"ca":15}`
	reqCreate := httptest.NewRequest(http.MethodPost, "/api/npcs", bytes.NewBufferString(createBody))
	reqCreate = reqCreate.WithContext(context.WithValue(reqCreate.Context(), middleware.UserIDKey, 7))
	recCreate := httptest.NewRecorder()
	handler.CreateNPC(recCreate, reqCreate)
	if recCreate.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d", recCreate.Code)
	}

	mock.ExpectExec(`UPDATE npcs SET`).WillReturnResult(sqlmock.NewResult(0, 1))
	updateBody := `{"name":"Updated","description":"desc","level":2,"race":"elf","class":"wizard","hp":11,"ca":16}`
	reqUpdate := httptest.NewRequest(http.MethodPut, "/api/npcs/5", bytes.NewBufferString(updateBody))
	reqUpdate = addChiURLParam(reqUpdate, "id", "5")
	reqUpdate = reqUpdate.WithContext(context.WithValue(reqUpdate.Context(), middleware.UserIDKey, 7))
	recUpdate := httptest.NewRecorder()
	handler.UpdateNPC(recUpdate, reqUpdate)
	if recUpdate.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", recUpdate.Code)
	}

	mock.ExpectExec(`DELETE FROM npcs WHERE id = \$1`).WithArgs(5).WillReturnResult(sqlmock.NewResult(0, 1))
	reqDelete := httptest.NewRequest(http.MethodDelete, "/api/npcs/5", nil)
	reqDelete = addChiURLParam(reqDelete, "id", "5")
	reqDelete = reqDelete.WithContext(context.WithValue(reqDelete.Context(), middleware.UserIDKey, 7))
	recDelete := httptest.NewRecorder()
	handler.DeleteNPC(recDelete, reqDelete)
	if recDelete.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d", recDelete.Code)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}
