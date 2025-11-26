package utils

import "testing"

func TestValidatorBasicChecks(t *testing.T) {
	v := NewValidator()

	if err := v.ValidateRequired("ok", "field"); err != nil {
		t.Fatalf("expected required to pass, got %v", err)
	}

	if err := v.ValidateRequired("   ", "field"); err == nil {
		t.Fatal("expected required error for blank string")
	}

	if err := v.ValidateStringLength("abc", "name", 1, 5); err != nil {
		t.Fatalf("unexpected length error: %v", err)
	}

	if err := v.ValidateStringLength("too long", "name", 1, 3); err == nil {
		t.Fatal("expected max length error")
	}
}

func TestValidatorLevelAndRange(t *testing.T) {
	v := NewValidator()

	if err := v.ValidateLevel(1); err != nil {
		t.Fatalf("level 1 should be valid: %v", err)
	}

	if err := v.ValidateLevel(21); err == nil {
		t.Fatal("expected invalid_range for level 21")
	}

	if err := v.ValidateIntRange(5, "value", 1, 10); err != nil {
		t.Fatalf("int range should pass: %v", err)
	}

	if err := v.ValidateIntRange(0, "value", 1, 10); err == nil {
		t.Fatal("expected range error for 0")
	}
}

func TestValidatorEmailAndPassword(t *testing.T) {
	v := NewValidator()

	if err := v.ValidateEmail("user@example.com"); err != nil {
		t.Fatalf("valid email should pass: %v", err)
	}

	if err := v.ValidateEmail("bad-email"); err == nil {
		t.Fatal("expected invalid email format error")
	}

	if err := v.ValidatePassword("abc123"); err != nil {
		t.Fatalf("password with letters and numbers should pass: %v", err)
	}

	if err := v.ValidatePassword("abcdef"); err == nil {
		t.Fatal("expected weak password error (no number)")
	}
}

func TestValidatorChoices(t *testing.T) {
	v := NewValidator()

	if err := v.ValidateChoice("easy", "difficulty", DifficultyLevels); err != nil {
		t.Fatalf("expected difficulty choice to pass: %v", err)
	}
	if err := v.ValidateDifficulty("medium"); err != nil {
		t.Fatalf("expected ValidateDifficulty to pass: %v", err)
	}

	if err := v.ValidateChoice("impossible", "difficulty", DifficultyLevels); err == nil {
		t.Fatal("expected invalid choice error")
	}
	if err := v.ValidateAttributeMethod("array"); err != nil {
		t.Fatalf("expected ValidateAttributeMethod to pass: %v", err)
	}

	if err := v.ValidateIntChoice(2, "option", []int{1, 2, 3}); err != nil {
		t.Fatalf("expected int choice to pass: %v", err)
	}

	if err := v.ValidateIntChoice(4, "option", []int{1, 2, 3}); err == nil {
		t.Fatal("expected invalid int choice error")
	}
}

func TestValidatorNumericChecks(t *testing.T) {
	v := NewValidator()

	if err := v.ValidatePositive(5, "value"); err != nil {
		t.Fatalf("positive check should pass: %v", err)
	}

	if err := v.ValidatePositive(0, "value"); err == nil {
		t.Fatal("expected positive check to fail for zero")
	}

	if err := v.ValidateNonNegative(0, "value"); err != nil {
		t.Fatalf("non-negative should pass: %v", err)
	}

	if err := v.ValidateNonNegative(-1, "value"); err == nil {
		t.Fatal("expected non-negative to fail for -1")
	}

	if err := v.ValidatePlayerCount(3); err != nil {
		t.Fatalf("expected player count to pass: %v", err)
	}

	if err := v.ValidatePlayerCount(0); err == nil {
		t.Fatal("expected player count to fail for 0")
	}
}

func TestBatchValidateAggregatesErrors(t *testing.T) {
	v := NewValidator()

	errs := v.BatchValidate(
		func() error { return v.ValidateRequired("", "name") },
		func() error { return v.ValidateEmail("bad") },
	)

	if !errs.HasErrors() {
		t.Fatal("expected batch validation to report errors")
	}

	if len(errs) != 2 {
		t.Fatalf("expected 2 errors, got %d", len(errs))
	}
}
