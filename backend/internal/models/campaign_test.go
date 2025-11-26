package models

import (
	"encoding/json"
	"testing"
	"time"
)

func TestCampaign_JSON(t *testing.T) {
	now := time.Now()
	campaign := Campaign{
		ID:             1,
		Name:           "Test Campaign",
		Description:    "A test campaign",
		DMID:           1,
		MaxPlayers:     6,
		CurrentSession: 1,
		Status:         "active",
		InviteCode:     "ABC12345",
		CreatedAt:      now,
		UpdatedAt:      now,
	}

	data, err := json.Marshal(campaign)
	if err != nil {
		t.Fatalf("failed to marshal campaign: %v", err)
	}

	var decoded Campaign
	if err := json.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("failed to unmarshal campaign: %v", err)
	}

	if decoded.ID != campaign.ID {
		t.Errorf("expected ID %d, got %d", campaign.ID, decoded.ID)
	}
	if decoded.Name != campaign.Name {
		t.Errorf("expected Name %s, got %s", campaign.Name, decoded.Name)
	}
}

func TestCreateCampaignRequest(t *testing.T) {
	req := CreateCampaignRequest{
		Name:        "New Campaign",
		Description: "Description",
		MaxPlayers:  6,
	}

	if req.Name != "New Campaign" {
		t.Errorf("expected Name 'New Campaign', got %s", req.Name)
	}
	if req.MaxPlayers != 6 {
		t.Errorf("expected MaxPlayers 6, got %d", req.MaxPlayers)
	}
}

func TestUpdateCampaignRequest(t *testing.T) {
	req := UpdateCampaignRequest{
		Name:           "Updated Campaign",
		Description:    "Updated Description",
		MaxPlayers:     8,
		CurrentSession: 5,
		Status:         "active",
	}

	if req.Name != "Updated Campaign" {
		t.Errorf("expected Name 'Updated Campaign', got %s", req.Name)
	}
	if req.CurrentSession != 5 {
		t.Errorf("expected CurrentSession 5, got %d", req.CurrentSession)
	}
}

func TestJoinCampaignRequest(t *testing.T) {
	req := JoinCampaignRequest{
		InviteCode: "ABC1-2345",
	}

	if req.InviteCode != "ABC1-2345" {
		t.Errorf("expected InviteCode 'ABC1-2345', got %s", req.InviteCode)
	}
}

func TestCampaignInviteResponse(t *testing.T) {
	resp := CampaignInviteResponse{
		InviteCode: "ABC1-2345",
		Message:    "Share this code",
	}

	if resp.InviteCode != "ABC1-2345" {
		t.Errorf("expected InviteCode 'ABC1-2345', got %s", resp.InviteCode)
	}
}

func TestCampaignSummary(t *testing.T) {
	now := time.Now()
	summary := CampaignSummary{
		ID:             1,
		Name:           "Test Campaign",
		Description:    "Description",
		Status:         "active",
		PlayerCount:    3,
		MaxPlayers:     6,
		CurrentSession: 1,
		DMName:         "DM User",
		InviteCode:     "ABC12345",
		CreatedAt:      now,
		UpdatedAt:      now,
	}

	if summary.DMName != "DM User" {
		t.Errorf("expected DMName 'DM User', got %s", summary.DMName)
	}
	if summary.PlayerCount != 3 {
		t.Errorf("expected PlayerCount 3, got %d", summary.PlayerCount)
	}
}

func TestAddCharacterRequest(t *testing.T) {
	req := AddCharacterRequest{
		PCID: 1,
	}

	if req.PCID != 1 {
		t.Errorf("expected PCID 1, got %d", req.PCID)
	}
}

func TestUpdateCharacterStatusRequest(t *testing.T) {
	currentHP := 25
	req := UpdateCharacterStatusRequest{
		CurrentHP: &currentHP,
		Status:    "active",
		Notes:     "Test notes",
	}

	if *req.CurrentHP != 25 {
		t.Errorf("expected CurrentHP 25, got %d", *req.CurrentHP)
	}
	if req.Status != "active" {
		t.Errorf("expected Status 'active', got %s", req.Status)
	}
}

func TestSyncCharacterRequest(t *testing.T) {
	req := SyncCharacterRequest{
		SyncToOtherCampaigns: true,
	}

	if !req.SyncToOtherCampaigns {
		t.Error("expected SyncToOtherCampaigns to be true")
	}
}
