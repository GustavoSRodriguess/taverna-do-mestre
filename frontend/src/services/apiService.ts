const API_BASE_URL =
  import.meta.env.DEV
    ? "http://localhost:8080/api" // desenvolvimento
    : "/api";                     // produção (SWA vai fazer o proxy)


// ========================================
// CORE API SERVICE
// ========================================

export const fetchFromAPI = async (endpoint: string, method: string = 'GET', data?: any) => {
    try {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        const token = localStorage.getItem('authToken');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const options: RequestInit = { method, headers };
        if (data) {
            options.body = JSON.stringify(data);
        }
        console.log(`Fetching ${method} ${API_BASE_URL}${endpoint}`, data);
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        // console.log(`Response from ${endpoint}:`, response.json());

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.message || `Error ${response.status}: ${response.statusText}`);
        }
        const responseJson = await response.json();
        console.log(`Response data from ${endpoint}:`, responseJson);
        return responseJson.data || responseJson.results || responseJson;
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        throw error;
    }
};

// ========================================
// GENERATION SERVICE
// ========================================

export interface GenerationFormData {
    nivel?: string;
    level?: string;
    raca?: string;
    race?: string;
    classe?: string;
    class?: string;
    npcClass?: string;
    antecedente?: string;
    background?: string;
    metodoAtributos?: string;
    attributes_method?: string;
    manual?: boolean;
    nivelJogadores?: string;
    player_level?: string;
    quantidadeJogadores?: string;
    player_count?: string;
    dificuldade?: string;
    difficulty?: string;
    tema?: string;
    theme?: string;
    coin_type?: string;
    item_categories?: string[];
    magic_item_categories?: string[];
    quantity?: number;
    gems?: boolean;
    art_objects?: boolean;
    magic_items?: boolean;
    ranks?: string[];
    [key: string]: any; // For additional properties
}

class ApiService {
    // Character Generation
    async generateCharacter(formData: GenerationFormData) {
        const payload = {
            level: parseInt(formData.nivel || '1'),
            attributes_method: formData.metodoAtributos || 'rolagem',
            manual: true,
            race: formData.raca,
            class: formData.classe,
            background: formData.antecedente
        };

        return this.callGenerationEndpoint('/npcs/generate', payload);
    }

    // NPC Generation
    async generateNPC(formData: GenerationFormData) {
        const payload: any = {
            level: parseInt(formData.level || '1'),
            manual: formData.manual || false
        };

        if (formData.manual) {
            payload.race = formData.race;
            payload.class = formData.npcClass;
            payload.background = formData.background;
        } else {
            payload.attributes_method = formData.attributes_method || 'rolagem';
        }

        const response = await this.callGenerationEndpoint('/npcs/generate', payload);

        return this.transformToCharacterSheet(response);
    }

    // Encounter Generation
    async generateEncounter(formData: GenerationFormData) {
        const payload = {
            player_level: parseInt(formData.nivelJogadores || formData.player_level || '1'),
            player_count: parseInt(formData.quantidadeJogadores || formData.player_count || '4'),
            difficulty: formData.dificuldade || formData.difficulty || 'm',
            theme: formData.tema || formData.theme
        };

        const response = await this.callGenerationEndpoint('/encounters/generate', payload);

        const result = response.data || response;

        return {
            tema: result.theme || 'Variado',
            xpTotal: result.total_xp,
            monstros: result.monsters?.map((monster: any) => ({
                nome: monster.name,
                xp: monster.xp,
                cr: monster.cr
            })) || [],
            descricaoNarrativa: result.description || 'Sem descrição disponível.'
        };
    }

    // Loot Generation
    async generateLoot(formData: GenerationFormData) {
        const payload = {
            level: parseInt(formData.level || '1'),
            quantity: formData.quantity || 1,
            coin_type: formData.coin_type || 'standard',
            magic_item_categories: formData.magic_item_categories || formData.item_categories || [],
            gems: formData.gems || false,
            art_objects: formData.art_objects || false,
            magic_items: formData.magic_items || false,
            ranks: formData.ranks || ['minor', 'medium'],
            // Additional fields with defaults
            valuable_type: "standard",
            item_type: "standard",
            more_random_coins: formData.more_random_coins || false,
            trade: "none",
            psionic_items: false,
            chaositech_items: false,
            max_value: 0,
            combine_hoards: false
        };

        const response = await this.callGenerationEndpoint('/treasures/generate', payload);

        console.log('Loot generation result:', response);

        // A resposta vem com structure { message: "", data: {...} }
        const result = response.data || response;

        return {
            nivel: result.level,
            valorTotal: result.total_value,
            hoards: result.hoards?.map((hoard: any) => ({
                valor: hoard.value,
                coins: hoard.coins || {},
                items: [
                    ...(hoard.valuables || []).map((item: any) => ({
                        nome: item.name,
                        tipo: item.type,
                        valor: item.value,
                        raridade: item.rank || 'Comum'
                    })),
                    ...(hoard.items || []).map((item: any) => ({
                        nome: item.name,
                        tipo: item.type,
                        valor: item.value || 0,
                        raridade: item.rank || 'Comum'
                    }))
                ]
            })) || []
        };
    }

    // Helper method for generation endpoints
    private async callGenerationEndpoint(endpoint: string, payload: any) {
        try {
            return await fetchFromAPI(endpoint, 'POST', payload);
        } catch (error) {
            console.error(`Generation error for ${endpoint}:`, error);
            throw new Error(`Erro ao gerar conteúdo. Tente novamente.`);
        }
    }

    // Transform API response to common format
    transformToCharacterSheet(apiResponse: any) {
        const attributes = {
            Força: 0, Destreza: 0, Constituição: 0,
            Inteligência: 0, Sabedoria: 0, Carisma: 0,
        };

        const modifiers = { ...attributes };

        if (apiResponse.attributes) {
            const attributeMapping: Record<string, keyof typeof attributes> = {
                strength: "Força", dexterity: "Destreza", constitution: "Constituição",
                intelligence: "Inteligência", wisdom: "Sabedoria", charisma: "Carisma",
            };

            for (const [key, value] of Object.entries(apiResponse.attributes)) {
                const mappedKey = attributeMapping[key.toLowerCase()];
                if (mappedKey && typeof value === 'number') {
                    attributes[mappedKey] = value;
                    modifiers[mappedKey] = Math.floor((value - 10) / 2);
                }
            }
        }

        return {
            Nome: apiResponse.name || "Personagem Sem Nome",
            Raca: apiResponse.race || "Desconhecida",
            Classe: apiResponse.class || "Desconhecida",
            HP: apiResponse.hp || 0,
            CA: apiResponse.ca || apiResponse.ac || 0,
            Antecedente: apiResponse.background || "Nenhum",
            Nível: apiResponse.level || 1,
            Atributos: attributes,
            Modificadores: modifiers,
            Habilidades: Array.isArray(apiResponse.abilities) ? apiResponse.abilities : (apiResponse.abilities?.abilities || []),
            Magias: apiResponse.spells || apiResponse.abilities?.spells || {},
            Equipamento: Array.isArray(apiResponse.equipment) ? apiResponse.equipment : (apiResponse.equipment?.items || []),
            "Traco de Antecedente": apiResponse.description || "Sem descrição detalhada.",
        };
    }

    // List endpoints (simplified)
    async getCharacters() {
        try {
            return await fetchFromAPI('/characters');
        } catch {
            return [];
        }
    }

    async getNPCs() {
        try {
            return await fetchFromAPI('/npcs');
        } catch {
            return [];
        }
    }

    async getEncounters() {
        try {
            return await fetchFromAPI('/encounters');
        } catch {
            return [];
        }
    }

    async getLoot() {
        try {
            return await fetchFromAPI('/treasures');
        } catch {
            return [];
        }
    }
}

// ========================================
// MOCK DATA FALLBACKS
// ========================================

// const MOCK_CHARACTER = {
//     name: "Personagem Mockado",
//     description: "Um bravo aventureiro gerado para testes.",
//     race: "Humano", class: "Guerreiro", background: "Soldado",
//     level: 1, hp: 15, ca: 16,
//     attributes: { strength: 15, dexterity: 14, constitution: 13, intelligence: 12, wisdom: 10, charisma: 8 },
//     abilities: { abilities: ["Ataque Extra"], spells: {} },
//     equipment: { items: ["Espada Longa", "Escudo"] }
// };

// const MOCK_NPC = {
//     ...MOCK_CHARACTER,
//     name: "NPC Mockado",
//     description: "Um NPC gerado para testes.",
//     race: "Goblin", class: "Guerreiro", background: "Capanga"
// };

// const MOCK_ENCOUNTER = {
//     tema: "Mortos-Vivos",
//     xpTotal: 1200,
//     monstros: [
//         { nome: "Esqueleto", xp: 50, cr: 0.25 },
//         { nome: "Zumbi", xp: 50, cr: 0.25 },
//         { nome: "Vampiro", xp: 3900, cr: 7 }
//     ],
//     descricaoNarrativa: "Um cemitério abandonado profanado por um necromante."
// };

// const MOCK_LOOT = {
//     nivel: 5, valorTotal: 1500,
//     hoards: [{
//         valor: 950,
//         coins: { copper: 350, silver: 150, gold: 45 },
//         items: [
//             { nome: "Anel de Proteção", tipo: "Anel Mágico", valor: 300, raridade: "Incomum" },
//             { nome: "Poção de Cura", tipo: "Poção", valor: 50, raridade: "Comum" }
//         ]
//     }]
// };

const apiService = new ApiService();
export default apiService;