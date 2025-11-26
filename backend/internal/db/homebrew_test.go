package db

import (
	"context"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
)

func TestDeleteHomebrewRace(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	mock.ExpectExec(`DELETE FROM homebrew_races WHERE id = \$1 AND user_id = \$2`).
		WithArgs(1, 5).
		WillReturnResult(sqlmock.NewResult(0, 1))

	err := pdb.DeleteHomebrewRace(context.Background(), 1, 5)
	if err != nil {
		t.Fatalf("DeleteHomebrewRace error: %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestDeleteHomebrewClass(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	mock.ExpectExec(`DELETE FROM homebrew_classes WHERE id = \$1 AND user_id = \$2`).
		WithArgs(1, 5).
		WillReturnResult(sqlmock.NewResult(0, 1))

	err := pdb.DeleteHomebrewClass(context.Background(), 1, 5)
	if err != nil {
		t.Fatalf("DeleteHomebrewClass error: %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestDeleteHomebrewBackground(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	mock.ExpectExec(`DELETE FROM homebrew_backgrounds WHERE id = \$1 AND user_id = \$2`).
		WithArgs(1, 5).
		WillReturnResult(sqlmock.NewResult(0, 1))

	err := pdb.DeleteHomebrewBackground(context.Background(), 1, 5)
	if err != nil {
		t.Fatalf("DeleteHomebrewBackground error: %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestAddFavorite(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	mock.ExpectExec(`INSERT INTO homebrew_favorites`).
		WithArgs(5, "race", 10).
		WillReturnResult(sqlmock.NewResult(1, 1))

	err := pdb.AddFavorite(context.Background(), 5, "race", 10)
	if err != nil {
		t.Fatalf("AddFavorite error: %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestRemoveFavorite(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	mock.ExpectExec(`DELETE FROM homebrew_favorites`).
		WithArgs(5, "class", 20).
		WillReturnResult(sqlmock.NewResult(0, 1))

	err := pdb.RemoveFavorite(context.Background(), 5, "class", 20)
	if err != nil {
		t.Fatalf("RemoveFavorite error: %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestIsFavorited(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	rows := sqlmock.NewRows([]string{"exists"}).AddRow(true)
	mock.ExpectQuery(`SELECT EXISTS`).WithArgs(5, "background", 30).WillReturnRows(rows)

	isFav, err := pdb.IsFavorited(context.Background(), 5, "background", 30)
	if err != nil {
		t.Fatalf("IsFavorited error: %v", err)
	}
	if !isFav {
		t.Fatalf("expected true, got false")
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestRemoveRating(t *testing.T) {
	pdb, mock, cleanup := newMockDB(t)
	defer cleanup()

	mock.ExpectExec(`DELETE FROM homebrew_ratings`).
		WithArgs(5, "background", 30).
		WillReturnResult(sqlmock.NewResult(0, 1))

	err := pdb.RemoveRating(context.Background(), 5, "background", 30)
	if err != nil {
		t.Fatalf("RemoveRating error: %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

