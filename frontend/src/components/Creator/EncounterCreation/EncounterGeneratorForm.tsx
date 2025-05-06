import React, { useState } from 'react';
import { Button, SelectField, NumberField } from '../../../ui';

type DifficultyLevel = 'f' | 'm' | 'd' | 'mo';

interface EncounterGeneratorFormProps {
    onGenerateEncounter: (encounterData: {
        nivelJogadores: string;
        quantidadeJogadores: string;
        dificuldade: DifficultyLevel;
        tema?: string;
    }) => void;
}

export const EncounterGeneratorForm: React.FC<EncounterGeneratorFormProps> = ({ onGenerateEncounter }) => {
    const [playerLevel, setPlayerLevel] = useState("1");
    const [playerCount, setPlayerCount] = useState("4");
    const [difficulty, setDifficulty] = useState<DifficultyLevel>('m');
    const [theme, setTheme] = useState("");

    const difficultyOptions = [
        { value: 'e', label: 'Fácil' },
        { value: 'm', label: 'Médio' },
        { value: 'd', label: 'Difícil' },
        { value: 'mo', label: 'Mortal' }
    ];

    const themeOptions = [
        { value: '', label: 'Aleatório' },
        { value: 'Mortos-Vivos', label: 'Mortos-Vivos' },
        { value: 'Dragões', label: 'Dragões' },
        { value: 'Aberrações', label: 'Aberrações' },
        { value: 'Fadas', label: 'Fadas' },
        { value: 'Bestas', label: 'Bestas' },
        { value: 'Demônios', label: 'Demônios' },
        { value: 'Humanóides', label: 'Humanóides' }
    ];

    const handleGenerateEncounter = () => {
        // alert(difficulty)
        onGenerateEncounter({
            nivelJogadores: playerLevel,
            quantidadeJogadores: playerCount,
            dificuldade: difficulty,
            tema: theme || undefined
        });
    };

    return (
        <div className="text-left">
            <div className="space-y-4">
                <NumberField
                    label="Nível dos Jogadores (1-20)"
                    value={playerLevel}
                    onChange={setPlayerLevel}
                    min={1}
                    max={20}
                />

                <NumberField
                    label="Quantidade de Jogadores"
                    value={playerCount}
                    onChange={setPlayerCount}
                    min={1}
                    max={10}
                />

                <SelectField
                    label="Dificuldade do Encontro"
                    value={difficulty}
                    onChange={(value) => setDifficulty(value as DifficultyLevel)}
                    options={difficultyOptions}
                />

                <SelectField
                    label="Tema do Encontro (opcional)"
                    value={theme}
                    onChange={setTheme}
                    options={themeOptions}
                />

                <Button
                    buttonLabel="Gerar Encontro"
                    onClick={handleGenerateEncounter}
                    classname="w-full mt-4"
                />
            </div>
        </div>
    );
};