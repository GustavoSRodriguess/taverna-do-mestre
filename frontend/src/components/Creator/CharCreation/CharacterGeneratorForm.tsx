import React, { useState } from 'react';
import { Button, SelectField, NumberField, RadioGroup } from '../../../ui';

type AttributeMethod = 'rolagem' | 'array' | 'compra';

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

const attributeMethods = [
    {
        id: 'rolagem',
        value: 'rolagem',
        label: 'Rolagem 4d6 (aleatoriedade completa)'
    },
    {
        id: 'array',
        value: 'array',
        label: 'Array padrão (15, 14, 13, 12, 10, 8)'
    },
    {
        id: 'compra',
        value: 'compra',
        label: 'Compra de pontos (27 pontos)'
    }
];

interface CharacterGeneratorFormProps {
    onGenerateCharacter: (characterData: {
        nivel: string;
        raca: string;
        classe: string;
        antecedente: string;
        metodoAtributos: AttributeMethod;
    }) => void;
}

export const CharacterGeneratorForm: React.FC<CharacterGeneratorFormProps> = ({ onGenerateCharacter }) => {
    const [level, setLevel] = useState("1");
    const [race, setRace] = useState(racas[0]);
    const [characterClass, setCharacterClass] = useState(classes[0]);
    const [background, setBackground] = useState(antecedentes[0]);
    const [attributeMethod, setAttributeMethod] = useState<AttributeMethod>('rolagem');

    const handleGenerateCharacter = () => {
        onGenerateCharacter({
            nivel: level,
            raca: race,
            classe: characterClass,
            antecedente: background,
            metodoAtributos: attributeMethod
        });
    };

    return (
        <div className="text-left">
            <div className="space-y-4">
                <NumberField
                    label="Nível do Personagem (1-20)"
                    value={level}
                    onChange={setLevel}
                    min={1}
                    max={20}
                />

                <SelectField
                    label="Raça"
                    value={race}
                    onChange={setRace}
                    options={racas.map(raca => ({ value: raca, label: raca }))}
                />

                <SelectField
                    label="Classe"
                    value={characterClass}
                    onChange={setCharacterClass}
                    options={classes.map(classe => ({ value: classe, label: classe }))}
                />

                <SelectField
                    label="Antecedente"
                    value={background}
                    onChange={setBackground}
                    options={antecedentes.map(antecedente => ({ value: antecedente, label: antecedente }))}
                />

                <RadioGroup
                    label="Método de Atributos"
                    options={attributeMethods}
                    value={attributeMethod}
                    onChange={(value) => setAttributeMethod(value as AttributeMethod)}
                />

                <Button
                    buttonLabel="Gerar Personagem"
                    onClick={handleGenerateCharacter}
                    classname="w-full mt-4"
                />
            </div>
        </div>
    );
};