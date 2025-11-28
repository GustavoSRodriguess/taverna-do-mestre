package models

import (
	"time"

	"github.com/lib/pq"
)

type Campaign struct {
	ID             int                 `json:"id" db:"id"`
	Name           string              `json:"name" db:"name"`
	Description    string              `json:"description" db:"description"`
	DMID           int                 `json:"dm_id" db:"dm_id"`
	DM             *User               `json:"dm,omitempty"`
	MaxPlayers     int                 `json:"max_players" db:"max_players"`
	CurrentSession int                 `json:"current_session" db:"current_session"`
	Status         string              `json:"status" db:"status"` // planning, active, paused, completed
	AllowHomebrew  bool                `json:"allow_homebrew" db:"allow_homebrew"`
	InviteCode     string              `json:"invite_code" db:"invite_code"`
	CreatedAt      time.Time           `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time           `json:"updated_at" db:"updated_at"`
	Players        []CampaignPlayer    `json:"players,omitempty"`
	Characters     []CampaignCharacter `json:"characters,omitempty"`
	PlayerCount    int                 `json:"player_count,omitempty"`
}

type CampaignPlayer struct {
	ID         int       `json:"id" db:"id"`
	CampaignID int       `json:"campaign_id" db:"campaign_id"`
	UserID     int       `json:"user_id" db:"user_id"`
	User       *User     `json:"user,omitempty"`
	JoinedAt   time.Time `json:"joined_at" db:"joined_at"`
	Status     string    `json:"status" db:"status"` // active, inactive, removed
}

// CampaignCharacter - Snapshot completo do PC para uma campanha específica
type CampaignCharacter struct {
	ID         int   `json:"id" db:"id"`
	CampaignID int   `json:"campaign_id" db:"campaign_id"`
	PlayerID   int   `json:"player_id" db:"player_id"`
	Player     *User `json:"player,omitempty"`
	SourcePCID int   `json:"source_pc_id" db:"source_pc_id"` // Referência ao PC original

	// Snapshot completo do PC
	Name              string         `json:"name" db:"name"`
	Description       string         `json:"description" db:"description"`
	Level             int            `json:"level" db:"level"`
	Race              string         `json:"race" db:"race"`
	Class             string         `json:"class" db:"class"`
	Background        string         `json:"background" db:"background"`
	Alignment         string         `json:"alignment" db:"alignment"`
	Attributes        JSONBFlexible  `json:"attributes" db:"attributes"`
	Abilities         JSONBFlexible  `json:"abilities" db:"abilities"`
	Equipment         JSONBFlexible  `json:"equipment" db:"equipment"`
	HP                int            `json:"hp" db:"hp"`
	CurrentHP         *int           `json:"current_hp" db:"current_hp"`
	CA                int            `json:"ca" db:"ca"`
	ProficiencyBonus  int            `json:"proficiency_bonus" db:"proficiency_bonus"`
	Inspiration       bool           `json:"inspiration" db:"inspiration"`
	Skills            JSONBFlexible  `json:"skills" db:"skills"`
	Attacks           JSONBFlexible  `json:"attacks" db:"attacks"`
	Spells            JSONBFlexible  `json:"spells" db:"spells"`
	PersonalityTraits string         `json:"personality_traits" db:"personality_traits"`
	Ideals            string         `json:"ideals" db:"ideals"`
	Bonds             string         `json:"bonds" db:"bonds"`
	Flaws             string         `json:"flaws" db:"flaws"`
	Features          pq.StringArray `json:"features" db:"features"`
	PlayerName        string         `json:"player_name" db:"player_name"`

	// Metadados específicos da campanha
	Status        string     `json:"status" db:"status"` // active, inactive, dead, retired
	JoinedAt      time.Time  `json:"joined_at" db:"joined_at"`
	LastSync      *time.Time `json:"last_sync" db:"last_sync"`
	CampaignNotes string     `json:"campaign_notes" db:"campaign_notes"`
}

type CreateCampaignRequest struct {
	Name          string `json:"name" binding:"required"`
	Description   string `json:"description"`
	MaxPlayers    int    `json:"max_players"`
	AllowHomebrew bool   `json:"allow_homebrew"`
}

type UpdateCampaignRequest struct {
	Name           string `json:"name"`
	Description    string `json:"description"`
	MaxPlayers     int    `json:"max_players"`
	CurrentSession int    `json:"current_session"`
	Status         string `json:"status"`
	AllowHomebrew  *bool  `json:"allow_homebrew"`
}

type JoinCampaignRequest struct {
	InviteCode string `json:"invite_code" binding:"required"`
}

type CampaignInviteResponse struct {
	InviteCode string `json:"invite_code"`
	Message    string `json:"message"`
}

type AddCharacterRequest struct {
	PCID int `json:"source_pc_id" binding:"required"`
}

type UpdateCharacterStatusRequest struct {
	CurrentHP *int   `json:"current_hp"`
	TempAC    *int   `json:"temp_ac"`
	Status    string `json:"status"`
	Notes     string `json:"campaign_notes"`
}

// Novo request para atualizar PC completo na campanha
type UpdateCampaignCharacterRequest struct {
	Name              string        `json:"name"`
	Description       string        `json:"description"`
	Level             int           `json:"level"`
	Race              string        `json:"race"`
	Class             string        `json:"class"`
	Background        string        `json:"background"`
	Alignment         string        `json:"alignment"`
	Attributes        JSONBFlexible `json:"attributes"`
	Abilities         JSONBFlexible `json:"abilities"`
	Equipment         JSONBFlexible `json:"equipment"`
	HP                int           `json:"hp"`
	CurrentHP         *int          `json:"current_hp"`
	CA                int           `json:"ca"`
	ProficiencyBonus  int           `json:"proficiency_bonus"`
	Inspiration       bool          `json:"inspiration"`
	Skills            JSONBFlexible `json:"skills"`
	Attacks           JSONBFlexible `json:"attacks"`
	Spells            JSONBFlexible `json:"spells"`
	PersonalityTraits string        `json:"personality_traits"`
	Ideals            string        `json:"ideals"`
	Bonds             string        `json:"bonds"`
	Flaws             string        `json:"flaws"`
	Features          []string      `json:"features"`
	PlayerName        string        `json:"player_name"`
	Status            string        `json:"status"`
	CampaignNotes     string        `json:"campaign_notes"`
}

// Request para sincronizar com o PC original
type SyncCharacterRequest struct {
	SyncToOtherCampaigns bool `json:"sync_to_other_campaigns"` // Se deve sincronizar com outras campanhas
}

type CampaignSummary struct {
	ID             int       `json:"id" db:"id"`
	Name           string    `json:"name" db:"name"`
	Description    string    `json:"description" db:"description"`
	Status         string    `json:"status" db:"status"`
	AllowHomebrew  bool      `json:"allow_homebrew" db:"allow_homebrew"`
	PlayerCount    int       `json:"player_count" db:"player_count"`
	MaxPlayers     int       `json:"max_players" db:"max_players"`
	CurrentSession int       `json:"current_session" db:"current_session"`
	DMName         string    `json:"dm_name" db:"dm_name"`
	InviteCode     string    `json:"invite_code,omitempty" db:"invite_code"`
	CreatedAt      time.Time `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time `json:"updated_at" db:"updated_at"`
}
