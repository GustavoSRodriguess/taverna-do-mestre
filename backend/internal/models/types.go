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
type JSONBFlexible struct {
	Data any
}

func (j JSONBFlexible) Unmarshal(m *map[string]any) any {
	panic("unimplemented")
}

func (j *JSONBFlexible) Scan(value any) error {
	if value == nil {
		j.Data = nil
		return nil
	}

	var result any
	switch v := value.(type) {
	case []byte:
		if err := json.Unmarshal(v, &result); err != nil {
			j.Data = nil // Se falhar, usar nil
			return nil
		}
	case string:
		if err := json.Unmarshal([]byte(v), &result); err != nil {
			j.Data = nil
			return nil
		}
	default:
		return fmt.Errorf("cannot scan %T into JSONBFlexible", value)
	}

	j.Data = result
	return nil
}

func (j JSONBFlexible) Value() (driver.Value, error) {
	if j.Data == nil {
		return nil, nil
	}
	data, err := json.Marshal(j.Data)
	if err != nil {
		return nil, err
	}
	return string(data), nil
}

// MarshalJSON implementa json.Marshaler
func (j JSONBFlexible) MarshalJSON() ([]byte, error) {
	if j.Data == nil {
		return []byte("null"), nil
	}
	return json.Marshal(j.Data)
}

// UnmarshalJSON implementa json.Unmarshaler
func (j *JSONBFlexible) UnmarshalJSON(data []byte) error {
	if j == nil {
		return errors.New("JSONBFlexible: UnmarshalJSON on nil pointer")
	}
	return json.Unmarshal(data, &j.Data)
}
