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
	"rpg-saas-backend/internal/models"
	"rpg-saas-backend/internal/python"
)

func TestItemHandler_GenerateRandomTreasure(t *testing.T) {
	rawDB, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create sqlmock: %v", err)
	}
	defer rawDB.Close()

	pdb := &db.PostgresDB{DB: sqlx.NewDb(rawDB, "postgres")}

	// Stub Python service via httptest server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/generate-loot" {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{
			"level": 2,
			"total_value": 100,
			"hoards": [{
				"coins": {"gp": 10},
				"valuables": [],
				"items": [{"type":"magic","category":"rings","name":"Ring","rank":"minor"}],
				"value": 100
			}]
		}`))
	}))
	defer server.Close()

	pyClient := &python.Client{
		BaseURL: server.URL,
		HTTPClient: server.Client(),
	}

	handler := NewItemHandler(pdb, pyClient)

	mock.ExpectBegin()
	mock.ExpectQuery(`INSERT INTO treasures`).WithArgs(2, "Level 2 Treasure", 100).
		WillReturnRows(sqlmock.NewRows([]string{"id", "created_at"}).AddRow(10, time.Now()))
	mock.ExpectQuery(`INSERT INTO hoards`).WithArgs(10, 100.0, sqlmock.AnyArg()).
		WillReturnRows(sqlmock.NewRows([]string{"id", "created_at"}).AddRow(20, time.Now()))
	mock.ExpectCommit()

	body, _ := json.Marshal(models.TreasureRequest{Level: 2, Quantity: 1, MagicItems: true})
	req := httptest.NewRequest(http.MethodPost, "/api/treasures/generate", bytes.NewBuffer(body))
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
	rec := httptest.NewRecorder()

	handler.GenerateRandomTreasure(rec, req)
	if rec.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d body=%s", rec.Code, rec.Body.String())
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}
