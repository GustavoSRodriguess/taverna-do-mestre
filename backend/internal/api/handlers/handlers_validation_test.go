package handlers

import (
	"bytes"
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"rpg-saas-backend/internal/api/middleware"
)

func TestCampaignHandler_CreateCampaign_InvalidJSON(t *testing.T) {
	h, _, cleanup := newMockCampaignHandler(t)
	defer cleanup()

	req := httptest.NewRequest(http.MethodPost, "/api/campaigns", bytes.NewBufferString(`{invalid`))
	req = req.WithContext(contextWithUserID(req.Context(), 1))
	rec := httptest.NewRecorder()

	h.CreateCampaign(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rec.Code)
	}
}

func TestNPCHandler_CreateNPC_ValidationError(t *testing.T) {
	h, _, cleanup := newMockNPCHandler(t)
	defer cleanup()

	req := httptest.NewRequest(http.MethodPost, "/api/npcs", bytes.NewBufferString(`{"name":""}`))
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 1))
	rec := httptest.NewRecorder()

	h.CreateNPC(rec, req)
	if rec.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected 422, got %d", rec.Code)
	}
}

func TestEncounterHandler_GenerateRandomEncounter_InvalidDifficulty(t *testing.T) {
	h, _, cleanup := newMockEncounterHandler(t)
	defer cleanup()

	body := `{"player_level":1,"player_count":4,"difficulty":"x"}`
	req := httptest.NewRequest(http.MethodPost, "/api/encounters/generate", bytes.NewBufferString(body))
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 1))
	rec := httptest.NewRecorder()

	h.GenerateRandomEncounter(rec, req)
	if rec.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected 422, got %d", rec.Code)
	}
}

func TestDnDHandler_GetRaceByIndex_BadRequest(t *testing.T) {
	h, _, cleanup := newMockDnDHandler(t)
	defer cleanup()

	req := httptest.NewRequest(http.MethodGet, "/api/dnd/races/", nil)
	rec := httptest.NewRecorder()

	h.GetRaceByIndex(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rec.Code)
	}
}
