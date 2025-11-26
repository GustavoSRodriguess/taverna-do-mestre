package handlers

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	sqlmock "github.com/DATA-DOG/go-sqlmock"
	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"

	"rpg-saas-backend/internal/db"
)

func newMockDnDSearchHandler(t *testing.T) (*DnDHandler, sqlmock.Sqlmock, func()) {
	t.Helper()
	rawDB, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create sqlmock: %v", err)
	}
	pdb := &db.PostgresDB{DB: sqlx.NewDb(rawDB, "postgres")}
	return NewDnDHandler(pdb), mock, func() { rawDB.Close() }
}

func TestDnDHandler_SearchRacesClassesSpellsMonsters(t *testing.T) {
	handler, mock, cleanup := newMockDnDSearchHandler(t)
	defer cleanup()

	now := time.Now()

	// Races search path
	raceCols := []string{
		"id", "api_index", "name", "speed", "size", "size_description",
		"ability_bonuses", "traits", "languages", "proficiencies", "subraces",
		"created_at", "updated_at", "api_version",
	}
	mock.ExpectQuery(`FROM dnd_races`).WithArgs("%elf%", 50, 0).
		WillReturnRows(sqlmock.NewRows(raceCols).AddRow(
			1, "elf", "Elf", 30, "Medium", "desc",
			[]byte(`[]`), []byte(`[]`), []byte(`[]`), []byte(`[]`), pq.StringArray{}, now, now, "2014",
		))

	reqRaces := httptest.NewRequest(http.MethodGet, "/api/dnd/races?search=elf", nil)
	recRaces := httptest.NewRecorder()
	handler.GetRaces(recRaces, reqRaces)
	if recRaces.Code != http.StatusOK {
		t.Fatalf("expected 200 for races search, got %d", recRaces.Code)
	}

	// Classes search path
	classCols := []string{
		"id", "api_index", "name", "hit_die", "proficiencies", "saving_throws",
		"spellcasting", "spellcasting_ability", "class_levels", "created_at", "updated_at", "api_version",
	}
	mock.ExpectQuery(`FROM dnd_classes`).WithArgs("%wiz%", 50, 0).
		WillReturnRows(sqlmock.NewRows(classCols).AddRow(
			1, "wizard", "Wizard", 6, []byte(`{}`), pq.StringArray{"int"},
			[]byte(`{}`), "int", []byte(`{}`), now, now, "2014",
		))

	reqClasses := httptest.NewRequest(http.MethodGet, "/api/dnd/classes?search=wiz", nil)
	recClasses := httptest.NewRecorder()
	handler.GetClasses(recClasses, reqClasses)
	if recClasses.Code != http.StatusOK {
		t.Fatalf("expected 200 for classes search, got %d", recClasses.Code)
	}

	// Spells search path
	spellCols := []string{
		"id", "api_index", "name", "level", "school", "casting_time", "range",
		"components", "duration", "concentration", "ritual", "description",
		"higher_level", "material", "classes", "created_at", "updated_at", "api_version",
	}
	mock.ExpectQuery(`FROM dnd_spells`).WithArgs("%missile%", 50, 0).
		WillReturnRows(sqlmock.NewRows(spellCols).AddRow(
			1, "magic-missile", "Magic Missile", 1, "evocation", "1 action", "120 feet",
			"V,S", "Instant", false, false, "desc", "", "", pq.StringArray{"Wizard"}, now, now, "2014",
		))

	reqSpells := httptest.NewRequest(http.MethodGet, "/api/dnd/spells?search=missile", nil)
	recSpells := httptest.NewRecorder()
	handler.GetSpells(recSpells, reqSpells)
	if recSpells.Code != http.StatusOK {
		t.Fatalf("expected 200 for spells search, got %d", recSpells.Code)
	}

	// Monsters search path
	monsterCols := []string{
		"id", "api_index", "name", "size", "type", "subtype", "alignment", "armor_class",
		"hit_points", "hit_dice", "speed", "strength", "dexterity", "constitution",
		"intelligence", "wisdom", "charisma", "challenge_rating", "xp", "proficiency_bonus",
		"damage_vulnerabilities", "damage_resistances", "damage_immunities", "condition_immunities",
		"senses", "languages", "special_abilities", "actions", "legendary_actions",
		"created_at", "updated_at", "api_version",
	}
	mock.ExpectQuery(`FROM dnd_monsters`).WithArgs("%gob%", 50, 0).
		WillReturnRows(sqlmock.NewRows(monsterCols).AddRow(
			1, "goblin", "Goblin", "Small", "humanoid", "", "neutral", 15, 7, "2d6",
			[]byte(`{}`), 8, 14, 10, 8, 8, 8, 0.25, 50, 2,
			pq.StringArray{}, pq.StringArray{}, pq.StringArray{}, pq.StringArray{},
			[]byte(`{}`), "Common", []byte(`[]`), []byte(`[]`), []byte(`[]`), now, now, "2014",
		))

	reqMonsters := httptest.NewRequest(http.MethodGet, "/api/dnd/monsters?search=gob", nil)
	recMonsters := httptest.NewRecorder()
	handler.GetMonsters(recMonsters, reqMonsters)
	if recMonsters.Code != http.StatusOK {
		t.Fatalf("expected 200 for monsters search, got %d", recMonsters.Code)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}
