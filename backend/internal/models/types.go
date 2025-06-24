package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"fmt"
)

// JSONB original - usado para maps/objects (item.go, npc.go, etc.)
type JSONB map[string]any

func (j JSONB) ToJSON() {
	panic("unimplemented")
}

func (j JSONB) String() {
	panic("unimplemented")
}

func (j JSONB) Value() (driver.Value, error) {
	if j == nil {
		return nil, nil
	}
	valueString, err := json.Marshal(j)
	return string(valueString), err
}

func (j *JSONB) Scan(value any) error {
	if value == nil {
		*j = nil
		return nil
	}

	bytes, ok := value.([]byte)
	if !ok {
		return errors.New(fmt.Sprint("Failed to unmarshal JSONB value:", value))
	}

	result := JSONB{}
	err := json.Unmarshal(bytes, &result)
	*j = result
	return err
}

// JSONBFlexible - tipo flexível que aceita arrays, objects, etc. (pc.go)
type JSONBFlexible json.RawMessage

func (j JSONBFlexible) Value() (driver.Value, error) {
	if j == nil {
		return nil, nil
	}
	return string(j), nil
}

func (j *JSONBFlexible) Scan(value any) error {
	if value == nil {
		*j = nil
		return nil
	}

	switch v := value.(type) {
	case []byte:
		*j = JSONBFlexible(v)
		return nil
	case string:
		*j = JSONBFlexible(v)
		return nil
	default:
		return fmt.Errorf("cannot scan %T into JSONBFlexible", value)
	}
}

// MarshalJSON implementa json.Marshaler
func (j JSONBFlexible) MarshalJSON() ([]byte, error) {
	if j == nil {
		return []byte("null"), nil
	}
	return []byte(j), nil
}

// UnmarshalJSON implementa json.Unmarshaler
func (j *JSONBFlexible) UnmarshalJSON(data []byte) error {
	if j == nil {
		return errors.New("JSONBFlexible: UnmarshalJSON on nil pointer")
	}
	*j = append((*j)[0:0], data...)
	return nil
}
