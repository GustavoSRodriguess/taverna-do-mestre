package models

import "testing"

func TestGetModifier(t *testing.T) {
	if mod := GetModifier(10); mod != 0 {
		t.Fatalf("expected 0 for 10, got %d", mod)
	}
	if mod := GetModifier(8); mod != -1 {
		t.Fatalf("expected -1 for 8, got %d", mod)
	}
	if mod := GetModifier(18); mod != 4 {
		t.Fatalf("expected 4 for 18, got %d", mod)
	}
}

func TestFormatChallengeRating(t *testing.T) {
	m := DnDMonster{ChallengeRating: 0.25}
	if cr := m.FormatChallengeRating(); cr != "1/4" {
		t.Fatalf("expected 1/4, got %s", cr)
	}
	m.ChallengeRating = 2
	if cr := m.FormatChallengeRating(); cr != "2" {
		t.Fatalf("expected 2, got %s", cr)
	}
}

func TestGetSpellLevelName(t *testing.T) {
	s := DnDSpell{Level: 0}
	if name := s.GetSpellLevelName(); name != "Cantrip" {
		t.Fatalf("expected Cantrip, got %s", name)
	}
	s.Level = 1
	if name := s.GetSpellLevelName(); name != "1st Level" {
		t.Fatalf("expected 1st Level, got %s", name)
	}
	s.Level = 5
	if name := s.GetSpellLevelName(); name != "5th Level" {
		t.Fatalf("expected 5th Level, got %s", name)
	}
}
