package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"

	"rpg-saas-backend/internal/api/middleware"
	"rpg-saas-backend/internal/db"
	"rpg-saas-backend/internal/models"
	"rpg-saas-backend/internal/utils"
)

// RoomHandler implements a minimal room flow backed by Postgres.
type RoomHandler struct {
	DB       *db.PostgresDB
	Response *utils.ResponseHandler
}

// NewRoomHandler creates a handler with DB persistence.
func NewRoomHandler(db *db.PostgresDB) *RoomHandler {
	return &RoomHandler{
		DB:       db,
		Response: utils.NewResponseHandler(),
	}
}

// CreateRoomRequest represents the payload for creating a room.
type CreateRoomRequest struct {
	Name string `json:"name"`
	// Optional campaign binding; if set, user must belong to the campaign.
	CampaignID *int           `json:"campaign_id,omitempty"`
	Metadata   map[string]any `json:"metadata,omitempty"`
}

// UpdateSceneRequest represents the payload for updating the scene state.
type UpdateSceneRequest struct {
	SceneState models.JSONBFlexible `json:"scene_state"`
	Metadata   map[string]any       `json:"metadata,omitempty"`
}

func (h *RoomHandler) CreateRoom(w http.ResponseWriter, r *http.Request) {
	userID, ok := getUserIDFromContext(r)
	if !ok {
		h.Response.SendUnauthorized(w, "user not found in context")
		return
	}

	var payload CreateRoomRequest
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		h.Response.SendBadRequest(w, "invalid request body")
		return
	}
	if payload.Name == "" {
		payload.Name = "Sala sem nome"
	}

	if payload.CampaignID != nil {
		hasAccess, err := h.DB.HasCampaignAccess(r.Context(), *payload.CampaignID, userID)
		if err != nil {
			h.Response.HandleDBError(w, err, "campaign access check")
			return
		}
		if !hasAccess {
			h.Response.SendForbidden(w, "user not in campaign")
			return
		}
	}

	room := &models.Room{
		ID:         generateRoomID(),
		Name:       payload.Name,
		OwnerID:    userID,
		CampaignID: payload.CampaignID,
		Metadata:   models.JSONB(payload.Metadata),
		CreatedAt:  time.Now().UTC(),
		UpdatedAt:  time.Now().UTC(),
	}

	created, err := h.DB.CreateRoom(r.Context(), room)
	if err != nil {
		h.Response.HandleDBError(w, err, "create room")
		return
	}

	// Add owner as GM
	_, err = h.DB.AddRoomMember(r.Context(), created.ID, userID, "gm")
	if err != nil {
		h.Response.HandleDBError(w, err, "add room member")
		return
	}

	members, _ := h.DB.ListRoomMembers(r.Context(), created.ID)
	created.Members = members
	h.Response.SendCreated(w, "room created", created)
}

func (h *RoomHandler) GetRoom(w http.ResponseWriter, r *http.Request) {
	roomID := chi.URLParam(r, "id")
	room, err := h.DB.GetRoomByID(r.Context(), roomID)
	if err != nil {
		h.Response.HandleDBError(w, err, "fetch room")
		return
	}
	if room == nil {
		h.Response.SendNotFound(w, "room not found")
		return
	}

	members, _ := h.DB.ListRoomMembers(r.Context(), roomID)
	room.Members = members
	h.Response.SendJSON(w, room, http.StatusOK)
}

func (h *RoomHandler) JoinRoom(w http.ResponseWriter, r *http.Request) {
	userID, ok := getUserIDFromContext(r)
	if !ok {
		h.Response.SendUnauthorized(w, "user not found in context")
		return
	}

	roomID := chi.URLParam(r, "id")
	room, err := h.DB.GetRoomByID(r.Context(), roomID)
	if err != nil {
		h.Response.HandleDBError(w, err, "fetch room")
		return
	}
	if room == nil {
		h.Response.SendNotFound(w, "room not found")
		return
	}

	if room.CampaignID != nil {
		hasAccess, err := h.DB.HasCampaignAccess(r.Context(), *room.CampaignID, userID)
		if err != nil {
			h.Response.HandleDBError(w, err, "campaign access check")
			return
		}
		if !hasAccess {
			h.Response.SendForbidden(w, "user not in campaign")
			return
		}
	}

	member, err := h.DB.AddRoomMember(r.Context(), roomID, userID, roleForUser(userID, room.OwnerID))
	if err != nil {
		h.Response.HandleDBError(w, err, "add room member")
		return
	}

	members, _ := h.DB.ListRoomMembers(r.Context(), roomID)
	room.Members = members
	h.Response.SendSuccess(w, "joined room", map[string]any{
		"room":   room,
		"member": member,
	})
}

func (h *RoomHandler) UpdateScene(w http.ResponseWriter, r *http.Request) {
	userID, ok := getUserIDFromContext(r)
	if !ok {
		h.Response.SendUnauthorized(w, "user not found in context")
		return
	}

	roomID := chi.URLParam(r, "id")
	room, err := h.DB.GetRoomByID(r.Context(), roomID)
	if err != nil {
		h.Response.HandleDBError(w, err, "fetch room")
		return
	}
	if room == nil {
		h.Response.SendNotFound(w, "room not found")
		return
	}

	if room.CampaignID != nil {
		hasAccess, err := h.DB.HasCampaignAccess(r.Context(), *room.CampaignID, userID)
		if err != nil {
			h.Response.HandleDBError(w, err, "campaign access check")
			return
		}
		if !hasAccess {
			h.Response.SendForbidden(w, "user not in campaign")
			return
		}
	}

	// Allow only members to update
	isMember, err := h.DB.IsRoomMember(r.Context(), roomID, userID)
	if err != nil {
		h.Response.HandleDBError(w, err, "check room member")
		return
	}
	if !isMember {
		h.Response.SendForbidden(w, "user is not a member of this room")
		return
	}

	var payload UpdateSceneRequest
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		h.Response.SendBadRequest(w, "invalid request body")
		return
	}

	updated, err := h.DB.UpdateRoomScene(r.Context(), roomID, payload.SceneState, payload.Metadata)
	if err != nil {
		h.Response.HandleDBError(w, err, "update scene")
		return
	}
	if updated == nil {
		h.Response.SendNotFound(w, "room not found")
		return
	}

	members, _ := h.DB.ListRoomMembers(r.Context(), roomID)
	updated.Members = members
	h.Response.SendSuccess(w, "scene updated", updated)
}

// Helper methods for context and roles
func getUserIDFromContext(r *http.Request) (int, bool) {
	raw := r.Context().Value(middleware.UserIDKey)
	userID, ok := raw.(int)
	return userID, ok
}

func roleForUser(userID, ownerID int) string {
	if userID == ownerID {
		return "gm"
	}
	return "player"
}

// generateRoomID creates a short unique identifier without pulling extra deps.
func generateRoomID() string {
	return strconv.FormatInt(time.Now().UTC().UnixNano(), 36)
}
