// frontend/src/services/pcService.ts - Versão Refatorada
import { fetchFromAPI } from './apiService';
import { FullCharacter, GameAttributes, StatusType } from '../types/game';
import {
    calculateProficiencyBonus,
    calculateModifier,
    validateCharacterName,
    validateLevel,
    validateAttributes,
    validateHP
} from '../utils/gameUtils';

export interface PCCampaign {
    id: number;
    name: string;
    description: string;
    status: StatusType;
    max_players: number;
    current_session: number;
    dm_name: string;
    player_count: number;
    character_status: StatusType;
    current_hp?: number;
    created_at: string;
    updated_at: string;
}

export interface PCListResponse {
    pcs: FullCharacter[];
    limit: number;
    offset: number;
    count: number;
}

export interface PCCampaignsResponse {
    campaigns: PCCampaign[];
    count: number;
}

export interface GeneratePCRequest {
    level: number;
    attributes_method?: string;
    manual?: boolean;
    race?: string;
    class?: string;
    background?: string;
    player_name?: string;
}

class PCService {
    // CRUD Operations
    async getPCs(limit: number = 20, offset: number = 0): Promise<PCListResponse> {
        return fetchFromAPI(`/pcs?limit=${limit}&offset=${offset}`);
    }

    async getPC(id: number): Promise<FullCharacter> {
        return fetchFromAPI(`/pcs/${id}`);
    }

    async createPC(pcData: Partial<FullCharacter>): Promise<FullCharacter> {
        const processedData = this.processCreateData(pcData);
        return fetchFromAPI('/pcs', 'POST', processedData);
    }

    async updatePC(id: number, pcData: Partial<FullCharacter>): Promise<FullCharacter> {
        const processedData = this.processUpdateData(pcData);
        console.log('Updating PC with data:', processedData);
        return fetchFromAPI(`/pcs/${id}`, 'PUT', processedData);
    }

    async deletePC(id: number): Promise<void> {
        return fetchFromAPI(`/pcs/${id}`, 'DELETE');
    }

    async getPCCampaigns(id: number): Promise<PCCampaignsResponse> {
        return fetchFromAPI(`/pcs/${id}/campaigns`);
    }

    async generatePC(request: GeneratePCRequest): Promise<FullCharacter> {
        return fetchFromAPI('/pcs/generate', 'POST', request);
    }

    // Data Processing
    private processCreateData(pcData: Partial<FullCharacter>): Partial<FullCharacter> {
        const processed = { ...pcData };

        // Auto-calculate proficiency bonus if not provided
        if (!processed.proficiency_bonus && processed.level) {
            processed.proficiency_bonus = calculateProficiencyBonus(processed.level);
        }

        // Set current HP if not provided
        if (processed.current_hp === undefined && processed.hp) {
            processed.current_hp = processed.hp;
        }

        // Ensure required nested objects exist
        processed.skills = processed.skills || {};
        processed.attacks = processed.attacks || [];
        processed.abilities = processed.abilities || {};
        processed.spells = processed.spells || { spell_slots: {}, known_spells: [] };
        processed.equipment = processed.equipment || [];
        processed.inspiration = processed.inspiration || false;

        // Ensure string fields have defaults
        processed.description = processed.description || '';
        processed.personality_traits = processed.personality_traits || '';
        processed.ideals = processed.ideals || '';
        processed.bonds = processed.bonds || '';
        processed.flaws = processed.flaws || '';
        processed.features = processed.features || [];

        return processed;
    }

    private processUpdateData(pcData: Partial<FullCharacter>): Partial<FullCharacter> {
        const processed = { ...pcData };

        // Recalculate proficiency bonus if level changed
        if (processed.level && !processed.proficiency_bonus) {
            processed.proficiency_bonus = calculateProficiencyBonus(processed.level);
        }

        // Ensure abilities exists
        if (!processed.abilities) {
            processed.abilities = {};
        }

        return processed;
    }

    // Utility Functions
    calculateProficiencyBonus = calculateProficiencyBonus;
    calculateModifier = calculateModifier;

    formatModifier(modifier: number): string {
        return modifier >= 0 ? `+${modifier}` : modifier.toString();
    }

    // Validation
    validatePCData(pcData: Partial<FullCharacter>): string[] {
        const errors: string[] = [];

        // Basic validation
        if (pcData.name !== undefined) {
            const nameError = validateCharacterName(pcData.name);
            if (nameError) errors.push(nameError);
        }

        if (pcData.level !== undefined) {
            const levelError = validateLevel(pcData.level);
            if (levelError) errors.push(levelError);
        }

        if (pcData.attributes) {
            errors.push(...validateAttributes(pcData.attributes));
        }

        if (pcData.hp !== undefined) {
            errors.push(...validateHP(pcData.hp, pcData.current_hp));
        }

        // Required fields for creation
        if (!pcData.race?.trim()) errors.push('Raça é obrigatória');
        if (!pcData.class?.trim()) errors.push('Classe é obrigatória');

        return errors;
    }

    // Character Creation Helpers
    createDefaultPC(race?: string, className?: string, level: number = 1): Partial<FullCharacter> {
        const attributes: GameAttributes = {
            strength: 10,
            dexterity: 10,
            constitution: 10,
            intelligence: 10,
            wisdom: 10,
            charisma: 10
        };

        // Apply basic racial modifiers
        if (race) {
            this.applyRacialModifiers(attributes, race);
        }

        // Calculate HP based on class
        const baseHP = this.getClassHitDie(className);
        const hp = baseHP + calculateModifier(attributes.constitution) +
            (level - 1) * (Math.floor(baseHP / 2) + 1 + calculateModifier(attributes.constitution));

        return {
            name: '',
            race: race || '',
            class: className || '',
            level,
            attributes,
            abilities: {},
            hp: Math.max(hp, 1),
            ca: 10 + calculateModifier(attributes.dexterity),
            proficiency_bonus: calculateProficiencyBonus(level),
            skills: {},
            attacks: [],
            spells: { spell_slots: {}, known_spells: [] },
            equipment: [],
            inspiration: false,
            description: '',
            personality_traits: '',
            ideals: '',
            bonds: '',
            flaws: '',
            features: []
        };
    }

    private applyRacialModifiers(attributes: GameAttributes, race: string): void {
        // Simplified racial modifiers
        switch (race.toLowerCase()) {
            case 'elf':
                attributes.dexterity += 2;
                break;
            case 'dwarf':
                attributes.constitution += 2;
                break;
            case 'halfling':
                attributes.dexterity += 2;
                break;
            case 'human':
                // Humans get +1 to all
                Object.keys(attributes).forEach(key => {
                    attributes[key as keyof GameAttributes] += 1;
                });
                break;
            case 'tiefling':
                attributes.charisma += 2;
                break;
            case 'dragonborn':
                attributes.strength += 2;
                attributes.charisma += 1;
                break;
            case 'gnome':
                attributes.intelligence += 2;
                break;
            case 'half-elf':
                attributes.charisma += 2;
                // Half-elves also get +1 to two different abilities
                break;
            case 'half-orc':
                attributes.strength += 2;
                attributes.constitution += 1;
                break;
        }
    }

    private getClassHitDie(className?: string): number {
        if (!className) return 8;

        switch (className.toLowerCase()) {
            case 'barbarian':
                return 12;
            case 'fighter':
            case 'paladin':
            case 'ranger':
                return 10;
            case 'bard':
            case 'cleric':
            case 'druid':
            case 'monk':
            case 'rogue':
            case 'warlock':
                return 8;
            case 'sorcerer':
            case 'wizard':
                return 6;
            default:
                return 8;
        }
    }

    // Spell calculations
    calculateSpellAttackBonus(
        spellcastingAbility: keyof GameAttributes,
        attributes: GameAttributes,
        proficiencyBonus: number
    ): number {
        const modifier = calculateModifier(attributes[spellcastingAbility]);
        return modifier + proficiencyBonus;
    }

    calculateSpellSaveDC(
        spellcastingAbility: keyof GameAttributes,
        attributes: GameAttributes,
        proficiencyBonus: number
    ): number {
        const modifier = calculateModifier(attributes[spellcastingAbility]);
        return 8 + modifier + proficiencyBonus;
    }

    // Skill calculations
    calculateSkillBonus(
        skillAttribute: keyof GameAttributes,
        attributes: GameAttributes,
        proficiencyBonus: number,
        isProficient: boolean = false,
        hasExpertise: boolean = false,
        bonusModifier: number = 0
    ): number {
        let total = calculateModifier(attributes[skillAttribute]) + bonusModifier;

        if (isProficient) {
            total += proficiencyBonus;
        }

        if (hasExpertise) {
            total += proficiencyBonus;
        }

        return total;
    }
}

export const pcService = new PCService();