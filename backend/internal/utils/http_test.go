package utils

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"

	"rpg-saas-backend/internal/api/middleware"
)

func TestExtractPagination(t *testing.T) {
	r := httptest.NewRequest(http.MethodGet, "/test?limit=50&offset=10", nil)
	p := ExtractPagination(r, 20)
	if p.Limit != 50 || p.Offset != 10 {
		t.Fatalf("expected limit=50 offset=10, got %d %d", p.Limit, p.Offset)
	}

	r = httptest.NewRequest(http.MethodGet, "/test", nil)
	p = ExtractPagination(r, 25)
	if p.Limit != 25 || p.Offset != 0 {
		t.Fatalf("expected defaults limit=25 offset=0, got %d %d", p.Limit, p.Offset)
	}

	r = httptest.NewRequest(http.MethodGet, "/test?limit=150&offset=-5", nil)
	p = ExtractPagination(r, 20)
	if p.Limit != 100 || p.Offset != 0 {
		t.Fatalf("expected capped limit=100 offset=0, got %d %d", p.Limit, p.Offset)
	}
}

func TestExtractUserID(t *testing.T) {
	ctx := context.WithValue(context.Background(), middleware.UserIDKey, 42)
	r := httptest.NewRequest(http.MethodGet, "/test", nil).WithContext(ctx)

	id, err := ExtractUserID(r)
	if err != nil {
		t.Fatalf("expected user id, got error: %v", err)
	}
	if id != 42 {
		t.Fatalf("expected id 42, got %d", id)
	}

	_, err = ExtractUserID(httptest.NewRequest(http.MethodGet, "/test", nil))
	if err == nil {
		t.Fatal("expected error when user id is missing")
	}
}

func TestExtractIDParam(t *testing.T) {
	rc := chi.NewRouteContext()
	rc.URLParams.Add("npcId", "7")

	r := httptest.NewRequest(http.MethodGet, "/npcs/7", nil)
	r = r.WithContext(context.WithValue(r.Context(), chi.RouteCtxKey, rc))

	id, err := ExtractIDParam(r, "npcId")
	if err != nil {
		t.Fatalf("expected id, got error: %v", err)
	}
	if id != 7 {
		t.Fatalf("expected id 7, got %d", id)
	}

	// Missing parameter
	r = httptest.NewRequest(http.MethodGet, "/npcs", nil)
	if _, err := ExtractIDParam(r, "npcId"); err == nil {
		t.Fatal("expected error for missing id param")
	}

	// Invalid parameter
	rc = chi.NewRouteContext()
	rc.URLParams.Add("npcId", "bad")
	r = httptest.NewRequest(http.MethodGet, "/npcs/bad", nil)
	r = r.WithContext(context.WithValue(r.Context(), chi.RouteCtxKey, rc))
	if _, err := ExtractIDParam(r, "npcId"); err == nil {
		t.Fatal("expected error for invalid id")
	}
}

func TestExtractID(t *testing.T) {
	rc := chi.NewRouteContext()
	rc.URLParams.Add("id", "3")
	r := httptest.NewRequest(http.MethodGet, "/resources/3", nil)
	r = r.WithContext(context.WithValue(r.Context(), chi.RouteCtxKey, rc))

	id, err := ExtractID(r)
	if err != nil || id != 3 {
		t.Fatalf("expected id 3, got %d err %v", id, err)
	}
}

func TestOptionalParams(t *testing.T) {
	r := httptest.NewRequest(http.MethodGet, "/test", nil)
	if val := ExtractOptionalIntParam(r, "limit", 5); val != 5 {
		t.Fatalf("expected default 5, got %d", val)
	}
	if val := ExtractOptionalStringParam(r, "name", "default"); val != "default" {
		t.Fatalf("expected default string, got %s", val)
	}

	r = httptest.NewRequest(http.MethodGet, "/test?limit=9&name=foo", nil)
	if val := ExtractOptionalIntParam(r, "limit", 5); val != 9 {
		t.Fatalf("expected int param 9, got %d", val)
	}
	if val := ExtractOptionalStringParam(r, "name", "default"); val != "foo" {
		t.Fatalf("expected string param foo, got %s", val)
	}
}
