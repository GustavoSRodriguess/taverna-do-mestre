import React, { useState } from 'react';
import { Button, SelectField, NumberField, RadioGroup } from '../../../ui';
import { RACES, CLASSES, BACKGROUNDS, ATTRIBUTE_METHODS, LEVEL_RANGE } from '../../../constants';

type AttributeMethod = 'rolagem' | 'array' | 'compra';

const attributeMethodsRadio = [
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
    const [race, setRace] = useState(RACES[0]);
    const [characterClass, setCharacterClass] = useState(CLASSES[0]);
    const [background, setBackground] = useState(BACKGROUNDS[0]);
    const [attributeMethod, setAttributeMethod] = useState<AttributeMethod>('rolagem');

    const handleGenerateCharacter = () => {
        onGenerateCharacter({
            nivel: level,
            raca: race.value,
            classe: characterClass.value,
            antecedente: background.value,
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
                    value={race.value}
                    onChange={(value) => setRace(RACES.find(raca => raca.value === value) || RACES[0])}
                    options={RACES}
                />

                <SelectField
                    label="Classe"
                    value={characterClass.value}
                    onChange={(value) => setCharacterClass(CLASSES.find(classe => classe.value === value) || CLASSES[0])}
                    options={CLASSES}
                />

                <SelectField
                    label="Antecedente"
                    value={background.value}
                    onChange={(value) => setBackground(BACKGROUNDS.find(antecedente => antecedente.value === value) || BACKGROUNDS[0])}
                    options={BACKGROUNDS}
                />

                <RadioGroup
                    label="Método de Atributos"
                    options={attributeMethodsRadio}
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