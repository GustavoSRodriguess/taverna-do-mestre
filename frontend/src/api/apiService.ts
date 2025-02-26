// Serviço para chamadas de API ao backend

import { mockCharacter } from "../mocks/characterMocks";
import { mockEncounter } from "../mocks/encounterMocks";
import { mockNPC } from "../mocks/npcMocks";

// Tipos para os dados de formulário
type CharacterFormData = {
    nivel: string;
    raca: string;
    classe: string;
    antecedente: string;
    metodoAtributos: 'rolagem' | 'array' | 'compra';
};

type NPCFormData = {
    nivel: string;
    metodo: 'automatic' | 'manual';
    raca?: string;
    classe?: string;
    antecedente?: string;
};

type EncounterFormData = {
    nivelJogadores: string;
    quantidadeJogadores: string;
    dificuldade: 'f' | 'm' | 'd' | 'mo';
    tema?: string;
};

// URL base da API - pode ser configurada com base no ambiente
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Gerar personagem
export const generateCharacter = async (formData: CharacterFormData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/character/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Erro ao gerar personagem:', error);
        throw error;
    }
};

// Gerar NPC
export const generateNPC = async (formData: NPCFormData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/npc/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Erro ao gerar NPC:', error);
        throw error;
    }
};

// Gerar encontro
export const generateEncounter = async (formData: EncounterFormData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/encounter/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Erro ao gerar encontro:', error);
        throw error;
    }
};

// Mockups para desenvolvimento (quando a API não estiver disponível)
// Dados importados dos mocks para simular respostas da API


// Versões mockadas das funções para desenvolvimento
export const mockGenerateCharacter = async (formData: CharacterFormData) => {
    console.log('Gerando personagem com dados:', formData);
    // Simula um delay de rede
    await new Promise(resolve => setTimeout(resolve, 500));

    // Para fins de simulação, podemos fazer pequenos ajustes no mock baseado no formulário
    return {
        ...mockCharacter,
        Raça: formData.raca,
        Classe: formData.classe,
        Nível: parseInt(formData.nivel),
        Antecedente: formData.antecedente
    };
};

export const mockGenerateNPC = async (formData: NPCFormData) => {
    console.log('Gerando NPC com dados:', formData);
    // Simula um delay de rede
    await new Promise(resolve => setTimeout(resolve, 500));

    // Ajustes baseados no formulário
    let npc = { ...mockNPC, Nível: parseInt(formData.nivel) };

    if (formData.metodo === 'manual' && formData.raca && formData.classe && formData.antecedente) {
        npc.Raça = formData.raca;
        npc.Classe = formData.classe;
        npc.Antecedente = formData.antecedente;

        // Ajustes específicos por classe
        if (formData.classe === 'Mago') {
            npc.Magias = {
                "Magias de Nível 1": ["Míssil Mágico", "Escudo Arcano", "Detectar Magia"]
            };
        }
    }

    return npc;
};

export const mockGenerateEncounter = async (formData: EncounterFormData) => {
    console.log('Gerando encontro com dados:', formData);
    // Simula um delay de rede
    await new Promise(resolve => setTimeout(resolve, 500));

    return mockEncounter;
};

// Função auxiliar para decidir qual versão usar (real ou mock)
// Use isto para facilitar a alternância entre desenvolvimento e produção
const USE_MOCKS = true; // Mude para false quando tiver uma API real

export default {
    generateCharacter: USE_MOCKS ? mockGenerateCharacter : generateCharacter,
    generateNPC: USE_MOCKS ? mockGenerateNPC : generateNPC,
    generateEncounter: USE_MOCKS ? mockGenerateEncounter : generateEncounter
};