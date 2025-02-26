import React, { useState } from 'react';
import { Button, SelectField, NumberField } from '../../../ui';

type GenerationMethod = 'automatic' | 'manual';

const racas = [
    "Humano", "Elfo", "Anão", "Halfling", "Tiefling",
    "Dragonborn", "Gnomo", "Meio-Elfo", "Meio-Orc"
];

const classes = [
    "Guerreiro", "Mago", "Ladino", "Clérigo", "Bardo",
    "Druida", "Monge", "Paladino", "Patrulheiro", "Feiticeiro", "Bruxo"
];

const antecedentes = [
    "Nobre", "Eremita", "Soldado", "Criminoso", "Sábio",
    "Charlatão", "Artífice", "Forasteiro", "Herói", "Mercenário"
];

interface NPCGeneratorFormProps {
    onGenerateNPC: (npcData: {
        nivel: string;
        metodo: GenerationMethod;
        raca?: string;
        classe?: string;
        antecedente?: string;
    }) => void;
}

export const NPCGeneratorForm: React.FC<NPCGeneratorFormProps> = ({ onGenerateNPC }) => {
    const [level, setLevel] = useState("1");
    const [generationMethod, setGenerationMethod] = useState<GenerationMethod>('automatic');
    const [race, setRace] = useState(racas[0]);
    const [npcClass, setNpcClass] = useState(classes[0]);
    const [background, setBackground] = useState(antecedentes[0]);

    const handleGenerateNPC = () => {
        const npcData: {
            nivel: string;
            metodo: GenerationMethod;
            raca?: string;
            classe?: string;
            antecedente?: string;
        } = {
            nivel: level,
            metodo: generationMethod,
        };

        if (generationMethod === 'manual') {
            npcData.raca = race;
            npcData.classe = npcClass;
            npcData.antecedente = background;
        }

        onGenerateNPC(npcData);
    };

    return (
        <div className="text-left">
            <div className="space-y-4">
                <NumberField
                    label="Nível do NPC (1-20)"
                    value={level}
                    onChange={setLevel}
                    min={1}
                    max={20}
                />

                <div className="mb-4">
                    <label className="block text-indigo-200 mb-2">Método de Geração</label>
                    <div className="flex space-x-4">
                        <div className="flex items-center">
                            <input
                                type="radio"
                                id="automatic"
                                name="generationMethod"
                                value="automatic"
                                checked={generationMethod === 'automatic'}
                                onChange={() => setGenerationMethod('automatic')}
                                className="mr-2 text-purple-600 focus:ring-purple-500"
                            />
                            <label htmlFor="automatic" className="text-white">Automático (Aleatório)</label>
                        </div>
                        <div className="flex items-center">
                            <input
                                type="radio"
                                id="manual"
                                name="generationMethod"
                                value="manual"
                                checked={generationMethod === 'manual'}
                                onChange={() => setGenerationMethod('manual')}
                                className="mr-2 text-purple-600 focus:ring-purple-500"
                            />
                            <label htmlFor="manual" className="text-white">Manual (Personalizado)</label>
                        </div>
                    </div>
                </div>

                {generationMethod === 'manual' && (
                    <div className="space-y-4 pl-4 border-l-2 border-purple-600">
                        <SelectField
                            label="Raça"
                            value={race}
                            onChange={setRace}
                            options={racas.map(raca => ({ value: raca, label: raca }))}
                        />

                        <SelectField
                            label="Classe"
                            value={npcClass}
                            onChange={setNpcClass}
                            options={classes.map(classe => ({ value: classe, label: classe }))}
                        />

                        <SelectField
                            label="Antecedente"
                            value={background}
                            onChange={setBackground}
                            options={antecedentes.map(antecedente => ({ value: antecedente, label: antecedente }))}
                        />
                    </div>
                )}

                <Button
                    buttonLabel="Gerar NPC"
                    onClick={handleGenerateNPC}
                    classname="w-full mt-4"
                />
            </div>
        </div>
    );
};