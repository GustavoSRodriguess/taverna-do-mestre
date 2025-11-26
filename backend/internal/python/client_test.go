package python

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"rpg-saas-backend/internal/models"
)

func TestHealthCheck(t *testing.T) {
	t.Run("healthy", func(t *testing.T) {
		srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.URL.Path != "/health" {
				t.Fatalf("unexpected path %s", r.URL.Path)
			}
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"status":"healthy"}`))
		}))
		defer srv.Close()

		client := NewClient(srv.URL, time.Second)
		if err := client.HealthCheck(context.Background()); err != nil {
			t.Fatalf("expected healthy check to pass: %v", err)
		}
	})

	t.Run("unhealthy", func(t *testing.T) {
		srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"status":"down"}`))
		}))
		defer srv.Close()

		client := NewClient(srv.URL, time.Second)
		if err := client.HealthCheck(context.Background()); err == nil {
			t.Fatal("expected health check to fail")
		}
	})
}

func TestGenerateNPC(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/generate-npc" {
			t.Fatalf("unexpected path %s", r.URL.Path)
		}

		var req NPCRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			t.Fatalf("failed to decode request: %v", err)
		}

		if !req.Manual || req.Race != "elf" || req.Class != "wizard" || req.AttributesMethod != "array" {
			t.Fatalf("unexpected request: %+v", req)
		}

		resp := NPCResponse{
			Name:        "Elven Mage",
			Description: "A wise wizard",
			Level:       5,
			Race:        "elf",
			Class:       "wizard",
			Background:  "sage",
			Attributes:  map[string]int{"int": 16},
			Modifiers:   map[string]int{"int": 3},
			Abilities:   []string{"Spellcasting"},
			Equipment:   []string{"Staff"},
			HP:          20,
			CA:          12,
			Spells:      map[string][]string{"cantrips": {"light"}},
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}))
	defer srv.Close()

	client := NewClient(srv.URL, time.Second)
	npc, err := client.GenerateNPC(context.Background(), 5, "array", true, "elf", "wizard", "sage")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if npc.Name != "Elven Mage" || npc.Race != "elf" || npc.Class != "wizard" {
		t.Fatalf("unexpected npc result: %+v", npc)
	}
	if npc.Attributes["int"] != 16 || npc.HP != 20 || npc.CA != 12 {
		t.Fatalf("unexpected npc stats: %+v", npc)
	}
}

func TestGenerateEncounter(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/generate-encounter" {
			t.Fatalf("unexpected path %s", r.URL.Path)
		}

		var req EncounterRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			t.Fatalf("failed to decode request: %v", err)
		}

		if req.PlayerLevel != 3 || req.PlayerCount != 4 || req.Difficulty != "medium" {
			t.Fatalf("unexpected request: %+v", req)
		}

		resp := EncounterResponse{
			Theme:       "Forest Ambush",
			Difficulty:  "medium",
			TotalXP:     450,
			PlayerLevel: 3,
			PlayerCount: 4,
			Monsters: []MonsterResponse{
				{Name: "Wolf", XP: 50, CR: 0.25},
			},
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}))
	defer srv.Close()

	client := NewClient(srv.URL, time.Second)
	encounter, err := client.GenerateEncounter(context.Background(), 3, 4, "medium")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if encounter.Theme != "Forest Ambush" || encounter.TotalXP != 450 {
		t.Fatalf("unexpected encounter result: %+v", encounter)
	}
	if len(encounter.Monsters) != 1 || encounter.Monsters[0].Name != "Wolf" {
		t.Fatalf("unexpected monsters: %+v", encounter.Monsters)
	}
}

func TestGenerateTreasure(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/generate-loot" {
			t.Fatalf("unexpected path %s", r.URL.Path)
		}

		var req map[string]any
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			t.Fatalf("failed to decode request: %v", err)
		}

		categories, ok := req["magic_item_categories"].([]any)
		if !ok || len(categories) != 9 {
			t.Fatalf("expected default magic item categories, got %#v", req["magic_item_categories"])
		}

		resp := map[string]any{
			"level":       4,
			"total_value": 123.0,
			"hoards": []any{
				map[string]any{
					"coins": map[string]int{"gp": 100},
					"valuables": []any{
						map[string]any{"type": "gem", "name": "Ruby", "value": 50.0, "rank": "A"},
					},
					"items": []any{
						map[string]any{"type": "magic", "category": "wands", "name": "Wand of Light", "rank": "B"},
					},
					"value": 150.0,
				},
			},
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}))
	defer srv.Close()

	client := NewClient(srv.URL, time.Second)
	request := models.TreasureRequest{
		Level:       4,
		MagicItems:  true,
		Quantity:    1,
		MoreRandomCoins: true,
	}

	treasure, err := client.GenerateTreasure(context.Background(), request)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if treasure.Level != 4 || treasure.TotalValue != 123 {
		t.Fatalf("unexpected treasure totals: %+v", treasure)
	}

	if len(treasure.Hoards) != 1 {
		t.Fatalf("expected one hoard, got %d", len(treasure.Hoards))
	}

	hoard := treasure.Hoards[0]
	if hoard.Coins["gp"] != 100 {
		t.Fatalf("expected 100 gp, got %v", hoard.Coins["gp"])
	}
	if len(hoard.Valuables) != 1 || hoard.Valuables[0].Name != "Ruby" {
		t.Fatalf("unexpected valuables: %+v", hoard.Valuables)
	}
	if len(hoard.Items) != 1 || hoard.Items[0].Category != "wands" {
		t.Fatalf("unexpected items: %+v", hoard.Items)
	}
}
