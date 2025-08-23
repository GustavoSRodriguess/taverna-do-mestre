package utils

import (
	"fmt"
	"regexp"
	"strings"
	"unicode"
)

// Validator provides common validation functions
type Validator struct{}

// NewValidator creates a new validator instance
func NewValidator() *Validator {
	return &Validator{}
}

// ValidationError represents a validation error with field information
type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
	Code    string `json:"code"`
}

func (ve ValidationError) Error() string {
	return fmt.Sprintf("%s: %s", ve.Field, ve.Message)
}

// ValidationErrors represents multiple validation errors
type ValidationErrors []ValidationError

func (ve ValidationErrors) Error() string {
	var messages []string
	for _, err := range ve {
		messages = append(messages, err.Error())
	}
	return strings.Join(messages, "; ")
}

func (ve ValidationErrors) HasErrors() bool {
	return len(ve) > 0
}

// Common validation constants
const (
	MinNameLength     = 1
	MaxNameLength     = 255
	MinEmailLength    = 5
	MaxEmailLength    = 320
	MinPasswordLength = 6
	MaxPasswordLength = 128
	MinLevel          = 1
	MaxLevel          = 20
	MinPlayers        = 1
	MaxPlayers        = 10
)

// Email regex pattern
var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)

// ValidateRequired validates that a string field is not empty
func (v *Validator) ValidateRequired(value, fieldName string) error {
	if strings.TrimSpace(value) == "" {
		return ValidationError{
			Field:   fieldName,
			Message: fmt.Sprintf("%s is required", fieldName),
			Code:    "required",
		}
	}
	return nil
}

// ValidateStringLength validates string length within bounds
func (v *Validator) ValidateStringLength(value, fieldName string, min, max int) error {
	length := len(strings.TrimSpace(value))

	if length < min {
		return ValidationError{
			Field:   fieldName,
			Message: fmt.Sprintf("%s must be at least %d characters", fieldName, min),
			Code:    "min_length",
		}
	}

	if length > max {
		return ValidationError{
			Field:   fieldName,
			Message: fmt.Sprintf("%s must be at most %d characters", fieldName, max),
			Code:    "max_length",
		}
	}

	return nil
}

// ValidateLevel validates RPG character/NPC level (1-20)
func (v *Validator) ValidateLevel(level int) error {
	if level < MinLevel || level > MaxLevel {
		return ValidationError{
			Field:   "level",
			Message: fmt.Sprintf("Level must be between %d and %d", MinLevel, MaxLevel),
			Code:    "invalid_range",
		}
	}
	return nil
}

// ValidateIntRange validates integer within specified range
func (v *Validator) ValidateIntRange(value int, fieldName string, min, max int) error {
	if value < min || value > max {
		return ValidationError{
			Field:   fieldName,
			Message: fmt.Sprintf("%s must be between %d and %d", fieldName, min, max),
			Code:    "invalid_range",
		}
	}
	return nil
}

// ValidateEmail validates email format
func (v *Validator) ValidateEmail(email string) error {
	email = strings.TrimSpace(email)

	if err := v.ValidateRequired(email, "email"); err != nil {
		return err
	}

	if err := v.ValidateStringLength(email, "email", MinEmailLength, MaxEmailLength); err != nil {
		return err
	}

	if !emailRegex.MatchString(email) {
		return ValidationError{
			Field:   "email",
			Message: "Invalid email format",
			Code:    "invalid_format",
		}
	}

	return nil
}

// ValidatePassword validates password strength
func (v *Validator) ValidatePassword(password string) error {
	if err := v.ValidateRequired(password, "password"); err != nil {
		return err
	}

	if err := v.ValidateStringLength(password, "password", MinPasswordLength, MaxPasswordLength); err != nil {
		return err
	}

	// Check for at least one letter and one number
	hasLetter := false
	hasNumber := false

	for _, char := range password {
		if unicode.IsLetter(char) {
			hasLetter = true
		}
		if unicode.IsNumber(char) {
			hasNumber = true
		}
	}

	if !hasLetter || !hasNumber {
		return ValidationError{
			Field:   "password",
			Message: "Password must contain at least one letter and one number",
			Code:    "weak_password",
		}
	}

	return nil
}

// ValidateName validates entity name (campaign, character, etc.)
func (v *Validator) ValidateName(name, fieldName string) error {
	if err := v.ValidateRequired(name, fieldName); err != nil {
		return err
	}

	return v.ValidateStringLength(name, fieldName, MinNameLength, MaxNameLength)
}

// ValidatePlayerCount validates number of players in campaign
func (v *Validator) ValidatePlayerCount(count int) error {
	return v.ValidateIntRange(count, "max_players", MinPlayers, MaxPlayers)
}

// ValidateChoice validates that a value is within allowed choices
func (v *Validator) ValidateChoice(value, fieldName string, choices []string) error {
	if err := v.ValidateRequired(value, fieldName); err != nil {
		return err
	}

	for _, choice := range choices {
		if value == choice {
			return nil
		}
	}

	return ValidationError{
		Field:   fieldName,
		Message: fmt.Sprintf("%s must be one of: %s", fieldName, strings.Join(choices, ", ")),
		Code:    "invalid_choice",
	}
}

// ValidateIntChoice validates integer choice
func (v *Validator) ValidateIntChoice(value int, fieldName string, choices []int) error {
	for _, choice := range choices {
		if value == choice {
			return nil
		}
	}

	choiceStrs := make([]string, len(choices))
	for i, choice := range choices {
		choiceStrs[i] = fmt.Sprintf("%d", choice)
	}

	return ValidationError{
		Field:   fieldName,
		Message: fmt.Sprintf("%s must be one of: %s", fieldName, strings.Join(choiceStrs, ", ")),
		Code:    "invalid_choice",
	}
}

// ValidatePositive validates that a number is positive
func (v *Validator) ValidatePositive(value int, fieldName string) error {
	if value <= 0 {
		return ValidationError{
			Field:   fieldName,
			Message: fmt.Sprintf("%s must be positive", fieldName),
			Code:    "invalid_positive",
		}
	}
	return nil
}

// ValidateNonNegative validates that a number is non-negative
func (v *Validator) ValidateNonNegative(value int, fieldName string) error {
	if value < 0 {
		return ValidationError{
			Field:   fieldName,
			Message: fmt.Sprintf("%s must be non-negative", fieldName),
			Code:    "invalid_non_negative",
		}
	}
	return nil
}

// BatchValidate runs multiple validations and returns all errors
func (v *Validator) BatchValidate(validations ...func() error) ValidationErrors {
	var errors ValidationErrors

	for _, validation := range validations {
		if err := validation(); err != nil {
			if ve, ok := err.(ValidationError); ok {
				errors = append(errors, ve)
			} else {
				// Convert generic error to ValidationError
				errors = append(errors, ValidationError{
					Field:   "general",
					Message: err.Error(),
					Code:    "validation_error",
				})
			}
		}
	}

	return errors
}

// Common difficulty levels for encounters
var DifficultyLevels = []string{"easy", "medium", "hard", "deadly", "e", "m", "d", "mo"}

// Common attribute methods
var AttributeMethods = []string{"rolagem", "array", "compra"}

// ValidateDifficulty validates encounter difficulty
func (v *Validator) ValidateDifficulty(difficulty string) error {
	return v.ValidateChoice(difficulty, "difficulty", DifficultyLevels)
}

// ValidateAttributeMethod validates character generation method
func (v *Validator) ValidateAttributeMethod(method string) error {
	return v.ValidateChoice(method, "attributes_method", AttributeMethods)
}
