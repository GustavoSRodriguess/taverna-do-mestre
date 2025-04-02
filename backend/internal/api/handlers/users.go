package handlers

import (
	"rpg-saas-backend/internal/db"
)

type userHandler struct {
	DB *db.PostgresDB
}

func NewUserHandler(db *db.PostgresDB) *userHandler {
	return &userHandler{DB: db}
}
