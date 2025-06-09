package models

import (
	"time"
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

type CampaignCharacter struct {
	ID         int   `json:"id" db:"id"`
	CampaignID int   `json:"campaign_id" db:"campaign_id"`
	PlayerID   int   `json:"player_id" db:"player_id"`
	Player     *User `json:"player,omitempty"`
	PCID       int   `json:"pc_id" db:"pc_id"`

	Status   string    `json:"status" db:"status"` // active, inactive, dead, retired
	JoinedAt time.Time `json:"joined_at" db:"joined_at"`

	CurrentHP *int   `json:"current_hp,omitempty" db:"current_hp"`
	TempAC    *int   `json:"temp_ac,omitempty" db:"temp_ac"`
	Notes     string `json:"campaign_notes" db:"campaign_notes"`

	PC *PC `json:"pc,omitempty"`
}

type CreateCampaignRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	MaxPlayers  int    `json:"max_players"`
}

type UpdateCampaignRequest struct {
	Name           string `json:"name"`
	Description    string `json:"description"`
	MaxPlayers     int    `json:"max_players"`
	CurrentSession int    `json:"current_session"`
	Status         string `json:"status"`
}

type JoinCampaignRequest struct {
	InviteCode string `json:"invite_code" binding:"required"`
}

type CampaignInviteResponse struct {
	InviteCode string `json:"invite_code"`
	Message    string `json:"message"`
}

type AddCharacterRequest struct {
	PCID int `json:"pc_id" binding:"required"`
}

type UpdateCharacterStatusRequest struct {
	CurrentHP *int   `json:"current_hp"`
	TempAC    *int   `json:"temp_ac"`
	Status    string `json:"status"`
	Notes     string `json:"campaign_notes"`
}

type CampaignSummary struct {
	ID             int       `json:"id" db:"id"`
	Name           string    `json:"name" db:"name"`
	Description    string    `json:"description" db:"description"`
	Status         string    `json:"status" db:"status"`
	PlayerCount    int       `json:"player_count" db:"player_count"`
	MaxPlayers     int       `json:"max_players" db:"max_players"`
	CurrentSession int       `json:"current_session" db:"current_session"`
	DMName         string    `json:"dm_name" db:"dm_name"`
	InviteCode     string    `json:"invite_code,omitempty" db:"invite_code"`
	CreatedAt      time.Time `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time `json:"updated_at" db:"updated_at"`
}
