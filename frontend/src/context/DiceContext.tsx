import React, { createContext, useContext, useState, ReactNode } from 'react';
import { diceService } from '../services/diceService';
import { DiceRoll } from '../types/dice';
import { DiceNotification } from '../components/Dice/DiceNotification';

interface DiceContextType {
    roll: (
        notation: string,
        label?: string,
        advantage?: boolean,
        disadvantage?: boolean,
        options?: { silent?: boolean },
    ) => Promise<DiceRoll>;
    lastRoll: DiceRoll | null;
    addRollListener: (cb: (roll: DiceRoll) => void) => () => void;
}

const DiceContext = createContext<DiceContextType | undefined>(undefined);

export const DiceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [lastRoll, setLastRoll] = useState<DiceRoll | null>(null);
    const [notification, setNotification] = useState<DiceRoll | null>(null);
    const listeners = React.useRef<Set<(roll: DiceRoll) => void>>(new Set());

    const roll = async (
        notation: string,
        label?: string,
        advantage?: boolean,
        disadvantage?: boolean,
        options?: { silent?: boolean },
    ) => {
        try {
            const result = await diceService.roll(notation, label, advantage, disadvantage);

            // Detectar crítico (natural 20) ou falha (natural 1)
            const isCritical = result.sides === 20 && result.quantity === 1 && result.rolls[0] === 20;
            const isFumble = result.sides === 20 && result.quantity === 1 && result.rolls[0] === 1;

            const diceRoll: DiceRoll = {
                notation: result.notation,
                rolls: result.rolls,
                modifier: result.modifier,
                total: result.total,
                timestamp: new Date(result.timestamp),
                label: result.label,
                isCritical,
                isFumble,
                advantage: result.advantage,
                disadvantage: result.disadvantage,
                droppedRolls: result.dropped_rolls,
            };

            setLastRoll(diceRoll);
            if (!options?.silent) {
                setNotification(diceRoll);
            }
            listeners.current.forEach((cb) => cb(diceRoll));
            return diceRoll;
        } catch (error) {
            console.error('Erro ao rolar dados:', error);
            throw error;
        }
    };

    const closeNotification = () => {
        setNotification(null);
    };

    const addRollListener = (cb: (roll: DiceRoll) => void) => {
        listeners.current.add(cb);
        return () => listeners.current.delete(cb);
    };

    return (
        <DiceContext.Provider value={{ roll, lastRoll, addRollListener }}>
            {children}
            {notification && (
                <DiceNotification
                    roll={notification}
                    onClose={closeNotification}
                    autoClose={5000}
                />
            )}
        </DiceContext.Provider>
    );
};

export const useDice = () => {
    const context = useContext(DiceContext);
    if (!context) {
        throw new Error('useDice deve ser usado dentro de um DiceProvider');
    }
    return context;
};
