import { fetchFromAPI } from "./apiService";

export interface Campaign {
    id: number;
    name: string;
    description: string;
    dm_id: number;
    max_players: number;
    current_session: number;
    status: 'planning' | 'active' | 'paused' | 'completed';
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
    status: 'active' | 'inactive' | 'removed';
    user?: {
        id: number;
        username: string;
        email: string;
    };
}

export interface CampaignCharacter {
    id: number;
    campaign_id: number;
    player_id: number;
    pc_id: number;
    status: 'active' | 'inactive' | 'dead' | 'retired';
    joined_at: string;
    current_hp?: number;
    temp_ac?: number;
    campaign_notes: string;
    pc?: {
        id: number;
        name: string;
        race: string;
        class: string;
        level: number;
        hp: number;
        ca: number;
    };
    player?: {
        id: number;
        username: string;
    };
}

export interface CreateCampaignData {
    name: string;
    description: string;
    max_players: number;
}

export interface UpdateCampaignData {
    name?: string;
    description?: string;
    max_players?: number;
    current_session?: number;
    status?: string;
}

export interface AddCharacterData {
    pc_id: number;
}

export interface UpdateCharacterData {
    current_hp?: number;
    temp_ac?: number;
    status?: string;
    campaign_notes?: string;
}

// Serviços de Campanha
export const campaignService = {
    // Listar campanhas do usuário
    getCampaigns: async (): Promise<{ campaigns: Campaign[], count: number }> => {
        return await fetchFromAPI('/campaigns');
    },

    // Obter campanha específica
    getCampaign: async (id: number): Promise<Campaign> => {
        return await fetchFromAPI(`/campaigns/${id}`);
    },

    // Criar nova campanha
    createCampaign: async (data: CreateCampaignData): Promise<Campaign> => {
        return await fetchFromAPI('/campaigns', 'POST', data);
    },

    // Atualizar campanha
    updateCampaign: async (id: number, data: UpdateCampaignData): Promise<Campaign> => {
        return await fetchFromAPI(`/campaigns/${id}`, 'PUT', data);
    },

    // Deletar campanha
    deleteCampaign: async (id: number): Promise<void> => {
        return await fetchFromAPI(`/campaigns/${id}`, 'DELETE');
    },

    // Obter código de convite
    getInviteCode: async (id: number): Promise<{ invite_code: string, message: string }> => {
        return await fetchFromAPI(`/campaigns/${id}/invite-code`);
    },

    // Regenerar código de convite
    regenerateInviteCode: async (id: number): Promise<{ invite_code: string, message: string }> => {
        return await fetchFromAPI(`/campaigns/${id}/regenerate-code`, 'POST');
    },

    // Entrar na campanha
    joinCampaign: async (inviteCode: string): Promise<{ message: string }> => {
        return await fetchFromAPI('/campaigns/join', 'POST', { invite_code: inviteCode });
    },

    // Sair da campanha
    leaveCampaign: async (id: number): Promise<void> => {
        return await fetchFromAPI(`/campaigns/${id}/leave`, 'DELETE');
    },

    // Listar PCs disponíveis para a campanha
    getAvailableCharacters: async (id: number): Promise<{ available_characters: any[], count: number }> => {
        return await fetchFromAPI(`/campaigns/${id}/available-characters`);
    },

    // Listar personagens da campanha
    getCampaignCharacters: async (id: number): Promise<{ characters: CampaignCharacter[], count: number }> => {
        return await fetchFromAPI(`/campaigns/${id}/characters`);
    },

    // Adicionar PC à campanha
    addCharacterToCampaign: async (campaignId: number, data: AddCharacterData): Promise<CampaignCharacter> => {
        return await fetchFromAPI(`/campaigns/${campaignId}/characters`, 'POST', data);
    },

    // Atualizar status do personagem na campanha
    updateCampaignCharacter: async (campaignId: number, characterId: number, data: UpdateCharacterData): Promise<CampaignCharacter> => {
        return await fetchFromAPI(`/campaigns/${campaignId}/characters/${characterId}`, 'PUT', data);
    },

    // Remover personagem da campanha
    removeCampaignCharacter: async (campaignId: number, characterId: number): Promise<void> => {
        return await fetchFromAPI(`/campaigns/${campaignId}/characters/${characterId}`, 'DELETE');
    }
};

export default campaignService;