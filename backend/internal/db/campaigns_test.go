package db

import (
	"context"
	"testing"
	"time"

	sqlmock "github.com/DATA-DOG/go-sqlmock"
	"github.com/jmoiron/sqlx"
	"rpg-saas-backend/internal/models"
)

func newMockCampaignDB(t *testing.T) (*PostgresDB, sqlmock.Sqlmock, func()) {
	t.Helper()
	rawDB, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create sqlmock: %v", err)
	}
	return &PostgresDB{DB: sqlx.NewDb(rawDB, "postgres")}, mock, func() { rawDB.Close() }
}

func TestJoinCampaignByCode_Succeeds(t *testing.T) {
	pdb, mock, cleanup := newMockCampaignDB(t)
	defer cleanup()

	now := time.Now()
	campaignRow := sqlmock.NewRows([]string{
		"id", "name", "description", "dm_id", "max_players", "current_session", "status", "allow_homebrew", "invite_code", "created_at", "updated_at",
	}).AddRow(1, "Joinable", "desc", 99, 5, 1, "planning", false, "ABCD1234", now, now)
	mock.ExpectQuery(`FROM campaigns`).WithArgs("ABCD1234").WillReturnRows(campaignRow)

	mock.ExpectQuery(`SELECT EXISTS\(SELECT 1 FROM campaign_players`).WithArgs(1, 7).
		WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(false))

	mock.ExpectQuery(`SELECT COUNT\(cp.user_id\) as player_count`).WithArgs(1).
		WillReturnRows(sqlmock.NewRows([]string{"player_count"}).AddRow(1))

	mock.ExpectExec(`INSERT INTO campaign_players`).WithArgs(1, 7, sqlmock.AnyArg()).
		WillReturnResult(sqlmock.NewResult(1, 1))

	if err := pdb.JoinCampaignByCode(context.Background(), "ABCD1234", 7); err != nil {
		t.Fatalf("expected join to succeed, got error: %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestJoinCampaignByCode_DMCannotJoin(t *testing.T) {
	pdb, mock, cleanup := newMockCampaignDB(t)
	defer cleanup()

	now := time.Now()
	campaignRow := sqlmock.NewRows([]string{
		"id", "name", "description", "dm_id", "max_players", "current_session", "status", "allow_homebrew", "invite_code", "created_at", "updated_at",
	}).AddRow(2, "Owned", "desc", 7, 5, 1, "planning", false, "ZZZZ1111", now, now)
	mock.ExpectQuery(`FROM campaigns`).WithArgs("ZZZZ1111").WillReturnRows(campaignRow)

	mock.ExpectQuery(`SELECT EXISTS\(SELECT 1 FROM campaign_players`).WithArgs(2, 7).
		WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(false))

	mock.ExpectQuery(`SELECT COUNT\(cp.user_id\) as player_count`).WithArgs(2).
		WillReturnRows(sqlmock.NewRows([]string{"player_count"}).AddRow(0))

	err := pdb.JoinCampaignByCode(context.Background(), "ZZZZ1111", 7)
	if err == nil || err.Error() != "DM cannot join their own campaign as a player" {
		t.Fatalf("expected DM restriction error, got: %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestAddPlayerToCampaign_Succeeds(t *testing.T) {
	pdb, mock, cleanup := newMockCampaignDB(t)
	defer cleanup()

	mock.ExpectQuery(`SELECT EXISTS\(SELECT 1 FROM campaign_players`).WithArgs(3, 8).
		WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(false))

	mock.ExpectQuery(`SELECT\s+COUNT\(cp.user_id\) as player_count,\s*c.max_players`).WithArgs(3).
		WillReturnRows(sqlmock.NewRows([]string{"player_count", "max_players"}).AddRow(1, 5))

	mock.ExpectExec(`INSERT INTO campaign_players`).WithArgs(3, 8, sqlmock.AnyArg()).
		WillReturnResult(sqlmock.NewResult(1, 1))

	if err := pdb.AddPlayerToCampaign(context.Background(), 3, 8); err != nil {
		t.Fatalf("expected add player to succeed, got: %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestHasCampaignAccess(t *testing.T) {
	pdb, mock, cleanup := newMockCampaignDB(t)
	defer cleanup()

	mock.ExpectQuery(`SELECT EXISTS\(`).WithArgs(10, 7).
		WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(true))

	has, err := pdb.HasCampaignAccess(context.Background(), 10, 7)
	if err != nil {
		t.Fatalf("HasCampaignAccess returned error: %v", err)
	}
	if !has {
		t.Fatalf("expected access for DM")
	}

	mock.ExpectQuery(`SELECT EXISTS\(`).WithArgs(10, 8).
		WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(false))

	has, err = pdb.HasCampaignAccess(context.Background(), 10, 8)
	if err != nil {
		t.Fatalf("HasCampaignAccess returned error: %v", err)
	}
	if has {
		t.Fatalf("expected no access for unrelated user")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestGetCampaignCharacters(t *testing.T) {
	pdb, mock, cleanup := newMockCampaignDB(t)
	defer cleanup()

	now := time.Now()
	cols := []string{
		"id", "campaign_id", "player_id", "source_pc_id", "status", "joined_at", "last_sync", "campaign_notes",
		"name", "description", "level", "race", "class", "background", "alignment", "attributes", "abilities",
		"equipment", "hp", "current_hp", "ca", "proficiency_bonus", "inspiration", "skills", "attacks", "spells",
		"personality_traits", "ideals", "bonds", "flaws", "features", "player_name", "player_username",
	}
	rows := sqlmock.NewRows(cols).AddRow(
		1, 10, 7, 4, "active", now, now, "note",
		"Hero", "desc", 3, "elf", "wizard", "sage", "neutral",
		[]byte(`{"int":16}`), []byte(`{"spell":"fire"}`), []byte(`{"staff":1}`),
		20, 18, 12, 2, true, []byte(`[]`), []byte(`[]`), []byte(`[]`),
		"brave", "ideal", "bond", "flaw", "{feature}", "Player One", "player_username",
	)

	mock.ExpectQuery(`FROM campaign_characters`).WithArgs(10).WillReturnRows(rows)

	characters, err := pdb.GetCampaignCharacters(context.Background(), 10)
	if err != nil {
		t.Fatalf("GetCampaignCharacters error: %v", err)
	}
	if len(characters) != 1 || characters[0].Name != "Hero" {
		t.Fatalf("unexpected characters: %+v", characters)
	}
	if characters[0].Player == nil || characters[0].Player.Username != "player_username" {
		t.Fatalf("expected player username to be set: %+v", characters[0])
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestGetAvailablePCs(t *testing.T) {
	pdb, mock, cleanup := newMockCampaignDB(t)
	defer cleanup()

	now := time.Now()
	cols := []string{
		"id", "name", "description", "level", "race", "class",
		"background", "alignment", "attributes", "abilities",
		"equipment", "hp", "ca", "player_name", "player_id", "created_at",
	}
	rows := sqlmock.NewRows(cols).AddRow(
		2, "PC Name", "desc", 4, "human", "fighter", "soldier", "neutral",
		[]byte(`{}`), []byte(`{}`), []byte(`{}`), 30, 16, "Player", 7, now,
	)

	mock.ExpectQuery(`FROM pcs`).WithArgs(7, 10).WillReturnRows(rows)

	pcs, err := pdb.GetAvailablePCs(context.Background(), 7, 10)
	if err != nil {
		t.Fatalf("GetAvailablePCs error: %v", err)
	}
	if len(pcs) != 1 || pcs[0].Name != "PC Name" {
		t.Fatalf("unexpected PCs: %+v", pcs)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestGetCampaigns(t *testing.T) {
	pdb, mock, cleanup := newMockCampaignDB(t)
	defer cleanup()

	now := time.Now()
	rows := sqlmock.NewRows([]string{
		"id", "name", "description", "status", "allow_homebrew", "max_players", "current_session",
		"invite_code", "created_at", "updated_at", "dm_name", "player_count",
	}).AddRow(1, "Camp1", "desc", "active", false, 5, 1, "CODE123", now, now, "DM", 3)

	mock.ExpectQuery(`FROM campaigns`).WithArgs(7, 20, 0).WillReturnRows(rows)

	campaigns, err := pdb.GetCampaigns(context.Background(), 7, 20, 0)
	if err != nil {
		t.Fatalf("GetCampaigns error: %v", err)
	}
	if len(campaigns) != 1 || campaigns[0].Name != "Camp1" {
		t.Fatalf("unexpected campaigns: %+v", campaigns)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestGetCampaignByID(t *testing.T) {
	pdb, mock, cleanup := newMockCampaignDB(t)
	defer cleanup()

	now := time.Now()
	campaignRow := sqlmock.NewRows([]string{
		"id", "name", "description", "dm_id", "max_players", "current_session",
		"status", "allow_homebrew", "invite_code", "created_at", "updated_at",
	}).AddRow(5, "TestCamp", "desc", 7, 5, 1, "active", false, "CODE", now, now)

	playerRows := sqlmock.NewRows([]string{"id", "campaign_id", "user_id", "joined_at", "status", "username", "email"})
	charCols := []string{
		"id", "campaign_id", "player_id", "source_pc_id", "status", "joined_at", "last_sync", "campaign_notes",
		"name", "description", "level", "race", "class", "background", "alignment", "attributes", "abilities",
		"equipment", "hp", "current_hp", "ca", "proficiency_bonus", "inspiration", "skills", "attacks", "spells",
		"personality_traits", "ideals", "bonds", "flaws", "features", "player_name", "player_username",
	}
	charRows := sqlmock.NewRows(charCols)

	mock.ExpectQuery(`FROM campaigns`).WithArgs(5, 7).WillReturnRows(campaignRow)
	mock.ExpectQuery(`FROM campaign_players`).WithArgs(5).WillReturnRows(playerRows)
	mock.ExpectQuery(`FROM campaign_characters`).WithArgs(5).WillReturnRows(charRows)

	campaign, err := pdb.GetCampaignByID(context.Background(), 5, 7)
	if err != nil {
		t.Fatalf("GetCampaignByID error: %v", err)
	}
	if campaign.Name != "TestCamp" {
		t.Fatalf("unexpected campaign: %+v", campaign)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestCreateCampaign(t *testing.T) {
	pdb, mock, cleanup := newMockCampaignDB(t)
	defer cleanup()

	mock.ExpectQuery(`INSERT INTO campaigns`).
		WithArgs("NewCamp", "desc", 7, 6, "planning", false, sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg()).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(10))

	campaign := &models.Campaign{
		Name:        "NewCamp",
		Description: "desc",
		DMID:        7,
		MaxPlayers:  6,
	}

	err := pdb.CreateCampaign(context.Background(), campaign)
	if err != nil {
		t.Fatalf("CreateCampaign error: %v", err)
	}
	if campaign.ID != 10 {
		t.Fatalf("expected campaign ID 10, got %d", campaign.ID)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestUpdateCampaign(t *testing.T) {
	pdb, mock, cleanup := newMockCampaignDB(t)
	defer cleanup()

	mock.ExpectExec(`UPDATE campaigns SET`).
		WithArgs("Updated", "new desc", 8, 3, "active", false, sqlmock.AnyArg(), 15, 7).
		WillReturnResult(sqlmock.NewResult(0, 1))

	campaign := &models.Campaign{
		ID:             15,
		DMID:           7,
		Name:           "Updated",
		Description:    "new desc",
		MaxPlayers:     8,
		CurrentSession: 3,
		Status:         "active",
	}

	err := pdb.UpdateCampaign(context.Background(), campaign)
	if err != nil {
		t.Fatalf("UpdateCampaign error: %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestDeleteCampaign(t *testing.T) {
	pdb, mock, cleanup := newMockCampaignDB(t)
	defer cleanup()

	mock.ExpectExec(`DELETE FROM campaigns WHERE id = \$1 AND dm_id = \$2`).
		WithArgs(20, 7).
		WillReturnResult(sqlmock.NewResult(0, 1))

	err := pdb.DeleteCampaign(context.Background(), 20, 7)
	if err != nil {
		t.Fatalf("DeleteCampaign error: %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestRemovePlayerFromCampaign(t *testing.T) {
	pdb, mock, cleanup := newMockCampaignDB(t)
	defer cleanup()

	mock.ExpectExec(`DELETE FROM campaign_players WHERE campaign_id = \$1 AND user_id = \$2`).
		WithArgs(5, 8).
		WillReturnResult(sqlmock.NewResult(0, 1))

	err := pdb.RemovePlayerFromCampaign(context.Background(), 5, 8)
	if err != nil {
		t.Fatalf("RemovePlayerFromCampaign error: %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestIsPlayerInCampaign(t *testing.T) {
	pdb, mock, cleanup := newMockCampaignDB(t)
	defer cleanup()

	mock.ExpectQuery(`SELECT EXISTS`).WithArgs(10, 7).
		WillReturnRows(sqlmock.NewRows([]string{"exists"}).AddRow(true))

	exists, err := pdb.IsPlayerInCampaign(context.Background(), 10, 7)
	if err != nil {
		t.Fatalf("IsPlayerInCampaign error: %v", err)
	}
	if !exists {
		t.Fatalf("expected player to be in campaign")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestGetCampaignPlayers(t *testing.T) {
	pdb, mock, cleanup := newMockCampaignDB(t)
	defer cleanup()

	rows := sqlmock.NewRows([]string{"id", "campaign_id", "user_id", "joined_at", "status", "username", "email"}).
		AddRow(1, 10, 7, time.Now(), "active", "player1", "player1@test.com")

	mock.ExpectQuery(`FROM campaign_players`).WithArgs(10).WillReturnRows(rows)

	players, err := pdb.GetCampaignPlayers(context.Background(), 10)
	if err != nil {
		t.Fatalf("GetCampaignPlayers error: %v", err)
	}
	if len(players) != 1 || players[0].User == nil || players[0].User.Username != "player1" {
		t.Fatalf("unexpected players: %+v", players)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestAddPCToCampaign(t *testing.T) {
	pdb, mock, cleanup := newMockCampaignDB(t)
	defer cleanup()

	now := time.Now()
	// Mock campaign character creation
	// Order: campaign_id, player_id, source_pc_id, status, joined_at, campaign_notes,
	//        name, description, level, race, class, background, alignment,
	//        attributes, abilities, equipment, hp, current_hp, ca, proficiency_bonus,
	//        inspiration, skills, attacks, spells, personality_traits, ideals,
	//        bonds, flaws, features, player_name
	mock.ExpectQuery(`INSERT INTO campaign_characters`).
		WithArgs(10, 7, 5, "active", now, "",
			"TestPC", "desc", 3, "elf", "wizard", "sage", "neutral",
			sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(),
			sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(),
			sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(),
			sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), "Player").
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(100))

	char := &models.CampaignCharacter{
		CampaignID:   10,
		PlayerID:     7,
		SourcePCID:   5,
		Status:       "active",
		JoinedAt:     now,
		Name:         "TestPC",
		Description:  "desc",
		Level:        3,
		Race:         "elf",
		Class:        "wizard",
		Background:   "sage",
		Alignment:    "neutral",
		HP:           20,
		CA:           0,
		PlayerName:   "Player",
	}

	err := pdb.AddPCToCampaign(context.Background(), char)
	if err != nil {
		t.Fatalf("AddPCToCampaign error: %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestUpdateCampaignCharacter(t *testing.T) {
	pdb, mock, cleanup := newMockCampaignDB(t)
	defer cleanup()

	currentHP := 25
	mock.ExpectExec(`UPDATE campaign_characters SET`).
		WithArgs(&currentHP, "active", "notes", 100, 10).
		WillReturnResult(sqlmock.NewResult(0, 1))

	char := &models.CampaignCharacter{
		ID:            100,
		CampaignID:    10,
		Status:        "active",
		CurrentHP:     &currentHP,
		CampaignNotes: "notes",
	}

	err := pdb.UpdateCampaignCharacter(context.Background(), char)
	if err != nil {
		t.Fatalf("UpdateCampaignCharacter error: %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestDeleteCampaignCharacter(t *testing.T) {
	pdb, mock, cleanup := newMockCampaignDB(t)
	defer cleanup()

	mock.ExpectExec(`DELETE FROM campaign_characters WHERE id = \$1 AND campaign_id = \$2`).
		WithArgs(100, 10).
		WillReturnResult(sqlmock.NewResult(0, 1))

	err := pdb.DeleteCampaignCharacter(context.Background(), 100, 10)
	if err != nil {
		t.Fatalf("DeleteCampaignCharacter error: %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestIsPCInCampaign(t *testing.T) {
	pdb, mock, cleanup := newMockCampaignDB(t)
	defer cleanup()

	rows := sqlmock.NewRows([]string{"exists"}).AddRow(true)
	mock.ExpectQuery(`SELECT EXISTS\(SELECT 1 FROM campaign_characters WHERE campaign_id = \$1 AND source_pc_id = \$2`).
		WithArgs(10, 5).
		WillReturnRows(rows)

	exists, err := pdb.IsPCInCampaign(context.Background(), 10, 5)
	if err != nil {
		t.Fatalf("IsPCInCampaign error: %v", err)
	}
	if !exists {
		t.Fatalf("expected true, got false")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestGetCampaignCharacter(t *testing.T) {
	pdb, mock, cleanup := newMockCampaignDB(t)
	defer cleanup()

	now := time.Now()
	charCols := []string{
		"id", "campaign_id", "player_id", "source_pc_id", "status",
		"joined_at", "last_sync", "campaign_notes",
		"name", "description", "level", "race", "class", "background",
		"alignment", "attributes", "abilities", "equipment", "hp",
		"current_hp", "ca", "proficiency_bonus", "inspiration",
		"skills", "attacks", "spells", "personality_traits", "ideals",
		"bonds", "flaws", "features", "player_name",
	}

	charRow := sqlmock.NewRows(charCols).AddRow(
		100, 10, 7, 5, "active",
		now, nil, "notes",
		"TestChar", "desc", 5, "elf", "wizard", "sage",
		"neutral", []byte(`{}`), []byte(`{}`), []byte(`{}`), 30,
		25, 12, 3, false,
		[]byte(`{}`), []byte(`{}`), []byte(`{}`), "brave", "freedom",
		"friends", "none", []byte(`{}`), "Player1",
	)

	mock.ExpectQuery(`SELECT cc\.id, cc\.campaign_id, cc\.player_id, cc\.source_pc_id`).
		WithArgs(100, 10, 7).
		WillReturnRows(charRow)

	char, err := pdb.GetCampaignCharacter(context.Background(), 100, 10, 7)
	if err != nil {
		t.Fatalf("GetCampaignCharacter error: %v", err)
	}
	if char.Name != "TestChar" {
		t.Fatalf("unexpected character: %+v", char)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestUpdateCampaignCharacterFull(t *testing.T) {
	pdb, mock, cleanup := newMockCampaignDB(t)
	defer cleanup()

	currentHP := 25
	// Order from query: name, description, level, race, class, background, alignment,
	// attributes, abilities, equipment, hp, current_hp, ca, proficiency_bonus, inspiration,
	// skills, attacks, spells, personality_traits, ideals, bonds, flaws, features,
	// player_name, status, campaign_notes, id, campaign_id
	mock.ExpectExec(`UPDATE campaign_characters SET`).
		WithArgs(
			"UpdatedChar", "new desc", 6, "elf", "wizard", "sage", "good",
			sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(),
			35, &currentHP, 13, 4, true,
			sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(),
			"personality", "ideals", "bonds", "flaws",
			sqlmock.AnyArg(), "Player1",
			"active", "notes",
			100, 10,
		).
		WillReturnResult(sqlmock.NewResult(0, 1))

	char := &models.CampaignCharacter{
		ID:                100,
		CampaignID:        10,
		Status:            "active",
		CurrentHP:         &currentHP,
		CampaignNotes:     "notes",
		Name:              "UpdatedChar",
		Description:       "new desc",
		Level:             6,
		Race:              "elf",
		Class:             "wizard",
		Background:        "sage",
		Alignment:         "good",
		HP:                35,
		CA:                13,
		ProficiencyBonus:  4,
		Inspiration:       true,
		PersonalityTraits: "personality",
		Ideals:            "ideals",
		Bonds:             "bonds",
		Flaws:             "flaws",
		PlayerName:        "Player1",
	}

	err := pdb.UpdateCampaignCharacterFull(context.Background(), char)
	if err != nil {
		t.Fatalf("UpdateCampaignCharacterFull error: %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

