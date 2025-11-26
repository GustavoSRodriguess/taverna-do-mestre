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

func newMockDnDHandler(t *testing.T) (*DnDHandler, sqlmock.Sqlmock, func()) {
	t.Helper()
	rawDB, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create sqlmock: %v", err)
	}
	pdb := &db.PostgresDB{DB: sqlx.NewDb(rawDB, "postgres")}
	return NewDnDHandler(pdb), mock, func() { rawDB.Close() }
}

func TestDnDHandler_GetRaces_Default(t *testing.T) {
	handler, mock, cleanup := newMockDnDHandler(t)
	defer cleanup()

	now := time.Now()
	row := sqlmock.NewRows([]string{
		"id", "api_index", "name", "speed", "size", "size_description",
		"ability_bonuses", "traits", "languages", "proficiencies", "subraces",
		"created_at", "updated_at", "api_version",
	}).AddRow(
		1, "elf", "Elf", 30, "Medium", "desc",
		[]byte(`[]`), []byte(`[]`), []byte(`[]`), []byte(`[]`),
		pq.StringArray{"high-elf"}, now, now, "2014",
	)

	mock.ExpectQuery(`FROM dnd_races`).WithArgs(50, 0).WillReturnRows(row)

	req := httptest.NewRequest(http.MethodGet, "/api/dnd/races", nil)
	rr := httptest.NewRecorder()

	handler.GetRaces(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestDnDHandler_GetRaceByIndex(t *testing.T) {
	handler, mock, cleanup := newMockDnDHandler(t)
	defer cleanup()

	now := time.Now()
	row := sqlmock.NewRows([]string{
		"id", "api_index", "name", "speed", "size", "size_description",
		"ability_bonuses", "traits", "languages", "proficiencies", "subraces",
		"created_at", "updated_at", "api_version",
	}).AddRow(
		1, "elf", "Elf", 30, "Medium", "desc",
		[]byte(`[]`), []byte(`[]`), []byte(`[]`), []byte(`[]`),
		pq.StringArray{"high-elf"}, now, now, "2014",
	)
	mock.ExpectQuery(`WHERE api_index = \$1`).WithArgs("elf").WillReturnRows(row)

	req := httptest.NewRequest(http.MethodGet, "/api/dnd/races/elf", nil)
	req = addChiURLParam(req, "index", "elf")
	rr := httptest.NewRecorder()

	handler.GetRaceByIndex(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestDnDHandler_GetClassesAndSpells(t *testing.T) {
	handler, mock, cleanup := newMockDnDHandler(t)
	defer cleanup()

	now := time.Now()
	classRows := sqlmock.NewRows([]string{
		"id", "api_index", "name", "hit_die", "proficiencies", "saving_throws",
		"spellcasting", "spellcasting_ability", "class_levels", "created_at", "updated_at", "api_version",
	}).AddRow(
		1, "wizard", "Wizard", 6, []byte(`{}`), pq.StringArray{"int"},
		[]byte(`{}`), "int", []byte(`{}`), now, now, "2014",
	)
	mock.ExpectQuery(`FROM dnd_classes`).WithArgs(50, 0).WillReturnRows(classRows)

	reqClasses := httptest.NewRequest(http.MethodGet, "/api/dnd/classes", nil)
	classRec := httptest.NewRecorder()
	handler.GetClasses(classRec, reqClasses)
	if classRec.Code != http.StatusOK {
		t.Fatalf("expected 200 for classes, got %d", classRec.Code)
	}

	classDetail := sqlmock.NewRows([]string{
		"id", "api_index", "name", "hit_die", "proficiencies", "saving_throws",
		"spellcasting", "spellcasting_ability", "class_levels", "created_at", "updated_at", "api_version",
	}).AddRow(
		1, "wizard", "Wizard", 6, []byte(`{}`), pq.StringArray{"int"},
		[]byte(`{}`), "int", []byte(`{}`), now, now, "2014",
	)
	mock.ExpectQuery(`WHERE api_index = \$1`).WithArgs("wizard").WillReturnRows(classDetail)

	reqClassByIndex := httptest.NewRequest(http.MethodGet, "/api/dnd/classes/wizard", nil)
	reqClassByIndex = addChiURLParam(reqClassByIndex, "index", "wizard")
	classByRec := httptest.NewRecorder()
	handler.GetClassByIndex(classByRec, reqClassByIndex)
	if classByRec.Code != http.StatusOK {
		t.Fatalf("expected 200 for class detail, got %d", classByRec.Code)
	}

	spellRows := sqlmock.NewRows([]string{
		"id", "api_index", "name", "level", "school", "casting_time", "range", "components",
		"duration", "concentration", "ritual", "description", "higher_level", "material",
		"classes", "created_at", "updated_at", "api_version",
	}).AddRow(
		1, "magic-missile", "Magic Missile", 1, "evocation", "1 action", "120 feet", "V,S",
		"Instant", false, false, "desc", "", "", pq.StringArray{"Wizard"}, now, now, "2014",
	)
	mock.ExpectQuery(`FROM dnd_spells WHERE 1=1`).WithArgs(50, 0).WillReturnRows(spellRows)

	reqSpells := httptest.NewRequest(http.MethodGet, "/api/dnd/spells", nil)
	spellsRec := httptest.NewRecorder()
	handler.GetSpells(spellsRec, reqSpells)
	if spellsRec.Code != http.StatusOK {
		t.Fatalf("expected 200 for spells, got %d", spellsRec.Code)
	}

	spellDetail := sqlmock.NewRows([]string{
		"id", "api_index", "name", "level", "school", "casting_time", "range", "components",
		"duration", "concentration", "ritual", "description", "higher_level", "material",
		"classes", "created_at", "updated_at", "api_version",
	}).AddRow(
		1, "magic-missile", "Magic Missile", 1, "evocation", "1 action", "120 feet", "V,S",
		"Instant", false, false, "desc", "", "", pq.StringArray{"Wizard"}, now, now, "2014",
	)
	mock.ExpectQuery(`WHERE api_index = \$1`).WithArgs("magic-missile").WillReturnRows(spellDetail)

	reqSpellByIndex := httptest.NewRequest(http.MethodGet, "/api/dnd/spells/magic-missile", nil)
	reqSpellByIndex = addChiURLParam(reqSpellByIndex, "index", "magic-missile")
	spellRec := httptest.NewRecorder()
	handler.GetSpellByIndex(spellRec, reqSpellByIndex)
	if spellRec.Code != http.StatusOK {
		t.Fatalf("expected 200 for spell detail, got %d", spellRec.Code)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestDnDHandler_EquipmentLanguagesConditions(t *testing.T) {
	handler, mock, cleanup := newMockDnDHandler(t)
	defer cleanup()

	now := time.Now()

	// Equipment list and detail
	equipCols := []string{
		"id", "api_index", "name", "equipment_category", "cost_quantity", "cost_unit", "weight",
		"weapon_category", "weapon_range", "damage", "properties", "armor_category", "armor_class",
		"description", "special", "created_at", "updated_at", "api_version",
	}
	equipRows := sqlmock.NewRows(equipCols).AddRow(
		1, "longsword", "Longsword", "Weapon", 15, "gp", 3.0, "Martial", "Melee",
		[]byte(`{}`), pq.StringArray{"versatile"}, "", []byte(`{}`), "desc", pq.StringArray{}, now, now, "2014",
	)
	mock.ExpectQuery(`FROM dnd_equipment`).WithArgs(50, 0).WillReturnRows(equipRows)

	reqEquip := httptest.NewRequest(http.MethodGet, "/api/dnd/equipment", nil)
	recEquip := httptest.NewRecorder()
	handler.GetEquipment(recEquip, reqEquip)
	if recEquip.Code != http.StatusOK {
		t.Fatalf("expected 200 for equipment, got %d", recEquip.Code)
	}

	equipDetail := sqlmock.NewRows(equipCols).AddRow(
		1, "longsword", "Longsword", "Weapon", 15, "gp", 3.0, "Martial", "Melee",
		[]byte(`{}`), pq.StringArray{"versatile"}, "", []byte(`{}`), "desc", pq.StringArray{}, now, now, "2014",
	)
	mock.ExpectQuery(`WHERE api_index = \$1`).WithArgs("longsword").WillReturnRows(equipDetail)

	reqEquipDetail := httptest.NewRequest(http.MethodGet, "/api/dnd/equipment/longsword", nil)
	reqEquipDetail = addChiURLParam(reqEquipDetail, "index", "longsword")
	recEquipDetail := httptest.NewRecorder()
	handler.GetEquipmentByIndex(recEquipDetail, reqEquipDetail)
	if recEquipDetail.Code != http.StatusOK {
		t.Fatalf("expected 200 for equipment detail, got %d", recEquipDetail.Code)
	}

	// Backgrounds list/detail
	bgCols := []string{
		"id", "api_index", "name", "starting_proficiencies", "language_options", "starting_equipment",
		"starting_equipment_options", "feature", "personality_traits", "ideals", "bonds", "flaws",
		"created_at", "updated_at", "api_version",
	}
	bgRows := sqlmock.NewRows(bgCols).AddRow(
		1, "acolyte", "Acolyte", []byte(`{}`), []byte(`{}`), []byte(`{}`), []byte(`{}`), []byte(`{}`),
		[]byte(`{}`), []byte(`{}`), []byte(`{}`), []byte(`{}`), now, now, "2014",
	)
	mock.ExpectQuery(`FROM dnd_backgrounds`).WithArgs(50, 0).WillReturnRows(bgRows)

	reqBG := httptest.NewRequest(http.MethodGet, "/api/dnd/backgrounds", nil)
	recBG := httptest.NewRecorder()
	handler.GetBackgrounds(recBG, reqBG)
	if recBG.Code != http.StatusOK {
		t.Fatalf("expected 200 for backgrounds, got %d", recBG.Code)
	}

	bgDetail := sqlmock.NewRows(bgCols).AddRow(
		1, "acolyte", "Acolyte", []byte(`{}`), []byte(`{}`), []byte(`{}`), []byte(`{}`), []byte(`{}`),
		[]byte(`{}`), []byte(`{}`), []byte(`{}`), []byte(`{}`), now, now, "2014",
	)
	mock.ExpectQuery(`WHERE api_index = \$1`).WithArgs("acolyte").WillReturnRows(bgDetail)

	reqBGDetail := httptest.NewRequest(http.MethodGet, "/api/dnd/backgrounds/acolyte", nil)
	reqBGDetail = addChiURLParam(reqBGDetail, "index", "acolyte")
	recBGDetail := httptest.NewRecorder()
	handler.GetBackgroundByIndex(recBGDetail, reqBGDetail)
	if recBGDetail.Code != http.StatusOK {
		t.Fatalf("expected 200 for background detail, got %d", recBGDetail.Code)
	}

	// Languages and Conditions
	langCols := []string{
		"id", "api_index", "name", "type", "description", "script", "typical_speakers", "created_at", "updated_at", "api_version",
	}
	langRows := sqlmock.NewRows(langCols).AddRow(
		1, "common", "Common", "Standard", "desc", "Common", pq.StringArray{"Human"}, now, now, "2014",
	)
	mock.ExpectQuery(`FROM dnd_languages`).WithArgs(50, 0).WillReturnRows(langRows)

	reqLang := httptest.NewRequest(http.MethodGet, "/api/dnd/languages", nil)
	recLang := httptest.NewRecorder()
	handler.GetLanguages(recLang, reqLang)
	if recLang.Code != http.StatusOK {
		t.Fatalf("expected 200 for languages, got %d", recLang.Code)
	}

	condCols := []string{"id", "api_index", "name", "description", "created_at", "updated_at", "api_version"}
	condRows := sqlmock.NewRows(condCols).AddRow(1, "blinded", "Blinded", "desc", now, now, "2014")
	mock.ExpectQuery(`FROM dnd_conditions`).WithArgs(50, 0).WillReturnRows(condRows)

	reqCond := httptest.NewRequest(http.MethodGet, "/api/dnd/conditions", nil)
	recCond := httptest.NewRecorder()
	handler.GetConditions(recCond, reqCond)
	if recCond.Code != http.StatusOK {
		t.Fatalf("expected 200 for conditions, got %d", recCond.Code)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestDnDHandler_SkillsFeaturesSubracesMagicItemsAndStats(t *testing.T) {
	handler, mock, cleanup := newMockDnDHandler(t)
	defer cleanup()

	now := time.Now()

	skillCols := []string{"id", "api_index", "name", "description", "ability_score", "created_at", "updated_at", "api_version"}
	skillRows := sqlmock.NewRows(skillCols).AddRow(1, "acrobatics", "Acrobatics", "desc", "dexterity", now, now, "2014")
	mock.ExpectQuery(`FROM dnd_skills`).WithArgs(50, 0).WillReturnRows(skillRows)

	reqSkills := httptest.NewRequest(http.MethodGet, "/api/dnd/skills", nil)
	recSkills := httptest.NewRecorder()
	handler.GetSkills(recSkills, reqSkills)
	if recSkills.Code != http.StatusOK {
		t.Fatalf("expected 200 for skills, got %d", recSkills.Code)
	}

	// Monsters list/detail
	monsterCols := []string{
		"id", "api_index", "name", "size", "type", "subtype", "alignment", "armor_class",
		"hit_points", "hit_dice", "speed", "strength", "dexterity", "constitution",
		"intelligence", "wisdom", "charisma", "challenge_rating", "xp", "proficiency_bonus",
		"damage_vulnerabilities", "damage_resistances", "damage_immunities", "condition_immunities",
		"senses", "languages", "special_abilities", "actions", "legendary_actions",
		"created_at", "updated_at", "api_version",
	}
	monsterRows := sqlmock.NewRows(monsterCols).AddRow(
		1, "goblin", "Goblin", "Small", "humanoid", "", "neutral", 15, 7, "2d6",
		[]byte(`{}`), 8, 14, 10, 8, 8, 8, 0.25, 50, 2,
		pq.StringArray{}, pq.StringArray{}, pq.StringArray{}, pq.StringArray{},
		[]byte(`{}`), "Common", []byte(`[]`), []byte(`[]`), []byte(`[]`), now, now, "2014",
	)
	mock.ExpectQuery(`FROM dnd_monsters`).WithArgs(50, 0).WillReturnRows(monsterRows)

	reqMonsters := httptest.NewRequest(http.MethodGet, "/api/dnd/monsters", nil)
	recMonsters := httptest.NewRecorder()
	handler.GetMonsters(recMonsters, reqMonsters)
	if recMonsters.Code != http.StatusOK {
		t.Fatalf("expected 200 for monsters, got %d", recMonsters.Code)
	}

	monsterDetail := sqlmock.NewRows(monsterCols).AddRow(
		1, "goblin", "Goblin", "Small", "humanoid", "", "neutral", 15, 7, "2d6",
		[]byte(`{}`), 8, 14, 10, 8, 8, 8, 0.25, 50, 2,
		pq.StringArray{}, pq.StringArray{}, pq.StringArray{}, pq.StringArray{},
		[]byte(`{}`), "Common", []byte(`[]`), []byte(`[]`), []byte(`[]`), now, now, "2014",
	)
	mock.ExpectQuery(`WHERE api_index = \$1`).WithArgs("goblin").WillReturnRows(monsterDetail)

	reqMonsterDetail := httptest.NewRequest(http.MethodGet, "/api/dnd/monsters/goblin", nil)
	reqMonsterDetail = addChiURLParam(reqMonsterDetail, "index", "goblin")
	recMonsterDetail := httptest.NewRecorder()
	handler.GetMonsterByIndex(recMonsterDetail, reqMonsterDetail)
	if recMonsterDetail.Code != http.StatusOK {
		t.Fatalf("expected 200 for monster detail, got %d", recMonsterDetail.Code)
	}

	skillDetail := sqlmock.NewRows(skillCols).AddRow(1, "acrobatics", "Acrobatics", "desc", "dexterity", now, now, "2014")
	mock.ExpectQuery(`WHERE api_index = \$1`).WithArgs("acrobatics").WillReturnRows(skillDetail)

	reqSkillDetail := httptest.NewRequest(http.MethodGet, "/api/dnd/skills/acrobatics", nil)
	reqSkillDetail = addChiURLParam(reqSkillDetail, "index", "acrobatics")
	recSkillDetail := httptest.NewRecorder()
	handler.GetSkillByIndex(recSkillDetail, reqSkillDetail)
	if recSkillDetail.Code != http.StatusOK {
		t.Fatalf("expected 200 for skill detail, got %d", recSkillDetail.Code)
	}

	featureCols := []string{"id", "api_index", "name", "level", "class_name", "subclass_name", "description", "prerequisites", "created_at", "updated_at", "api_version"}
	featureRows := sqlmock.NewRows(featureCols).AddRow(
		1, "arcane-recovery", "Arcane Recovery", 1, "Wizard", "", "desc", []byte(`{}`), now, now, "2014",
	)
	mock.ExpectQuery(`FROM dnd_features`).WithArgs(50, 0).WillReturnRows(featureRows)

	reqFeatures := httptest.NewRequest(http.MethodGet, "/api/dnd/features", nil)
	recFeatures := httptest.NewRecorder()
	handler.GetFeatures(recFeatures, reqFeatures)
	if recFeatures.Code != http.StatusOK {
		t.Fatalf("expected 200 for features, got %d", recFeatures.Code)
	}

	featureDetail := sqlmock.NewRows(featureCols).AddRow(
		1, "arcane-recovery", "Arcane Recovery", 1, "Wizard", "", "desc", []byte(`{}`), now, now, "2014",
	)
	mock.ExpectQuery(`WHERE api_index = \$1`).WithArgs("arcane-recovery").WillReturnRows(featureDetail)

	reqFeatureDetail := httptest.NewRequest(http.MethodGet, "/api/dnd/features/arcane-recovery", nil)
	reqFeatureDetail = addChiURLParam(reqFeatureDetail, "index", "arcane-recovery")
	recFeatureDetail := httptest.NewRecorder()
	handler.GetFeatureByIndex(recFeatureDetail, reqFeatureDetail)
	if recFeatureDetail.Code != http.StatusOK {
		t.Fatalf("expected 200 for feature detail, got %d", recFeatureDetail.Code)
	}

	subraceCols := []string{"id", "api_index", "name", "race_name", "description", "ability_bonuses", "traits", "proficiencies", "created_at", "updated_at", "api_version"}
	subraceRows := sqlmock.NewRows(subraceCols).AddRow(
		1, "high-elf", "High Elf", "Elf", "desc", []byte(`{}`), []byte(`{}`), []byte(`{}`), now, now, "2014",
	)
	mock.ExpectQuery(`FROM dnd_subraces`).WithArgs(50, 0).WillReturnRows(subraceRows)

	reqSubraces := httptest.NewRequest(http.MethodGet, "/api/dnd/subraces", nil)
	recSubraces := httptest.NewRecorder()
	handler.GetSubraces(recSubraces, reqSubraces)
	if recSubraces.Code != http.StatusOK {
		t.Fatalf("expected 200 for subraces, got %d", recSubraces.Code)
	}

	magicCols := []string{"id", "api_index", "name", "description", "category", "rarity", "variants", "created_at", "updated_at", "api_version"}
	magicRows := sqlmock.NewRows(magicCols).AddRow(
		1, "wand-of-magic-missiles", "Wand of Magic Missiles", "desc", "Wand", "uncommon", []byte(`[]`), now, now, "2014",
	)
	mock.ExpectQuery(`FROM dnd_magic_items`).WithArgs(50, 0).WillReturnRows(magicRows)

	reqMagic := httptest.NewRequest(http.MethodGet, "/api/dnd/magic-items", nil)
	recMagic := httptest.NewRecorder()
	handler.GetMagicItems(recMagic, reqMagic)
	if recMagic.Code != http.StatusOK {
		t.Fatalf("expected 200 for magic items, got %d", recMagic.Code)
	}

	// Another call for magic items (no detail endpoint, reuse listing)
	mock.ExpectQuery(`FROM dnd_magic_items`).WithArgs(50, 0).WillReturnRows(magicRows)

	reqMagicDetail := httptest.NewRequest(http.MethodGet, "/api/dnd/magic-items", nil)
	recMagicDetail := httptest.NewRecorder()
	handler.GetMagicItems(recMagicDetail, reqMagicDetail)
	if recMagicDetail.Code != http.StatusOK {
		t.Fatalf("expected 200 for magic items second call, got %d", recMagicDetail.Code)
	}

	// Stats endpoint (no DB)
	reqStats := httptest.NewRequest(http.MethodGet, "/api/dnd", nil)
	recStats := httptest.NewRecorder()
	handler.GetDnDStats(recStats, reqStats)
	if recStats.Code != http.StatusOK {
		t.Fatalf("expected 200 for stats, got %d", recStats.Code)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}
