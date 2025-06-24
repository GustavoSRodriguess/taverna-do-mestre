import { fetchFromAPI } from './apiService';

export interface PCAttributesType {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
}

export interface PCSkill {
    proficient: boolean;
    expertise: boolean;
    bonus: number;
}

export interface PCAttack {
    name: string;
    bonus: number;
    damage: string;
    type: string;
    range?: string;
}

export interface PCSpell {
    name: string;
    level: number;
    school: string;
    prepared?: boolean;
}

export interface PCSpells {
    spell_slots: { [level: string]: { total: number; used: number } };
    known_spells: PCSpell[];
    spellcasting_ability?: string;
    spell_attack_bonus?: number;
    spell_save_dc?: number;
}

export interface PCEquipmentItem {
    name: string;
    quantity: number;
    equipped?: boolean;
    description?: string;
}

export interface PC {
    id: number;
    name: string;
    race: string;
    class: string;
    level: number;
    background: string;
    alignment: string;
    attributes: PCAttributesType;
    skills: { [key: string]: PCSkill };
    hp: number;
    current_hp?: number;
    ca: number;
    attacks: PCAttack[];
    spells: PCSpells;
    abilities: { [key: string]: any };
    equipment: PCEquipmentItem[];
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
    attributes: PCAttributesType;
    skills?: { [key: string]: PCSkill };
    abilities?: { [key: string]: any };
    hp: number;
    current_hp?: number;
    ca: number;
    attacks?: PCAttack[];
    spells?: PCSpells;
    equipment?: PCEquipmentItem[];
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

export interface PCCampaign {
    id: number;
    name: string;
    description: string;
    status: string;
    max_players: number;
    current_session: number;
    dm_name: string;
    player_count: number;
    character_status: string;
    current_hp?: number;
    created_at: string;
    updated_at: string;
}

export interface PCListResponse {
    pcs: PC[];
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
    async getPCs(limit: number = 20, offset: number = 0): Promise<PCListResponse> {
        return fetchFromAPI(`/pcs?limit=${limit}&offset=${offset}`);
    }

    async getPC(id: number): Promise<PC> {
        return fetchFromAPI(`/pcs/${id}`);
    }

    async createPC(pcData: CreatePCData): Promise<PC> {
        // Calcular bônus de proficiência se não fornecido
        if (!pcData.proficiency_bonus) {
            pcData.proficiency_bonus = this.calculateProficiencyBonus(pcData.level);
        }

        // Definir HP atual se não fornecido
        if (pcData.current_hp === undefined) {
            pcData.current_hp = pcData.hp;
        }

        // Definir valores padrão para campos opcionais
        const payload = {
            ...pcData,
            skills: pcData.skills || {},
            attacks: pcData.attacks || [],
            abilities: pcData.abilities || {}, // GARANTIR QUE ABILITIES EXISTE
            spells: pcData.spells || {
                spell_slots: {},
                known_spells: []
            },
            equipment: pcData.equipment || [],
            inspiration: pcData.inspiration || false,
            description: pcData.description || '',
            personality_traits: pcData.personality_traits || '',
            ideals: pcData.ideals || '',
            bonds: pcData.bonds || '',
            flaws: pcData.flaws || '',
            features: pcData.features || []
        };

        console.log('Enviando payload para criar PC:', payload); // DEBUG

        return fetchFromAPI('/pcs', 'POST', payload);
    }

    async updatePC(id: number, pcData: Partial<CreatePCData>): Promise<PC> {
        // Recalcular bônus de proficiência se o nível mudou
        if (pcData.level && !pcData.proficiency_bonus) {
            pcData.proficiency_bonus = this.calculateProficiencyBonus(pcData.level);
        }

        // Garantir que abilities existe se estiver atualizando
        const payload = {
            ...pcData,
            abilities: pcData.abilities || {} // GARANTIR QUE ABILITIES EXISTE
        };

        console.log('Enviando payload para atualizar PC:', payload); // DEBUG

        return fetchFromAPI(`/pcs/${id}`, 'PUT', payload);
    }

    async deletePC(id: number): Promise<void> {
        return fetchFromAPI(`/pcs/${id}`, 'DELETE');
    }

    async getPCCampaigns(id: number): Promise<PCCampaignsResponse> {
        return fetchFromAPI(`/pcs/${id}/campaigns`);
    }

    async generatePC(request: GeneratePCRequest): Promise<PC> {
        return fetchFromAPI('/pcs/generate', 'POST', request);
    }

    // Funções auxiliares
    calculateProficiencyBonus(level: number): number {
        if (level >= 17) return 6;
        if (level >= 13) return 5;
        if (level >= 9) return 4;
        if (level >= 5) return 3;
        return 2;
    }

    calculateModifier(score: number): number {
        return Math.floor((score - 10) / 2);
    }

    formatModifier(modifier: number): string {
        return modifier >= 0 ? `+${modifier}` : modifier.toString();
    }

    // Validações
    validatePCData(pcData: CreatePCData): string[] {
        const errors: string[] = [];

        if (!pcData.name?.trim()) {
            errors.push('Nome é obrigatório');
        }

        if (!pcData.race?.trim()) {
            errors.push('Raça é obrigatória');
        }

        if (!pcData.class?.trim()) {
            errors.push('Classe é obrigatória');
        }

        if (pcData.level < 1 || pcData.level > 20) {
            errors.push('Nível deve estar entre 1 e 20');
        }

        if (pcData.hp < 1) {
            errors.push('HP deve ser maior que 0');
        }

        if (pcData.ca < 1) {
            errors.push('CA deve ser maior que 0');
        }

        // Validar atributos
        const attributes = Object.values(pcData.attributes);
        if (attributes.some(attr => attr < 1 || attr > 30)) {
            errors.push('Atributos devem estar entre 1 e 30');
        }

        return errors;
    }

    // Criar PC com valores padrão baseados em raça/classe
    createDefaultPC(race?: string, className?: string, level: number = 1): CreatePCData {
        const attributes: PCAttributesType = {
            strength: 10,
            dexterity: 10,
            constitution: 10,
            intelligence: 10,
            wisdom: 10,
            charisma: 10
        };

        // Aplicar modificadores raciais básicos (simplificado)
        if (race) {
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
                    // Humanos ganham +1 em todos
                    Object.keys(attributes).forEach(key => {
                        attributes[key as keyof PCAttributesType] += 1;
                    });
                    break;
                case 'tiefling':
                    attributes.charisma += 2;
                    break;
            }
        }

        // Calcular HP base (simplificado)
        let baseHP = 8; // Padrão
        if (className) {
            switch (className.toLowerCase()) {
                case 'barbarian':
                case 'fighter':
                case 'paladin':
                case 'ranger':
                    baseHP = 10;
                    break;
                case 'bard':
                case 'cleric':
                case 'druid':
                case 'monk':
                case 'rogue':
                case 'warlock':
                    baseHP = 8;
                    break;
                case 'sorcerer':
                case 'wizard':
                    baseHP = 6;
                    break;
            }
        }

        const hp = baseHP + this.calculateModifier(attributes.constitution) + (level - 1) * (Math.floor(baseHP / 2) + 1);

        return {
            name: '',
            race: race || '',
            class: className || '',
            level,
            attributes,
            abilities: {}, // CAMPO ABILITIES ADICIONADO AQUI TAMBÉM
            hp: Math.max(hp, 1),
            ca: 10 + this.calculateModifier(attributes.dexterity),
            proficiency_bonus: this.calculateProficiencyBonus(level)
        };
    }
}

export const pcService = new PCService();