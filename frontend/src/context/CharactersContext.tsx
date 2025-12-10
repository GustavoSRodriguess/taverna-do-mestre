import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FullCharacter } from '../types/game';
import { pcService } from '../services/pcService';

interface CharactersContextType {
    characters: FullCharacter[];
    loading: boolean;
    error: string | null;
    refreshCharacters: () => Promise<void>;
}

const CharactersContext = createContext<CharactersContextType | undefined>(undefined);

interface CharactersProviderProps {
    children: ReactNode;
}

export const CharactersProvider: React.FC<CharactersProviderProps> = ({ children }) => {
    const [characters, setCharacters] = useState<FullCharacter[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refreshCharacters = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await pcService.getPCs(100, 0);
            setCharacters(response.pcs || []);
        } catch (err) {
            setError('Erro ao carregar personagens');
        } finally {
            setLoading(false);
        }
    };

    // Carregar personagens ao montar o componente
    useEffect(() => {
        refreshCharacters();
    }, []);

    const value = {
        characters,
        loading,
        error,
        refreshCharacters,
    };

    return <CharactersContext.Provider value={value}>{children}</CharactersContext.Provider>;
};

export const useCharacters = (): CharactersContextType => {
    const context = useContext(CharactersContext);

    if (context === undefined) {
        throw new Error('useCharacters deve ser usado dentro de um CharactersProvider');
    }

    return context;
};
