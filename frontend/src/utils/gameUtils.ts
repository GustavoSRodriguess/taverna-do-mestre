import { GameAttributes, StatusType, StatusConfig, BadgeVariant } from '../types/game';

// ========================================
// CÁLCULOS DE JOGO
// ========================================

export const calculateModifier = (score: number): number => {
    return Math.floor((score - 10) / 2);
};

export const formatModifier = (modifier: number): string => {
    return modifier >= 0 ? `+${modifier}` : modifier.toString();
};

export const calculateProficiencyBonus = (level: number): number => {
    if (level >= 17) return 6;
    if (level >= 13) return 5;
    if (level >= 9) return 4;
    if (level >= 5) return 3;
    return 2;
};

export const calculateSkillBonus = (
    attributeScore: number,
    proficiencyBonus: number,
    isProficient: boolean = false,
    hasExpertise: boolean = false,
    bonusModifier: number = 0
): number => {
    let total = calculateModifier(attributeScore) + bonusModifier;

    if (isProficient) {
        total += proficiencyBonus;
    }

    if (hasExpertise) {
        total += proficiencyBonus;
    }

    return total;
};

export const calculateSpellStats = (
    attributes: GameAttributes,
    proficiencyBonus: number,
    spellcastingAbility: keyof GameAttributes
) => {
    const modifier = calculateModifier(attributes[spellcastingAbility]);
    return {
        spellAttackBonus: modifier + proficiencyBonus,
        spellSaveDC: 8 + modifier + proficiencyBonus,
        modifier
    };
};

// ========================================
// STATUS E BADGES
// ========================================

export const CAMPAIGN_STATUS_CONFIG: Record<StatusType, StatusConfig> = {
    planning: { variant: 'info', text: 'Planejando' },
    active: { variant: 'success', text: 'Ativa' },
    paused: { variant: 'warning', text: 'Pausada' },
    completed: { variant: 'primary', text: 'Concluída' },
    inactive: { variant: 'info', text: 'Inativo' },
    dead: { variant: 'danger', text: 'Morto' },
    retired: { variant: 'warning', text: 'Aposentado' }
};

export const CHARACTER_STATUS_CONFIG: Record<StatusType, StatusConfig> = {
    active: { variant: 'success', text: 'Ativo' },
    inactive: { variant: 'info', text: 'Inativo' },
    dead: { variant: 'danger', text: 'Morto' },
    retired: { variant: 'warning', text: 'Aposentado' },
    planning: { variant: 'info', text: 'Planejando' },
    paused: { variant: 'warning', text: 'Pausado' },
    completed: { variant: 'primary', text: 'Completo' }
};

export const getStatusConfig = (status: StatusType, type: 'campaign' | 'character' = 'campaign'): StatusConfig => {
    const config = type === 'campaign' ? CAMPAIGN_STATUS_CONFIG : CHARACTER_STATUS_CONFIG;
    return config[status] || { variant: 'primary', text: status };
};

// ========================================
// UTILITÁRIOS DE VALIDAÇÃO
// ========================================

export const validateCharacterName = (name: string): string | null => {
    if (!name?.trim()) return 'Nome é obrigatório';
    if (name.length > 100) return 'Nome deve ter no máximo 100 caracteres';
    return null;
};

export const validateLevel = (level: number): string | null => {
    if (level < 1 || level > 20) return 'Nível deve estar entre 1 e 20';
    return null;
};

export const validateAttributes = (attributes: GameAttributes): string[] => {
    const errors: string[] = [];
    const entries = Object.entries(attributes);

    for (const [key, value] of entries) {
        if (value < 1 || value > 30) {
            errors.push(`${key} deve estar entre 1 e 30`);
        }
    }

    return errors;
};

export const validateHP = (hp: number, currentHp?: number): string[] => {
    const errors: string[] = [];

    if (hp < 1) errors.push('HP deve ser maior que 0');
    if (currentHp !== undefined && currentHp < 0) errors.push('HP atual não pode ser negativo');

    return errors;
};

// ========================================
// UTILITÁRIOS DE FORMATAÇÃO
// ========================================

export const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value).replace('R$', 'PO ');
};

export const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('pt-BR');
};

export const formatDateTime = (date: string): string => {
    return new Date(date).toLocaleString('pt-BR');
};

// ========================================
// UTILITÁRIOS DE ARRAY
// ========================================

export const groupBy = <T, K extends keyof any>(
    array: T[],
    getKey: (item: T) => K
): Record<K, T[]> => {
    return array.reduce((grouped, item) => {
        const key = getKey(item);
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(item);
        return grouped;
    }, {} as Record<K, T[]>);
};

export const sortBy = <T>(array: T[], key: keyof T): T[] => {
    return [...array].sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];
        if (aVal < bVal) return -1;
        if (aVal > bVal) return 1;
        return 0;
    });
};

// ========================================
// CONSTANTES DE JOGO
// ========================================

export const ATTRIBUTE_LABELS: Record<keyof GameAttributes, string> = {
    strength: 'Força',
    dexterity: 'Destreza',
    constitution: 'Constituição',
    intelligence: 'Inteligência',
    wisdom: 'Sabedoria',
    charisma: 'Carisma'
};

export const ATTRIBUTE_SHORT_LABELS: Record<keyof GameAttributes, string> = {
    strength: 'FOR',
    dexterity: 'DES',
    constitution: 'CON',
    intelligence: 'INT',
    wisdom: 'SAB',
    charisma: 'CAR'
};

export const ALIGNMENTS = [
    'Lawful Good', 'Neutral Good', 'Chaotic Good',
    'Lawful Neutral', 'True Neutral', 'Chaotic Neutral',
    'Lawful Evil', 'Neutral Evil', 'Chaotic Evil'
];

export const DAMAGE_TYPES = [
    'Cortante', 'Perfurante', 'Esmagamento',
    'Fogo', 'Gelo', 'Raio', 'Força', 'Ácido',
    'Necrótico', 'Radiante', 'Psíquico'
];

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

export const POINT_BUY_DEFAULTS: GameAttributes = {
    strength: 13,
    dexterity: 14,
    constitution: 13,
    intelligence: 12,
    wisdom: 12,
    charisma: 10
};