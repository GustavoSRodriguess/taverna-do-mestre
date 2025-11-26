package handlers

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
)

// Test error cases for *ByIndex handlers
func TestDnDHandler_GetClassByIndex_Error(t *testing.T) {
	handler, mock, cleanup := newMockDnDHandler(t)
	defer cleanup()

	mock.ExpectQuery(`WHERE api_index = \$1`).
		WithArgs("wizard").
		WillReturnError(errors.New("db error"))

	req := httptest.NewRequest(http.MethodGet, "/api/dnd/classes/wizard", nil)
	req = addChiURLParam(req, "index", "wizard")
	rr := httptest.NewRecorder()

	handler.GetClassByIndex(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", rr.Code)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestDnDHandler_GetSpellByIndex_Error(t *testing.T) {
	handler, mock, cleanup := newMockDnDHandler(t)
	defer cleanup()

	mock.ExpectQuery(`WHERE api_index = \$1`).
		WithArgs("magic-missile").
		WillReturnError(errors.New("db error"))

	req := httptest.NewRequest(http.MethodGet, "/api/dnd/spells/magic-missile", nil)
	req = addChiURLParam(req, "index", "magic-missile")
	rr := httptest.NewRecorder()

	handler.GetSpellByIndex(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", rr.Code)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestDnDHandler_GetEquipmentByIndex_Error(t *testing.T) {
	handler, mock, cleanup := newMockDnDHandler(t)
	defer cleanup()

	mock.ExpectQuery(`WHERE api_index = \$1`).
		WithArgs("longsword").
		WillReturnError(errors.New("db error"))

	req := httptest.NewRequest(http.MethodGet, "/api/dnd/equipment/longsword", nil)
	req = addChiURLParam(req, "index", "longsword")
	rr := httptest.NewRecorder()

	handler.GetEquipmentByIndex(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", rr.Code)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestDnDHandler_GetMonsterByIndex_Error(t *testing.T) {
	handler, mock, cleanup := newMockDnDHandler(t)
	defer cleanup()

	mock.ExpectQuery(`WHERE api_index = \$1`).
		WithArgs("goblin").
		WillReturnError(errors.New("db error"))

	req := httptest.NewRequest(http.MethodGet, "/api/dnd/monsters/goblin", nil)
	req = addChiURLParam(req, "index", "goblin")
	rr := httptest.NewRecorder()

	handler.GetMonsterByIndex(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", rr.Code)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestDnDHandler_GetBackgroundByIndex_Error(t *testing.T) {
	handler, mock, cleanup := newMockDnDHandler(t)
	defer cleanup()

	mock.ExpectQuery(`WHERE api_index = \$1`).
		WithArgs("acolyte").
		WillReturnError(errors.New("db error"))

	req := httptest.NewRequest(http.MethodGet, "/api/dnd/backgrounds/acolyte", nil)
	req = addChiURLParam(req, "index", "acolyte")
	rr := httptest.NewRecorder()

	handler.GetBackgroundByIndex(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", rr.Code)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestDnDHandler_GetSkillByIndex_Error(t *testing.T) {
	handler, mock, cleanup := newMockDnDHandler(t)
	defer cleanup()

	mock.ExpectQuery(`WHERE api_index = \$1`).
		WithArgs("acrobatics").
		WillReturnError(errors.New("db error"))

	req := httptest.NewRequest(http.MethodGet, "/api/dnd/skills/acrobatics", nil)
	req = addChiURLParam(req, "index", "acrobatics")
	rr := httptest.NewRecorder()

	handler.GetSkillByIndex(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", rr.Code)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestDnDHandler_GetFeatureByIndex_Error(t *testing.T) {
	handler, mock, cleanup := newMockDnDHandler(t)
	defer cleanup()

	mock.ExpectQuery(`WHERE api_index = \$1`).
		WithArgs("rage").
		WillReturnError(errors.New("db error"))

	req := httptest.NewRequest(http.MethodGet, "/api/dnd/features/rage", nil)
	req = addChiURLParam(req, "index", "rage")
	rr := httptest.NewRecorder()

	handler.GetFeatureByIndex(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", rr.Code)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestDnDHandler_GetRaceByIndex_Error(t *testing.T) {
	handler, mock, cleanup := newMockDnDHandler(t)
	defer cleanup()

	mock.ExpectQuery(`WHERE api_index = \$1`).
		WithArgs("elf").
		WillReturnError(errors.New("db error"))

	req := httptest.NewRequest(http.MethodGet, "/api/dnd/races/elf", nil)
	req = addChiURLParam(req, "index", "elf")
	rr := httptest.NewRecorder()

	handler.GetRaceByIndex(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", rr.Code)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}
