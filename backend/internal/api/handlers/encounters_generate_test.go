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
	"github.com/jmoiron/sqlx"

	"rpg-saas-backend/internal/api/middleware"
	"rpg-saas-backend/internal/db"
	"rpg-saas-backend/internal/python"
)

func TestEncounterHandler_GenerateRandomEncounter(t *testing.T) {
	rawDB, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create sqlmock: %v", err)
	}
	defer rawDB.Close()

	// Stub Python service
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/generate-encounter" {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{
			"theme":"Forest",
			"difficulty":"m",
			"total_xp":300,
			"player_level":2,
			"player_count":4,
			"monsters":[]
		}`))
	}))
	defer server.Close()

	pdb := &db.PostgresDB{DB: sqlx.NewDb(rawDB, "postgres")}
	pyClient := &python.Client{BaseURL: server.URL, HTTPClient: server.Client()}
	handler := NewEncounterHandler(pdb, pyClient)

	mock.ExpectBegin()
	mock.ExpectQuery(`INSERT INTO encounters`).WithArgs("Forest", "m", 300, 2, 4, nil).
		WillReturnRows(sqlmock.NewRows([]string{"id", "created_at"}).AddRow(10, time.Now()))
	mock.ExpectCommit()

	body, _ := json.Marshal(map[string]any{
		"player_level": 2,
		"player_count": 4,
		"difficulty":   "m",
	})
	req := httptest.NewRequest(http.MethodPost, "/api/encounters/generate", bytes.NewBuffer(body))
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
	rec := httptest.NewRecorder()

	handler.GenerateRandomEncounter(rec, req)
	if rec.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d body=%s", rec.Code, rec.Body.String())
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}
