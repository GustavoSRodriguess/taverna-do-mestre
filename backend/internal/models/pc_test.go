package models

import "testing"

func TestGetProficiencyBonus(t *testing.T) {
	cases := []struct {
		level int
		want  int
	}{
		{1, 2},
		{5, 3},
		{9, 4},
		{13, 5},
		{17, 6},
	}

	for _, tc := range cases {
		pc := &PC{Level: tc.level}
		if got := pc.GetProficiencyBonus(); got != tc.want {
			t.Fatalf("level %d: expected %d, got %d", tc.level, tc.want, got)
		}
	}
}

func TestCalculateModifier(t *testing.T) {
	if CalculateModifier(10) != 0 {
		t.Fatal("expected 0 for 10")
	}
	if CalculateModifier(7) != -1 {
		t.Fatal("expected -1 for 7")
	}
	if CalculateModifier(18) != 4 {
		t.Fatal("expected 4 for 18")
	}
}

func TestGetAttributeModifiers(t *testing.T) {
	pc := &PC{
		Attributes: JSONBFlexible{Data: map[string]any{
			"strength":     10,
			"dexterity":    14,
			"constitution": 8,
		}},
	}

	mods := pc.GetAttributeModifiers()
	if mods["strength"] != 0 || mods["dexterity"] != 2 || mods["constitution"] != -1 {
		t.Fatalf("unexpected modifiers: %+v", mods)
	}

	// Empty attributes should return empty map
	pc = &PC{}
	if len(pc.GetAttributeModifiers()) != 0 {
		t.Fatal("expected empty modifiers for empty attributes")
	}
}

func TestIsValidLevel(t *testing.T) {
	if !(&PC{Level: 1}).IsValidLevel() {
		t.Fatal("level 1 should be valid")
	}
	if (&PC{Level: 0}).IsValidLevel() {
		t.Fatal("level 0 should be invalid")
	}
	if (&PC{Level: 25}).IsValidLevel() {
		t.Fatal("level 25 should be invalid")
	}
}
