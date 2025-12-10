import { SceneToken } from '../types/room';

/**
 * Filtra e ordena tokens que possuem iniciativa definida
 * Retorna em ordem decrescente (maior iniciativa primeiro)
 */
export const getTokensWithInitiative = (tokens: SceneToken[]): SceneToken[] => {
    return tokens
        .filter((token) => token.initiative !== undefined && token.initiative !== null)
        .sort((a, b) => (b.initiative || 0) - (a.initiative || 0));
};

/**
 * Verifica se há algum token com iniciativa definida
 */
export const hasAnyInitiative = (tokens: SceneToken[]): boolean => {
    return tokens.some((token) => token.initiative !== undefined && token.initiative !== null);
};

/**
 * Calcula o próximo token na ordem de iniciativa
 * Retorna o ID do próximo token e se deve incrementar o round
 */
export const getNextTurnToken = (
    tokens: SceneToken[],
    currentTurnTokenId: string | null
): { nextTokenId: string; shouldIncrementRound: boolean } | null => {
    const tokensWithInitiative = getTokensWithInitiative(tokens);

    if (tokensWithInitiative.length === 0) {
        return null;
    }

    // Se não há turno atual, começa pelo primeiro
    if (!currentTurnTokenId) {
        return {
            nextTokenId: tokensWithInitiative[0].id,
            shouldIncrementRound: false,
        };
    }

    // Encontra o índice do token atual
    const currentIndex = tokensWithInitiative.findIndex((t) => t.id === currentTurnTokenId);
    const nextIndex = (currentIndex + 1) % tokensWithInitiative.length;

    return {
        nextTokenId: tokensWithInitiative[nextIndex].id,
        shouldIncrementRound: nextIndex === 0, // Volta pro início = novo round
    };
};

/**
 * Remove a iniciativa de todos os tokens
 */
export const clearAllInitiatives = (tokens: SceneToken[]): SceneToken[] => {
    return tokens.map((token) => ({
        ...token,
        initiative: undefined,
    }));
};

/**
 * Calcula o modificador de atributo do D&D 5e
 */
export const calculateModifier = (attributeValue: number): number => {
    return Math.floor((attributeValue - 10) / 2);
};

/**
 * Rola 1d20 + modificador para iniciativa
 */
export const rollInitiative = (dexterityModifier: number): number => {
    const d20Roll = Math.floor(Math.random() * 20) + 1;
    return d20Roll + dexterityModifier;
};
