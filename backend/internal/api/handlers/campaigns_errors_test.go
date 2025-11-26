package handlers

import (
	"bytes"
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"rpg-saas-backend/internal/api/middleware"
)

func TestCampaignHandler_GetCampaignByID_Errors(t *testing.T) {
	handler, mock, cleanup := newMockCampaignHandler(t)
	defer cleanup()

	t.Run("invalid campaign ID", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/campaigns/invalid", nil)
		req = addChiURLParam(req, "id", "invalid")
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		rr := httptest.NewRecorder()

		handler.GetCampaignByID(rr, req)
		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rr.Code)
		}
	})

	t.Run("user ID not in context", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/campaigns/1", nil)
		req = addChiURLParam(req, "id", "1")
		rr := httptest.NewRecorder()

		handler.GetCampaignByID(rr, req)
		if rr.Code != http.StatusInternalServerError {
			t.Fatalf("expected 500, got %d", rr.Code)
		}
	})

	t.Run("campaign not found", func(t *testing.T) {
		mock.ExpectQuery(`FROM campaigns`).WithArgs(999, 7).
			WillReturnError(fmt.Errorf("campaign not found"))

		req := httptest.NewRequest(http.MethodGet, "/api/campaigns/999", nil)
		req = addChiURLParam(req, "id", "999")
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		rr := httptest.NewRecorder()

		handler.GetCampaignByID(rr, req)
		if rr.Code != http.StatusNotFound {
			t.Fatalf("expected 404, got %d", rr.Code)
		}
	})
}

func TestCampaignHandler_CreateCampaign_Errors(t *testing.T) {
	handler, _, cleanup := newMockCampaignHandler(t)
	defer cleanup()

	t.Run("invalid JSON body", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/campaigns", bytes.NewBufferString("invalid"))
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		rr := httptest.NewRecorder()

		handler.CreateCampaign(rr, req)
		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rr.Code)
		}
	})

	t.Run("missing campaign name", func(t *testing.T) {
		body := bytes.NewBufferString(`{"name":"","description":"test"}`)
		req := httptest.NewRequest(http.MethodPost, "/api/campaigns", body)
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		rr := httptest.NewRecorder()

		handler.CreateCampaign(rr, req)
		if rr.Code != http.StatusUnprocessableEntity {
			t.Fatalf("expected 422, got %d", rr.Code)
		}
	})
}

func TestCampaignHandler_UpdateCampaign_Errors(t *testing.T) {
	handler, _, cleanup := newMockCampaignHandler(t)
	defer cleanup()

	t.Run("invalid campaign ID", func(t *testing.T) {
		body := bytes.NewBufferString(`{"name":"Test"}`)
		req := httptest.NewRequest(http.MethodPut, "/api/campaigns/invalid", body)
		req = addChiURLParam(req, "id", "invalid")
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		rr := httptest.NewRecorder()

		handler.UpdateCampaign(rr, req)
		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rr.Code)
		}
	})

	t.Run("invalid JSON body", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPut, "/api/campaigns/1", bytes.NewBufferString("invalid"))
		req = addChiURLParam(req, "id", "1")
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		rr := httptest.NewRecorder()

		handler.UpdateCampaign(rr, req)
		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rr.Code)
		}
	})
}

func TestCampaignHandler_DeleteCampaign_Errors(t *testing.T) {
	handler, _, cleanup := newMockCampaignHandler(t)
	defer cleanup()

	t.Run("invalid campaign ID", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodDelete, "/api/campaigns/invalid", nil)
		req = addChiURLParam(req, "id", "invalid")
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		rr := httptest.NewRecorder()

		handler.DeleteCampaign(rr, req)
		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rr.Code)
		}
	})
}

func TestCampaignHandler_JoinCampaign_Errors(t *testing.T) {
	handler, _, cleanup := newMockCampaignHandler(t)
	defer cleanup()

	t.Run("invalid JSON body", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/campaigns/join", bytes.NewBufferString("invalid"))
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		rr := httptest.NewRecorder()

		handler.JoinCampaign(rr, req)
		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rr.Code)
		}
	})

	t.Run("missing invite code", func(t *testing.T) {
		body := bytes.NewBufferString(`{"invite_code":""}`)
		req := httptest.NewRequest(http.MethodPost, "/api/campaigns/join", body)
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		rr := httptest.NewRecorder()

		handler.JoinCampaign(rr, req)
		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rr.Code)
		}
	})

	t.Run("invalid invite code format", func(t *testing.T) {
		body := bytes.NewBufferString(`{"invite_code":"XYZ"}`)
		req := httptest.NewRequest(http.MethodPost, "/api/campaigns/join", body)
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 7))
		rr := httptest.NewRecorder()

		handler.JoinCampaign(rr, req)
		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rr.Code)
		}
	})
}
