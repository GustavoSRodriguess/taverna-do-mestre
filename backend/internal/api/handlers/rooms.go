package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/gorilla/websocket"

	"rpg-saas-backend/internal/api/middleware"
	"rpg-saas-backend/internal/auth"
	"rpg-saas-backend/internal/db"
	"rpg-saas-backend/internal/models"
	"rpg-saas-backend/internal/utils"
)

// RoomHandler implements a minimal room flow backed by Postgres.
type RoomHandler struct {
	DB       *db.PostgresDB
	Response *utils.ResponseHandler
	Hub      *RoomHub
}

// NewRoomHandler creates a handler with DB persistence.
func NewRoomHandler(db *db.PostgresDB) *RoomHandler {
	return &RoomHandler{
		DB:       db,
		Response: utils.NewResponseHandler(),
		Hub:      NewRoomHub(),
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

		// Reuse existing room for the campaign if present
		existing, err := h.DB.GetRoomByCampaignID(r.Context(), *payload.CampaignID)
		if err != nil {
			h.Response.HandleDBError(w, err, "fetch campaign room")
			return
		}
		if existing != nil {
			_, _ = h.DB.AddRoomMember(r.Context(), existing.ID, userID, roleForUser(userID, existing.OwnerID))
			members, _ := h.DB.ListRoomMembers(r.Context(), existing.ID)
			existing.Members = members
			h.Response.SendSuccess(w, "room already exists for campaign", existing)
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

// GetCampaignRoom retorna a sala vinculada a uma campanha, se existir.
func (h *RoomHandler) GetCampaignRoom(w http.ResponseWriter, r *http.Request) {
	userID, ok := getUserIDFromContext(r)
	if !ok {
		h.Response.SendUnauthorized(w, "user not found in context")
		return
	}

	rawID := chi.URLParam(r, "id")
	campaignID, err := strconv.Atoi(rawID)
	if err != nil {
		h.Response.SendBadRequest(w, "invalid campaign id")
		return
	}

	hasAccess, err := h.DB.HasCampaignAccess(r.Context(), campaignID, userID)
	if err != nil {
		h.Response.HandleDBError(w, err, "campaign access check")
		return
	}
	if !hasAccess {
		h.Response.SendForbidden(w, "user not in campaign")
		return
	}

	room, err := h.DB.GetRoomByCampaignID(r.Context(), campaignID)
	if err != nil {
		h.Response.HandleDBError(w, err, "fetch campaign room")
		return
	}
	if room == nil {
		h.Response.SendNotFound(w, "room not found")
		return
	}

	members, _ := h.DB.ListRoomMembers(r.Context(), room.ID)
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

// RoomWebsocket lida com conexões websocket por sala para presença, chat, cena e dados.
func (h *RoomHandler) RoomWebsocket(w http.ResponseWriter, r *http.Request) {
	roomID := chi.URLParam(r, "id")

	token := r.URL.Query().Get("token")
	if token == "" {
		authHeader := r.Header.Get("Authorization")
		if parts := strings.Split(authHeader, " "); len(parts) == 2 && strings.ToLower(parts[0]) == "bearer" {
			token = parts[1]
		}
	}
	if token == "" {
		http.Error(w, "missing token", http.StatusUnauthorized)
		return
	}

	claims, err := auth.ValidateToken(token)
	if err != nil {
		http.Error(w, "invalid token", http.StatusUnauthorized)
		return
	}
	userID := claims.UserID

	room, err := h.DB.GetRoomByID(r.Context(), roomID)
	if err != nil {
		http.Error(w, "room lookup failed", http.StatusInternalServerError)
		return
	}
	if room == nil {
		http.Error(w, "room not found", http.StatusNotFound)
		return
	}

	if room.CampaignID != nil {
		hasAccess, err := h.DB.HasCampaignAccess(r.Context(), *room.CampaignID, userID)
		if err != nil {
			http.Error(w, "campaign access check failed", http.StatusInternalServerError)
			return
		}
		if !hasAccess {
			http.Error(w, "user not in campaign", http.StatusForbidden)
			return
		}
	}

	// Garantir membership e papel correto
	_, _ = h.DB.AddRoomMember(r.Context(), roomID, userID, roleForUser(userID, room.OwnerID))

	conn, err := websocketUpgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}

	h.Hub.Add(roomID, conn, userID)
	defer func() {
		h.Hub.Remove(roomID, conn)
		_ = conn.Close()
		h.Hub.Broadcast(roomID, RoomSocketMessage{
			Type:      "presence:update",
			RoomID:    roomID,
			SenderID:  userID,
			Members:   h.Hub.Members(roomID),
			Timestamp: time.Now().UnixMilli(),
		})
	}()

	members, _ := h.DB.ListRoomMembers(r.Context(), roomID)
	room.Members = members

	// Envia estado inicial da cena
	_ = conn.WriteJSON(RoomSocketMessage{
		Type:       "scene:state",
		RoomID:     roomID,
		SceneState: room.SceneState,
		Timestamp:  time.Now().UnixMilli(),
	})

	// Broadcast de presença para todos
	h.Hub.Broadcast(roomID, RoomSocketMessage{
		Type:      "presence:update",
		RoomID:    roomID,
		SenderID:  userID,
		Members:   h.Hub.Members(roomID),
		Timestamp: time.Now().UnixMilli(),
	})

	// Loop principal de mensagens
	for {
		var msg RoomSocketMessage
		if err := conn.ReadJSON(&msg); err != nil {
			break
		}

		msg.RoomID = roomID
		msg.SenderID = userID
		msg.Timestamp = time.Now().UnixMilli()

		switch msg.Type {
		case "chat:message":
			h.Hub.Broadcast(roomID, msg)
		case "scene:update":
			updated, err := h.DB.UpdateRoomScene(r.Context(), roomID, msg.SceneState, msg.Metadata)
			if err != nil {
				writeSocketError(conn, "failed to persist scene")
				continue
			}
			if updated != nil {
				msg.SceneState = updated.SceneState
			}
			msg.Type = "scene:state"
			h.Hub.Broadcast(roomID, msg)
		case "presence:ping":
			_ = conn.WriteJSON(RoomSocketMessage{
				Type:      "presence:update",
				RoomID:    roomID,
				Members:   h.Hub.Members(roomID),
				Timestamp: msg.Timestamp,
			})
		case "dice:roll":
			h.Hub.Broadcast(roomID, msg)
		default:
			// ignore unknown message types
		}
	}
}

var websocketUpgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

type RoomSocketMessage struct {
	Type       string               `json:"type"`
	RoomID     string               `json:"room_id,omitempty"`
	SenderID   int                  `json:"sender_id,omitempty"`
	Message    string               `json:"message,omitempty"`
	SceneState models.JSONBFlexible `json:"scene_state,omitempty"`
	Dice       map[string]any       `json:"dice,omitempty"`
	Metadata   map[string]any       `json:"metadata,omitempty"`
	Members    []int                `json:"members,omitempty"`
	Timestamp  int64                `json:"timestamp,omitempty"`
}

type SocketClient struct {
	Conn   *websocket.Conn
	UserID int
}

type RoomHub struct {
	mu    sync.RWMutex
	rooms map[string]map[*websocket.Conn]*SocketClient
}

func NewRoomHub() *RoomHub {
	return &RoomHub{
		rooms: make(map[string]map[*websocket.Conn]*SocketClient),
	}
}

func (h *RoomHub) Add(roomID string, conn *websocket.Conn, userID int) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if _, ok := h.rooms[roomID]; !ok {
		h.rooms[roomID] = make(map[*websocket.Conn]*SocketClient)
	}
	h.rooms[roomID][conn] = &SocketClient{Conn: conn, UserID: userID}
}

func (h *RoomHub) Remove(roomID string, conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if room, ok := h.rooms[roomID]; ok {
		delete(room, conn)
		if len(room) == 0 {
			delete(h.rooms, roomID)
		}
	}
}

func (h *RoomHub) Members(roomID string) []int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	room := h.rooms[roomID]
	members := []int{}
	seen := make(map[int]bool)
	for _, client := range room {
		if !seen[client.UserID] {
			members = append(members, client.UserID)
			seen[client.UserID] = true
		}
	}
	return members
}

func (h *RoomHub) Broadcast(roomID string, msg RoomSocketMessage) {
	h.mu.RLock()
	clients := make([]*SocketClient, 0, len(h.rooms[roomID]))
	for _, client := range h.rooms[roomID] {
		clients = append(clients, client)
	}
	h.mu.RUnlock()

	for _, client := range clients {
		if err := client.Conn.WriteJSON(msg); err != nil {
			client.Conn.Close()
			h.Remove(roomID, client.Conn)
		}
	}
}

func writeSocketError(conn *websocket.Conn, message string) {
	_ = conn.WriteJSON(RoomSocketMessage{
		Type:      "error",
		Message:   message,
		Timestamp: time.Now().UnixMilli(),
	})
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
