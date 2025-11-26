package db

import (
	"context"
	"errors"
	"testing"

	"rpg-saas-backend/internal/models"
)

// Test error cases for functions with lower coverage

func TestGetCampaigns_Error(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	mock.ExpectQuery(`FROM campaigns`).
		WithArgs(1, 20, 0).
		WillReturnError(errors.New("db error"))

	_, err := pdb.GetCampaigns(context.Background(), 1, 20, 0)
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestDeleteCampaign_Error(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	mock.ExpectExec(`DELETE FROM campaigns`).
		WithArgs(1, 5).
		WillReturnError(errors.New("db error"))

	err := pdb.DeleteCampaign(context.Background(), 1, 5)
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestRemovePlayerFromCampaign_Error(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	mock.ExpectExec(`DELETE FROM campaign_players`).
		WithArgs(1, 5).
		WillReturnError(errors.New("db error"))

	err := pdb.RemovePlayerFromCampaign(context.Background(), 1, 5)
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestIsPlayerInCampaign_Error(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	mock.ExpectQuery(`SELECT EXISTS`).
		WithArgs(1, 5).
		WillReturnError(errors.New("db error"))

	_, err := pdb.IsPlayerInCampaign(context.Background(), 1, 5)
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestGetCampaignByInviteCode_Error(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	mock.ExpectQuery(`FROM campaigns WHERE invite_code`).
		WithArgs("ABCD1234").
		WillReturnError(errors.New("db error"))

	_, err := pdb.GetCampaignByInviteCode(context.Background(), "ABCD1234")
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestIsPCInCampaign_Error(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	mock.ExpectQuery(`SELECT EXISTS`).
		WithArgs(10, 1).
		WillReturnError(errors.New("db error"))

	_, err := pdb.IsPCInCampaign(context.Background(), 10, 1)
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestGetCampaignCharacter_Error(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	mock.ExpectQuery(`FROM campaign_characters`).
		WithArgs(10, 1, 5).
		WillReturnError(errors.New("db error"))

	_, err := pdb.GetCampaignCharacter(context.Background(), 10, 1, 5)
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestUpdateCampaignCharacter_Error(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	currentHP := 100
	mock.ExpectExec(`UPDATE campaign_characters`).
		WithArgs(100, "healthy", "notes", 10, 1).
		WillReturnError(errors.New("db error"))

	character := &models.CampaignCharacter{
		ID:            10,
		CampaignID:    1,
		CurrentHP:     &currentHP,
		Status:        "healthy",
		CampaignNotes: "notes",
	}

	err := pdb.UpdateCampaignCharacter(context.Background(), character)
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestDeleteCampaignCharacter_Error(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	mock.ExpectExec(`DELETE FROM campaign_characters`).
		WithArgs(10, 1).
		WillReturnError(errors.New("db error"))

	err := pdb.DeleteCampaignCharacter(context.Background(), 10, 1)
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestHasCampaignAccess_Error(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	mock.ExpectQuery(`SELECT EXISTS`).
		WithArgs(1, 5).
		WillReturnError(errors.New("db error"))

	_, err := pdb.HasCampaignAccess(context.Background(), 1, 5)
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

// DnD functions error tests

func TestGetDnDRaces_Error(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	mock.ExpectQuery(`FROM dnd_races`).
		WithArgs(10, 0).
		WillReturnError(errors.New("db error"))

	_, err := pdb.GetDnDRaces(context.Background(), 10, 0)
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestGetDnDRaceByIndex_Error(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	mock.ExpectQuery(`WHERE api_index = \$1`).
		WithArgs("elf").
		WillReturnError(errors.New("db error"))

	_, err := pdb.GetDnDRaceByIndex(context.Background(), "elf")
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestSearchDnDRaces_Error(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	mock.ExpectQuery(`FROM dnd_races WHERE`).
		WithArgs("%elf%", 10, 0).
		WillReturnError(errors.New("db error"))

	_, err := pdb.SearchDnDRaces(context.Background(), "elf", 10, 0)
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestGetDnDClasses_Error(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	mock.ExpectQuery(`FROM dnd_classes`).
		WithArgs(10, 0).
		WillReturnError(errors.New("db error"))

	_, err := pdb.GetDnDClasses(context.Background(), 10, 0)
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestGetDnDClassByIndex_Error(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	mock.ExpectQuery(`WHERE api_index = \$1`).
		WithArgs("wizard").
		WillReturnError(errors.New("db error"))

	_, err := pdb.GetDnDClassByIndex(context.Background(), "wizard")
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestSearchDnDClasses_Error(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	mock.ExpectQuery(`FROM dnd_classes WHERE`).
		WithArgs("%wizard%", 10, 0).
		WillReturnError(errors.New("db error"))

	_, err := pdb.SearchDnDClasses(context.Background(), "wizard", 10, 0)
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestGetDnDSpellByIndex_Error(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	mock.ExpectQuery(`WHERE api_index = \$1`).
		WithArgs("fireball").
		WillReturnError(errors.New("db error"))

	_, err := pdb.GetDnDSpellByIndex(context.Background(), "fireball")
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestSearchDnDSpells_Error(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	mock.ExpectQuery(`FROM dnd_spells WHERE`).
		WithArgs("%fire%", 10, 0).
		WillReturnError(errors.New("db error"))

	_, err := pdb.SearchDnDSpells(context.Background(), "fire", 10, 0)
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestGetDnDEquipmentByIndex_Error(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	mock.ExpectQuery(`WHERE api_index = \$1`).
		WithArgs("longsword").
		WillReturnError(errors.New("db error"))

	_, err := pdb.GetDnDEquipmentByIndex(context.Background(), "longsword")
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestSearchDnDEquipment_Error(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	mock.ExpectQuery(`FROM dnd_equipment WHERE`).
		WithArgs("%sword%", 10, 0).
		WillReturnError(errors.New("db error"))

	_, err := pdb.SearchDnDEquipment(context.Background(), "sword", 10, 0)
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestGetDnDMonsterByIndex_Error(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	mock.ExpectQuery(`WHERE api_index = \$1`).
		WithArgs("goblin").
		WillReturnError(errors.New("db error"))

	_, err := pdb.GetDnDMonsterByIndex(context.Background(), "goblin")
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestSearchDnDMonsters_Error(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	mock.ExpectQuery(`FROM dnd_monsters WHERE`).
		WithArgs("%dragon%", 10, 0).
		WillReturnError(errors.New("db error"))

	_, err := pdb.SearchDnDMonsters(context.Background(), "dragon", 10, 0)
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestGetDnDBackgroundByIndex_Error(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	mock.ExpectQuery(`WHERE api_index = \$1`).
		WithArgs("acolyte").
		WillReturnError(errors.New("db error"))

	_, err := pdb.GetDnDBackgroundByIndex(context.Background(), "acolyte")
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestSearchDnDBackgrounds_Error(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	mock.ExpectQuery(`FROM dnd_backgrounds WHERE`).
		WithArgs("%sage%", 10, 0).
		WillReturnError(errors.New("db error"))

	_, err := pdb.SearchDnDBackgrounds(context.Background(), "sage", 10, 0)
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestGetDnDSkillByIndex_Error(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	mock.ExpectQuery(`WHERE api_index`).
		WithArgs("acrobatics").
		WillReturnError(errors.New("db error"))

	_, err := pdb.GetDnDSkillByIndex(context.Background(), "acrobatics")
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestGetDnDFeatureByIndex_Error(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	mock.ExpectQuery(`WHERE api_index`).
		WithArgs("rage").
		WillReturnError(errors.New("db error"))

	_, err := pdb.GetDnDFeatureByIndex(context.Background(), "rage")
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}
