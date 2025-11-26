package handlers

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	sqlmock "github.com/DATA-DOG/go-sqlmock"
	"github.com/lib/pq"
)

func TestDnDHandler_SpellFilters(t *testing.T) {
	handler, mock, cleanup := newMockDnDHandler(t)
	defer cleanup()

	now := time.Now()
	spellCols := []string{
		"id", "api_index", "name", "level", "school", "casting_time", "range",
		"components", "duration", "concentration", "ritual", "description",
		"higher_level", "material", "classes", "created_at", "updated_at", "api_version",
	}
	mock.ExpectQuery(`FROM dnd_spells WHERE 1=1`).WithArgs(1, "%evocation%", "wizard", 50, 0).
		WillReturnRows(sqlmock.NewRows(spellCols).AddRow(
			1, "magic-missile", "Magic Missile", 1, "evocation", "1 action", "120 feet",
			"V,S", "Instant", false, false, "desc", "", "", pq.StringArray{"Wizard"}, now, now, "2014",
		))

	req := httptest.NewRequest(http.MethodGet, "/api/dnd/spells?level=1&school=evocation&class=wizard", nil)
	rec := httptest.NewRecorder()
	handler.GetSpells(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 for filtered spells, got %d", rec.Code)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestDnDHandler_MonsterFilters(t *testing.T) {
	handler, mock, cleanup := newMockDnDHandler(t)
	defer cleanup()

	now := time.Now()
	monsterCols := []string{
		"id", "api_index", "name", "size", "type", "subtype", "alignment", "armor_class",
		"hit_points", "hit_dice", "speed", "strength", "dexterity", "constitution",
		"intelligence", "wisdom", "charisma", "challenge_rating", "xp", "proficiency_bonus",
		"damage_vulnerabilities", "damage_resistances", "damage_immunities", "condition_immunities",
		"senses", "languages", "special_abilities", "actions", "legendary_actions",
		"created_at", "updated_at", "api_version",
	}
	mock.ExpectQuery(`SELECT .*FROM dnd_monsters`).WillReturnRows(sqlmock.NewRows(monsterCols).AddRow(
		1, "goblin", "Goblin", "Small", "humanoid", "", "neutral", 15, 7, "2d6",
		[]byte(`{}`), 8, 14, 10, 8, 8, 8, 0.25, 50, 2,
		pq.StringArray{}, pq.StringArray{}, pq.StringArray{}, pq.StringArray{},
		[]byte(`{}`), "Common", []byte(`[]`), []byte(`[]`), []byte(`[]`), now, now, "2014",
	))

	req := httptest.NewRequest(http.MethodGet, "/api/dnd/monsters?challenge_rating=0.25&type=humanoid", nil)
	rec := httptest.NewRecorder()
	handler.GetMonsters(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 for filtered monsters, got %d", rec.Code)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}
