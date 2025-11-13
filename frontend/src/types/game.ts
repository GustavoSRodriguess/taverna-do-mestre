export interface GameAttributes {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
}

export interface GameModifiers extends GameAttributes { }

export interface GameSkill {
    proficient: boolean;
    expertise: boolean;
    bonus: number;
}

export interface GameAttack {
    name: string;
    bonus: number;
    damage: string;
    type: string;
    range?: string;
}

export interface GameSpell {
    name: string;
    level: number;
    school: string;
    prepared?: boolean;
}

export interface GameSpells {
    spell_slots: { [level: string]: { total: number; used: number } };
    known_spells: GameSpell[];
    spellcasting_ability?: keyof GameAttributes;
    spell_attack_bonus?: number;
    spell_save_dc?: number;
}

export interface GameEquipment {
    name: string;
    quantity: number;
    equipped?: boolean;
    description?: string;
}

export interface BaseCharacter {
    id?: number;
    name: string;
    race: string;
    class: string;
    level: number;
    background?: string;
    alignment?: string;
    attributes: GameAttributes;
    hp: number;
    current_hp?: number;
    ca: number;
    proficiency_bonus: number;
    created_at?: string;
}

export interface FullCharacter extends BaseCharacter {
    skills: { [key: string]: GameSkill };
    attacks: GameAttack[];
    spells: GameSpells;
    abilities: { [key: string]: any };
    equipment: GameEquipment[];
    inspiration: boolean;
    description: string;
    personality_traits: string;
    ideals: string;
    bonds: string;
    flaws: string;
    features: string[];
    player_name?: string;
    player_id?: number;
    is_homebrew?: boolean;
    is_unique?: boolean;
}

export type StatusType = 'planning' | 'active' | 'paused' | 'completed' | 'inactive' | 'dead' | 'retired';
export type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info';

export interface StatusConfig {
    variant: BadgeVariant;
    text: string;
    color?: string;
}