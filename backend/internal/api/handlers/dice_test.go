package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"rpg-saas-backend/internal/models"
)

func TestParseDiceNotation(t *testing.T) {
	parsed, err := parseDiceNotation("2d6+3")
	if err != nil {
		t.Fatalf("expected valid notation, got error: %v", err)
	}
	if parsed.Quantity != 2 || parsed.Sides != 6 || parsed.Modifier != 3 {
		t.Fatalf("unexpected parsed result: %+v", parsed)
	}

	if _, err := parseDiceNotation("bad"); err == nil {
		t.Fatal("expected error for invalid notation")
	}
}

func TestRollDice(t *testing.T) {
	rolls, total, err := rollDice(3, 6, 2)
	if err != nil {
		t.Fatalf("unexpected roll error: %v", err)
	}
	if len(rolls) != 3 {
		t.Fatalf("expected 3 rolls, got %d", len(rolls))
	}
	for _, r := range rolls {
		if r < 1 || r > 6 {
			t.Fatalf("roll out of range: %d", r)
		}
	}
	if total < 5 || total > 20 {
		t.Fatalf("unexpected total %d", total)
	}
}

func TestRollDiceHandler(t *testing.T) {
	handler := NewDiceHandler()

	// Advantage + disadvantage should fail
	body, _ := json.Marshal(models.DiceRollRequest{Notation: "1d20", Advantage: true, Disadvantage: true})
	req := httptest.NewRequest(http.MethodPost, "/api/dice/roll", bytes.NewBuffer(body))
	rr := httptest.NewRecorder()
	handler.RollDice(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rr.Code)
	}

	// Invalid notation
	body, _ = json.Marshal(models.DiceRollRequest{Notation: "bad"})
	req = httptest.NewRequest(http.MethodPost, "/api/dice/roll", bytes.NewBuffer(body))
	rr = httptest.NewRecorder()
	handler.RollDice(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for invalid notation, got %d", rr.Code)
	}

	// Successful advantage roll (1d20)
	body, _ = json.Marshal(models.DiceRollRequest{Notation: "1d20", Advantage: true})
	req = httptest.NewRequest(http.MethodPost, "/api/dice/roll", bytes.NewBuffer(body))
	rr = httptest.NewRecorder()
	handler.RollDice(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}

	var resp models.DiceRollResponse
	if err := json.Unmarshal(rr.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if len(resp.Rolls) != 1 || len(resp.DroppedRolls) != 1 {
		t.Fatalf("expected one kept roll and one dropped, got %+v", resp)
	}
	if resp.Total != resp.Rolls[0] {
		t.Fatalf("expected total to match roll, got total=%d roll=%d", resp.Total, resp.Rolls[0])
	}
}

func TestRollDiceHandler_AdditionalCases(t *testing.T) {
	handler := NewDiceHandler()

	t.Run("invalid JSON body", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/dice/roll", bytes.NewBufferString("invalid-json"))
		rr := httptest.NewRecorder()
		handler.RollDice(rr, req)
		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rr.Code)
		}
	})

	t.Run("normal roll success", func(t *testing.T) {
		body, _ := json.Marshal(models.DiceRollRequest{Notation: "2d6+3"})
		req := httptest.NewRequest(http.MethodPost, "/api/dice/roll", bytes.NewBuffer(body))
		rr := httptest.NewRecorder()
		handler.RollDice(rr, req)
		if rr.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", rr.Code)
		}

		var resp models.DiceRollResponse
		if err := json.Unmarshal(rr.Body.Bytes(), &resp); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}
		if len(resp.Rolls) != 2 {
			t.Fatalf("expected 2 rolls, got %d", len(resp.Rolls))
		}
	})

	t.Run("disadvantage roll", func(t *testing.T) {
		body, _ := json.Marshal(models.DiceRollRequest{Notation: "1d20", Disadvantage: true})
		req := httptest.NewRequest(http.MethodPost, "/api/dice/roll", bytes.NewBuffer(body))
		rr := httptest.NewRecorder()
		handler.RollDice(rr, req)
		if rr.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", rr.Code)
		}

		var resp models.DiceRollResponse
		if err := json.Unmarshal(rr.Body.Bytes(), &resp); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}
		if len(resp.Rolls) != 1 || len(resp.DroppedRolls) != 1 {
			t.Fatalf("expected one kept roll and one dropped, got %+v", resp)
		}
		if resp.Total != resp.Rolls[0] {
			t.Fatalf("expected total to match roll, got total=%d roll=%d", resp.Total, resp.Rolls[0])
		}
	})

	t.Run("advantage with modifier", func(t *testing.T) {
		body, _ := json.Marshal(models.DiceRollRequest{Notation: "1d20+5", Advantage: true})
		req := httptest.NewRequest(http.MethodPost, "/api/dice/roll", bytes.NewBuffer(body))
		rr := httptest.NewRecorder()
		handler.RollDice(rr, req)
		if rr.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", rr.Code)
		}

		var resp models.DiceRollResponse
		if err := json.Unmarshal(rr.Body.Bytes(), &resp); err != nil {
			t.Fatalf("failed to decode response: %v", err)
		}
		// Total should be roll + 5
		if resp.Total != resp.Rolls[0]+5 {
			t.Fatalf("expected total to be roll+5, got total=%d roll=%d", resp.Total, resp.Rolls[0])
		}
	})
}

func TestRollMultipleHandler(t *testing.T) {
	handler := NewDiceHandler()

	// No requests should be rejected
	req := httptest.NewRequest(http.MethodPost, "/api/dice/roll-multiple", bytes.NewBufferString("[]"))
	rr := httptest.NewRecorder()
	handler.RollMultiple(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for empty list, got %d", rr.Code)
	}

	// Valid multiple rolls
	requests := []models.DiceRollRequest{
		{Notation: "1d4"},
		{Notation: "2d6+1"},
	}
	body, _ := json.Marshal(requests)
	req = httptest.NewRequest(http.MethodPost, "/api/dice/roll-multiple", bytes.NewBuffer(body))
	rr = httptest.NewRecorder()
	handler.RollMultiple(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}

	var resp []models.DiceRollResponse
	if err := json.Unmarshal(rr.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if len(resp) != 2 {
		t.Fatalf("expected 2 responses, got %d", len(resp))
	}

	for _, r := range resp {
		if r.Timestamp.IsZero() {
			t.Fatalf("expected timestamp to be set, got zero for %+v", r)
		}
		if r.Total == 0 {
			t.Fatalf("expected non-zero total for %+v", r)
		}
	}
}

func TestRollMultipleHandler_Errors(t *testing.T) {
	handler := NewDiceHandler()

	t.Run("invalid JSON", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/dice/roll-multiple", bytes.NewBufferString("invalid"))
		rr := httptest.NewRecorder()
		handler.RollMultiple(rr, req)
		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rr.Code)
		}
	})

	t.Run("too many requests", func(t *testing.T) {
		requests := make([]models.DiceRollRequest, 21)
		for i := range requests {
			requests[i] = models.DiceRollRequest{Notation: "1d6"}
		}
		body, _ := json.Marshal(requests)
		req := httptest.NewRequest(http.MethodPost, "/api/dice/roll-multiple", bytes.NewBuffer(body))
		rr := httptest.NewRecorder()
		handler.RollMultiple(rr, req)
		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected 400 for too many requests, got %d", rr.Code)
		}
	})

	t.Run("invalid notation in batch", func(t *testing.T) {
		requests := []models.DiceRollRequest{
			{Notation: "1d6"},
			{Notation: "bad-notation"},
		}
		body, _ := json.Marshal(requests)
		req := httptest.NewRequest(http.MethodPost, "/api/dice/roll-multiple", bytes.NewBuffer(body))
		rr := httptest.NewRecorder()
		handler.RollMultiple(rr, req)
		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected 400 for invalid notation, got %d", rr.Code)
		}
	})
}
