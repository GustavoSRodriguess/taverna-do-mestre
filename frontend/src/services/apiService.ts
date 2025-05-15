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

// Updated NPCFormData to match the form's output and backend expectations
type NPCFormData = {
    level: string;
    manual: boolean;
    attributes_method?: 'rolagem' | 'array' | 'compra';
    race?: string;
    npcClass?: string;
    background?: string;
};

type EncounterFormData = {
    nivelJogadores: string;
    quantidadeJogadores: string;
    dificuldade: 'f' | 'm' | 'd' | 'mo';
    tema?: string;
};

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

// Tipos para a ficha de NPC no frontend (NPCSheet.tsx)
type NPCSheetAttributes = {
    Força: number;
    Destreza: number;
    Constituição: number;
    Inteligência: number;
    Sabedoria: number;
    Carisma: number;
};

export type NPCSheetData = {
    Nome?: string; // Adicionado para o nome do NPC
    Raça: string;
    Classe: string;
    HP: number;
    CA: number;
    Antecedente: string;
    Nível: number;
    Atributos: NPCSheetAttributes;
    Modificadores: NPCSheetAttributes;
    Habilidades: string[];
    Magias: Record<string, string[]>;
    Equipamento: string[];
    "Traço de Antecedente": string; // Usará a descrição do NPC
};

// URL base da API - pode ser configurada com base no ambiente
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Função auxiliar para fazer requisições
const fetchFromAPI = async (endpoint: string, method: string = 'GET', data?: any) => {
    try {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        const token = localStorage.getItem('authToken');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        const options: RequestInit = { method, headers, credentials: 'include' };
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

const attributeNameMapping: Record<string, keyof NPCSheetAttributes> = {
    strength: "Força",
    dexterity: "Destreza",
    constitution: "Constituição",
    intelligence: "Inteligência",
    wisdom: "Sabedoria",
    charisma: "Carisma",
};

const calculateModifier = (value: number): number => Math.floor((value - 10) / 2);

// Função para transformar a resposta da API de NPC/PC para o formato do NPCSheetData
const transformNPCResponseToSheetData = (apiResponse: any): NPCSheetData => {
    const attributes: NPCSheetAttributes = {
        Força: 0, Destreza: 0, Constituição: 0, Inteligência: 0, Sabedoria: 0, Carisma: 0,
    };
    const modifiers: NPCSheetAttributes = {
        Força: 0, Destreza: 0, Constituição: 0, Inteligência: 0, Sabedoria: 0, Carisma: 0,
    };

    if (apiResponse.attributes) {
        for (const key in apiResponse.attributes) {
            const mappedKey = attributeNameMapping[key.toLowerCase()];
            if (mappedKey) {
                const value = apiResponse.attributes[key] || 0;
                attributes[mappedKey] = value;
                modifiers[mappedKey] = calculateModifier(value);
            }
        }
    }

    return {
        Nome: apiResponse.name || "NPC Sem Nome",
        Raça: apiResponse.race || "Desconhecida",
        Classe: apiResponse.class || "Desconhecida",
        HP: apiResponse.hp || 0,
        CA: apiResponse.ca || 0,
        Antecedente: apiResponse.background || "Nenhum",
        Nível: apiResponse.level || 1,
        Atributos: attributes,
        Modificadores: modifiers,
        Habilidades: apiResponse.abilities?.abilities || [],
        Magias: apiResponse.abilities?.spells || {},
        Equipamento: apiResponse.equipment?.items || [],
        "Traço de Antecedente": apiResponse.description || "Sem descrição detalhada.",
    };
};

// Gerar personagem (PC)
export const generateCharacter = async (formData: CharacterFormData): Promise<NPCSheetData> => {
    try {
        const payload = {
            level: parseInt(formData.nivel),
            attributes_method: formData.metodoAtributos,
            manual: true,
            race: formData.raca,
            class: formData.classe,
            background: formData.antecedente
        };
        console.log('Sending data to /npcs/generate (for PC):', payload);
        const apiResponse = await fetchFromAPI('/npcs/generate', 'POST', payload);
        return transformNPCResponseToSheetData(apiResponse);
    } catch (error) {
        console.log('Error generating character, using mock data instead:', error);
        // Retornar mock adaptado se a API falhar
        const mockApiResponse = mockGenerateCharacter(formData);
        return transformNPCResponseToSheetData(mockApiResponse);
    }
};

// Gerar NPC
export const generateNPC = async (formData: NPCFormData): Promise<NPCSheetData> => {
    try {
        const payload: any = {
            level: parseInt(formData.level),
            manual: formData.manual
        };

        if (formData.manual) {
            payload.race = formData.race;
            payload.class = formData.npcClass;
            payload.background = formData.background;
            // Se manual, o backend pode esperar attributes_method ou não.
            // O form de NPC agora envia attributes_method apenas se não for manual.
            // Se for manual e o backend precisar de um attributes_method específico, 
            // o form de NPC ou esta lógica precisaria definir um (ex: 'array' por padrão para manual).
            // Por enquanto, não enviaremos se manual, a menos que o form de NPC seja alterado para coletá-lo para o modo manual.
        } else {
            payload.attributes_method = formData.attributes_method;
        }

        console.log('Sending data to /npcs/generate (for NPC):', payload);
        const apiResponse = await fetchFromAPI('/npcs/generate', 'POST', payload);
        return transformNPCResponseToSheetData(apiResponse);
    } catch (error) {
        console.log('Error generating NPC, using mock data instead:', error);
        const mockApiResponse = await mockGenerateNPC(formData); // mockGenerateNPC é async
        return transformNPCResponseToSheetData(mockApiResponse);
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
        const data = {
            level: parseInt(formData.nivel),
            coin_type: formData.tipoMoedas,
            magic_item_categories: formData.itemCategories,
            quantity: parseInt(formData.quantidade),
            gems: formData.gems,
            art_objects: formData.artObjects,
            magic_items: formData.magicItems,
            ranks: formData.ranks,
            valuable_type: "standard", item_type: "standard", more_random_coins: false,
            trade: "none", psionic_items: false, chaositech_items: false, max_value: 0, combine_hoards: false
        };
        console.log('Sending data to /treasures/generate:', data);
        const result = await fetchFromAPI('/treasures/generate', 'POST', data);
        return {
            nivel: result.level,
            valorTotal: result.total_value,
            hoards: result.hoards.map((hoard: any) => {
                const valuablesArray = Array.isArray(hoard.valuables) ? hoard.valuables : [];
                const itemsArray = Array.isArray(hoard.items) ? hoard.items : [];
                const mappedValuables = valuablesArray.map((item: any) => ({ nome: item.name, tipo: item.type, valor: item.value, raridade: item.rank || 'Comum' }));
                const mappedItems = itemsArray.map((item: any) => ({ nome: item.name, tipo: item.type, valor: item.value || 0, raridade: item.rank || 'Comum' }));
                return { valor: hoard.value, coins: hoard.coins || {}, items: [...mappedValuables, ...mappedItems] };
            })
        };
    } catch (error) {
        console.log('Error generating loot, using mock data instead:', error);
        return mockGenerateLoot(formData);
    }
};

// Funções mockadas (precisam retornar algo que transformNPCResponseToSheetData possa processar se usadas como fallback)
export const mockGenerateCharacter = (formData: CharacterFormData) => {
    console.log('Gerando personagem com dados mockados (formato API):', formData);
    // Simula a estrutura da resposta da API Go, não do NPCSheetData diretamente
    return {
        name: "Personagem Mockado",
        description: "Um bravo aventureiro gerado para testes.",
        level: parseInt(formData.nivel),
        race: formData.raca,
        class: formData.classe,
        background: formData.antecedente,
        attributes: { strength: 15, dexterity: 14, constitution: 13, intelligence: 12, wisdom: 10, charisma: 8 },
        abilities: { abilities: ["Ataque Extra"], spells: {} },
        equipment: { items: ["Espada Longa", "Escudo"] },
        hp: 10 + parseInt(formData.nivel) * 5,
        ca: 16,
    };
};

export const mockGenerateNPC = async (formData: NPCFormData) => {
    console.log('Gerando NPC com dados mockados (formato API):', formData);
    // Simula a estrutura da resposta da API Go
    let npcData: any = {
        name: "NPC Mockado",
        description: "Um NPC gerado para testes.",
        level: parseInt(formData.level),
        attributes: { strength: 12, dexterity: 12, constitution: 12, intelligence: 10, wisdom: 10, charisma: 10 },
        abilities: { abilities: ["Percepção"], spells: {} },
        equipment: { items: ["Adaga"] },
        hp: 5 + parseInt(formData.level) * 4,
        ca: 12,
    };
    if (formData.manual) {
        npcData.race = formData.race || "Humano (Mock)";
        npcData.class = formData.npcClass || "Comum (Mock)";
        npcData.background = formData.background || "Aldeão (Mock)";
    } else {
        npcData.race = "Goblin (Mock)";
        npcData.class = "Guerreiro (Mock)";
        npcData.background = "Capanga (Mock)";
    }
    return npcData;
};

export const mockGenerateEncounter = (formData: EncounterFormData) => {
    console.log('Gerando encontro com dados mockados:', formData);
    return mockEncounter; // Assumindo que mockEncounter já está no formato correto
};

export const mockGenerateLoot = (formData: LootFormData) => {
    console.log('Gerando tesouro com dados mockados:', formData);
    return mockLoot; // Assumindo que mockLoot já está no formato correto
};

// Funções de busca (não modificadas)
export const getCharacters = async () => { try { return await fetchFromAPI('/characters'); } catch (e) { return []; } };
export const getNPCs = async () => { try { return await fetchFromAPI('/npcs'); } catch (e) { return []; } };
export const getEncounters = async () => { try { return await fetchFromAPI('/encounters'); } catch (e) { return []; } };
export const getLoot = async () => { try { return await fetchFromAPI('/treasures'); } catch (e) { return []; } };

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

