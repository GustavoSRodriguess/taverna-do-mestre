package handlers

import (
	"bytes"
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	sqlmock "github.com/DATA-DOG/go-sqlmock"
	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"

	"rpg-saas-backend/internal/api/middleware"
	"rpg-saas-backend/internal/db"
)

func newMockHomebrewHandler(t *testing.T) (*HomebrewHandler, sqlmock.Sqlmock, func()) {
	t.Helper()
	rawDB, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create sqlmock: %v", err)
	}
	pdb := &db.PostgresDB{DB: sqlx.NewDb(rawDB, "postgres")}
	return NewHomebrewHandler(pdb), mock, func() { rawDB.Close() }
}

func TestHomebrewHandler_GetHomebrewRaces(t *testing.T) {
	handler, mock, cleanup := newMockHomebrewHandler(t)
	defer cleanup()

	now := time.Now()
	rows := sqlmock.NewRows([]string{
		"id", "name", "description", "speed", "size", "languages", "traits", "abilities", "proficiencies",
		"user_id", "is_public", "average_rating", "rating_count", "favorites_count", "created_at", "updated_at", "owner_username",
	}).AddRow(
		1, "Custom Elf", "desc", 30, "Medium", pq.StringArray{"Common"}, []byte(`[]`), []byte(`{}`), []byte(`{}`),
		5, true, 4.5, 10, 2, now, now, "owner",
	)

	mock.ExpectQuery(`FROM homebrew_races`).WithArgs(5, 50, 0).WillReturnRows(rows)
	mock.ExpectQuery(`SELECT COUNT\(\*\) FROM homebrew_races`).WithArgs(5).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(1))

	req := httptest.NewRequest(http.MethodGet, "/api/homebrew/races", nil)
	req = req.WithContext(contextWithUserID(req.Context(), 5))
	rr := httptest.NewRecorder()

	handler.GetHomebrewRaces(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestHomebrewHandler_GetHomebrewRaceByID(t *testing.T) {
	handler, mock, cleanup := newMockHomebrewHandler(t)
	defer cleanup()

	now := time.Now()
	row := sqlmock.NewRows([]string{
		"id", "name", "description", "speed", "size", "languages", "traits", "abilities", "proficiencies",
		"user_id", "is_public", "average_rating", "rating_count", "favorites_count", "created_at", "updated_at", "owner_username",
	}).AddRow(
		10, "Race", "desc", 30, "Medium", pq.StringArray{"Common"}, []byte(`[]`), []byte(`{}`), []byte(`{}`),
		5, true, 4.0, 2, 1, now, now, "owner",
	)

	mock.ExpectQuery(`FROM homebrew_races`).WithArgs(10, 5).WillReturnRows(row)

	req := httptest.NewRequest(http.MethodGet, "/api/homebrew/races/10", nil)
	req = addChiURLParam(req, "id", "10")
	req = req.WithContext(contextWithUserID(req.Context(), 5))
	rr := httptest.NewRecorder()

	handler.GetHomebrewRaceByID(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestHomebrewHandler_CreateUpdateDeleteRace(t *testing.T) {
	handler, mock, cleanup := newMockHomebrewHandler(t)
	defer cleanup()

	now := time.Now()
	mock.ExpectQuery(`INSERT INTO homebrew_races`).
		WithArgs("New", "desc", 30, "Medium", pq.StringArray{"Common"}, sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), 5, true).
		WillReturnRows(sqlmock.NewRows([]string{"id", "created_at", "updated_at"}).AddRow(20, now, now))

	createBody := `{"name":"New","description":"desc","speed":30,"size":"Medium","languages":["Common"],"traits":{},"abilities":{},"proficiencies":{},"is_public":true}`
	createReq := httptest.NewRequest(http.MethodPost, "/api/homebrew/races", bytes.NewBufferString(createBody))
	createReq = createReq.WithContext(contextWithUserID(createReq.Context(), 5))
	createRec := httptest.NewRecorder()
	handler.CreateHomebrewRace(createRec, createReq)
	if createRec.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d", createRec.Code)
	}

	mock.ExpectExec(`UPDATE homebrew_races SET`).WithArgs(
		"Updated", "desc", 35, "Large", sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), true, 20, 5,
	).WillReturnResult(sqlmock.NewResult(0, 1))

	updateBody := `{"name":"Updated","description":"desc","speed":35,"size":"Large","languages":[],"traits":{},"abilities":{},"proficiencies":{},"is_public":true}`
	updateReq := httptest.NewRequest(http.MethodPut, "/api/homebrew/races/20", bytes.NewBufferString(updateBody))
	updateReq = addChiURLParam(updateReq, "id", "20")
	updateReq = updateReq.WithContext(contextWithUserID(updateReq.Context(), 5))
	updateRec := httptest.NewRecorder()
	handler.UpdateHomebrewRace(updateRec, updateReq)
	if updateRec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", updateRec.Code)
	}

	mock.ExpectExec(`DELETE FROM homebrew_races WHERE id = \$1 AND user_id = \$2`).WithArgs(20, 5).
		WillReturnResult(sqlmock.NewResult(0, 1))

	deleteReq := httptest.NewRequest(http.MethodDelete, "/api/homebrew/races/20", nil)
	deleteReq = addChiURLParam(deleteReq, "id", "20")
	deleteReq = deleteReq.WithContext(contextWithUserID(deleteReq.Context(), 5))
	deleteRec := httptest.NewRecorder()
	handler.DeleteHomebrewRace(deleteRec, deleteReq)
	if deleteRec.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d", deleteRec.Code)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestHomebrewHandler_ClassAndBackgroundFlows(t *testing.T) {
	handler, mock, cleanup := newMockHomebrewHandler(t)
	defer cleanup()

	now := time.Now()

	// Classes list/detail
	classCols := []string{
		"id", "name", "description", "hit_die", "primary_ability", "saving_throws",
		"armor_proficiency", "weapon_proficiency", "tool_proficiency", "skill_choices",
		"features", "spellcasting", "user_id", "is_public", "average_rating",
		"rating_count", "favorites_count", "created_at", "updated_at", "owner_username",
	}
	classRows := sqlmock.NewRows(classCols).AddRow(
		1, "Homebrew Class", "desc", 8, "int", pq.StringArray{"int"}, pq.StringArray{}, pq.StringArray{}, pq.StringArray{},
		[]byte(`{}`), []byte(`{}`), []byte(`{}`), 5, true, 4.5, 2, 1, now, now, "owner",
	)
	mock.ExpectQuery(`FROM homebrew_classes`).WithArgs(5, 50, 0).WillReturnRows(classRows)
	mock.ExpectQuery(`SELECT COUNT\(\*\) FROM homebrew_classes`).WithArgs(5).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(1))

	reqClasses := httptest.NewRequest(http.MethodGet, "/api/homebrew/classes", nil)
	reqClasses = reqClasses.WithContext(contextWithUserID(reqClasses.Context(), 5))
	recClasses := httptest.NewRecorder()
	handler.GetHomebrewClasses(recClasses, reqClasses)
	if recClasses.Code != http.StatusOK {
		t.Fatalf("expected 200 for class list, got %d", recClasses.Code)
	}

	classDetail := sqlmock.NewRows(classCols).AddRow(
		1, "Homebrew Class", "desc", 8, "int", pq.StringArray{"int"}, pq.StringArray{}, pq.StringArray{}, pq.StringArray{},
		[]byte(`{}`), []byte(`{}`), []byte(`{}`), 5, true, 4.5, 2, 1, now, now, "owner",
	)
	mock.ExpectQuery(`FROM homebrew_classes`).WithArgs(10, 5).WillReturnRows(classDetail)

	reqClassDetail := httptest.NewRequest(http.MethodGet, "/api/homebrew/classes/10", nil)
	reqClassDetail = addChiURLParam(reqClassDetail, "id", "10")
	reqClassDetail = reqClassDetail.WithContext(contextWithUserID(reqClassDetail.Context(), 5))
	recClassDetail := httptest.NewRecorder()
	handler.GetHomebrewClassByID(recClassDetail, reqClassDetail)
	if recClassDetail.Code != http.StatusOK {
		t.Fatalf("expected 200 for class detail, got %d", recClassDetail.Code)
	}

	// Create/Update/Delete class
	mock.ExpectQuery(`INSERT INTO homebrew_classes`).WillReturnRows(sqlmock.NewRows([]string{"id", "created_at", "updated_at"}).AddRow(15, now, now))

	createBody := `{"name":"NewClass","description":"desc","hit_die":8,"primary_ability":"int","saving_throws":["int"],"armor_proficiency":[],"weapon_proficiency":[],"tool_proficiency":[],"skill_choices":{},"features":{},"spellcasting":{},"is_public":true}`
	reqCreate := httptest.NewRequest(http.MethodPost, "/api/homebrew/classes", bytes.NewBufferString(createBody))
	reqCreate = reqCreate.WithContext(contextWithUserID(reqCreate.Context(), 5))
	recCreate := httptest.NewRecorder()
	handler.CreateHomebrewClass(recCreate, reqCreate)
	if recCreate.Code != http.StatusCreated {
		t.Fatalf("expected 201 for class create, got %d", recCreate.Code)
	}

	mock.ExpectExec(`UPDATE homebrew_classes SET`).WillReturnResult(sqlmock.NewResult(0, 1))
	updateBody := `{"name":"Upd","description":"desc","hit_die":8,"primary_ability":"int","saving_throws":["int"],"armor_proficiency":[],"weapon_proficiency":[],"tool_proficiency":[],"skill_choices":{},"features":{},"spellcasting":{},"is_public":true}`
	reqUpdate := httptest.NewRequest(http.MethodPut, "/api/homebrew/classes/15", bytes.NewBufferString(updateBody))
	reqUpdate = addChiURLParam(reqUpdate, "id", "15")
	reqUpdate = reqUpdate.WithContext(contextWithUserID(reqUpdate.Context(), 5))
	recUpdate := httptest.NewRecorder()
	handler.UpdateHomebrewClass(recUpdate, reqUpdate)
	if recUpdate.Code != http.StatusOK {
		t.Fatalf("expected 200 for class update, got %d", recUpdate.Code)
	}

	mock.ExpectExec(`DELETE FROM homebrew_classes WHERE id = \$1 AND user_id = \$2`).WithArgs(15, 5).
		WillReturnResult(sqlmock.NewResult(0, 1))
	reqDelete := httptest.NewRequest(http.MethodDelete, "/api/homebrew/classes/15", nil)
	reqDelete = addChiURLParam(reqDelete, "id", "15")
	reqDelete = reqDelete.WithContext(contextWithUserID(reqDelete.Context(), 5))
	recDelete := httptest.NewRecorder()
	handler.DeleteHomebrewClass(recDelete, reqDelete)
	if recDelete.Code != http.StatusNoContent {
		t.Fatalf("expected 204 for class delete, got %d", recDelete.Code)
	}

	// Backgrounds list/detail/create/update/delete
	bgCols := []string{
		"id", "name", "description", "skill_proficiencies", "tool_proficiencies", "languages", "equipment",
		"feature", "suggested_traits", "user_id", "is_public", "average_rating", "rating_count", "favorites_count",
		"created_at", "updated_at", "owner_username",
	}
	bgRows := sqlmock.NewRows(bgCols).AddRow(
		1, "HB Background", "desc", pq.StringArray{"acrobatics"}, pq.StringArray{}, 0, []byte(`{}`),
		[]byte(`{}`), []byte(`{}`), 5, true, 4.5, 2, 1, now, now, "owner",
	)
	mock.ExpectQuery(`FROM homebrew_backgrounds`).WithArgs(5, 50, 0).WillReturnRows(bgRows)
	mock.ExpectQuery(`SELECT COUNT\(\*\) FROM homebrew_backgrounds`).WithArgs(5).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(1))

	reqBGs := httptest.NewRequest(http.MethodGet, "/api/homebrew/backgrounds", nil)
	reqBGs = reqBGs.WithContext(contextWithUserID(reqBGs.Context(), 5))
	recBGs := httptest.NewRecorder()
	handler.GetHomebrewBackgrounds(recBGs, reqBGs)
	if recBGs.Code != http.StatusOK {
		t.Fatalf("expected 200 for backgrounds list, got %d", recBGs.Code)
	}

	bgDetail := sqlmock.NewRows(bgCols).AddRow(
		1, "HB Background", "desc", pq.StringArray{"acrobatics"}, pq.StringArray{}, 0, []byte(`{}`),
		[]byte(`{}`), []byte(`{}`), 5, true, 4.5, 2, 1, now, now, "owner",
	)
	mock.ExpectQuery(`FROM homebrew_backgrounds`).WithArgs(10, 5).WillReturnRows(bgDetail)

	reqBGDetail := httptest.NewRequest(http.MethodGet, "/api/homebrew/backgrounds/10", nil)
	reqBGDetail = addChiURLParam(reqBGDetail, "id", "10")
	reqBGDetail = reqBGDetail.WithContext(contextWithUserID(reqBGDetail.Context(), 5))
	recBGDetail := httptest.NewRecorder()
	handler.GetHomebrewBackgroundByID(recBGDetail, reqBGDetail)
	if recBGDetail.Code != http.StatusOK {
		t.Fatalf("expected 200 for background detail, got %d", recBGDetail.Code)
	}

	mock.ExpectQuery(`INSERT INTO homebrew_backgrounds`).WillReturnRows(sqlmock.NewRows([]string{"id", "created_at", "updated_at"}).AddRow(25, now, now))

	createBG := `{"name":"NewBG","description":"desc","skill_proficiencies":["acrobatics"],"tool_proficiencies":[],"languages":0,"equipment":{},"feature":{},"suggested_traits":{},"is_public":true}`
	reqCreateBG := httptest.NewRequest(http.MethodPost, "/api/homebrew/backgrounds", bytes.NewBufferString(createBG))
	reqCreateBG = reqCreateBG.WithContext(contextWithUserID(reqCreateBG.Context(), 5))
	recCreateBG := httptest.NewRecorder()
	handler.CreateHomebrewBackground(recCreateBG, reqCreateBG)
	if recCreateBG.Code != http.StatusCreated {
		t.Fatalf("expected 201 for background create, got %d", recCreateBG.Code)
	}

	mock.ExpectExec(`UPDATE homebrew_backgrounds SET`).WillReturnResult(sqlmock.NewResult(0, 1))

	updateBG := `{"name":"UpdBG","description":"desc","skill_proficiencies":[],"tool_proficiencies":[],"languages":0,"equipment":{},"feature":{},"suggested_traits":{},"is_public":true}`
	reqUpdateBG := httptest.NewRequest(http.MethodPut, "/api/homebrew/backgrounds/25", bytes.NewBufferString(updateBG))
	reqUpdateBG = addChiURLParam(reqUpdateBG, "id", "25")
	reqUpdateBG = reqUpdateBG.WithContext(contextWithUserID(reqUpdateBG.Context(), 5))
	recUpdateBG := httptest.NewRecorder()
	handler.UpdateHomebrewBackground(recUpdateBG, reqUpdateBG)
	if recUpdateBG.Code != http.StatusOK {
		t.Fatalf("expected 200 for background update, got %d", recUpdateBG.Code)
	}

	mock.ExpectExec(`DELETE FROM homebrew_backgrounds WHERE id = \$1 AND user_id = \$2`).WithArgs(25, 5).
		WillReturnResult(sqlmock.NewResult(0, 1))

	reqDeleteBG := httptest.NewRequest(http.MethodDelete, "/api/homebrew/backgrounds/25", nil)
	reqDeleteBG = addChiURLParam(reqDeleteBG, "id", "25")
	reqDeleteBG = reqDeleteBG.WithContext(contextWithUserID(reqDeleteBG.Context(), 5))
	recDeleteBG := httptest.NewRecorder()
	handler.DeleteHomebrewBackground(recDeleteBG, reqDeleteBG)
	if recDeleteBG.Code != http.StatusNoContent {
		t.Fatalf("expected 204 for background delete, got %d", recDeleteBG.Code)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func contextWithUserID(ctx context.Context, id int) context.Context {
	return context.WithValue(ctx, middleware.UserIDKey, id)
}
