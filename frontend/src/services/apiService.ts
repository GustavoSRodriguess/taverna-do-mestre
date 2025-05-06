// Serviço para chamadas de API ao backend

import { mockCharacter } from "../mocks/characterMocks";
import { mockEncounter } from "../mocks/encounterMocks";
import { mockNPC } from "../mocks/npcMocks";
import { mockLoot } from "../mocks/lootMocks";

// Tipos para os dados de formulário
type CharacterFormData = {
    nivel: string;
    raca: string;
    classe: string;
    antecedente: string;
    metodoAtributos: 'rolagem' | 'array' | 'compra';
};

// Updated NPCFormData to include attributesMethod from the form
type NPCFormData = {
    nivel: string;
    metodo: 'automatic' | 'manual'; // Indicates user preference for specifying race/class/background
    attributesMethod: 'rolagem' | 'array' | 'compra'; // The actual attribute generation method for the backend
    raca?: string; // Kept for potential display/future use, not sent to /generate
    classe?: string; // Kept for potential display/future use, not sent to /generate
    antecedente?: string; // Kept for potential display/future use, not sent to /generate
};

type EncounterFormData = {
    nivelJogadores: string;
    quantidadeJogadores: string;
    dificuldade: 'f' | 'm' | 'd' | 'mo';
    tema?: string;
};

// Updated LootFormData to include the missing fields from the form
type LootFormData = {
    nivel: string;
    tipoMoedas: string;
    itemCategories: string[];
    quantidade: string;
    gems: boolean;
    artObjects: boolean;
    magicItems: boolean;
    ranks: string[];
};

// URL base da API - pode ser configurada com base no ambiente
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Função auxiliar para fazer requisições
const fetchFromAPI = async (endpoint: string, method: string = 'GET', data?: any) => {
    try {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        // Adiciona token de autenticação, se disponível
        const token = localStorage.getItem('authToken');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const options: RequestInit = {
            method,
            headers,
            credentials: 'include',
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.message || `Error ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        throw error;
    }
};

// Gerar personagem
export const generateCharacter = async (formData: CharacterFormData) => {
    try {
        return await fetchFromAPI('/character/generate', 'POST', formData);
    } catch (error) {
        console.log('Error generating character, using mock data instead:', error);
        return mockGenerateCharacter(formData);
    }
};

// Gerar NPC
export const generateNPC = async (formData: NPCFormData) => {
    try {
        // Construct the payload exactly as the backend /npcs/generate endpoint expects
        const data = {
            level: parseInt(formData.nivel),
            attributes_method: formData.attributesMethod,
            manual: formData.metodo === 'manual'
        };

        console.log('Sending data to /npcs/generate:', data);

        return await fetchFromAPI('/npcs/generate', 'POST', data);
    } catch (error) {
        console.log('Error generating NPC, using mock data instead:', error);
        // Pass the original formData to the mock function
        return mockGenerateNPC(formData);
    }
};

// Gerar encontro
export const generateEncounter = async (formData: EncounterFormData) => {
    try {
        const data = {
            player_level: parseInt(formData.nivelJogadores),
            player_count: parseInt(formData.quantidadeJogadores),
            difficulty: formData.dificuldade,
            theme: formData.tema
        };

        const result = await fetchFromAPI('/encounters/generate', 'POST', data);

        // Adaptar a resposta da API para o formato esperado pelo front
        return {
            tema: result.theme || 'Variado',
            xpTotal: result.total_xp,
            monstros: result.monsters.map((monster: any) => ({
                nome: monster.name,
                xp: monster.xp,
                cr: monster.cr
            })),
            descricaoNarrativa: result.description || 'Sem descrição disponível.'
        };
    } catch (error) {
        console.log('Error generating encounter, using mock data instead:', error);
        return mockGenerateEncounter(formData);
    }
};

// Gerar loot/tesouro
export const generateLoot = async (formData: LootFormData) => {
    try {
        // Construct the payload using data from the form, matching backend expectations
        const data = {
            level: parseInt(formData.nivel),
            coin_type: formData.tipoMoedas,
            magic_item_categories: formData.itemCategories,
            quantity: parseInt(formData.quantidade),
            gems: formData.gems,
            art_objects: formData.artObjects,
            magic_items: formData.magicItems,
            ranks: formData.ranks,
            valuable_type: "standard",
            item_type: "standard",
            more_random_coins: false,
            trade: "none",
            psionic_items: false,
            chaositech_items: false,
            max_value: 0,
            combine_hoards: false
        };
        console.log('Sending data to /treasures/generate:', data);

        const result = await fetchFromAPI('/treasures/generate', 'POST', data);
        console.log('Received data from /treasures/generate:', result); // Log the received data

        // Adaptar a resposta da API para o formato esperado pelo front (LootSheet.tsx)
        return {
            nivel: result.level,
            valorTotal: result.total_value,
            hoards: result.hoards.map((hoard: any) => {
                // Ensure valuables and items are arrays, even if null/undefined from backend (fallback)
                const valuablesArray = Array.isArray(hoard.valuables) ? hoard.valuables : [];
                const itemsArray = Array.isArray(hoard.items) ? hoard.items : [];

                // Map valuables (gems/art) to the frontend item format
                const mappedValuables = valuablesArray.map((item: any) => ({
                    nome: item.name,
                    tipo: item.type, // Use the type directly from the item
                    valor: item.value,
                    raridade: item.rank || 'Comum' // Use rank from backend
                }));

                // Map items (magic items) to the frontend item format
                const mappedItems = itemsArray.map((item: any) => ({
                    nome: item.name,
                    tipo: item.type, // Use the type directly from the item
                    valor: item.value || 0, // Use value or default to 0
                    raridade: item.rank || 'Comum' // Use rank from backend
                }));

                // Combine valuables and magic items into a single list for the frontend
                const combinedItems = [...mappedValuables, ...mappedItems];

                return {
                    valor: hoard.value,
                    coins: hoard.coins || {},
                    items: combinedItems // Use the combined and correctly mapped list
                };
            })
        };
    } catch (error) {
        console.log('Error generating loot, using mock data instead:', error);
        return mockGenerateLoot(formData);
    }
};

// Buscar personagens existentes
export const getCharacters = async () => {
    try {
        return await fetchFromAPI('/characters');
    } catch (error) {
        console.log('Error fetching characters:', error);
        return [];
    }
};

// Buscar NPCs existentes
export const getNPCs = async () => {
    try {
        return await fetchFromAPI('/npcs');
    } catch (error) {
        console.log('Error fetching NPCs:', error);
        return [];
    }
};

// Buscar encontros existentes
export const getEncounters = async () => {
    try {
        return await fetchFromAPI('/encounters');
    } catch (error) {
        console.log('Error fetching encounters:', error);
        return [];
    }
};

// Buscar loots existentes
export const getLoot = async () => {
    try {
        return await fetchFromAPI('/treasures');
    } catch (error) {
        console.log('Error fetching treasures:', error);
        return [];
    }
};

// Versões mockadas das funções para desenvolvimento/fallback
export const mockGenerateCharacter = async (formData: CharacterFormData) => {
    console.log('Gerando personagem com dados mockados:', formData);
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
        ...mockCharacter,
        Raça: formData.raca,
        Classe: formData.classe,
        Nível: parseInt(formData.nivel),
        Antecedente: formData.antecedente
    };
};

export const mockGenerateNPC = async (formData: NPCFormData) => {
    console.log('Gerando NPC com dados mockados:', formData);
    await new Promise(resolve => setTimeout(resolve, 500));
    let npc = { ...mockNPC, Nível: parseInt(formData.nivel) };
    if (formData.metodo === 'manual' && formData.raca && formData.classe && formData.antecedente) {
        npc.Raça = formData.raca;
        npc.Classe = formData.classe;
        npc.Antecedente = formData.antecedente;
        if (formData.classe === 'Mago') {
            npc.Magias = {
                "Magias de Nível 1": ["Míssil Mágico", "Escudo Arcano", "Detectar Magia"]
            };
        }
    }
    return npc;
};

export const mockGenerateEncounter = async (formData: EncounterFormData) => {
    console.log('Gerando encontro com dados mockados:', formData);
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
        ...mockEncounter,
        tema: formData.tema || mockEncounter.tema,
        dificuldade: formData.dificuldade
    };
};

export const mockGenerateLoot = async (formData: LootFormData) => {
    console.log('Gerando tesouro com dados mockados:', formData);
    await new Promise(resolve => setTimeout(resolve, 500));
    const levelFactor = parseInt(formData.nivel) / mockLoot.nivel;
    let adjustedMock = {
        ...mockLoot,
        nivel: parseInt(formData.nivel),
        valorTotal: Math.round(mockLoot.valorTotal * levelFactor),
        hoards: mockLoot.hoards.map(hoard => ({
            ...hoard,
            valor: Math.round(hoard.valor * levelFactor),
            coins: Object.fromEntries(
                Object.entries(hoard.coins).map(([coin, amount]) =>
                    [coin, Math.round(amount * levelFactor)]
                )
            ),
            items: hoard.items.map(item => ({
                ...item,
                valor: Math.round(item.valor * levelFactor)
            }))
        }))
    };
    if (!formData.gems) {
        adjustedMock.hoards.forEach(hoard => {
            hoard.items = hoard.items.filter(item => item.tipo !== 'Gemas');
        });
    }
    if (!formData.artObjects) {
        adjustedMock.hoards.forEach(hoard => {
            hoard.items = hoard.items.filter(item => item.tipo !== 'Objetos de Arte');
        });
    }
    return adjustedMock;
};


// Exporta as funções reais
export default {
    generateCharacter,
    generateNPC,
    generateEncounter,
    generateLoot,
    getCharacters,
    getNPCs,
    getEncounters,
    getLoot
};

