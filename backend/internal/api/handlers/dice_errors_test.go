package handlers

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestDiceHandler_RollDice_Errors(t *testing.T) {
	handler := NewDiceHandler()

	t.Run("invalid JSON body", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/dice/roll", bytes.NewBufferString("invalid"))
		rec := httptest.NewRecorder()

		handler.RollDice(rec, req)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rec.Code)
		}
	})

	t.Run("invalid dice notation - empty", func(t *testing.T) {
		body := bytes.NewBufferString(`{"notation":""}`)
		req := httptest.NewRequest(http.MethodPost, "/api/dice/roll", body)
		rec := httptest.NewRecorder()

		handler.RollDice(rec, req)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rec.Code)
		}
	})

	t.Run("invalid dice notation - bad format", func(t *testing.T) {
		body := bytes.NewBufferString(`{"notation":"invalid"}`)
		req := httptest.NewRequest(http.MethodPost, "/api/dice/roll", body)
		rec := httptest.NewRecorder()

		handler.RollDice(rec, req)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rec.Code)
		}
	})

	t.Run("invalid number of dice", func(t *testing.T) {
		body := bytes.NewBufferString(`{"notation":"0d6"}`)
		req := httptest.NewRequest(http.MethodPost, "/api/dice/roll", body)
		rec := httptest.NewRecorder()

		handler.RollDice(rec, req)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rec.Code)
		}
	})

	t.Run("too many dice", func(t *testing.T) {
		body := bytes.NewBufferString(`{"notation":"101d6"}`)
		req := httptest.NewRequest(http.MethodPost, "/api/dice/roll", body)
		rec := httptest.NewRecorder()

		handler.RollDice(rec, req)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rec.Code)
		}
	})

	t.Run("invalid sides", func(t *testing.T) {
		body := bytes.NewBufferString(`{"notation":"1d0"}`)
		req := httptest.NewRequest(http.MethodPost, "/api/dice/roll", body)
		rec := httptest.NewRecorder()

		handler.RollDice(rec, req)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rec.Code)
		}
	})

	t.Run("too many sides", func(t *testing.T) {
		body := bytes.NewBufferString(`{"notation":"1d1001"}`)
		req := httptest.NewRequest(http.MethodPost, "/api/dice/roll", body)
		rec := httptest.NewRecorder()

		handler.RollDice(rec, req)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rec.Code)
		}
	})
}

func TestDiceHandler_RollMultiple_Errors(t *testing.T) {
	handler := NewDiceHandler()

	t.Run("invalid JSON body", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/dice/roll-multiple", bytes.NewBufferString("invalid"))
		rec := httptest.NewRecorder()

		handler.RollMultiple(rec, req)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rec.Code)
		}
	})

	t.Run("empty rolls array", func(t *testing.T) {
		body := bytes.NewBufferString(`{"rolls":[]}`)
		req := httptest.NewRequest(http.MethodPost, "/api/dice/roll-multiple", body)
		rec := httptest.NewRecorder()

		handler.RollMultiple(rec, req)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rec.Code)
		}
	})

	t.Run("too many rolls", func(t *testing.T) {
		rolls := `{"rolls":[`
		for i := 0; i < 21; i++ {
			if i > 0 {
				rolls += ","
			}
			rolls += `{"notation":"1d20"}`
		}
		rolls += `]}`

		body := bytes.NewBufferString(rolls)
		req := httptest.NewRequest(http.MethodPost, "/api/dice/roll-multiple", body)
		rec := httptest.NewRecorder()

		handler.RollMultiple(rec, req)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rec.Code)
		}
	})

	t.Run("invalid notation in rolls", func(t *testing.T) {
		body := bytes.NewBufferString(`{"rolls":[{"notation":"invalid"}]}`)
		req := httptest.NewRequest(http.MethodPost, "/api/dice/roll-multiple", body)
		rec := httptest.NewRecorder()

		handler.RollMultiple(rec, req)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rec.Code)
		}
	})
}
