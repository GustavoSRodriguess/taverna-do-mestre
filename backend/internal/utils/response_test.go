package utils

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
)

func decodeBody(t *testing.T, rr *httptest.ResponseRecorder, target any) {
	t.Helper()
	if err := json.Unmarshal(rr.Body.Bytes(), target); err != nil {
		t.Fatalf("failed to decode body: %v", err)
	}
}

func TestResponseHandlerJSONHelpers(t *testing.T) {
	rh := NewResponseHandler()

	rr := httptest.NewRecorder()
	rh.SendJSON(rr, map[string]bool{"ok": true}, http.StatusAccepted)
	if rr.Code != http.StatusAccepted {
		t.Fatalf("expected 202, got %d", rr.Code)
	}
	var data map[string]bool
	decodeBody(t, rr, &data)
	if !data["ok"] {
		t.Fatal("expected ok=true in response")
	}

	rr = httptest.NewRecorder()
	rh.SendSuccess(rr, "done", map[string]string{"id": "1"})
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}

	rr = httptest.NewRecorder()
	rh.SendCreated(rr, "created", nil)
	if rr.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d", rr.Code)
	}
}

func TestResponseHandlerPaginated(t *testing.T) {
	rh := NewResponseHandler()
	pagination := PaginationParams{Limit: 10, Offset: 5}

	rr := httptest.NewRecorder()
	rh.SendPaginated(rr, []int{1, 2}, pagination, 2, nil)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}

	var resp PaginatedResponse
	decodeBody(t, rr, &resp)
	if resp.Limit != 10 || resp.Offset != 5 || resp.Count != 2 {
		t.Fatalf("unexpected pagination response: %+v", resp)
	}
}

func TestResponseHandlerErrors(t *testing.T) {
	rh := NewResponseHandler()

	rr := httptest.NewRecorder()
	rh.SendBadRequest(rr, "bad")
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rr.Code)
	}

	rr = httptest.NewRecorder()
	rh.SendUnauthorized(rr, "unauth")
	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rr.Code)
	}

	rr = httptest.NewRecorder()
	rh.SendForbidden(rr, "forbidden")
	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", rr.Code)
	}

	rr = httptest.NewRecorder()
	rh.SendNotFound(rr, "missing")
	if rr.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", rr.Code)
	}

	rr = httptest.NewRecorder()
	rh.SendConflict(rr, "conflict")
	if rr.Code != http.StatusConflict {
		t.Fatalf("expected 409, got %d", rr.Code)
	}

	rr = httptest.NewRecorder()
	rh.SendInternalError(rr, "error")
	if rr.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", rr.Code)
	}

	rr = httptest.NewRecorder()
	rh.SendErrorWithCode(rr, "error", "E123", "details", http.StatusTeapot)
	if rr.Code != http.StatusTeapot {
		t.Fatalf("expected 418, got %d", rr.Code)
	}

	rr = httptest.NewRecorder()
	rh.SendValidationError(rr, "validation")
	if rr.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected 422, got %d", rr.Code)
	}
}

func TestHandleDBError(t *testing.T) {
	rh := NewResponseHandler()

	cases := []struct {
		name       string
		err        error
		wantStatus int
	}{
		{"no rows", errors.New("sql: no rows in result set"), http.StatusNotFound},
		{"duplicate", errors.New("pq: duplicate key value violates constraint abc"), http.StatusInternalServerError},
		{"foreign", errors.New(`pq: insert or update on table "pcs" violates foreign key constraint`), http.StatusInternalServerError},
		{"default", errors.New("unexpected database failure that should trigger internal error path and is quite long"), http.StatusInternalServerError},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			rr := httptest.NewRecorder()
			rh.HandleDBError(rr, tc.err, "op")
			if rr.Code != tc.wantStatus {
				t.Fatalf("expected status %d, got %d", tc.wantStatus, rr.Code)
			}
		})
	}
}
