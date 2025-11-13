// Types for dice rolling system

export type DiceType = 2 | 4 | 6 | 8 | 10 | 12 | 20 | 100;

export interface DiceRoll {
    notation: string;        // "2d6+3"
    rolls: number[];         // [4, 5]
    modifier: number;        // 3
    total: number;           // 12
    timestamp: Date;
    label?: string;          // "Ataque com Espada Longa"
    isCritical?: boolean;    // Natural 20
    isFumble?: boolean;      // Natural 1
    advantage?: boolean;     // Rolado com vantagem
    disadvantage?: boolean;  // Rolado com desvantagem
    droppedRolls?: number[]; // Dados descartados
}

export interface DiceRollRequest {
    notation: string;
    label?: string;
    advantage?: boolean;
    disadvantage?: boolean;
}

export interface DiceRollResponse {
    notation: string;
    quantity: number;
    sides: number;
    modifier: number;
    rolls: number[];
    total: number;
    timestamp: string;
    label?: string;
    advantage?: boolean;
    disadvantage?: boolean;
    dropped_rolls?: number[];
}

export interface QuickRoll {
    label: string;
    notation: string;
    icon?: string;
}
