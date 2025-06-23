import { fetchFromAPI } from "./apiService";

export interface PC {
    id: number;
    name: string;
    race: string;
    class: string;
    level: number;
    background: string;
    alignment: string;
    attributes: {
        strength: number;
        dexterity: number;
        constitution: number;
        intelligence: number;
        wisdom: number;
        charisma: number;
    };
    skills: { [key: string]: { proficient: boolean; expertise: boolean; bonus: number } };
    hp: number;
    current_hp?: number;
    ca: number;
    attacks: Array<{
        name: string;
        bonus: number;
        damage: string;
        type: string;
        range?: string;
    }>;
    spells: {
        spell_slots: { [level: string]: { total: number; used: number } };
        known_spells: Array<{
            name: string;
            level: number;
            school: string;
            prepared?: boolean;
        }>;
        spellcasting_ability?: string;
        spell_attack_bonus?: number;
        spell_save_dc?: number;
    };
    equipment: Array<{
        name: string;
        quantity: number;
        equipped?: boolean;
        description?: string;
    }>;
    proficiency_bonus: number;
    inspiration: boolean;
    description: string;
    personality_traits: string;
    ideals: string;
    bonds: string;
    flaws: string;
    features: string[];
    player_name?: string;
    player_id: number;
    created_at: string;
}

export interface CreatePCData {
    name: string;
    race: string;
    class: string;
    level: number;
    background?: string;
    alignment?: string;
    attributes: {
        strength: number;
        dexterity: number;
        constitution: number;
        intelligence: number;
        wisdom: number;
        charisma: number;
    };
    skills?: { [key: string]: { proficient: boolean; expertise: boolean; bonus: number } };
    hp: number;
    ca: number;
    attacks?: Array<{
        name: string;
        bonus: number;
        damage: string;
        type: string;
        range?: string;
    }>;
    spells?: {
        spell_slots: { [level: string]: { total: number; used: number } };
        known_spells: Array<{
            name: string;
            level: number;
            school: string;
            prepared?: boolean;
        }>;
        spellcasting_ability?: string;
    };
    equipment?: Array<{
        name: string;
        quantity: number;
        equipped?: boolean;
        description?: string;
    }>;
    proficiency_bonus?: number;
    inspiration?: boolean;
    description?: string;
    personality_traits?: string;
    ideals?: string;
    bonds?: string;
    flaws?: string;
    features?: string[];
    player_name?: string;
}

export interface UpdatePCData extends Partial<CreatePCData> {
    current_hp?: number;
}

export interface PCListResponse {
    pcs: PC[];
    count: number;
    limit: number;
    offset: number;
}

export interface PCCampaign {
    id: number;
    name: string;
    status: string;
    character_status: string;
    current_hp?: number;
    dm_name: string;
}

// Serviços de PC
export const pcService = {
    // Listar PCs do usuário
    getPCs: async (limit = 20, offset = 0): Promise<PCListResponse> => {
        return await fetchFromAPI(`/pcs?limit=${limit}&offset=${offset}`);
    },

    // Obter PC específico
    getPC: async (id: number): Promise<PC> => {
        return await fetchFromAPI(`/pcs/${id}`);
    },

    // Criar novo PC
    createPC: async (data: CreatePCData): Promise<PC> => {
        return await fetchFromAPI('/pcs', 'POST', data);
    },

    // Atualizar PC
    updatePC: async (id: number, data: UpdatePCData): Promise<PC> => {
        return await fetchFromAPI(`/pcs/${id}`, 'PUT', data);
    },

    // Deletar PC
    deletePC: async (id: number): Promise<void> => {
        return await fetchFromAPI(`/pcs/${id}`, 'DELETE');
    },

    // Obter campanhas do PC
    getPCCampaigns: async (id: number): Promise<{ campaigns: PCCampaign[], count: number }> => {
        return await fetchFromAPI(`/pcs/${id}/campaigns`);
    },

    // Gerar PC aleatório
    generateRandomPC: async (data: {
        level: number;
        attributes_method?: string;
        manual: boolean;
        race?: string;
        class?: string;
        background?: string;
        player_name?: string;
    }): Promise<PC> => {
        return await fetchFromAPI('/pcs/generate', 'POST', data);
    }
};

export default pcService;