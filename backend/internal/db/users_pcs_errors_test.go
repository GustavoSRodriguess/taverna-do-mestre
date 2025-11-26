package db

import (
	"context"
	"errors"
	"testing"
)

// Users error tests

func TestGetUserByID_Error(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	mock.ExpectQuery(`SELECT \* FROM users WHERE id`).
		WithArgs(1).
		WillReturnError(errors.New("db error"))

	_, err := pdb.GetUserByID(context.Background(), 1)
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestGetUserByUsername_Error(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	mock.ExpectQuery(`SELECT \* FROM users WHERE username`).
		WithArgs("test").
		WillReturnError(errors.New("db error"))

	_, err := pdb.GetUserByUsername(context.Background(), "test")
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestGetUserByEmail_Error(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	mock.ExpectQuery(`SELECT \* FROM users WHERE email`).
		WithArgs("test@example.com").
		WillReturnError(errors.New("db error"))

	_, err := pdb.GetUserByEmail(context.Background(), "test@example.com")
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestGetUserByEmailAndPwd_Error(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	mock.ExpectQuery(`SELECT \* FROM users WHERE email`).
		WithArgs("test@example.com", "hashedpwd").
		WillReturnError(errors.New("db error"))

	_, err := pdb.GetUserByEmailAndPwd(context.Background(), "test@example.com", "hashedpwd")
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestDeleteUser_Error(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	mock.ExpectExec(`DELETE FROM users WHERE id`).
		WithArgs(1).
		WillReturnError(errors.New("db error"))

	err := pdb.DeleteUser(context.Background(), 1)
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

// PCs error tests

func TestGetPCsByPlayer_Error(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	mock.ExpectQuery(`FROM pcs WHERE player_id`).
		WithArgs(1, 20, 0).
		WillReturnError(errors.New("db error"))

	_, err := pdb.GetPCsByPlayer(context.Background(), 1, 20, 0)
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestGetPCByIDAndPlayer_Error(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	mock.ExpectQuery(`FROM pcs WHERE id`).
		WithArgs(10, 1).
		WillReturnError(errors.New("db error"))

	_, err := pdb.GetPCByIDAndPlayer(context.Background(), 10, 1)
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}


func TestCountPCCampaigns_Error(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	mock.ExpectQuery(`SELECT COUNT`).
		WithArgs(10).
		WillReturnError(errors.New("db error"))

	_, err := pdb.CountPCCampaigns(context.Background(), 10)
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}
