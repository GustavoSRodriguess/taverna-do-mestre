package models

import (
	"encoding/json"
	"testing"
)

func TestJSONBValueAndScan(t *testing.T) {
	original := JSONB{"key": "value", "num": 2}
	val, err := original.Value()
	if err != nil {
		t.Fatalf("unexpected error marshaling JSONB: %v", err)
	}

	var scanned JSONB
	if err := scanned.Scan([]byte(val.(string))); err != nil {
		t.Fatalf("unexpected error scanning JSONB: %v", err)
	}

	if scanned["key"] != "value" || scanned["num"] != float64(2) {
		t.Fatalf("unexpected scanned data: %+v", scanned)
	}
}

func TestJSONBFlexibleScanAndMarshal(t *testing.T) {
	// Scan from JSON bytes
	var flex JSONBFlexible
	if err := flex.Scan([]byte(`{"a":1,"b":"two"}`)); err != nil {
		t.Fatalf("unexpected scan error: %v", err)
	}

	b, err := json.Marshal(flex)
	if err != nil {
		t.Fatalf("marshal should succeed: %v", err)
	}

	var decoded map[string]any
	if err := json.Unmarshal(b, &decoded); err != nil {
		t.Fatalf("unmarshal should succeed: %v", err)
	}
	if decoded["b"] != "two" {
		t.Fatalf("expected key b to survive marshal/unmarshal, got %+v", decoded)
	}

	// Value should round-trip
	if _, err := flex.Value(); err != nil {
		t.Fatalf("unexpected Value error: %v", err)
	}
}

func TestJSONBNilValue(t *testing.T) {
	var j JSONB
	val, err := j.Value()
	if err != nil {
		t.Fatalf("unexpected error for nil JSONB: %v", err)
	}
	if val != nil {
		t.Fatalf("expected nil value, got %v", val)
	}
}

func TestJSONBScanNil(t *testing.T) {
	var j JSONB
	if err := j.Scan(nil); err != nil {
		t.Fatalf("unexpected error scanning nil: %v", err)
	}
	if j != nil {
		t.Fatalf("expected nil JSONB after scanning nil")
	}
}

func TestJSONBScanError(t *testing.T) {
	var j JSONB
	err := j.Scan(12345) // invalid type
	if err == nil {
		t.Fatalf("expected error scanning invalid type")
	}
}

func TestJSONBFlexibleScanNil(t *testing.T) {
	var flex JSONBFlexible
	if err := flex.Scan(nil); err != nil {
		t.Fatalf("unexpected error scanning nil: %v", err)
	}
	if flex.Data != nil {
		t.Fatalf("expected nil Data after scanning nil")
	}
}

func TestJSONBFlexibleScanString(t *testing.T) {
	var flex JSONBFlexible
	if err := flex.Scan(`{"test":"value"}`); err != nil {
		t.Fatalf("unexpected error scanning string: %v", err)
	}
	data, ok := flex.Data.(map[string]any)
	if !ok {
		t.Fatalf("expected map, got %T", flex.Data)
	}
	if data["test"] != "value" {
		t.Fatalf("expected test=value, got %v", data["test"])
	}
}

func TestJSONBFlexibleScanInvalidType(t *testing.T) {
	var flex JSONBFlexible
	err := flex.Scan(12345) // invalid type
	if err == nil {
		t.Fatalf("expected error scanning invalid type")
	}
}

func TestJSONBFlexibleValueNil(t *testing.T) {
	var flex JSONBFlexible
	val, err := flex.Value()
	if err != nil {
		t.Fatalf("unexpected error for nil JSONBFlexible: %v", err)
	}
	if val != nil {
		t.Fatalf("expected nil value, got %v", val)
	}
}

func TestJSONBFlexibleMarshalJSONNil(t *testing.T) {
	var flex JSONBFlexible
	b, err := flex.MarshalJSON()
	if err != nil {
		t.Fatalf("unexpected error marshaling nil: %v", err)
	}
	if string(b) != "null" {
		t.Fatalf("expected 'null', got %s", string(b))
	}
}

func TestJSONBFlexibleUnmarshalJSON(t *testing.T) {
	var flex JSONBFlexible
	data := []byte(`{"key":"value"}`)
	if err := flex.UnmarshalJSON(data); err != nil {
		t.Fatalf("unexpected error unmarshaling: %v", err)
	}
	m, ok := flex.Data.(map[string]any)
	if !ok {
		t.Fatalf("expected map, got %T", flex.Data)
	}
	if m["key"] != "value" {
		t.Fatalf("expected key=value, got %v", m["key"])
	}
}

func TestJSONBFlexibleUnmarshalJSONNilPointer(t *testing.T) {
	var flex *JSONBFlexible
	err := flex.UnmarshalJSON([]byte(`{}`))
	if err == nil {
		t.Fatalf("expected error unmarshaling to nil pointer")
	}
}

func TestJSONBFlexibleScanInvalidJSON(t *testing.T) {
	var flex JSONBFlexible
	// Should not error, just set Data to nil
	if err := flex.Scan([]byte(`invalid json`)); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if flex.Data != nil {
		t.Fatalf("expected nil Data for invalid JSON")
	}
}

func TestJSONBFlexibleValueError(t *testing.T) {
	// Create a JSONBFlexible with data that cannot be marshaled
	flex := JSONBFlexible{Data: make(chan int)} // channels cannot be marshaled
	_, err := flex.Value()
	if err == nil {
		t.Fatalf("expected error marshaling invalid data")
	}
}
