// frontend/src/services/campaignService.ts - Versão Refatorada
import { fetchFromAPI } from "./apiService";
import { StatusType, BaseCharacter } from "../types/game";

export interface Campaign {
    id: number;
    name: string;
    description: string;
    dm_id: number;
    max_players: number;
    current_session: number;
    status: StatusType;
    allow_homebrew: boolean;
    invite_code: string;
    created_at: string;
    updated_at: string;
    player_count?: number;
    dm_name?: string;
    players?: CampaignPlayer[];
    characters?: CampaignCharacter[];
}

export interface CampaignPlayer {
    id: number;
    campaign_id: number;
    user_id: number;
    joined_at: string;
    status: StatusType;
    user?: {
        id: number;
        username: string;
        email: string;
    };
}

// Interface para o modelo de snapshot completo
export interface CampaignCharacter {
    id: number;
    campaign_id: number;
    player_id: number;
    source_pc_id: number; // ID do PC original

    // Snapshot completo do PC
    name: string;
    description: string;
    level: number;
    race: string;
    class: string;
    background: string;
    alignment: string;
    attributes: any;
    abilities: any;
    equipment: any;
    hp: number;
    current_hp?: number;
    ca: number;
    proficiency_bonus: number;
    inspiration: boolean;
    skills: any;
    attacks: any;
    spells: any;
    personality_traits: string;
    ideals: string;
    bonds: string;
    flaws: string;
    features: string[];
    player_name: string;

    // Metadados da campanha
    status: StatusType;
    joined_at: string;
    last_sync?: string;
    campaign_notes: string;

    player?: {
        id: number;
        username: string;
    };
}

export interface CreateCampaignData {
    name: string;
    description: string;
    max_players: number;
    allow_homebrew: boolean;
}

export interface UpdateCampaignData {
    name?: string;
    description?: string;
    max_players?: number;
    current_session?: number;
    status?: StatusType;
    allow_homebrew?: boolean;
}

export interface AddCharacterData {
    source_pc_id: number;
}

export interface UpdateCharacterData {
    current_hp?: number;
    temp_ac?: number;
    status?: StatusType;
    campaign_notes?: string;
}

// Interface para atualização completa do PC na campanha
export interface UpdateCampaignCharacterData {
    name?: string;
    description?: string;
    level?: number;
    race?: string;
    class?: string;
    background?: string;
    alignment?: string;
    attributes?: any;
    abilities?: any;
    equipment?: any;
    hp?: number;
    current_hp?: number;
    ca?: number;
    proficiency_bonus?: number;
    inspiration?: boolean;
    skills?: any;
    attacks?: any;
    spells?: any;
    personality_traits?: string;
    ideals?: string;
    bonds?: string;
    flaws?: string;
    features?: string[];
    player_name?: string;
    status?: StatusType;
    campaign_notes?: string;
}

// Interface para sincronização
export interface SyncCharacterData {
    sync_to_other_campaigns?: boolean;
}

// Campaign Service Class
class CampaignService {
    // Campaign CRUD
    async getCampaigns(): Promise<{ campaigns: Campaign[], results: any, count: number }> {
        return fetchFromAPI('/campaigns');
    }

    async getCampaign(id: number): Promise<Campaign> {
        return fetchFromAPI(`/campaigns/${id}`);
    }

    async createCampaign(data: CreateCampaignData): Promise<Campaign> {
        return fetchFromAPI('/campaigns', 'POST', data);
    }

    async updateCampaign(id: number, data: UpdateCampaignData): Promise<Campaign> {
        return fetchFromAPI(`/campaigns/${id}`, 'PUT', data);
    }

    async deleteCampaign(id: number): Promise<void> {
        return fetchFromAPI(`/campaigns/${id}`, 'DELETE');
    }

    // Invite Management
    async getInviteCode(id: number): Promise<{ invite_code: string, message: string }> {
        return fetchFromAPI(`/campaigns/${id}/invite-code`);
    }

    async regenerateInviteCode(id: number): Promise<{ invite_code: string, message: string }> {
        return fetchFromAPI(`/campaigns/${id}/regenerate-code`, 'POST');
    }

    async joinCampaign(inviteCode: string): Promise<{ message: string }> {
        return fetchFromAPI('/campaigns/join', 'POST', { invite_code: inviteCode });
    }

    async leaveCampaign(id: number): Promise<void> {
        return fetchFromAPI(`/campaigns/${id}/leave`, 'DELETE');
    }

    // Character Management
    async getAvailableCharacters(id: number): Promise<{ available_characters: BaseCharacter[], results: any, count: number }> {
        return fetchFromAPI(`/campaigns/${id}/available-characters`);
    }

    async getCampaignCharacters(id: number): Promise<{ characters: CampaignCharacter[], count: number }> {
        return fetchFromAPI(`/campaigns/${id}/characters`);
    }

    async addCharacterToCampaign(campaignId: number, data: AddCharacterData): Promise<CampaignCharacter> {
        return fetchFromAPI(`/campaigns/${campaignId}/characters`, 'POST', data);
    }

    async updateCampaignCharacterStatus(campaignId: number, characterId: number, data: UpdateCharacterData): Promise<CampaignCharacter> {
        return fetchFromAPI(`/campaigns/${campaignId}/characters/${characterId}`, 'PUT', data);
    }

    async removeCampaignCharacter(campaignId: number, characterId: number): Promise<void> {
        return fetchFromAPI(`/campaigns/${campaignId}/characters/${characterId}`, 'DELETE');
    }

    // Novos métodos para gerenciar snapshots completos
    async getCampaignCharacter(campaignId: number, characterId: number): Promise<CampaignCharacter> {
        return fetchFromAPI(`/campaigns/${campaignId}/characters/${characterId}`);
    }

    async updateCampaignCharacterFull(campaignId: number, characterId: number, data: UpdateCampaignCharacterData): Promise<CampaignCharacter> {
        return fetchFromAPI(`/campaigns/${campaignId}/characters/${characterId}/full`, 'PUT', data);
    }

    async syncCampaignCharacter(campaignId: number, characterId: number, data: SyncCharacterData): Promise<{ message: string }> {
        return fetchFromAPI(`/campaigns/${campaignId}/characters/${characterId}/sync`, 'POST', data);
    }

    // Utility methods
    validateCampaignData(data: CreateCampaignData): string[] {
        const errors: string[] = [];

        if (!data.name?.trim()) errors.push('Nome da campanha é obrigatório');
        if (data.name && data.name.length > 100) errors.push('Nome deve ter no máximo 100 caracteres');
        if (data.max_players < 1 || data.max_players > 10) errors.push('Número de jogadores deve ser entre 1 e 10');
        if (data.description && data.description.length > 500) errors.push('Descrição deve ter no máximo 500 caracteres');

        return errors;
    }

    validateInviteCode(code: string): string | null {
        const cleanCode = code.replace(/[^A-Za-z0-9]/g, '');
        if (cleanCode.length !== 8) return 'Código deve ter 8 caracteres';
        return null;
    }
}

export const campaignService = new CampaignService();
export default campaignService;