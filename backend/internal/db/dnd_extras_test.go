package db

import (
	"context"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
)

func TestGetDnDSkills(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	now := time.Now()
	rows := sqlmock.NewRows([]string{"id", "api_index", "name", "description", "ability_score", "created_at", "updated_at", "api_version"}).
		AddRow(1, "acrobatics", "Acrobatics", "Balance", "dex", now, now, "2014").
		AddRow(2, "stealth", "Stealth", "Move quietly", "dex", now, now, "2014")

	mock.ExpectQuery(`SELECT id, api_index, name, description, ability_score`).
		WithArgs(10, 0).
		WillReturnRows(rows)

	skills, err := pdb.GetDnDSkills(context.Background(), 10, 0)
	if err != nil {
		t.Fatalf("GetDnDSkills error: %v", err)
	}
	if len(skills) != 2 || skills[0].Name != "Acrobatics" {
		t.Fatalf("unexpected skills: %+v", skills)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestGetDnDSkillByIndex(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	now := time.Now()
	row := sqlmock.NewRows([]string{"id", "api_index", "name", "description", "ability_score", "created_at", "updated_at", "api_version"}).
		AddRow(1, "perception", "Perception", "Notice", "wis", now, now, "2014")

	mock.ExpectQuery(`SELECT id, api_index, name, description, ability_score, created_at, updated_at, api_version FROM dnd_skills WHERE api_index`).
		WithArgs("perception").
		WillReturnRows(row)

	skill, err := pdb.GetDnDSkillByIndex(context.Background(), "perception")
	if err != nil {
		t.Fatalf("GetDnDSkillByIndex error: %v", err)
	}
	if skill.Name != "Perception" {
		t.Fatalf("unexpected skill: %+v", skill)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestGetDnDLanguages(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	now := time.Now()
	rows := sqlmock.NewRows([]string{"id", "api_index", "name", "type", "description", "script", "typical_speakers", "created_at", "updated_at", "api_version"}).
		AddRow(1, "common", "Common", "standard", "Common tongue", "Common", `{"Humans"}`, now, now, "2014").
		AddRow(2, "elvish", "Elvish", "standard", "Elven language", "Elvish", `{"Elves"}`, now, now, "2014")

	mock.ExpectQuery(`SELECT id, api_index, name, type, description, script, typical_speakers`).
		WithArgs(10, 0).
		WillReturnRows(rows)

	languages, err := pdb.GetDnDLanguages(context.Background(), 10, 0)
	if err != nil {
		t.Fatalf("GetDnDLanguages error: %v", err)
	}
	if len(languages) != 2 || languages[0].Name != "Common" {
		t.Fatalf("unexpected languages: %+v", languages)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestGetDnDConditions(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	now := time.Now()
	rows := sqlmock.NewRows([]string{"id", "api_index", "name", "description", "created_at", "updated_at", "api_version"}).
		AddRow(1, "blinded", "Blinded", "Cannot see", now, now, "2014").
		AddRow(2, "poisoned", "Poisoned", "Disadvantage", now, now, "2014")

	mock.ExpectQuery(`SELECT id, api_index, name, description`).
		WithArgs(10, 0).
		WillReturnRows(rows)

	conditions, err := pdb.GetDnDConditions(context.Background(), 10, 0)
	if err != nil {
		t.Fatalf("GetDnDConditions error: %v", err)
	}
	if len(conditions) != 2 || conditions[0].Name != "Blinded" {
		t.Fatalf("unexpected conditions: %+v", conditions)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestGetDnDSubraces(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	now := time.Now()
	rows := sqlmock.NewRows([]string{"id", "api_index", "name", "race_name", "description", "ability_bonuses", "traits", "proficiencies", "created_at", "updated_at", "api_version"}).
		AddRow(1, "high-elf", "High Elf", "elf", "Elven subrace", []byte(`{"int":1}`), []byte(`[]`), []byte(`[]`), now, now, "2014")

	mock.ExpectQuery(`SELECT id, api_index, name, race_name, description, ability_bonuses, traits, proficiencies`).
		WithArgs(10, 0).
		WillReturnRows(rows)

	subraces, err := pdb.GetDnDSubraces(context.Background(), 10, 0)
	if err != nil {
		t.Fatalf("GetDnDSubraces error: %v", err)
	}
	if len(subraces) != 1 || subraces[0].Name != "High Elf" {
		t.Fatalf("unexpected subraces: %+v", subraces)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestGetDnDFeatures(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	now := time.Now()
	rows := sqlmock.NewRows([]string{"id", "api_index", "name", "level", "class_name", "subclass_name", "description", "prerequisites", "created_at", "updated_at", "api_version"}).
		AddRow(1, "action-surge", "Action Surge", 2, "fighter", "", "Extra action", []byte(`{}`), now, now, "2014")

	mock.ExpectQuery(`SELECT id, api_index, name, level, class_name, subclass_name, description, prerequisites`).
		WithArgs("%fighter%", 10, 0).
		WillReturnRows(rows)

	features, err := pdb.GetDnDFeatures(context.Background(), 10, 0, "fighter", nil)
	if err != nil {
		t.Fatalf("GetDnDFeatures error: %v", err)
	}
	if len(features) != 1 || features[0].Name != "Action Surge" {
		t.Fatalf("unexpected features: %+v", features)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestGetDnDFeatureByIndex(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	now := time.Now()
	row := sqlmock.NewRows([]string{"id", "api_index", "name", "level", "class_name", "subclass_name", "description", "prerequisites", "created_at", "updated_at", "api_version"}).
		AddRow(1, "rage", "Rage", 1, "barbarian", "", "Enter rage", []byte(`{}`), now, now, "2014")

	mock.ExpectQuery(`SELECT id, api_index, name, level, class_name, subclass_name, description, prerequisites`).
		WithArgs("rage").
		WillReturnRows(row)

	feature, err := pdb.GetDnDFeatureByIndex(context.Background(), "rage")
	if err != nil {
		t.Fatalf("GetDnDFeatureByIndex error: %v", err)
	}
	if feature.Name != "Rage" {
		t.Fatalf("unexpected feature: %+v", feature)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}
