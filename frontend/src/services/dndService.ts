// frontend/src/services/dndService.ts
import { fetchFromAPI } from "./apiService";

// ========================================
// INTERFACES D&D
// ========================================

export interface DnDRace {
    index: string;
    name: string;
    speed: number;
    size: string;
    size_description: string;
    age: string;
    alignment: string;
    language_desc: string;
    ability_bonuses: any;
    proficiencies: any;
    languages: any;
    traits: any;
    subraces: any;
    url: string;
    created_at: string;
}

export interface DnDClass {
    index: string;
    name: string;
    hit_die: number;
    primary_ability: any;
    saving_throws: any;
    proficiencies: any;
    proficiency_choices: any;
    starting_equipment: any;
    class_levels: any;
    multiclassing: any;
    subclasses: any;
    spellcasting: any;
    spells: any;
    url: string;
    created_at: string;
}

export interface DnDSpell {
    index: string;
    name: string;
    description: any;
    higher_level: any;
    range: string;
    components: any;
    material: string;
    ritual: boolean;
    duration: string;
    concentration: boolean;
    casting_time: string;
    level: number;
    attack_type: string;
    damage: any;
    school: any;
    classes: any;
    subclasses: any;
    url: string;
    created_at: string;
}

export interface DnDEquipment {
    index: string;
    name: string;
    equipment_category: any;
    gear_category: any;
    cost: any;
    damage: any;
    range: any;
    weight: number;
    properties: any;
    weapon_category: string;
    weapon_range: string;
    category_range: string;
    throw_range: any;
    two_handed_damage: any;
    armor_category: string;
    armor_class: any;
    str_minimum: number;
    stealth_disadvantage: boolean;
    contents: any;
    description: any;
    special_abilities: any;
    url: string;
    created_at: string;
}

export interface DnDMonster {
    index: string;
    name: string;
    size: string;
    type: string;
    subtype: string;
    alignment: string;
    armor_class: number;
    hit_points: number;
    hit_dice: string;
    hit_points_roll: string;
    speed: any;
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
    proficiencies: any;
    damage_vulnerabilities: any;
    damage_resistances: any;
    damage_immunities: any;
    condition_immunities: any;
    senses: any;
    languages: string;
    challenge_rating: number;
    proficiency_bonus: number;
    xp: number;
    special_abilities: any;
    actions: any;
    legendary_actions: any;
    image: string;
    url: string;
    created_at: string;
}

export interface DnDBackground {
    index: string;
    name: string;
    skill_proficiencies: any;
    language_proficiencies: any;
    equipment_proficiencies: any;
    starting_equipment: any;
    language_options: any;
    equipment_options: any;
    feature: any;
    personality_traits: any;
    ideals: any;
    bonds: any;
    flaws: any;
    url: string;
    created_at: string;
}

export interface DnDSkill {
    index: string;
    name: string;
    description: any;
    ability_score: any;
    url: string;
    created_at: string;
}

export interface DnDFeature {
    index: string;
    name: string;
    level: number;
    description: any;
    class: any;
    subclass: any;
    parent: any;
    prerequisites: any;
    url: string;
    created_at: string;
}

// ========================================
// TIPOS PARA PARÂMETROS DE BUSCA
// ========================================

export interface DnDSearchParams {
    limit?: number;
    offset?: number;
    search?: string;
}

export interface SpellSearchParams extends DnDSearchParams {
    level?: number;
    school?: string;
    class?: string;
}

export interface EquipmentSearchParams extends DnDSearchParams {
    category?: string;
}

export interface MonsterSearchParams extends DnDSearchParams {
    challenge_rating?: number;
    type?: string;
}

export interface FeatureSearchParams extends DnDSearchParams {
    class?: string;
    level?: number;
}

// ========================================
// TIPOS PARA RESPOSTAS DA API
// ========================================

export interface DnDListResponse<T> {
    results: T[];
    limit: number;
    offset: number;
}

// ========================================
// SERVIÇO D&D
// ========================================

export const dndService = {
    // ========================================
    // RACES (RAÇAS)
    // ========================================
    getRaces: async (params?: DnDSearchParams): Promise<DnDListResponse<DnDRace>> => {
        const queryString = new URLSearchParams();

        if (params?.limit) queryString.append('limit', params.limit.toString());
        if (params?.offset) queryString.append('offset', params.offset.toString());
        if (params?.search) queryString.append('search', params.search);

        const url = `/dnd/races${queryString.toString() ? `?${queryString}` : ''}`;
        return await fetchFromAPI(url);
    },

    getRaceByIndex: async (index: string): Promise<DnDRace> => {
        return await fetchFromAPI(`/dnd/races/${index}`);
    },

    // ========================================
    // CLASSES
    // ========================================
    getClasses: async (params?: DnDSearchParams): Promise<DnDListResponse<DnDClass>> => {
        const queryString = new URLSearchParams();

        if (params?.limit) queryString.append('limit', params.limit.toString());
        if (params?.offset) queryString.append('offset', params.offset.toString());
        if (params?.search) queryString.append('search', params.search);

        const url = `/dnd/classes${queryString.toString() ? `?${queryString}` : ''}`;
        return await fetchFromAPI(url);
    },

    getClassByIndex: async (index: string): Promise<DnDClass> => {
        return await fetchFromAPI(`/dnd/classes/${index}`);
    },

    // ========================================
    // SPELLS (MAGIAS)
    // ========================================
    getSpells: async (params?: SpellSearchParams): Promise<DnDListResponse<DnDSpell>> => {
        const queryString = new URLSearchParams();

        if (params?.limit) queryString.append('limit', params.limit.toString());
        if (params?.offset) queryString.append('offset', params.offset.toString());
        if (params?.search) queryString.append('search', params.search);
        if (params?.level !== undefined) queryString.append('level', params.level.toString());
        if (params?.school) queryString.append('school', params.school);
        if (params?.class) queryString.append('class', params.class);

        const url = `/dnd/spells${queryString.toString() ? `?${queryString}` : ''}`;
        return await fetchFromAPI(url);
    },

    getSpellByIndex: async (index: string): Promise<DnDSpell> => {
        return await fetchFromAPI(`/dnd/spells/${index}`);
    },

    // ========================================
    // EQUIPMENT (EQUIPAMENTOS)
    // ========================================
    getEquipment: async (params?: EquipmentSearchParams): Promise<DnDListResponse<DnDEquipment>> => {
        const queryString = new URLSearchParams();

        if (params?.limit) queryString.append('limit', params.limit.toString());
        if (params?.offset) queryString.append('offset', params.offset.toString());
        if (params?.search) queryString.append('search', params.search);
        if (params?.category) queryString.append('category', params.category);

        const url = `/dnd/equipment${queryString.toString() ? `?${queryString}` : ''}`;
        return await fetchFromAPI(url);
    },

    getEquipmentByIndex: async (index: string): Promise<DnDEquipment> => {
        return await fetchFromAPI(`/dnd/equipment/${index}`);
    },

    // ========================================
    // MONSTERS (MONSTROS)
    // ========================================
    getMonsters: async (params?: MonsterSearchParams): Promise<DnDListResponse<DnDMonster>> => {
        const queryString = new URLSearchParams();

        if (params?.limit) queryString.append('limit', params.limit.toString());
        if (params?.offset) queryString.append('offset', params.offset.toString());
        if (params?.search) queryString.append('search', params.search);
        if (params?.challenge_rating !== undefined) queryString.append('challenge_rating', params.challenge_rating.toString());
        if (params?.type) queryString.append('type', params.type);

        const url = `/dnd/monsters${queryString.toString() ? `?${queryString}` : ''}`;
        return await fetchFromAPI(url);
    },

    getMonsterByIndex: async (index: string): Promise<DnDMonster> => {
        return await fetchFromAPI(`/dnd/monsters/${index}`);
    },

    // ========================================
    // BACKGROUNDS
    // ========================================
    getBackgrounds: async (params?: DnDSearchParams): Promise<DnDListResponse<DnDBackground>> => {
        const queryString = new URLSearchParams();

        if (params?.limit) queryString.append('limit', params.limit.toString());
        if (params?.offset) queryString.append('offset', params.offset.toString());
        if (params?.search) queryString.append('search', params.search);

        const url = `/dnd/backgrounds${queryString.toString() ? `?${queryString}` : ''}`;
        return await fetchFromAPI(url);
    },

    getBackgroundByIndex: async (index: string): Promise<DnDBackground> => {
        return await fetchFromAPI(`/dnd/backgrounds/${index}`);
    },

    // ========================================
    // SKILLS (HABILIDADES)
    // ========================================
    getSkills: async (params?: DnDSearchParams): Promise<DnDListResponse<DnDSkill>> => {
        const queryString = new URLSearchParams();

        if (params?.limit) queryString.append('limit', params.limit.toString());
        if (params?.offset) queryString.append('offset', params.offset.toString());

        const url = `/dnd/skills${queryString.toString() ? `?${queryString}` : ''}`;
        return await fetchFromAPI(url);
    },

    getSkillByIndex: async (index: string): Promise<DnDSkill> => {
        return await fetchFromAPI(`/dnd/skills/${index}`);
    },

    // ========================================
    // FEATURES (CARACTERÍSTICAS)
    // ========================================
    getFeatures: async (params?: FeatureSearchParams): Promise<DnDListResponse<DnDFeature>> => {
        const queryString = new URLSearchParams();

        if (params?.limit) queryString.append('limit', params.limit.toString());
        if (params?.offset) queryString.append('offset', params.offset.toString());
        if (params?.class) queryString.append('class', params.class);
        if (params?.level !== undefined) queryString.append('level', params.level.toString());

        const url = `/dnd/features${queryString.toString() ? `?${queryString}` : ''}`;
        return await fetchFromAPI(url);
    },

    getFeatureByIndex: async (index: string): Promise<DnDFeature> => {
        return await fetchFromAPI(`/dnd/features/${index}`);
    }
};

// ========================================
// UTILITÁRIOS/HELPERS
// ========================================

// Função para formatar CR (Challenge Rating) para exibição
export const formatChallengeRating = (cr: number): string => {
    if (cr < 1) {
        if (cr === 0.125) return "1/8";
        if (cr === 0.25) return "1/4";
        if (cr === 0.5) return "1/2";
    }
    return cr.toString();
};

// Função para obter modificador de atributo
export const getAbilityModifier = (score: number): number => {
    return Math.floor((score - 10) / 2);
};

// Função para formatar modificador com sinal
export const formatModifier = (modifier: number): string => {
    return modifier >= 0 ? `+${modifier}` : modifier.toString();
};

// Função para calcular bônus de proficiência por CR
export const getProficiencyBonusByCR = (cr: number): number => {
    if (cr >= 17) return 6;
    if (cr >= 13) return 5;
    if (cr >= 9) return 4;
    if (cr >= 5) return 3;
    return 2;
};

// Função para obter cor baseada no CR
export const getCRColor = (cr: number): string => {
    if (cr <= 2) return "text-green-600";
    if (cr <= 5) return "text-yellow-600";
    if (cr <= 10) return "text-orange-600";
    if (cr <= 15) return "text-red-600";
    return "text-purple-600";
};

// Função para obter cores de nível de magia
export const getSpellLevelColor = (level: number): string => {
    const colors = [
        "text-gray-600",    // Cantrip
        "text-blue-600",    // 1st
        "text-green-600",   // 2nd
        "text-yellow-600",  // 3rd
        "text-orange-600",  // 4th
        "text-red-600",     // 5th
        "text-purple-600",  // 6th
        "text-pink-600",    // 7th
        "text-indigo-600",  // 8th
        "text-gray-800"     // 9th
    ];
    return colors[level] || "text-gray-600";
};

// Função para formatar nível de magia
export const formatSpellLevel = (level: number): string => {
    if (level === 0) return "Cantrip";
    return `${level}º Nível`;
};

export default dndService;