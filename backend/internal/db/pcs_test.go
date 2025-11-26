package db

import (
	"context"
	"testing"
	"time"

	sqlmock "github.com/DATA-DOG/go-sqlmock"
	"github.com/jmoiron/sqlx"
	"rpg-saas-backend/internal/models"
)

func newMockPCDB(t *testing.T) (*PostgresDB, sqlmock.Sqlmock, func()) {
	t.Helper()
	rawDB, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create sqlmock: %v", err)
	}
	return &PostgresDB{DB: sqlx.NewDb(rawDB, "postgres")}, mock, func() { rawDB.Close() }
}

func TestGetPCsByPlayer(t *testing.T) {
	pdb, mock, cleanup := newMockPCDB(t)
	defer cleanup()

	now := time.Now()
	cols := []string{
		"id", "name", "description", "level", "race", "class", "background", "alignment",
		"attributes", "abilities", "equipment", "hp", "current_hp", "ca", "proficiency_bonus",
		"inspiration", "skills", "attacks", "spells", "personality_traits", "ideals", "bonds",
		"flaws", "features", "player_name", "player_id", "is_homebrew", "is_unique", "created_at",
	}
	rows := sqlmock.NewRows(cols).AddRow(
		1, "TestPC", "desc", 5, "elf", "wizard", "sage", "neutral",
		[]byte(`{}`), []byte(`{}`), []byte(`{}`), 30, 25, 14, 3,
		false, []byte(`[]`), []byte(`[]`), []byte(`{}`), "brave", "ideal", "bond",
		"flaw", "{feat}", "Player", 7, false, false, now,
	)

	mock.ExpectQuery(`SELECT (.+) FROM pcs WHERE player_id`).WithArgs(7, 20, 0).WillReturnRows(rows)

	pcs, err := pdb.GetPCsByPlayer(context.Background(), 7, 20, 0)
	if err != nil {
		t.Fatalf("GetPCsByPlayer error: %v", err)
	}
	if len(pcs) != 1 || pcs[0].Name != "TestPC" {
		t.Fatalf("unexpected PCs: %+v", pcs)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestGetPCByIDAndPlayer(t *testing.T) {
	pdb, mock, cleanup := newMockPCDB(t)
	defer cleanup()

	now := time.Now()
	cols := []string{
		"id", "name", "description", "level", "race", "class", "background", "alignment",
		"attributes", "abilities", "equipment", "hp", "current_hp", "ca", "proficiency_bonus",
		"inspiration", "skills", "attacks", "spells", "personality_traits", "ideals", "bonds",
		"flaws", "features", "player_name", "player_id", "is_homebrew", "is_unique", "created_at",
	}
	rows := sqlmock.NewRows(cols).AddRow(
		5, "MyPC", "desc", 3, "human", "fighter", "soldier", "lawful",
		[]byte(`{}`), []byte(`{}`), []byte(`{}`), 35, 30, 16, 2,
		true, []byte(`[]`), []byte(`[]`), []byte(`{}`), "brave", "ideal", "bond",
		"flaw", "{feat}", "Player", 7, false, false, now,
	)

	mock.ExpectQuery(`SELECT (.+) FROM pcs WHERE id = \$1 AND player_id = \$2`).WithArgs(5, 7).WillReturnRows(rows)

	pc, err := pdb.GetPCByIDAndPlayer(context.Background(), 5, 7)
	if err != nil {
		t.Fatalf("GetPCByIDAndPlayer error: %v", err)
	}
	if pc.Name != "MyPC" || pc.ID != 5 {
		t.Fatalf("unexpected PC: %+v", pc)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestCreatePC(t *testing.T) {
	pdb, mock, cleanup := newMockPCDB(t)
	defer cleanup()

	mock.ExpectQuery(`INSERT INTO pcs`).
		WithArgs("NewPC", "desc", 1, "dwarf", "cleric", "acolyte", "good",
			sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), 28, 15, "Player", 7, false, false, sqlmock.AnyArg()).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(10))

	pc := &models.PC{
		Name:        "NewPC",
		Description: "desc",
		Level:       1,
		Race:        "dwarf",
		Class:       "cleric",
		Background:  "acolyte",
		Alignment:   "good",
		HP:          28,
		CA:          15,
		PlayerName:  "Player",
		PlayerID:    7,
	}

	err := pdb.CreatePC(context.Background(), pc)
	if err != nil {
		t.Fatalf("CreatePC error: %v", err)
	}
	if pc.ID != 10 {
		t.Fatalf("expected PC ID 10, got %d", pc.ID)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestUpdatePC(t *testing.T) {
	pdb, mock, cleanup := newMockPCDB(t)
	defer cleanup()

	mock.ExpectExec(`UPDATE pcs SET`).
		WithArgs("UpdatedPC", "new desc", 5, "elf", "wizard", "sage", "neutral",
			sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), 35, 30, 14, 3,
			false, sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(),
			"traits", "ideals", "bonds", "flaws", sqlmock.AnyArg(), "Player", false, false, 10, 7).
		WillReturnResult(sqlmock.NewResult(0, 1))

	pc := &models.PC{
		ID:                 10,
		Name:               "UpdatedPC",
		Description:        "new desc",
		Level:              5,
		Race:               "elf",
		Class:              "wizard",
		Background:         "sage",
		Alignment:          "neutral",
		HP:                 35,
		CurrentHP:          intPtr(30),
		CA:                 14,
		ProficiencyBonus:   3,
		Inspiration:        false,
		PersonalityTraits:  "traits",
		Ideals:             "ideals",
		Bonds:              "bonds",
		Flaws:              "flaws",
		PlayerName:         "Player",
		PlayerID:           7,
	}

	err := pdb.UpdatePC(context.Background(), pc)
	if err != nil {
		t.Fatalf("UpdatePC error: %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestDeletePC(t *testing.T) {
	pdb, mock, cleanup := newMockPCDB(t)
	defer cleanup()

	// Check no campaigns
	mock.ExpectQuery(`SELECT COUNT\(\*\)`).WithArgs(10).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(0))

	// Delete PC
	mock.ExpectExec(`DELETE FROM pcs WHERE id = \$1 AND player_id = \$2`).
		WithArgs(10, 7).
		WillReturnResult(sqlmock.NewResult(0, 1))

	err := pdb.DeletePC(context.Background(), 10, 7)
	if err != nil {
		t.Fatalf("DeletePC error: %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestDeletePC_InActiveCampaign(t *testing.T) {
	pdb, mock, cleanup := newMockPCDB(t)
	defer cleanup()

	// Check campaigns - PC is in active campaign
	mock.ExpectQuery(`SELECT COUNT\(\*\)`).WithArgs(10).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(1))

	err := pdb.DeletePC(context.Background(), 10, 7)
	if err == nil || err.Error() != "cannot delete PC that is in active campaigns" {
		t.Fatalf("expected campaign restriction error, got: %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestGetPCCampaigns(t *testing.T) {
	pdb, mock, cleanup := newMockPCDB(t)
	defer cleanup()

	now := time.Now()
	rows := sqlmock.NewRows([]string{
		"id", "name", "description", "status", "max_players", "current_session",
		"created_at", "updated_at", "dm_name", "character_status", "current_hp", "player_count",
	}).AddRow(1, "Campaign1", "desc", "active", 5, 1, now, now, "DM", "active", 25, 3)

	mock.ExpectQuery(`SELECT (.+) FROM campaigns c`).WithArgs(10, 7).WillReturnRows(rows)

	campaigns, err := pdb.GetPCCampaigns(context.Background(), 10, 7)
	if err != nil {
		t.Fatalf("GetPCCampaigns error: %v", err)
	}
	if len(campaigns) != 1 || campaigns[0].Name != "Campaign1" {
		t.Fatalf("unexpected campaigns: %+v", campaigns)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestCheckUniquePCInCampaign(t *testing.T) {
	pdb, mock, cleanup := newMockPCDB(t)
	defer cleanup()

	t.Run("PC in campaign", func(t *testing.T) {
		mock.ExpectQuery(`SELECT cc.campaign_id`).WithArgs(10).
			WillReturnRows(sqlmock.NewRows([]string{"campaign_id"}).AddRow(5))

		isInCampaign, campaignID, err := pdb.CheckUniquePCInCampaign(context.Background(), 10)
		if err != nil {
			t.Fatalf("CheckUniquePCInCampaign error: %v", err)
		}
		if !isInCampaign || campaignID != 5 {
			t.Fatalf("expected PC in campaign 5, got isInCampaign=%v, campaignID=%d", isInCampaign, campaignID)
		}

		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatalf("sql expectations not met: %v", err)
		}
	})

	t.Run("PC not in campaign", func(t *testing.T) {
		mock.ExpectQuery(`SELECT cc.campaign_id`).WithArgs(20).
			WillReturnError(sqlmock.ErrCancelled)

		isInCampaign, _, err := pdb.CheckUniquePCInCampaign(context.Background(), 20)
		if err == nil {
			t.Fatalf("expected error, got isInCampaign=%v", isInCampaign)
		}

		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatalf("sql expectations not met: %v", err)
		}
	})
}

func TestCountPCCampaigns(t *testing.T) {
	pdb, mock, cleanup := newMockPCDB(t)
	defer cleanup()

	mock.ExpectQuery(`SELECT COUNT\(\*\)`).WithArgs(10).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(2))

	count, err := pdb.CountPCCampaigns(context.Background(), 10)
	if err != nil {
		t.Fatalf("CountPCCampaigns error: %v", err)
	}
	if count != 2 {
		t.Fatalf("expected count 2, got %d", count)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func intPtr(i int) *int {
	return &i
}
