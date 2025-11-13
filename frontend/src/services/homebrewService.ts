// frontend/src/services/homebrewService.ts
import { fetchFromAPI } from './apiService';

// ========================================
// TYPES
// ========================================

export interface HomebrewTrait {
    name: string;
    description: string;
}

export interface HomebrewAbilities {
    strength?: number;
    dexterity?: number;
    constitution?: number;
    intelligence?: number;
    wisdom?: number;
    charisma?: number;
}

export interface HomebrewProficiencies {
    skills?: string[];
    weapons?: string[];
    armor?: string[];
    tools?: string[];
}

export interface HomebrewRace {
    id?: number;
    name: string;
    description: string;
    speed: number;
    size: string;
    languages: string[];
    traits: HomebrewTrait[];
    abilities: HomebrewAbilities;
    proficiencies: HomebrewProficiencies;
    user_id?: number;
    is_public: boolean;
    created_at?: string;
    updated_at?: string;
    owner_username?: string;
}

export interface HomebrewSkillChoices {
    count: number;
    options: string[];
}

export interface HomebrewFeaturesByLevel {
    [level: string]: HomebrewTrait[];
}

export interface HomebrewSpellcasting {
    ability: string;
    cantrips_known?: { [level: string]: number };
    spells_known?: { [level: string]: number };
    spell_slots?: { [level: string]: { [slot_level: string]: number } };
}

export interface HomebrewClass {
    id?: number;
    name: string;
    description: string;
    hit_die: number;
    primary_ability: string;
    saving_throws: string[];
    armor_proficiency: string[];
    weapon_proficiency: string[];
    tool_proficiency: string[];
    skill_choices: HomebrewSkillChoices;
    features: HomebrewFeaturesByLevel;
    spellcasting?: HomebrewSpellcasting | null;
    user_id?: number;
    is_public: boolean;
    created_at?: string;
    updated_at?: string;
    owner_username?: string;
}

export interface HomebrewEquipment {
    name: string;
    quantity: number;
}

export interface HomebrewFeature {
    name: string;
    description: string;
}

export interface HomebrewSuggestedTraits {
    personality: string[];
    ideals: string[];
    bonds: string[];
    flaws: string[];
}

export interface HomebrewBackground {
    id?: number;
    name: string;
    description: string;
    skill_proficiencies: string[];
    tool_proficiencies: string[];
    languages: number;
    equipment: HomebrewEquipment[];
    feature: HomebrewFeature;
    suggested_traits: HomebrewSuggestedTraits;
    user_id?: number;
    is_public: boolean;
    created_at?: string;
    updated_at?: string;
    owner_username?: string;
}

export interface HomebrewListResponse<T> {
    races?: T[];
    classes?: T[];
    backgrounds?: T[];
    count: number;
    limit: number;
    offset: number;
}

// ========================================
// HOMEBREW SERVICE CLASS
// ========================================

class HomebrewService {
    // ========================================
    // RACES
    // ========================================

    async getRaces(limit: number = 50, offset: number = 0): Promise<HomebrewListResponse<HomebrewRace>> {
        return fetchFromAPI(`/homebrew/races?limit=${limit}&offset=${offset}`);
    }

    async getRaceById(id: number): Promise<HomebrewRace> {
        return fetchFromAPI(`/homebrew/races/${id}`);
    }

    async createRace(race: Omit<HomebrewRace, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'owner_username'>): Promise<HomebrewRace> {
        return fetchFromAPI('/homebrew/races', 'POST', race);
    }

    async updateRace(id: number, race: Partial<Omit<HomebrewRace, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'owner_username'>>): Promise<HomebrewRace> {
        return fetchFromAPI(`/homebrew/races/${id}`, 'PUT', race);
    }

    async deleteRace(id: number): Promise<void> {
        return fetchFromAPI(`/homebrew/races/${id}`, 'DELETE');
    }

    // ========================================
    // CLASSES
    // ========================================

    async getClasses(limit: number = 50, offset: number = 0): Promise<HomebrewListResponse<HomebrewClass>> {
        return fetchFromAPI(`/homebrew/classes?limit=${limit}&offset=${offset}`);
    }

    async getClassById(id: number): Promise<HomebrewClass> {
        return fetchFromAPI(`/homebrew/classes/${id}`);
    }

    async createClass(classData: Omit<HomebrewClass, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'owner_username'>): Promise<HomebrewClass> {
        return fetchFromAPI('/homebrew/classes', 'POST', classData);
    }

    async updateClass(id: number, classData: Partial<Omit<HomebrewClass, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'owner_username'>>): Promise<HomebrewClass> {
        return fetchFromAPI(`/homebrew/classes/${id}`, 'PUT', classData);
    }

    async deleteClass(id: number): Promise<void> {
        return fetchFromAPI(`/homebrew/classes/${id}`, 'DELETE');
    }

    // ========================================
    // BACKGROUNDS
    // ========================================

    async getBackgrounds(limit: number = 50, offset: number = 0): Promise<HomebrewListResponse<HomebrewBackground>> {
        return fetchFromAPI(`/homebrew/backgrounds?limit=${limit}&offset=${offset}`);
    }

    async getBackgroundById(id: number): Promise<HomebrewBackground> {
        return fetchFromAPI(`/homebrew/backgrounds/${id}`);
    }

    async createBackground(background: Omit<HomebrewBackground, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'owner_username'>): Promise<HomebrewBackground> {
        return fetchFromAPI('/homebrew/backgrounds', 'POST', background);
    }

    async updateBackground(id: number, background: Partial<Omit<HomebrewBackground, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'owner_username'>>): Promise<HomebrewBackground> {
        return fetchFromAPI(`/homebrew/backgrounds/${id}`, 'PUT', background);
    }

    async deleteBackground(id: number): Promise<void> {
        return fetchFromAPI(`/homebrew/backgrounds/${id}`, 'DELETE');
    }

    // ========================================
    // UTILITY METHODS
    // ========================================

    // Helpers para criar objetos vazios com valores padrão
    createEmptyRace(): Omit<HomebrewRace, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'owner_username'> {
        return {
            name: '',
            description: '',
            speed: 30,
            size: 'Medium',
            languages: [],
            traits: [],
            abilities: {},
            proficiencies: {
                skills: [],
                weapons: [],
                armor: [],
                tools: []
            },
            is_public: false
        };
    }

    createEmptyClass(): Omit<HomebrewClass, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'owner_username'> {
        return {
            name: '',
            description: '',
            hit_die: 8,
            primary_ability: 'strength',
            saving_throws: [],
            armor_proficiency: [],
            weapon_proficiency: [],
            tool_proficiency: [],
            skill_choices: {
                count: 2,
                options: []
            },
            features: {},
            spellcasting: null,
            is_public: false
        };
    }

    createEmptyBackground(): Omit<HomebrewBackground, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'owner_username'> {
        return {
            name: '',
            description: '',
            skill_proficiencies: [],
            tool_proficiencies: [],
            languages: 0,
            equipment: [],
            feature: {
                name: '',
                description: ''
            },
            suggested_traits: {
                personality: [],
                ideals: [],
                bonds: [],
                flaws: []
            },
            is_public: false
        };
    }

    // Validação básica
    validateRace(race: Partial<HomebrewRace>): string[] {
        const errors: string[] = [];

        if (!race.name?.trim()) errors.push('Nome é obrigatório');
        if (!race.description?.trim()) errors.push('Descrição é obrigatória');
        if (!race.size?.trim()) errors.push('Tamanho é obrigatório');
        if (race.speed && race.speed < 0) errors.push('Velocidade deve ser positiva');

        return errors;
    }

    validateClass(classData: Partial<HomebrewClass>): string[] {
        const errors: string[] = [];

        if (!classData.name?.trim()) errors.push('Nome é obrigatório');
        if (!classData.description?.trim()) errors.push('Descrição é obrigatória');
        if (!classData.primary_ability?.trim()) errors.push('Habilidade primária é obrigatória');
        if (classData.hit_die && ![6, 8, 10, 12].includes(classData.hit_die)) {
            errors.push('Dado de vida deve ser 6, 8, 10 ou 12');
        }
        if (classData.saving_throws && classData.saving_throws.length !== 2) {
            errors.push('Deve ter exatamente 2 testes de resistência');
        }

        return errors;
    }

    validateBackground(background: Partial<HomebrewBackground>): string[] {
        const errors: string[] = [];

        if (!background.name?.trim()) errors.push('Nome é obrigatório');
        if (!background.description?.trim()) errors.push('Descrição é obrigatória');

        return errors;
    }
}

export const homebrewService = new HomebrewService();
export default homebrewService;