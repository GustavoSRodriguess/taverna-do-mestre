package utils

import (
	"errors"
	"net/http"
	"strconv"

	"rpg-saas-backend/internal/api/middleware"

	"github.com/go-chi/chi/v5"
)

// PaginationParams holds pagination parameters
type PaginationParams struct {
	Limit  int
	Offset int
}

// ExtractPagination extracts pagination parameters from request with defaults
func ExtractPagination(r *http.Request, defaultLimit int) PaginationParams {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	if limit <= 0 {
		limit = defaultLimit
	}
	if offset < 0 {
		offset = 0
	}

	// Cap limit at reasonable maximum
	if limit > 100 {
		limit = 100
	}

	return PaginationParams{
		Limit:  limit,
		Offset: offset,
	}
}

// ExtractUserID extracts user ID from request context
func ExtractUserID(r *http.Request) (int, error) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		return 0, errors.New("user ID not found in context")
	}
	return userID, nil
}

// ExtractIDParam extracts and validates ID parameter from URL
func ExtractIDParam(r *http.Request, paramName string) (int, error) {
	idStr := chi.URLParam(r, paramName)
	if idStr == "" {
		return 0, errors.New("missing " + paramName + " parameter")
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		return 0, errors.New("invalid " + paramName + " parameter")
	}

	if id <= 0 {
		return 0, errors.New(paramName + " must be positive")
	}

	return id, nil
}

// ExtractID is a shorthand for ExtractIDParam with "id" parameter
func ExtractID(r *http.Request) (int, error) {
	return ExtractIDParam(r, "id")
}

// ExtractOptionalIntParam extracts optional integer parameter with default value
func ExtractOptionalIntParam(r *http.Request, paramName string, defaultValue int) int {
	valueStr := r.URL.Query().Get(paramName)
	if valueStr == "" {
		return defaultValue
	}

	value, err := strconv.Atoi(valueStr)
	if err != nil {
		return defaultValue
	}

	return value
}

// ExtractOptionalStringParam extracts optional string parameter with default value
func ExtractOptionalStringParam(r *http.Request, paramName string, defaultValue string) string {
	value := r.URL.Query().Get(paramName)
	if value == "" {
		return defaultValue
	}
	return value
}