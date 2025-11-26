package db

import (
	"context"
	"testing"
	"time"

	sqlmock "github.com/DATA-DOG/go-sqlmock"
	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"

	"rpg-saas-backend/internal/models"
)

func newMockDB(t *testing.T) (*PostgresDB, sqlmock.Sqlmock, func()) {
	t.Helper()
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create sqlmock: %v", err)
	}
	sqlxDB := sqlx.NewDb(db, "postgres")
	return &PostgresDB{DB: sqlxDB}, mock, func() { db.Close() }
}

func TestGetNPCsAndByID(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()
	defer func() {
		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatalf("unmet expectations: %v", err)
		}
	}()

	now := time.Now()
	listRows := sqlmock.NewRows([]string{"id", "name", "description", "level", "race", "class", "background", "attributes", "abilities", "equipment", "hp", "ca", "created_at"}).
		AddRow(1, "NPC", "desc", 5, "elf", "wizard", "sage", []byte(`{"int":16}`), []byte(`{"abilities":["spell"]}`), []byte(`{"items":["staff"]}`), 20, 12, now)

	mock.ExpectQuery(`SELECT \* FROM npcs`).WithArgs(10, 0).WillReturnRows(listRows)

	npcs, err := pdb.GetNPCs(context.Background(), 10, 0)
	if err != nil {
		t.Fatalf("GetNPCs error: %v", err)
	}
	if len(npcs) != 1 || npcs[0].Name != "NPC" || npcs[0].Level != 5 {
		t.Fatalf("unexpected npcs result: %+v", npcs)
	}

	// By ID
	rowByID := sqlmock.NewRows([]string{"id", "name", "description", "level", "race", "class", "background", "attributes", "abilities", "equipment", "hp", "ca", "created_at"}).
		AddRow(1, "NPC", "desc", 5, "elf", "wizard", "sage", []byte(`{"int":16}`), []byte(`{"abilities":["spell"]}`), []byte(`{"items":["staff"]}`), 20, 12, now)

	mock.ExpectQuery(`SELECT \* FROM npcs WHERE id = \$1`).WithArgs(1).WillReturnRows(rowByID)
	npc, err := pdb.GetNPCByID(context.Background(), 1)
	if err != nil {
		t.Fatalf("GetNPCByID error: %v", err)
	}
	if npc.ID != 1 || npc.Name != "NPC" {
		t.Fatalf("unexpected npc: %+v", npc)
	}
}

func TestCreateUpdateDeleteNPC(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()
	defer func() {
		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatalf("unmet expectations: %v", err)
		}
	}()

	npc := models.NPC{
		Name:        "New",
		Description: "desc",
		Level:       2,
		Race:        "human",
		Class:       "fighter",
		Attributes:  models.JSONB{"str": 12},
		Abilities:   models.JSONB{"abilities": []string{"slash"}},
		Equipment:   models.JSONB{"items": []string{"sword"}},
		HP:          10,
		CA:          15,
	}

	mock.ExpectQuery(`INSERT INTO npcs`).
		WithArgs(
			npc.Name, npc.Description, npc.Level, npc.Race, npc.Class,
			sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), npc.HP, npc.CA, nil,
		).
		WillReturnRows(sqlmock.NewRows([]string{"id", "created_at"}).AddRow(5, time.Now()))

	if err := pdb.CreateNPC(context.Background(), &npc); err != nil {
		t.Fatalf("CreateNPC error: %v", err)
	}
	if npc.ID != 5 {
		t.Fatalf("expected npc ID to be set, got %d", npc.ID)
	}

	npc.ID = 5
	mock.ExpectExec(`UPDATE npcs SET`).WithArgs(
		npc.Name, npc.Description, npc.Level, npc.Race, npc.Class,
		sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), npc.HP, npc.CA, npc.ID,
	).WillReturnResult(sqlmock.NewResult(0, 1))

	if err := pdb.UpdateNPC(context.Background(), &npc); err != nil {
		t.Fatalf("UpdateNPC error: %v", err)
	}

	mock.ExpectExec(`DELETE FROM npcs WHERE id = \$1`).WithArgs(npc.ID).WillReturnResult(sqlmock.NewResult(0, 1))
	if err := pdb.DeleteNPC(context.Background(), npc.ID); err != nil {
		t.Fatalf("DeleteNPC error: %v", err)
	}
}

func TestEncounters(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()
	defer func() {
		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatalf("unmet expectations: %v", err)
		}
	}()

	now := time.Now()
	encounterRows := sqlmock.NewRows([]string{"id", "theme", "difficulty", "total_xp", "player_level", "player_count", "created_at"}).
		AddRow(1, "Forest", "easy", 100, 2, 3, now)

	monsterRows := sqlmock.NewRows([]string{"id", "encounter_id", "name", "xp", "cr", "created_at"}).
		AddRow(1, 1, "Goblin", 50, 0.25, now)

	mock.ExpectQuery(`SELECT \* FROM encounters`).WithArgs(5, 0).WillReturnRows(encounterRows)
	mock.ExpectQuery(`SELECT \* FROM encounter_monsters WHERE encounter_id = \$1`).WithArgs(1).WillReturnRows(monsterRows)

	encounters, err := pdb.GetEncounters(context.Background(), 5, 0)
	if err != nil {
		t.Fatalf("GetEncounters error: %v", err)
	}
	if len(encounters) != 1 || len(encounters[0].Monsters) != 1 {
		t.Fatalf("unexpected encounters: %+v", encounters)
	}

	encounterRowsSingle := sqlmock.NewRows([]string{"id", "theme", "difficulty", "total_xp", "player_level", "player_count", "created_at"}).
		AddRow(1, "Forest", "easy", 100, 2, 3, now)
	monsterRowsSingle := sqlmock.NewRows([]string{"id", "encounter_id", "name", "xp", "cr", "created_at"}).
		AddRow(1, 1, "Goblin", 50, 0.25, now)

	mock.ExpectQuery(`SELECT \* FROM encounters WHERE id = \$1`).WithArgs(1).WillReturnRows(encounterRowsSingle)
	mock.ExpectQuery(`SELECT \* FROM encounter_monsters WHERE encounter_id = \$1`).WithArgs(1).WillReturnRows(monsterRowsSingle)

	encounter, err := pdb.GetEncounterByID(context.Background(), 1)
	if err != nil {
		t.Fatalf("GetEncounterByID error: %v", err)
	}
	if encounter.ID != 1 || encounter.Monsters[0].Name != "Goblin" {
		t.Fatalf("unexpected encounter: %+v", encounter)
	}
}

func TestCreateEncounter(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()
	defer func() {
		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatalf("unmet expectations: %v", err)
		}
	}()

	encounter := &models.Encounter{
		Theme:       "Dungeon",
		Difficulty:  "medium",
		TotalXP:     300,
		PlayerLevel: 4,
		PlayerCount: 4,
		Monsters: []models.Monster{
			{Name: "Orc", XP: 100, CR: 0.5},
		},
	}

	mock.ExpectBegin()
	mock.ExpectQuery(`INSERT INTO encounters`).
		WithArgs(encounter.Theme, encounter.Difficulty, encounter.TotalXP, encounter.PlayerLevel, encounter.PlayerCount, nil).
		WillReturnRows(sqlmock.NewRows([]string{"id", "created_at"}).AddRow(10, time.Now()))
	mock.ExpectQuery(`INSERT INTO encounter_monsters`).
		WithArgs(10, "Orc", 100, 0.5).
		WillReturnRows(sqlmock.NewRows([]string{"id", "created_at"}).AddRow(1, time.Now()))
	mock.ExpectCommit()

	if err := pdb.CreateEncounter(context.Background(), encounter); err != nil {
		t.Fatalf("CreateEncounter error: %v", err)
	}
	if encounter.ID != 10 || encounter.Monsters[0].EncounterID != 10 {
		t.Fatalf("expected encounter/monster ids to be set, got %+v", encounter)
	}
}

func TestGetPCByID(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()
	defer func() {
		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatalf("unmet expectations: %v", err)
		}
	}()

	now := time.Now()
	rows := sqlmock.NewRows([]string{
		"id", "name", "description", "level", "race", "class", "background", "alignment",
		"attributes", "abilities", "equipment", "hp", "ca", "player_name", "player_id", "created_at",
	}).
		AddRow(1, "Hero", "desc", 3, "elf", "ranger", "outlander", "neutral",
			[]byte(`{"dex":14}`), []byte(`{"skills":["stealth"]}`), []byte(`{"items":["bow"]}`),
			18, 14, "Player", 7, now)

	mock.ExpectQuery(`SELECT id, name, description, level, race, class, background, alignment`).
		WithArgs(1).
		WillReturnRows(rows)

	pc, err := pdb.GetPCByID(context.Background(), 1)
	if err != nil {
		t.Fatalf("GetPCByID error: %v", err)
	}
	if pc.ID != 1 || pc.Name != "Hero" || pc.PlayerID != 7 {
		t.Fatalf("unexpected pc: %+v", pc)
	}
}

func TestUsersCRUD(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()
	defer func() {
		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatalf("unmet expectations: %v", err)
		}
	}()

	now := time.Now()
	userRow := func() *sqlmock.Rows {
		return sqlmock.NewRows([]string{"id", "username", "email", "password", "created_at", "updated_at", "admin", "plan"}).
			AddRow(1, "tester", "tester@example.com", "hash", now, now, false, 0)
	}

	mock.ExpectQuery(`SELECT \* FROM users WHERE id = \$1`).WithArgs(1).WillReturnRows(userRow())
	user, err := pdb.GetUserByID(context.Background(), 1)
	if err != nil || user.Email != "tester@example.com" {
		t.Fatalf("GetUserByID failed: user=%+v err=%v", user, err)
	}

	mock.ExpectQuery(`SELECT \* FROM users WHERE username = \$1`).WithArgs("tester").WillReturnRows(userRow())
	if _, err := pdb.GetUserByUsername(context.Background(), "tester"); err != nil {
		t.Fatalf("GetUserByUsername failed: %v", err)
	}

	mock.ExpectQuery(`SELECT \* FROM users WHERE email = \$1`).WithArgs("tester@example.com").WillReturnRows(userRow())
	if _, err := pdb.GetUserByEmail(context.Background(), "tester@example.com"); err != nil {
		t.Fatalf("GetUserByEmail failed: %v", err)
	}

	mock.ExpectQuery(`SELECT \* FROM users WHERE email = \$1 AND password = \$2`).WithArgs("tester@example.com", "hash").WillReturnRows(userRow())
	if _, err := pdb.GetUserByEmailAndPwd(context.Background(), "tester@example.com", "hash"); err != nil {
		t.Fatalf("GetUserByEmailAndPwd failed: %v", err)
	}

	mock.ExpectExec(`INSERT INTO users`).WithArgs("tester", "tester@example.com", "hash", sqlmock.AnyArg(), sqlmock.AnyArg(), false).WillReturnResult(sqlmock.NewResult(1, 1))
	if err := pdb.CreateUser(context.Background(), &models.User{Username: "tester", Email: "tester@example.com", Password: "hash"}); err != nil {
		t.Fatalf("CreateUser failed: %v", err)
	}

	mock.ExpectExec(`UPDATE users SET`).WithArgs("tester", "tester@example.com", "hash", sqlmock.AnyArg(), false, 1).WillReturnResult(sqlmock.NewResult(0, 1))
	if err := pdb.UpdateUser(context.Background(), &models.User{ID: 1, Username: "tester", Email: "tester@example.com", Password: "hash"}); err != nil {
		t.Fatalf("UpdateUser failed: %v", err)
	}

	mock.ExpectExec(`DELETE FROM users WHERE id = \$1`).WithArgs(1).WillReturnResult(sqlmock.NewResult(0, 1))
	if err := pdb.DeleteUser(context.Background(), 1); err != nil {
		t.Fatalf("DeleteUser failed: %v", err)
	}

	mock.ExpectQuery(`SELECT \* FROM users`).WillReturnRows(userRow())
	users, err := pdb.GetAllUsers(context.Background())
	if err != nil || len(users) != 1 {
		t.Fatalf("GetAllUsers failed: users=%v err=%v", users, err)
	}
}

func TestDnDRacesAndSpells(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()
	defer func() {
		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatalf("unmet expectations: %v", err)
		}
	}()

	now := time.Now()
	raceRows := sqlmock.NewRows([]string{"id", "api_index", "name", "speed", "size", "size_description", "ability_bonuses", "traits", "languages", "proficiencies", "subraces", "created_at", "updated_at", "api_version"}).
		AddRow(1, "elf", "Elf", 30, "M", "desc", []byte(`[]`), []byte(`[]`), []byte(`[]`), []byte(`[]`), pq.StringArray{}, now, now, "2014")
	mock.ExpectQuery(`FROM dnd_races`).WithArgs(5, 0).WillReturnRows(raceRows)
	races, err := pdb.GetDnDRaces(context.Background(), 5, 0)
	if err != nil || len(races) != 1 || races[0].Name != "Elf" {
		t.Fatalf("GetDnDRaces failed: races=%v err=%v", races, err)
	}

	// Spell query with filters
	level := 1
	spellRows := sqlmock.NewRows([]string{"id", "api_index", "name", "level", "school", "casting_time", "range", "components", "duration", "concentration", "ritual", "description", "higher_level", "material", "classes", "created_at", "updated_at", "api_version"}).
		AddRow(1, "magic-missile", "Magic Missile", 1, "evocation", "1 action", "120 feet", "V,S", "Instant", false, false, "desc", "", "", pq.StringArray{"wizard"}, now, now, "2014")
	mock.ExpectQuery(`FROM dnd_spells`).WithArgs(level, "%evocation%", "wizard", 5, 0).WillReturnRows(spellRows)
	spells, err := pdb.GetDnDSpells(context.Background(), 5, 0, &level, "evocation", "wizard")
	if err != nil || len(spells) != 1 || spells[0].Name != "Magic Missile" {
		t.Fatalf("GetDnDSpells failed: spells=%v err=%v", spells, err)
	}
}

func TestDnDMonstersAndMagicItems(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()
	defer func() {
		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatalf("unmet expectations: %v", err)
		}
	}()

	now := time.Now()
	cr := 0.25
	monsterRows := sqlmock.NewRows([]string{
		"id", "api_index", "name", "size", "type", "subtype", "alignment", "armor_class", "hit_points", "hit_dice",
		"speed", "strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma",
		"challenge_rating", "xp", "proficiency_bonus", "damage_vulnerabilities", "damage_resistances",
		"damage_immunities", "condition_immunities", "senses", "languages", "special_abilities",
		"actions", "legendary_actions", "created_at", "updated_at", "api_version",
	}).
		AddRow(1, "wolf", "Wolf", "M", "beast", "", "unaligned", 13, 11, "2d8+2",
			[]byte(`{"walk":"40 ft"}`), 12, 15, 12, 3, 12, 6,
			cr, 50, 2, pq.StringArray{}, pq.StringArray{}, pq.StringArray{}, pq.StringArray{},
			[]byte(`{}`), "Common", []byte(`[]`), []byte(`[]`), []byte(`[]`), now, now, "2014")

	mock.ExpectQuery(`FROM dnd_monsters`).WithArgs(cr, "%beast%", 5, 0).WillReturnRows(monsterRows)
	monsters, err := pdb.GetDnDMonsters(context.Background(), 5, 0, &cr, "beast")
	if err != nil || len(monsters) != 1 || monsters[0].Name != "Wolf" {
		t.Fatalf("GetDnDMonsters failed: monsters=%v err=%v", monsters, err)
	}

	itemRows := sqlmock.NewRows([]string{"id", "api_index", "name", "description", "category", "rarity", "variants", "created_at", "updated_at", "api_version"}).
		AddRow(1, "wand-of-light", "Wand of Light", "desc", "wands", "rare", []byte(`[]`), now, now, "2014")
	mock.ExpectQuery(`FROM dnd_magic_items`).WithArgs("%rare%", 5, 0).WillReturnRows(itemRows)

	items, err := pdb.GetDnDMagicItems(context.Background(), 5, 0, "rare")
	if err != nil || len(items) != 1 || items[0].Name != "Wand of Light" {
		t.Fatalf("GetDnDMagicItems failed: items=%v err=%v", items, err)
	}
}

func TestDnDGetByIndex(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()
	defer func() {
		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatalf("unmet expectations: %v", err)
		}
	}()

	now := time.Now()

	// Test GetDnDRaceByIndex
	raceRow := sqlmock.NewRows([]string{"id", "api_index", "name", "speed", "size", "size_description", "ability_bonuses", "traits", "languages", "proficiencies", "subraces", "created_at", "updated_at", "api_version"}).
		AddRow(1, "dwarf", "Dwarf", 25, "M", "desc", []byte(`[]`), []byte(`[]`), []byte(`[]`), []byte(`[]`), pq.StringArray{}, now, now, "2014")
	mock.ExpectQuery(`FROM dnd_races WHERE api_index = \$1`).WithArgs("dwarf").WillReturnRows(raceRow)

	race, err := pdb.GetDnDRaceByIndex(context.Background(), "dwarf")
	if err != nil || race.Name != "Dwarf" {
		t.Fatalf("GetDnDRaceByIndex failed: race=%+v err=%v", race, err)
	}

	// Test GetDnDClassByIndex
	classRow := sqlmock.NewRows([]string{"id", "api_index", "name", "hit_die", "proficiencies", "saving_throws", "spellcasting", "spellcasting_ability", "class_levels", "created_at", "updated_at", "api_version"}).
		AddRow(1, "fighter", "Fighter", 10, []byte(`[]`), pq.StringArray{"str", "con"}, []byte(`{}`), "", []byte(`{}`), now, now, "2014")
	mock.ExpectQuery(`FROM dnd_classes WHERE api_index = \$1`).WithArgs("fighter").WillReturnRows(classRow)

	class, err := pdb.GetDnDClassByIndex(context.Background(), "fighter")
	if err != nil || class.Name != "Fighter" {
		t.Fatalf("GetDnDClassByIndex failed: class=%+v err=%v", class, err)
	}

	// Test GetDnDSpellByIndex
	spellRow := sqlmock.NewRows([]string{"id", "api_index", "name", "level", "school", "casting_time", "range", "components", "duration", "concentration", "ritual", "description", "higher_level", "material", "classes", "created_at", "updated_at", "api_version"}).
		AddRow(1, "fireball", "Fireball", 3, "evocation", "1 action", "150 feet", "V,S,M", "Instant", false, false, "desc", "", "bat guano", pq.StringArray{"wizard"}, now, now, "2014")
	mock.ExpectQuery(`FROM dnd_spells WHERE api_index = \$1`).WithArgs("fireball").WillReturnRows(spellRow)

	spell, err := pdb.GetDnDSpellByIndex(context.Background(), "fireball")
	if err != nil || spell.Name != "Fireball" {
		t.Fatalf("GetDnDSpellByIndex failed: spell=%+v err=%v", spell, err)
	}

	// Test GetDnDEquipmentByIndex
	equipRow := sqlmock.NewRows([]string{"id", "api_index", "name", "equipment_category", "cost_quantity", "cost_unit", "weight", "weapon_category", "weapon_range", "damage", "properties", "armor_category", "armor_class", "description", "special", "created_at", "updated_at", "api_version"}).
		AddRow(1, "longsword", "Longsword", "Weapon", 15, "gp", 3.0, "Martial Melee", "5 ft", []byte(`{}`), pq.StringArray{}, "", []byte(`{}`), "A longsword", pq.StringArray{}, now, now, "2014")
	mock.ExpectQuery(`FROM dnd_equipment WHERE api_index = \$1`).WithArgs("longsword").WillReturnRows(equipRow)

	equip, err := pdb.GetDnDEquipmentByIndex(context.Background(), "longsword")
	if err != nil || equip.Name != "Longsword" {
		t.Fatalf("GetDnDEquipmentByIndex failed: equip=%+v err=%v", equip, err)
	}

	// Test GetDnDMonsterByIndex
	cr := 0.5
	monsterRow := sqlmock.NewRows([]string{
		"id", "api_index", "name", "size", "type", "subtype", "alignment", "armor_class", "hit_points", "hit_dice",
		"speed", "strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma",
		"challenge_rating", "xp", "proficiency_bonus", "damage_vulnerabilities", "damage_resistances",
		"damage_immunities", "condition_immunities", "senses", "languages", "special_abilities",
		"actions", "legendary_actions", "created_at", "updated_at", "api_version",
	}).AddRow(1, "orc", "Orc", "M", "humanoid", "orc", "chaotic", 13, 15, "2d8+6",
		[]byte(`{"walk":"30 ft"}`), 16, 12, 16, 7, 11, 10,
		cr, 100, 2, pq.StringArray{}, pq.StringArray{}, pq.StringArray{}, pq.StringArray{},
		[]byte(`{}`), "Common", []byte(`[]`), []byte(`[]`), []byte(`[]`), now, now, "2014")

	mock.ExpectQuery(`FROM dnd_monsters WHERE api_index = \$1`).WithArgs("orc").WillReturnRows(monsterRow)

	monster, err := pdb.GetDnDMonsterByIndex(context.Background(), "orc")
	if err != nil || monster.Name != "Orc" {
		t.Fatalf("GetDnDMonsterByIndex failed: monster=%+v err=%v", monster, err)
	}

	// Test GetDnDBackgroundByIndex
	backgroundRow := sqlmock.NewRows([]string{"id", "api_index", "name", "starting_proficiencies", "language_options", "starting_equipment", "starting_equipment_options", "feature", "personality_traits", "ideals", "bonds", "flaws", "created_at", "updated_at", "api_version"}).
		AddRow(1, "acolyte", "Acolyte", []byte(`[]`), []byte(`{}`), []byte(`[]`), []byte(`[]`), []byte(`{"name":"Shelter"}`), []byte(`[]`), []byte(`[]`), []byte(`[]`), []byte(`[]`), now, now, "2014")
	mock.ExpectQuery(`FROM dnd_backgrounds WHERE api_index = \$1`).WithArgs("acolyte").WillReturnRows(backgroundRow)

	background, err := pdb.GetDnDBackgroundByIndex(context.Background(), "acolyte")
	if err != nil || background.Name != "Acolyte" {
		t.Fatalf("GetDnDBackgroundByIndex failed: background=%+v err=%v", background, err)
	}
}

func TestDnDSearch(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()
	defer func() {
		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatalf("unmet expectations: %v", err)
		}
	}()

	now := time.Now()

	// Test SearchDnDRaces
	raceRows := sqlmock.NewRows([]string{"id", "api_index", "name", "speed", "size", "size_description", "ability_bonuses", "traits", "languages", "proficiencies", "subraces", "created_at", "updated_at", "api_version"}).
		AddRow(1, "elf", "Elf", 30, "M", "desc", []byte(`[]`), []byte(`[]`), []byte(`[]`), []byte(`[]`), pq.StringArray{}, now, now, "2014")
	mock.ExpectQuery(`FROM dnd_races WHERE name ILIKE \$1`).WithArgs("%elf%", 10, 0).WillReturnRows(raceRows)

	races, err := pdb.SearchDnDRaces(context.Background(), "elf", 10, 0)
	if err != nil || len(races) != 1 {
		t.Fatalf("SearchDnDRaces failed: races=%v err=%v", races, err)
	}

	// Test SearchDnDClasses
	classRows := sqlmock.NewRows([]string{"id", "api_index", "name", "hit_die", "proficiencies", "saving_throws", "spellcasting", "spellcasting_ability", "class_levels", "created_at", "updated_at", "api_version"}).
		AddRow(1, "wizard", "Wizard", 6, []byte(`[]`), pq.StringArray{"int", "wis"}, []byte(`{"level":1}`), "INT", []byte(`{}`), now, now, "2014")
	mock.ExpectQuery(`FROM dnd_classes WHERE name ILIKE \$1`).WithArgs("%wiz%", 10, 0).WillReturnRows(classRows)

	classes, err := pdb.SearchDnDClasses(context.Background(), "wiz", 10, 0)
	if err != nil || len(classes) != 1 {
		t.Fatalf("SearchDnDClasses failed: classes=%v err=%v", classes, err)
	}

	// Test SearchDnDSpells
	spellRows := sqlmock.NewRows([]string{"id", "api_index", "name", "level", "school", "casting_time", "range", "components", "duration", "concentration", "ritual", "description", "higher_level", "material", "classes", "created_at", "updated_at", "api_version"}).
		AddRow(1, "shield", "Shield", 1, "abjuration", "reaction", "Self", "V,S", "1 round", false, false, "desc", "", "", pq.StringArray{"wizard"}, now, now, "2014")
	mock.ExpectQuery(`FROM dnd_spells WHERE name ILIKE \$1`).WithArgs("%shield%", 10, 0).WillReturnRows(spellRows)

	spells, err := pdb.SearchDnDSpells(context.Background(), "shield", 10, 0)
	if err != nil || len(spells) != 1 {
		t.Fatalf("SearchDnDSpells failed: spells=%v err=%v", spells, err)
	}

	// Test SearchDnDEquipment
	equipRows := sqlmock.NewRows([]string{"id", "api_index", "name", "equipment_category", "cost_quantity", "cost_unit", "weight", "weapon_category", "weapon_range", "damage", "properties", "armor_category", "armor_class", "description", "special", "created_at", "updated_at", "api_version"}).
		AddRow(1, "rope", "Rope", "Adventuring Gear", 1, "gp", 10.0, "", "", []byte(`{}`), pq.StringArray{}, "", []byte(`{}`), "50 feet of rope", pq.StringArray{}, now, now, "2014")
	mock.ExpectQuery(`FROM dnd_equipment WHERE name ILIKE \$1`).WithArgs("%rope%", 10, 0).WillReturnRows(equipRows)

	equip, err := pdb.SearchDnDEquipment(context.Background(), "rope", 10, 0)
	if err != nil || len(equip) != 1 {
		t.Fatalf("SearchDnDEquipment failed: equip=%v err=%v", equip, err)
	}

	// Test SearchDnDMonsters
	cr := 1.0
	monsterRows := sqlmock.NewRows([]string{
		"id", "api_index", "name", "size", "type", "subtype", "alignment", "armor_class", "hit_points", "hit_dice",
		"speed", "strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma",
		"challenge_rating", "xp", "proficiency_bonus", "damage_vulnerabilities", "damage_resistances",
		"damage_immunities", "condition_immunities", "senses", "languages", "special_abilities",
		"actions", "legendary_actions", "created_at", "updated_at", "api_version",
	}).AddRow(1, "goblin", "Goblin", "S", "humanoid", "goblinoid", "neutral evil", 15, 7, "2d6",
		[]byte(`{"walk":"30 ft"}`), 8, 14, 10, 10, 8, 8,
		cr, 200, 2, pq.StringArray{}, pq.StringArray{}, pq.StringArray{}, pq.StringArray{},
		[]byte(`{}`), "Common", []byte(`[]`), []byte(`[]`), []byte(`[]`), now, now, "2014")

	mock.ExpectQuery(`FROM dnd_monsters WHERE name ILIKE \$1`).WithArgs("%goblin%", 10, 0).WillReturnRows(monsterRows)

	monsters, err := pdb.SearchDnDMonsters(context.Background(), "goblin", 10, 0)
	if err != nil || len(monsters) != 1 {
		t.Fatalf("SearchDnDMonsters failed: monsters=%v err=%v", monsters, err)
	}

	// Test SearchDnDBackgrounds
	backgroundRows := sqlmock.NewRows([]string{"id", "api_index", "name", "starting_proficiencies", "language_options", "starting_equipment", "starting_equipment_options", "feature", "personality_traits", "ideals", "bonds", "flaws", "created_at", "updated_at", "api_version"}).
		AddRow(1, "soldier", "Soldier", []byte(`[]`), []byte(`{}`), []byte(`[]`), []byte(`[]`), []byte(`{"name":"Military Rank"}`), []byte(`[]`), []byte(`[]`), []byte(`[]`), []byte(`[]`), now, now, "2014")
	mock.ExpectQuery(`FROM dnd_backgrounds WHERE name ILIKE \$1`).WithArgs("%soldier%", 10, 0).WillReturnRows(backgroundRows)

	backgrounds, err := pdb.SearchDnDBackgrounds(context.Background(), "soldier", 10, 0)
	if err != nil || len(backgrounds) != 1 {
		t.Fatalf("SearchDnDBackgrounds failed: backgrounds=%v err=%v", backgrounds, err)
	}
}

func TestDnDGetLists(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()
	defer func() {
		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatalf("unmet expectations: %v", err)
		}
	}()

	now := time.Now()

	// Test GetDnDClasses
	classRows := sqlmock.NewRows([]string{"id", "api_index", "name", "hit_die", "proficiencies", "saving_throws", "spellcasting", "spellcasting_ability", "class_levels", "created_at", "updated_at", "api_version"}).
		AddRow(1, "paladin", "Paladin", 10, []byte(`[]`), pq.StringArray{"wis", "cha"}, []byte(`{"level":1}`), "CHA", []byte(`{}`), now, now, "2014")
	mock.ExpectQuery(`FROM dnd_classes`).WithArgs(5, 0).WillReturnRows(classRows)

	classes, err := pdb.GetDnDClasses(context.Background(), 5, 0)
	if err != nil || len(classes) != 1 {
		t.Fatalf("GetDnDClasses failed: classes=%v err=%v", classes, err)
	}

	// Test GetDnDEquipment
	equipRows := sqlmock.NewRows([]string{"id", "api_index", "name", "equipment_category", "cost_quantity", "cost_unit", "weight", "weapon_category", "weapon_range", "damage", "properties", "armor_category", "armor_class", "description", "special", "created_at", "updated_at", "api_version"}).
		AddRow(1, "chainmail", "Chain Mail", "Armor", 75, "gp", 55.0, "", "", []byte(`{}`), pq.StringArray{}, "Heavy", []byte(`{"base":16}`), "Heavy armor", pq.StringArray{}, now, now, "2014")
	mock.ExpectQuery(`FROM dnd_equipment`).WithArgs("%armor%", 5, 0).WillReturnRows(equipRows)

	equip, err := pdb.GetDnDEquipment(context.Background(), 5, 0, "armor")
	if err != nil || len(equip) != 1 {
		t.Fatalf("GetDnDEquipment failed: equip=%v err=%v", equip, err)
	}

	// Test GetDnDBackgrounds
	backgroundRows := sqlmock.NewRows([]string{"id", "api_index", "name", "starting_proficiencies", "language_options", "starting_equipment", "starting_equipment_options", "feature", "personality_traits", "ideals", "bonds", "flaws", "created_at", "updated_at", "api_version"}).
		AddRow(1, "noble", "Noble", []byte(`[]`), []byte(`{}`), []byte(`[]`), []byte(`[]`), []byte(`{"name":"Position of Privilege"}`), []byte(`[]`), []byte(`[]`), []byte(`[]`), []byte(`[]`), now, now, "2014")
	mock.ExpectQuery(`FROM dnd_backgrounds`).WithArgs(5, 0).WillReturnRows(backgroundRows)

	backgrounds, err := pdb.GetDnDBackgrounds(context.Background(), 5, 0)
	if err != nil || len(backgrounds) != 1 {
		t.Fatalf("GetDnDBackgrounds failed: backgrounds=%v err=%v", backgrounds, err)
	}
}

func TestDnDAuxiliaryFunctions(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()
	defer func() {
		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatalf("unmet expectations: %v", err)
		}
	}()

	now := time.Now()

	// Test GetDnDSkills
	skillRows := sqlmock.NewRows([]string{"id", "api_index", "name", "description", "ability_score", "created_at", "updated_at", "api_version"}).
		AddRow(1, "acrobatics", "Acrobatics", "Balance and coordination", "dex", now, now, "2014").
		AddRow(2, "stealth", "Stealth", "Move quietly", "dex", now, now, "2014")
	mock.ExpectQuery(`SELECT id, api_index, name, description, ability_score, created_at, updated_at, api_version FROM dnd_skills ORDER BY name LIMIT`).
		WithArgs(10, 0).
		WillReturnRows(skillRows)

	skills, err := pdb.GetDnDSkills(context.Background(), 10, 0)
	if err != nil || len(skills) != 2 {
		t.Fatalf("GetDnDSkills failed: skills=%v err=%v", skills, err)
	}

	// Test GetDnDSkillByIndex
	skillRow := sqlmock.NewRows([]string{"id", "api_index", "name", "description", "ability_score", "created_at", "updated_at", "api_version"}).
		AddRow(1, "perception", "Perception", "Notice things", "wis", now, now, "2014")
	mock.ExpectQuery(`SELECT id, api_index, name, description, ability_score, created_at, updated_at, api_version FROM dnd_skills WHERE api_index`).
		WithArgs("perception").
		WillReturnRows(skillRow)

	skill, err := pdb.GetDnDSkillByIndex(context.Background(), "perception")
	if err != nil || skill.Name != "Perception" {
		t.Fatalf("GetDnDSkillByIndex failed: skill=%+v err=%v", skill, err)
	}

	// Test GetDnDFeatures
	featureRows := sqlmock.NewRows([]string{"id", "api_index", "name", "level", "class_name", "subclass_name", "description", "prerequisites", "created_at", "updated_at", "api_version"}).
		AddRow(1, "action-surge", "Action Surge", 2, "fighter", "", "Take an extra action", []byte(`{}`), now, now, "2014")
	mock.ExpectQuery(`SELECT id, api_index, name, level, class_name, subclass_name, description, prerequisites`).
		WithArgs("%fighter%", 10, 0).
		WillReturnRows(featureRows)

	features, err := pdb.GetDnDFeatures(context.Background(), 10, 0, "fighter", nil)
	if err != nil || len(features) != 1 {
		t.Fatalf("GetDnDFeatures failed: features=%v err=%v", features, err)
	}

	// Test GetDnDFeatureByIndex
	featureRow := sqlmock.NewRows([]string{"id", "api_index", "name", "level", "class_name", "subclass_name", "description", "prerequisites", "created_at", "updated_at", "api_version"}).
		AddRow(1, "rage", "Rage", 1, "barbarian", "", "Enter a rage", []byte(`{}`), now, now, "2014")
	mock.ExpectQuery(`SELECT id, api_index, name, level, class_name, subclass_name, description, prerequisites`).
		WithArgs("rage").
		WillReturnRows(featureRow)

	feature, err := pdb.GetDnDFeatureByIndex(context.Background(), "rage")
	if err != nil || feature.Name != "Rage" {
		t.Fatalf("GetDnDFeatureByIndex failed: feature=%+v err=%v", feature, err)
	}

	// Test GetDnDLanguages
	languageRows := sqlmock.NewRows([]string{"id", "api_index", "name", "type", "description", "script", "typical_speakers", "created_at", "updated_at", "api_version"}).
		AddRow(1, "common", "Common", "standard", "Common tongue", "Common", `{"Humans"}`, now, now, "2014").
		AddRow(2, "elvish", "Elvish", "standard", "Elven language", "Elvish", `{"Elves"}`, now, now, "2014")
	mock.ExpectQuery(`SELECT id, api_index, name, type, description, script, typical_speakers`).
		WithArgs(10, 0).
		WillReturnRows(languageRows)

	languages, err := pdb.GetDnDLanguages(context.Background(), 10, 0)
	if err != nil || len(languages) != 2 {
		t.Fatalf("GetDnDLanguages failed: languages=%v err=%v", languages, err)
	}

	// Test GetDnDConditions
	conditionRows := sqlmock.NewRows([]string{"id", "api_index", "name", "description", "created_at", "updated_at", "api_version"}).
		AddRow(1, "blinded", "Blinded", "Cannot see", now, now, "2014").
		AddRow(2, "poisoned", "Poisoned", "Disadvantage on attacks", now, now, "2014")
	mock.ExpectQuery(`SELECT id, api_index, name, description`).
		WithArgs(10, 0).
		WillReturnRows(conditionRows)

	conditions, err := pdb.GetDnDConditions(context.Background(), 10, 0)
	if err != nil || len(conditions) != 2 {
		t.Fatalf("GetDnDConditions failed: conditions=%v err=%v", conditions, err)
	}

	// Test GetDnDSubraces
	subraceRows := sqlmock.NewRows([]string{"id", "api_index", "name", "race_name", "description", "ability_bonuses", "traits", "proficiencies", "created_at", "updated_at", "api_version"}).
		AddRow(1, "high-elf", "High Elf", "elf", "Elven subrace", []byte(`{"int":1}`), []byte(`[]`), []byte(`[]`), now, now, "2014")
	mock.ExpectQuery(`SELECT id, api_index, name, race_name, description, ability_bonuses, traits, proficiencies`).
		WithArgs(10, 0).
		WillReturnRows(subraceRows)

	subraces, err := pdb.GetDnDSubraces(context.Background(), 10, 0)
	if err != nil || len(subraces) != 1 {
		t.Fatalf("GetDnDSubraces failed: subraces=%v err=%v", subraces, err)
	}
}
