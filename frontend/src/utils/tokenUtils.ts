import { SceneToken } from '../types/room';

/**
 * Limita um valor percentual entre 0 e 100
 */
export const clampPercent = (value: number): number => Math.max(0, Math.min(100, value));

/**
 * Arredonda um valor para o grid de 5%
 */
export const snapToGrid = (value: number): number => Math.round(value / 5) * 5;

/**
 * Calcula a porcentagem de HP atual, limitado entre 0 e 100 para não estourar a barra
 */
export const calculateHPPercentage = (currentHP: number, maxHP: number): number => {
    if (maxHP === 0) return 100;
    const percentage = (currentHP / maxHP) * 100;
    return Math.max(0, Math.min(100, percentage));
};

/**
 * Determina a cor da barra de HP baseado na porcentagem
 */
export const getHPColor = (hpPercentage: number): string => {
    if (hpPercentage > 66) return 'bg-green-500';
    if (hpPercentage > 33) return 'bg-yellow-500';
    return 'bg-red-500';
};

/**
 * Determina a cor do texto de HP baseado na porcentagem
 */
export const getHPTextColor = (hpPercentage: number): string => {
    if (hpPercentage > 66) return 'text-green-400';
    if (hpPercentage > 33) return 'text-yellow-400';
    return 'text-red-400';
};

/**
 * Gera um ID único para um novo token
 */
export const generateTokenId = (): string => `token-${Date.now()}`;

/**
 * Cores padrão para tokens
 */
export const TOKEN_COLORS = ['#f59e0b', '#38bdf8', '#c084fc', '#22c55e', '#f97316'];

/**
 * Retorna a próxima cor disponível para um novo token
 */
export const getNextTokenColor = (existingTokensCount: number): string => {
    return TOKEN_COLORS[existingTokensCount % TOKEN_COLORS.length];
};
