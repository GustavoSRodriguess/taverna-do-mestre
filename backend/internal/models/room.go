package models

import "time"

// Room represents a collaborative play space (MVP, stored in-memory for now).
type Room struct {
	ID         string        `json:"id" db:"id"`
	Name       string        `json:"name" db:"name"`
	OwnerID    int           `json:"owner_id" db:"owner_id"`
	CampaignID *int          `json:"campaign_id,omitempty" db:"campaign_id"`
	SceneState JSONBFlexible `json:"scene_state,omitempty" db:"scene_state"`
	CreatedAt  time.Time     `json:"created_at" db:"created_at"`
	UpdatedAt  time.Time     `json:"updated_at" db:"updated_at"`
	Members    []RoomMember  `json:"members,omitempty"`
	Metadata   JSONB         `json:"metadata,omitempty" db:"metadata"`
}

// RoomMember links a user to a room with a role.
type RoomMember struct {
	RoomID   string    `json:"room_id" db:"room_id"`
	UserID   int       `json:"user_id" db:"user_id"`
	Role     string    `json:"role" db:"role"` // e.g. "gm" or "player"
	JoinedAt time.Time `json:"joined_at" db:"joined_at"`
}
