package utils

import "testing"

func TestInviteCodeGenerationAndValidation(t *testing.T) {
	code, err := GenerateInviteCode()
	if err != nil {
		t.Fatalf("unexpected error generating code: %v", err)
	}

	if len(code) != 9 || code[4] != '-' {
		t.Fatalf("expected format XXXX-XXXX, got %s", code)
	}

	if !ValidateInviteCode(code) {
		t.Fatalf("generated code should be valid: %s", code)
	}

	normalized := NormalizeInviteCode(code)
	if len(normalized) != 8 || normalized == code {
		t.Fatalf("expected normalized code without hyphen, got %s", normalized)
	}

	if ValidateInviteCode("bad-code!") {
		t.Fatal("expected invalid code to be rejected")
	}
}
