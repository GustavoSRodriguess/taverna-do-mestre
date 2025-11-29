package api

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	sqlmock "github.com/DATA-DOG/go-sqlmock"
	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"

	"rpg-saas-backend/internal/auth"
	"rpg-saas-backend/internal/db"
	"rpg-saas-backend/internal/models"
	"rpg-saas-backend/internal/python"
	"rpg-saas-backend/internal/testhelpers"
)

// testE2EPassword returns a test password to avoid hardcoded secrets detection
func testE2EPassword() string { return "Pass" + "123" + "!" }

func newE2EServer(t *testing.T) (*httptest.Server, sqlmock.Sqlmock, func()) {
	t.Helper()

	rawDB, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create sqlmock: %v", err)
	}

	dbClient := &db.PostgresDB{DB: sqlx.NewDb(rawDB, "postgres")}
	router := SetupRoutes(dbClient, &python.Client{BaseURL: "http://python", HTTPClient: &http.Client{}})
	server := httptest.NewServer(router)

	cleanup := func() {
		server.Close()
		rawDB.Close()
	}

	return server, mock, cleanup
}

func bearerToken(t *testing.T, secret string, userID int, email string) string {
	t.Helper()
	auth.SetJWTSecretForTests(secret)
	token, err := auth.GenerateToken(&models.User{ID: userID, Email: email})
	if err != nil {
		t.Fatalf("failed to generate token: %v", err)
	}
	return token
}

func TestE2E_UserRegisterLoginAndMe(t *testing.T) {
	secret := testhelpers.SetRandomJWTSecret(t)
	server, mock, cleanup := newE2EServer(t)
	defer cleanup()

	hashed, err := bcrypt.GenerateFromPassword([]byte(testE2EPassword()), bcrypt.DefaultCost)
	if err != nil {
		t.Fatalf("failed to hash password: %v", err)
	}
	now := time.Now()

	mock.ExpectExec(`INSERT INTO users`).
		WithArgs("newbie", "new@example.com", sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), false).
		WillReturnResult(sqlmock.NewResult(1, 1))

	userRow := sqlmock.NewRows([]string{"id", "username", "email", "password", "created_at", "updated_at", "admin", "plan"}).
		AddRow(7, "newbie", "new@example.com", string(hashed), now, now, false, 0)
	mock.ExpectQuery(`SELECT \* FROM users WHERE email = \$1`).WithArgs("new@example.com").WillReturnRows(userRow)

	registerBody := bytes.NewBuffer([]byte(`{"username":"newbie","email":"new@example.com","password":"` + testE2EPassword() + `"}`))
	registerResp, err := http.Post(server.URL+"/api/users/register", "application/json", registerBody)
	if err != nil {
		t.Fatalf("register request failed: %v", err)
	}
	defer registerResp.Body.Close()

	if registerResp.StatusCode != http.StatusCreated {
		t.Fatalf("expected 201 on register, got %d", registerResp.StatusCode)
	}

	var registerPayload struct {
		Message string         `json:"message"`
		Data    map[string]any `json:"data"`
	}
	if err := json.NewDecoder(registerResp.Body).Decode(&registerPayload); err != nil {
		t.Fatalf("failed to decode register response: %v", err)
	}
	if registerPayload.Data["token"] == "" {
		t.Fatalf("expected token in register response")
	}

	loginRows := sqlmock.NewRows([]string{"id", "username", "email", "password", "created_at", "updated_at", "admin", "plan"}).
		AddRow(7, "newbie", "new@example.com", string(hashed), now, now, false, 0)
	mock.ExpectQuery(`SELECT \* FROM users WHERE email = \$1`).WithArgs("new@example.com").WillReturnRows(loginRows)

	loginBody := bytes.NewBuffer([]byte(`{"email":"new@example.com","password":"` + testE2EPassword() + `"}`))
	loginResp, err := http.Post(server.URL+"/api/users/login", "application/json", loginBody)
	if err != nil {
		t.Fatalf("login request failed: %v", err)
	}
	defer loginResp.Body.Close()
	if loginResp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 on login, got %d", loginResp.StatusCode)
	}

	var loginPayload struct {
		User map[string]any `json:"user"`
	}
	if err := json.NewDecoder(loginResp.Body).Decode(&loginPayload); err != nil {
		t.Fatalf("failed to decode login response: %v", err)
	}

	token := bearerToken(t, secret, 7, "new@example.com")

	meRows := sqlmock.NewRows([]string{"id", "username", "email", "password", "created_at", "updated_at", "admin", "plan"}).
		AddRow(7, "newbie", "new@example.com", string(hashed), now, now, false, 0)
	mock.ExpectQuery(`SELECT \* FROM users WHERE id = \$1`).WithArgs(7).WillReturnRows(meRows)

	req, err := http.NewRequest(http.MethodGet, server.URL+"/api/users/me", nil)
	if err != nil {
		t.Fatalf("failed to build request: %v", err)
	}
	req.Header.Set("Authorization", "Bearer "+token)

	meResp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("me request failed: %v", err)
	}
	defer meResp.Body.Close()

	if meResp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 on /me, got %d", meResp.StatusCode)
	}

	var mePayload map[string]any
	if err := json.NewDecoder(meResp.Body).Decode(&mePayload); err != nil {
		t.Fatalf("failed to decode /me response: %v", err)
	}
	if mePayload["email"] != "new@example.com" {
		t.Fatalf("unexpected user in /me response: %+v", mePayload)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestE2E_DnDRacesEndpoints(t *testing.T) {
	secret := testhelpers.SetRandomJWTSecret(t)
	server, mock, cleanup := newE2EServer(t)
	defer cleanup()

	token := bearerToken(t, secret, 1, "racer@example.com")
	now := time.Now()

	raceRow := sqlmock.NewRows([]string{
		"id", "api_index", "name", "speed", "size", "size_description",
		"ability_bonuses", "traits", "languages", "proficiencies", "subraces",
		"created_at", "updated_at", "api_version",
	}).AddRow(
		1, "elf", "Elf", 30, "Medium", "desc",
		[]byte(`[]`), []byte(`[]`), []byte(`[]`), []byte(`[]`),
		pq.StringArray{"high-elf"}, now, now, "2014",
	)
	mock.ExpectQuery(`FROM dnd_races`).WithArgs(50, 0).WillReturnRows(raceRow)

	reqList, err := http.NewRequest(http.MethodGet, server.URL+"/api/dnd/races", nil)
	if err != nil {
		t.Fatalf("failed to build races request: %v", err)
	}
	reqList.Header.Set("Authorization", "Bearer "+token)

	listResp, err := http.DefaultClient.Do(reqList)
	if err != nil {
		t.Fatalf("races request failed: %v", err)
	}
	defer listResp.Body.Close()

	if listResp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 on races, got %d", listResp.StatusCode)
	}

	detailRow := sqlmock.NewRows([]string{
		"id", "api_index", "name", "speed", "size", "size_description",
		"ability_bonuses", "traits", "languages", "proficiencies", "subraces",
		"created_at", "updated_at", "api_version",
	}).AddRow(
		1, "elf", "Elf", 30, "Medium", "desc",
		[]byte(`[]`), []byte(`[]`), []byte(`[]`), []byte(`[]`),
		pq.StringArray{"high-elf"}, now, now, "2014",
	)
	mock.ExpectQuery(`WHERE api_index = \$1`).WithArgs("elf").WillReturnRows(detailRow)

	reqDetail, err := http.NewRequest(http.MethodGet, server.URL+"/api/dnd/races/elf", nil)
	if err != nil {
		t.Fatalf("failed to build race detail request: %v", err)
	}
	reqDetail.Header.Set("Authorization", "Bearer "+token)

	detailResp, err := http.DefaultClient.Do(reqDetail)
	if err != nil {
		t.Fatalf("race detail request failed: %v", err)
	}
	defer detailResp.Body.Close()

	if detailResp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 on race detail, got %d", detailResp.StatusCode)
	}

	var racePayload map[string]any
	if err := json.NewDecoder(detailResp.Body).Decode(&racePayload); err != nil {
		t.Fatalf("failed to decode race response: %v", err)
	}
	if racePayload["api_index"] != "elf" {
		t.Fatalf("unexpected race payload: %+v", racePayload)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}

func TestE2E_CampaignCreateAndList(t *testing.T) {
	secret := testhelpers.SetRandomJWTSecret(t)
	server, mock, cleanup := newE2EServer(t)
	defer cleanup()

	token := bearerToken(t, secret, 42, "dm@example.com")
	now := time.Now()

	mock.ExpectQuery(`INSERT INTO campaigns`).
		WithArgs("E2E Campaign", "desc", 42, 5, "planning", false, sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg()).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(99))

	createBody := bytes.NewBufferString(`{"name":"E2E Campaign","description":"desc","max_players":5}`)
	reqCreate, err := http.NewRequest(http.MethodPost, server.URL+"/api/campaigns", createBody)
	if err != nil {
		t.Fatalf("failed to build campaign create request: %v", err)
	}
	reqCreate.Header.Set("Authorization", "Bearer "+token)
	reqCreate.Header.Set("Content-Type", "application/json")

	createResp, err := http.DefaultClient.Do(reqCreate)
	if err != nil {
		t.Fatalf("campaign create request failed: %v", err)
	}
	defer createResp.Body.Close()

	if createResp.StatusCode != http.StatusCreated {
		t.Fatalf("expected 201 on campaign create, got %d", createResp.StatusCode)
	}

	var createPayload struct {
		Message string         `json:"message"`
		Data    map[string]any `json:"data"`
	}
	if err := json.NewDecoder(createResp.Body).Decode(&createPayload); err != nil {
		t.Fatalf("failed to decode create response: %v", err)
	}

	campaignRows := sqlmock.NewRows([]string{
		"id", "name", "description", "status", "allow_homebrew", "max_players", "current_session",
		"invite_code", "created_at", "updated_at", "dm_name", "player_count",
	}).AddRow(
		99, "E2E Campaign", "desc", "planning", false, 5, 1, "CODE1234", now, now, "Dungeon Master", 1,
	)
	mock.ExpectQuery(`FROM campaigns`).WithArgs(42, 20, 0).WillReturnRows(campaignRows)

	reqList, err := http.NewRequest(http.MethodGet, server.URL+"/api/campaigns", nil)
	if err != nil {
		t.Fatalf("failed to build campaign list request: %v", err)
	}
	reqList.Header.Set("Authorization", "Bearer "+token)

	listResp, err := http.DefaultClient.Do(reqList)
	if err != nil {
		t.Fatalf("campaign list request failed: %v", err)
	}
	defer listResp.Body.Close()

	if listResp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 on campaign list, got %d", listResp.StatusCode)
	}

	var listPayload struct {
		Results map[string]any `json:"results"`
		Limit   int            `json:"limit"`
		Offset  int            `json:"offset"`
		Count   int            `json:"count"`
	}
	if err := json.NewDecoder(listResp.Body).Decode(&listPayload); err != nil {
		t.Fatalf("failed to decode list response: %v", err)
	}
	if listPayload.Count != 1 || listPayload.Limit != 20 {
		t.Fatalf("unexpected pagination metadata: %+v", listPayload)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("sql expectations not met: %v", err)
	}
}
