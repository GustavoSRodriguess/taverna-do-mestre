package utils

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

// PaginatedResponse represents a paginated API response
type PaginatedResponse struct {
	Results any  `json:"results"`
	Limit   int  `json:"limit"`
	Offset  int  `json:"offset"`
	Count   int  `json:"count"`
	Total   *int `json:"total,omitempty"` // Optional total count
}

// ErrorResponse represents an error API response
type ErrorResponse struct {
	Error   string `json:"error"`
	Code    string `json:"code,omitempty"`
	Details string `json:"details,omitempty"`
}

// SuccessResponse represents a success API response
type SuccessResponse struct {
	Message string `json:"message"`
	Data    any    `json:"data,omitempty"`
}

// ResponseHandler handles HTTP responses consistently
type ResponseHandler struct{}

// NewResponseHandler creates a new response handler
func NewResponseHandler() *ResponseHandler {
	return &ResponseHandler{}
}

// SendJSON sends a JSON response with the given status code
func (rh *ResponseHandler) SendJSON(w http.ResponseWriter, data any, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	if err := json.NewEncoder(w).Encode(data); err != nil {
		log.Printf("Error encoding JSON response: %v", err)
		// Fallback to plain text error
		http.Error(w, "Internal server error", http.StatusInternalServerError)
	}
}

// SendSuccess sends a success response with optional data
func (rh *ResponseHandler) SendSuccess(w http.ResponseWriter, message string, data any) {
	response := SuccessResponse{
		Message: message,
		Data:    data,
	}
	rh.SendJSON(w, response, http.StatusOK)
}

// SendCreated sends a 201 Created response with optional data
func (rh *ResponseHandler) SendCreated(w http.ResponseWriter, message string, data any) {
	response := SuccessResponse{
		Message: message,
		Data:    data,
	}
	rh.SendJSON(w, response, http.StatusCreated)
}

// SendPaginated sends a paginated response
func (rh *ResponseHandler) SendPaginated(w http.ResponseWriter, data any, pagination PaginationParams, count int, total *int) {
	response := PaginatedResponse{
		Results: data,
		Limit:   pagination.Limit,
		Offset:  pagination.Offset,
		Count:   count,
		Total:   total,
	}
	rh.SendJSON(w, response, http.StatusOK)
}

// SendError sends an error response with the given status code
func (rh *ResponseHandler) SendError(w http.ResponseWriter, message string, statusCode int) {
	response := ErrorResponse{
		Error: message,
	}
	rh.SendJSON(w, response, statusCode)
}

// SendErrorWithCode sends an error response with error code and details
func (rh *ResponseHandler) SendErrorWithCode(w http.ResponseWriter, message, code, details string, statusCode int) {
	response := ErrorResponse{
		Error:   message,
		Code:    code,
		Details: details,
	}
	rh.SendJSON(w, response, statusCode)
}

// SendBadRequest sends a 400 Bad Request error
func (rh *ResponseHandler) SendBadRequest(w http.ResponseWriter, message string) {
	rh.SendError(w, message, http.StatusBadRequest)
}

// SendUnauthorized sends a 401 Unauthorized error
func (rh *ResponseHandler) SendUnauthorized(w http.ResponseWriter, message string) {
	rh.SendError(w, message, http.StatusUnauthorized)
}

// SendForbidden sends a 403 Forbidden error
func (rh *ResponseHandler) SendForbidden(w http.ResponseWriter, message string) {
	rh.SendError(w, message, http.StatusForbidden)
}

// SendNotFound sends a 404 Not Found error
func (rh *ResponseHandler) SendNotFound(w http.ResponseWriter, message string) {
	rh.SendError(w, message, http.StatusNotFound)
}

// SendConflict sends a 409 Conflict error
func (rh *ResponseHandler) SendConflict(w http.ResponseWriter, message string) {
	rh.SendError(w, message, http.StatusConflict)
}

// SendInternalError sends a 500 Internal Server Error
func (rh *ResponseHandler) SendInternalError(w http.ResponseWriter, message string) {
	rh.SendError(w, message, http.StatusInternalServerError)
}

// SendValidationError sends a 422 Unprocessable Entity error for validation failures
func (rh *ResponseHandler) SendValidationError(w http.ResponseWriter, message string) {
	rh.SendError(w, message, http.StatusUnprocessableEntity)
}

// HandleDBError handles database errors and sends appropriate HTTP response
func (rh *ResponseHandler) HandleDBError(w http.ResponseWriter, err error, operation string) {
	log.Printf("Database error during %s: %v", operation, err)

	errMsg := err.Error()

	// Check for common database errors
	switch {
	case isNoRowsError(errMsg):
		rh.SendNotFound(w, "Resource not found")
	case isDuplicateKeyError(errMsg):
		rh.SendConflict(w, "Resource already exists")
	case isForeignKeyError(errMsg):
		rh.SendBadRequest(w, "Invalid reference to related resource")
	default:
		rh.SendInternalError(w, fmt.Sprintf("Failed to %s", operation))
	}
}

// Helper functions to identify database error types
func isNoRowsError(errMsg string) bool {
	return errMsg == "sql: no rows in result set"
}

func isDuplicateKeyError(errMsg string) bool {
	// PostgreSQL duplicate key error patterns
	return len(errMsg) > 0 && (errMsg[:9] == "ERROR: duplicate" ||
		errMsg[:19] == "pq: duplicate key value")
}

func isForeignKeyError(errMsg string) bool {
	// PostgreSQL foreign key error patterns
	return len(errMsg) > 0 && (errMsg[:23] == "ERROR: insert or update" ||
		errMsg[:25] == "pq: insert or update on table")
}
