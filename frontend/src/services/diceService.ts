import { fetchFromAPI } from './apiService';
import { DiceRollRequest, DiceRollResponse } from '../types/dice';

export const diceService = {
    /**
     * Rola dados usando notação padrão (ex: "2d6+3", "1d20")
     */
    roll: async (notation: string, label?: string, advantage?: boolean, disadvantage?: boolean): Promise<DiceRollResponse> => {
        const request: DiceRollRequest = {
            notation,
            label,
            advantage,
            disadvantage
        };
        return await fetchFromAPI('/dice/roll', 'POST', request);
    },

    /**
     * Rola múltiplas notações de dados de uma vez
     */
    rollMultiple: async (requests: DiceRollRequest[]): Promise<DiceRollResponse[]> => {
        return await fetchFromAPI('/dice/roll-multiple', 'POST', requests);
    }
};
