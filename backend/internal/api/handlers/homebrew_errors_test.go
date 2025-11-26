package handlers

import (
	"bytes"
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHomebrewHandler_GetHomebrewRaceByID_Errors(t *testing.T) {
	handler, mock, cleanup := newMockHomebrewHandler(t)
	defer cleanup()

	t.Run("invalid race ID", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/homebrew/races/invalid", nil)
		req = req.WithContext(contextWithUserID(context.Background(), 5))
		req = addChiURLParam(req, "id", "invalid")
		rec := httptest.NewRecorder()

		handler.GetHomebrewRaceByID(rec, req)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rec.Code)
		}
	})

	t.Run("race not found", func(t *testing.T) {
		mock.ExpectQuery(`FROM homebrew_races`).WithArgs(999, 5).
			WillReturnError(fmt.Errorf("race not found"))

		req := httptest.NewRequest(http.MethodGet, "/api/homebrew/races/999", nil)
		req = req.WithContext(contextWithUserID(context.Background(), 5))
		req = addChiURLParam(req, "id", "999")
		rec := httptest.NewRecorder()

		handler.GetHomebrewRaceByID(rec, req)
		if rec.Code != http.StatusInternalServerError {
			t.Fatalf("expected 500, got %d", rec.Code)
		}
	})
}

func TestHomebrewHandler_CreateHomebrewRace_Errors(t *testing.T) {
	handler, _, cleanup := newMockHomebrewHandler(t)
	defer cleanup()

	t.Run("invalid JSON body", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/homebrew/races", bytes.NewBufferString("invalid"))
		req = req.WithContext(contextWithUserID(context.Background(), 5))
		rec := httptest.NewRecorder()

		handler.CreateHomebrewRace(rec, req)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rec.Code)
		}
	})

	t.Run("missing required fields", func(t *testing.T) {
		body := bytes.NewBufferString(`{"name":"","description":""}`)
		req := httptest.NewRequest(http.MethodPost, "/api/homebrew/races", body)
		req = req.WithContext(contextWithUserID(context.Background(), 5))
		rec := httptest.NewRecorder()

		handler.CreateHomebrewRace(rec, req)
		if rec.Code != http.StatusUnprocessableEntity {
			t.Fatalf("expected 422, got %d", rec.Code)
		}
	})
}

func TestHomebrewHandler_UpdateHomebrewRace_Errors(t *testing.T) {
	handler, _, cleanup := newMockHomebrewHandler(t)
	defer cleanup()

	t.Run("invalid race ID", func(t *testing.T) {
		body := bytes.NewBufferString(`{"name":"Test"}`)
		req := httptest.NewRequest(http.MethodPut, "/api/homebrew/races/invalid", body)
		req = req.WithContext(contextWithUserID(context.Background(), 5))
		req = addChiURLParam(req, "id","invalid")
		rec := httptest.NewRecorder()

		handler.UpdateHomebrewRace(rec, req)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rec.Code)
		}
	})

	t.Run("invalid JSON body", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPut, "/api/homebrew/races/1", bytes.NewBufferString("invalid"))
		req = req.WithContext(contextWithUserID(context.Background(), 5))
		req = addChiURLParam(req, "id","1")
		rec := httptest.NewRecorder()

		handler.UpdateHomebrewRace(rec, req)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rec.Code)
		}
	})
}

func TestHomebrewHandler_DeleteHomebrewRace_Errors(t *testing.T) {
	handler, _, cleanup := newMockHomebrewHandler(t)
	defer cleanup()

	t.Run("invalid race ID", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodDelete, "/api/homebrew/races/invalid", nil)
		req = req.WithContext(contextWithUserID(context.Background(), 5))
		req = addChiURLParam(req, "id","invalid")
		rec := httptest.NewRecorder()

		handler.DeleteHomebrewRace(rec, req)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rec.Code)
		}
	})
}

// Class errors
func TestHomebrewHandler_GetHomebrewClassByID_Errors(t *testing.T) {
	handler, _, cleanup := newMockHomebrewHandler(t)
	defer cleanup()

	t.Run("invalid class ID", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/homebrew/classes/invalid", nil)
		req = req.WithContext(contextWithUserID(context.Background(), 5))
		req = addChiURLParam(req, "id","invalid")
		rec := httptest.NewRecorder()

		handler.GetHomebrewClassByID(rec, req)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rec.Code)
		}
	})
}

func TestHomebrewHandler_CreateHomebrewClass_Errors(t *testing.T) {
	handler, _, cleanup := newMockHomebrewHandler(t)
	defer cleanup()

	t.Run("invalid JSON body", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/homebrew/classes", bytes.NewBufferString("invalid"))
		req = req.WithContext(contextWithUserID(context.Background(), 5))
		rec := httptest.NewRecorder()

		handler.CreateHomebrewClass(rec, req)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rec.Code)
		}
	})

	t.Run("missing required fields", func(t *testing.T) {
		body := bytes.NewBufferString(`{"name":""}`)
		req := httptest.NewRequest(http.MethodPost, "/api/homebrew/classes", body)
		req = req.WithContext(contextWithUserID(context.Background(), 5))
		rec := httptest.NewRecorder()

		handler.CreateHomebrewClass(rec, req)
		if rec.Code != http.StatusUnprocessableEntity {
			t.Fatalf("expected 422, got %d", rec.Code)
		}
	})
}

// Background errors
func TestHomebrewHandler_GetHomebrewBackgroundByID_Errors(t *testing.T) {
	handler, _, cleanup := newMockHomebrewHandler(t)
	defer cleanup()

	t.Run("invalid background ID", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/homebrew/backgrounds/invalid", nil)
		req = req.WithContext(contextWithUserID(context.Background(), 5))
		req = addChiURLParam(req, "id","invalid")
		rec := httptest.NewRecorder()

		handler.GetHomebrewBackgroundByID(rec, req)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rec.Code)
		}
	})
}

func TestHomebrewHandler_CreateHomebrewBackground_Errors(t *testing.T) {
	handler, _, cleanup := newMockHomebrewHandler(t)
	defer cleanup()

	t.Run("invalid JSON body", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/homebrew/backgrounds", bytes.NewBufferString("invalid"))
		req = req.WithContext(contextWithUserID(context.Background(), 5))
		rec := httptest.NewRecorder()

		handler.CreateHomebrewBackground(rec, req)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rec.Code)
		}
	})

	t.Run("missing required fields", func(t *testing.T) {
		body := bytes.NewBufferString(`{"name":""}`)
		req := httptest.NewRequest(http.MethodPost, "/api/homebrew/backgrounds", body)
		req = req.WithContext(contextWithUserID(context.Background(), 5))
		rec := httptest.NewRecorder()

		handler.CreateHomebrewBackground(rec, req)
		if rec.Code != http.StatusUnprocessableEntity {
			t.Fatalf("expected 422, got %d", rec.Code)
		}
	})
}

func TestHomebrewHandler_UpdateHomebrewBackground_Errors(t *testing.T) {
	handler, _, cleanup := newMockHomebrewHandler(t)
	defer cleanup()

	t.Run("invalid background ID", func(t *testing.T) {
		body := bytes.NewBufferString(`{"name":"Test"}`)
		req := httptest.NewRequest(http.MethodPut, "/api/homebrew/backgrounds/invalid", body)
		req = req.WithContext(contextWithUserID(context.Background(), 5))
		req = addChiURLParam(req, "id","invalid")
		rec := httptest.NewRecorder()

		handler.UpdateHomebrewBackground(rec, req)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rec.Code)
		}
	})
}

func TestHomebrewHandler_DeleteHomebrewBackground_Errors(t *testing.T) {
	handler, _, cleanup := newMockHomebrewHandler(t)
	defer cleanup()

	t.Run("invalid background ID", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodDelete, "/api/homebrew/backgrounds/invalid", nil)
		req = req.WithContext(contextWithUserID(context.Background(), 5))
		req = addChiURLParam(req, "id","invalid")
		rec := httptest.NewRecorder()

		handler.DeleteHomebrewBackground(rec, req)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rec.Code)
		}
	})
}

