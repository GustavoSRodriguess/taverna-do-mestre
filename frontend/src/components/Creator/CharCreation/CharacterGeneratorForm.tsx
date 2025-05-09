import React, { useState } from 'react';
import { Button, SelectField, NumberField, RadioGroup } from '../../../ui';

type AttributeMethod = 'rolagem' | 'array' | 'compra';

const racas = [
    { value: "human", label: "Humano" },
    { value: "elf", label: "Elfo" },
    { value: "dwarf", label: "Anão" },
    { value: "halfling", label: "Halfling" },
    { value: "tiefling", label: "Tiefling" },
    { value: "dragonborn", label: "Dragonborn" },
    { value: "gnome", label: "Gnomo" },
    { value: "half-elf", label: "Meio-Elfo" },
    { value: "half-orc", label: "Meio-Orc" }
];

const classes = [
    { value: "warrior", label: "Guerreiro" },
    { value: "wizard", label: "Mago" },
    { value: "rogue", label: "Ladino" },
    { value: "cleric", label: "Clérigo" },
    { value: "bard", label: "Bardo" },
    { value: "druid", label: "Druida" },
    { value: "monk", label: "Monge" },
    { value: "paladin", label: "Paladino" },
    { value: "ranger", label: "Patrulheiro" },
    { value: "sorcerer", label: "Feiticeiro" },
    { value: "warlock", label: "Bruxo" }
];

const antecedentes = [
    { value: "noble", label: "Nobre" },
    { value: "hermit", label: "Eremita" },
    { value: "soldier", label: "Soldado" },
    { value: "criminal", label: "Criminoso" },
    { value: "sage", label: "Sábio" },
    { value: "charlatan", label: "Charlatão" },
    { value: "artisan", label: "Artífice" },
    { value: "outlander", label: "Forasteiro" },
    { value: "hero", label: "Herói" },
    { value: "mercenary", label: "Mercenário" }
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
                    onChange={(value) => setRace(racas.find(raca => raca.value === value) || racas[0])}
                    options={racas.map(raca => ({ value: raca.value, label: raca.label }))}
                />

                <SelectField
                    label="Classe"
                    value={characterClass.value}
                    onChange={(value) => setCharacterClass(classes.find(classe => classe.value === value) || classes[0])}
                    options={classes.map(classe => ({ value: classe.value, label: classe.label }))}
                />

                <SelectField
                    label="Antecedente"
                    value={background.value}
                    onChange={(value) => setBackground(antecedentes.find(antecedente => antecedente.value === value) || antecedentes[0])}
                    options={antecedentes.map(antecedente => ({ value: antecedente.value, label: antecedente.label }))}
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