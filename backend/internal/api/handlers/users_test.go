package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	sqlmock "github.com/DATA-DOG/go-sqlmock"
	"github.com/jmoiron/sqlx"
	"golang.org/x/crypto/bcrypt"

	"rpg-saas-backend/internal/api/middleware"
	"rpg-saas-backend/internal/db"
	"rpg-saas-backend/internal/testhelpers"
)

func newMockUserDB(t *testing.T) (*db.PostgresDB, sqlmock.Sqlmock, func()) {
	t.Helper()
	rawDB, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create sqlmock: %v", err)
	}
	return &db.PostgresDB{DB: sqlx.NewDb(rawDB, "postgres")}, mock, func() { rawDB.Close() }
}

func TestUserHandler_GetUsers(t *testing.T) {
	pdb, mock, cleanup := newMockUserDB(t)
	defer cleanup()

	now := time.Now()
	rows := sqlmock.NewRows([]string{"id", "username", "email", "password", "created_at", "updated_at", "admin", "plan"}).
		AddRow(1, "tester", "tester@example.com", "hash", now, now, false, 0)
	mock.ExpectQuery(`SELECT \* FROM users`).WillReturnRows(rows)

	h := NewUserHandler(pdb)
	rr := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/users", nil)

	h.GetUsers(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestUserHandler_GetUsers_Error(t *testing.T) {
	pdb, mock, cleanup := newMockUserDB(t)
	defer cleanup()

	mock.ExpectQuery(`SELECT \* FROM users`).WillReturnError(fmt.Errorf("database error"))

	h := NewUserHandler(pdb)
	rr := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/users", nil)

	h.GetUsers(rr, req)

	if rr.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", rr.Code)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestUserHandler_Login(t *testing.T) {
	testhelpers.SetRandomJWTSecret(t)

	pdb, mock, cleanup := newMockUserDB(t)
	defer cleanup()

	hash, _ := bcrypt.GenerateFromPassword([]byte("pass123"), bcrypt.DefaultCost)
	now := time.Now()
	rows := sqlmock.NewRows([]string{"id", "username", "email", "password", "created_at", "updated_at", "admin", "plan"}).
		AddRow(1, "tester", "user@example.com", string(hash), now, now, false, 0)
	mock.ExpectQuery(`SELECT \* FROM users WHERE email = \$1`).WithArgs("user@example.com").WillReturnRows(rows)

	h := NewUserHandler(pdb)
	body, _ := json.Marshal(map[string]string{"email": "user@example.com", "password": "pass123"})
	req := httptest.NewRequest(http.MethodPost, "/api/users/login", bytes.NewBuffer(body))
	rr := httptest.NewRecorder()

	h.Login(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestUserHandler_Login_Errors(t *testing.T) {
	testhelpers.SetRandomJWTSecret(t)

	t.Run("invalid JSON body", func(t *testing.T) {
		pdb, _, cleanup := newMockUserDB(t)
		defer cleanup()

		h := NewUserHandler(pdb)
		req := httptest.NewRequest(http.MethodPost, "/api/users/login", bytes.NewBufferString("invalid-json"))
		rr := httptest.NewRecorder()

		h.Login(rr, req)
		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rr.Code)
		}
	})

	t.Run("user not found", func(t *testing.T) {
		pdb, mock, cleanup := newMockUserDB(t)
		defer cleanup()

		mock.ExpectQuery(`SELECT \* FROM users WHERE email = \$1`).
			WithArgs("notfound@example.com").
			WillReturnError(fmt.Errorf("user not found"))

		h := NewUserHandler(pdb)
		body, _ := json.Marshal(map[string]string{"email": "notfound@example.com", "password": "pass123"})
		req := httptest.NewRequest(http.MethodPost, "/api/users/login", bytes.NewBuffer(body))
		rr := httptest.NewRecorder()

		h.Login(rr, req)
		if rr.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401, got %d", rr.Code)
		}
	})

	t.Run("invalid password", func(t *testing.T) {
		pdb, mock, cleanup := newMockUserDB(t)
		defer cleanup()

		hash, _ := bcrypt.GenerateFromPassword([]byte("correctpass"), bcrypt.DefaultCost)
		now := time.Now()
		rows := sqlmock.NewRows([]string{"id", "username", "email", "password", "created_at", "updated_at", "admin", "plan"}).
			AddRow(1, "tester", "user@example.com", string(hash), now, now, false, 0)
		mock.ExpectQuery(`SELECT \* FROM users WHERE email = \$1`).
			WithArgs("user@example.com").
			WillReturnRows(rows)

		h := NewUserHandler(pdb)
		body, _ := json.Marshal(map[string]string{"email": "user@example.com", "password": "wrongpass"})
		req := httptest.NewRequest(http.MethodPost, "/api/users/login", bytes.NewBuffer(body))
		rr := httptest.NewRecorder()

		h.Login(rr, req)
		if rr.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401, got %d", rr.Code)
		}
	})
}

func TestUserHandler_CreateUser(t *testing.T) {
	testhelpers.SetRandomJWTSecret(t)

	pdb, mock, cleanup := newMockUserDB(t)
	defer cleanup()

	// Expect insert
	mock.ExpectExec(`INSERT INTO users`).WillReturnResult(sqlmock.NewResult(1, 1))

	now := time.Now()
	createdRows := sqlmock.NewRows([]string{"id", "username", "email", "password", "created_at", "updated_at", "admin", "plan"}).
		AddRow(2, "new", "new@example.com", "hash", now, now, false, 0)
	mock.ExpectQuery(`SELECT \* FROM users WHERE email = \$1`).WithArgs("new@example.com").WillReturnRows(createdRows)

	h := NewUserHandler(pdb)
	payload := map[string]string{"username": "new", "email": "new@example.com", "password": "Pass123"}
	body, _ := json.Marshal(payload)
	req := httptest.NewRequest(http.MethodPost, "/api/users", bytes.NewBuffer(body))
	rr := httptest.NewRecorder()

	h.CreateUser(rr, req)
	if rr.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d", rr.Code)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestUserHandler_CreateUser_Errors(t *testing.T) {
	testhelpers.SetRandomJWTSecret(t)

	t.Run("invalid JSON body", func(t *testing.T) {
		pdb, _, cleanup := newMockUserDB(t)
		defer cleanup()

		h := NewUserHandler(pdb)
		req := httptest.NewRequest(http.MethodPost, "/api/users", bytes.NewBufferString("invalid-json"))
		rr := httptest.NewRecorder()

		h.CreateUser(rr, req)
		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rr.Code)
		}
	})

	t.Run("missing required fields", func(t *testing.T) {
		pdb, _, cleanup := newMockUserDB(t)
		defer cleanup()

		h := NewUserHandler(pdb)
		payload := map[string]string{"username": "test"} // Missing email and password
		body, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPost, "/api/users", bytes.NewBuffer(body))
		rr := httptest.NewRecorder()

		h.CreateUser(rr, req)
		if rr.Code != http.StatusUnprocessableEntity {
			t.Fatalf("expected 422 for missing fields, got %d", rr.Code)
		}
	})

	t.Run("invalid email format", func(t *testing.T) {
		pdb, _, cleanup := newMockUserDB(t)
		defer cleanup()

		h := NewUserHandler(pdb)
		payload := map[string]string{"username": "test", "email": "invalid-email", "password": "Pass123"}
		body, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPost, "/api/users", bytes.NewBuffer(body))
		rr := httptest.NewRecorder()

		h.CreateUser(rr, req)
		if rr.Code != http.StatusUnprocessableEntity {
			t.Fatalf("expected 422 for invalid email, got %d", rr.Code)
		}
	})

	t.Run("weak password", func(t *testing.T) {
		pdb, _, cleanup := newMockUserDB(t)
		defer cleanup()

		h := NewUserHandler(pdb)
		payload := map[string]string{"username": "test", "email": "test@example.com", "password": "weak"}
		body, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPost, "/api/users", bytes.NewBuffer(body))
		rr := httptest.NewRecorder()

		h.CreateUser(rr, req)
		if rr.Code != http.StatusUnprocessableEntity {
			t.Fatalf("expected 422 for weak password, got %d", rr.Code)
		}
	})

	t.Run("database error on create", func(t *testing.T) {
		pdb, mock, cleanup := newMockUserDB(t)
		defer cleanup()

		mock.ExpectExec(`INSERT INTO users`).WillReturnError(fmt.Errorf("db error"))

		h := NewUserHandler(pdb)
		payload := map[string]string{"username": "test", "email": "test@example.com", "password": "Pass123"}
		body, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPost, "/api/users", bytes.NewBuffer(body))
		rr := httptest.NewRecorder()

		h.CreateUser(rr, req)
		if rr.Code != http.StatusInternalServerError {
			t.Fatalf("expected 500 for db error, got %d", rr.Code)
		}
	})

	t.Run("error fetching created user for token", func(t *testing.T) {
		pdb, mock, cleanup := newMockUserDB(t)
		defer cleanup()

		mock.ExpectExec(`INSERT INTO users`).WillReturnResult(sqlmock.NewResult(1, 1))
		mock.ExpectQuery(`SELECT \* FROM users WHERE email = \$1`).
			WithArgs("test@example.com").
			WillReturnError(fmt.Errorf("user not found"))

		h := NewUserHandler(pdb)
		payload := map[string]string{"username": "test", "email": "test@example.com", "password": "Pass123"}
		body, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPost, "/api/users", bytes.NewBuffer(body))
		rr := httptest.NewRecorder()

		h.CreateUser(rr, req)
		// Should still return 201 even if token generation fails
		if rr.Code != http.StatusCreated {
			t.Fatalf("expected 201, got %d", rr.Code)
		}
	})
}

func TestUserHandler_GetCurrentUser(t *testing.T) {
	pdb, mock, cleanup := newMockUserDB(t)
	defer cleanup()

	now := time.Now()
	rows := sqlmock.NewRows([]string{"id", "username", "email", "password", "created_at", "updated_at", "admin", "plan"}).
		AddRow(5, "me", "me@example.com", "hash", now, now, false, 0)
	mock.ExpectQuery(`SELECT \* FROM users WHERE id = \$1`).WithArgs(5).WillReturnRows(rows)

	h := NewUserHandler(pdb)
	req := httptest.NewRequest(http.MethodGet, "/api/users/me", nil)
	req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 5))
	rr := httptest.NewRecorder()

	h.GetCurrentUser(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestUserHandler_GetUserByID_Update_Delete(t *testing.T) {
	pdb, mock, cleanup := newMockUserDB(t)
	defer cleanup()

	now := time.Now()
	row := sqlmock.NewRows([]string{"id", "username", "email", "password", "created_at", "updated_at", "admin", "plan"}).
		AddRow(8, "other", "other@example.com", "hash", now, now, false, 0)
	mock.ExpectQuery(`SELECT \* FROM users WHERE id = \$1`).WithArgs(8).WillReturnRows(row)

	h := NewUserHandler(pdb)

	// GetUserByID
	req := httptest.NewRequest(http.MethodGet, "/api/users/8", nil)
	req = addChiURLParam(req, "id", "8")
	rr := httptest.NewRecorder()
	h.GetUserByID(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}

	// UpdateUser
	mock.ExpectExec(`UPDATE users SET`).WillReturnResult(sqlmock.NewResult(0, 1))
	updateBody, _ := json.Marshal(map[string]any{
		"username": "upd",
		"email":    "upd@example.com",
		"password": "Pass1234",
	})
	reqUpd := httptest.NewRequest(http.MethodPut, "/api/users/8", bytes.NewBuffer(updateBody))
	reqUpd = addChiURLParam(reqUpd, "id", "8")
	rrUpd := httptest.NewRecorder()
	h.UpdateUser(rrUpd, reqUpd)
	if rrUpd.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rrUpd.Code)
	}

	// DeleteUser
	mock.ExpectExec(`DELETE FROM users WHERE id = \$1`).WithArgs(8).WillReturnResult(sqlmock.NewResult(0, 1))
	reqDel := httptest.NewRequest(http.MethodDelete, "/api/users/8", nil)
	reqDel = addChiURLParam(reqDel, "id", "8")
	rrDel := httptest.NewRecorder()
	h.DeleteUser(rrDel, reqDel)
	if rrDel.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d", rrDel.Code)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet expectations: %v", err)
	}
}

func TestUserHandler_GetUserByID_Errors(t *testing.T) {
	t.Run("invalid ID", func(t *testing.T) {
		pdb, _, cleanup := newMockUserDB(t)
		defer cleanup()

		h := NewUserHandler(pdb)
		req := httptest.NewRequest(http.MethodGet, "/api/users/invalid", nil)
		req = addChiURLParam(req, "id", "invalid")
		rr := httptest.NewRecorder()

		h.GetUserByID(rr, req)
		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rr.Code)
		}
	})

	t.Run("user not found", func(t *testing.T) {
		pdb, mock, cleanup := newMockUserDB(t)
		defer cleanup()

		mock.ExpectQuery(`SELECT \* FROM users WHERE id = \$1`).
			WithArgs(999).
			WillReturnError(fmt.Errorf("user not found"))

		h := NewUserHandler(pdb)
		req := httptest.NewRequest(http.MethodGet, "/api/users/999", nil)
		req = addChiURLParam(req, "id", "999")
		rr := httptest.NewRecorder()

		h.GetUserByID(rr, req)
		// DB errors return 500, not 404
		if rr.Code != http.StatusInternalServerError {
			t.Fatalf("expected 500, got %d", rr.Code)
		}
	})
}

func TestUserHandler_GetCurrentUser_Errors(t *testing.T) {
	t.Run("user ID not in context", func(t *testing.T) {
		pdb, _, cleanup := newMockUserDB(t)
		defer cleanup()

		h := NewUserHandler(pdb)
		req := httptest.NewRequest(http.MethodGet, "/api/users/me", nil)
		rr := httptest.NewRecorder()

		h.GetCurrentUser(rr, req)
		if rr.Code != http.StatusInternalServerError {
			t.Fatalf("expected 500, got %d", rr.Code)
		}
	})

	t.Run("user not found", func(t *testing.T) {
		pdb, mock, cleanup := newMockUserDB(t)
		defer cleanup()

		mock.ExpectQuery(`SELECT \* FROM users WHERE id = \$1`).
			WithArgs(99).
			WillReturnError(fmt.Errorf("user not found"))

		h := NewUserHandler(pdb)
		req := httptest.NewRequest(http.MethodGet, "/api/users/me", nil)
		req = req.WithContext(context.WithValue(req.Context(), middleware.UserIDKey, 99))
		rr := httptest.NewRecorder()

		h.GetCurrentUser(rr, req)
		// DB errors return 500, not 404
		if rr.Code != http.StatusInternalServerError {
			t.Fatalf("expected 500, got %d", rr.Code)
		}
	})
}

func TestUserHandler_UpdateUser_Errors(t *testing.T) {
	t.Run("invalid ID", func(t *testing.T) {
		pdb, _, cleanup := newMockUserDB(t)
		defer cleanup()

		h := NewUserHandler(pdb)
		req := httptest.NewRequest(http.MethodPut, "/api/users/invalid", bytes.NewBufferString(`{}`))
		req = addChiURLParam(req, "id", "invalid")
		rr := httptest.NewRecorder()

		h.UpdateUser(rr, req)
		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rr.Code)
		}
	})

	t.Run("invalid JSON body", func(t *testing.T) {
		pdb, _, cleanup := newMockUserDB(t)
		defer cleanup()

		h := NewUserHandler(pdb)
		req := httptest.NewRequest(http.MethodPut, "/api/users/1", bytes.NewBufferString("invalid"))
		req = addChiURLParam(req, "id", "1")
		rr := httptest.NewRecorder()

		h.UpdateUser(rr, req)
		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rr.Code)
		}
	})

	t.Run("database error on update", func(t *testing.T) {
		pdb, mock, cleanup := newMockUserDB(t)
		defer cleanup()

		mock.ExpectExec(`UPDATE users SET`).WillReturnError(fmt.Errorf("db error"))

		h := NewUserHandler(pdb)
		body, _ := json.Marshal(map[string]any{
			"username": "test",
			"email":    "test@example.com",
			"password": "Pass123",
		})
		req := httptest.NewRequest(http.MethodPut, "/api/users/1", bytes.NewBuffer(body))
		req = addChiURLParam(req, "id", "1")
		rr := httptest.NewRecorder()

		h.UpdateUser(rr, req)
		if rr.Code != http.StatusInternalServerError {
			t.Fatalf("expected 500, got %d", rr.Code)
		}
	})
}

func TestUserHandler_DeleteUser_Errors(t *testing.T) {
	t.Run("invalid ID", func(t *testing.T) {
		pdb, _, cleanup := newMockUserDB(t)
		defer cleanup()

		h := NewUserHandler(pdb)
		req := httptest.NewRequest(http.MethodDelete, "/api/users/invalid", nil)
		req = addChiURLParam(req, "id", "invalid")
		rr := httptest.NewRecorder()

		h.DeleteUser(rr, req)
		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rr.Code)
		}
	})

	t.Run("database error on delete", func(t *testing.T) {
		pdb, mock, cleanup := newMockUserDB(t)
		defer cleanup()

		mock.ExpectExec(`DELETE FROM users WHERE id = \$1`).
			WithArgs(1).
			WillReturnError(fmt.Errorf("db error"))

		h := NewUserHandler(pdb)
		req := httptest.NewRequest(http.MethodDelete, "/api/users/1", nil)
		req = addChiURLParam(req, "id", "1")
		rr := httptest.NewRecorder()

		h.DeleteUser(rr, req)
		if rr.Code != http.StatusInternalServerError {
			t.Fatalf("expected 500, got %d", rr.Code)
		}
	})
}
