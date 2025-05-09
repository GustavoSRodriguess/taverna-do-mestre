import React, { useState } from 'react';
import { Button, SelectField, NumberField } from '../../../ui';

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
    "Guerreiro", "Mago", "Ladino", "Clérigo", "Bardo",
    "Druida", "Monge", "Paladino", "Patrulheiro", "Feiticeiro", "Bruxo"
];

const antecedentes = [
    "Nobre", "Eremita", "Soldado", "Criminoso", "Sábio",
    "Charlatão", "Artífice", "Forasteiro", "Herói", "Mercenário"
];

const attributeMethods = [
    { value: 'rolagem', label: 'Rolagem de Dados (4d6dL)' },
    { value: 'array', label: 'Array Padrão (15,14,13,12,10,8)' },
    { value: 'compra', label: 'Compra de Pontos' },
];

interface NPCGeneratorFormProps {
    onGenerateNPC: (npcData: {
        level: string;
        manual: boolean;
        attributes_method?: string;
        race?: string;
        npcClass?: string;
        background?: string;
    }) => void;
}

export const NPCGeneratorForm: React.FC<NPCGeneratorFormProps> = ({ onGenerateNPC }) => {
    const [level, setLevel] = useState("1");
    const [isManual, setIsManual] = useState(false);
    const [selectedAttributesMethod, setSelectedAttributesMethod] = useState(attributeMethods[0].value);
    const [race, setRace] = useState(racas[0]);
    const [npcClass, setNpcClass] = useState(classes[0]);
    const [background, setBackground] = useState(antecedentes[0]);

    const handleGenerateNPC = () => {
        const npcData: {
            level: string;
            manual: boolean;
            attributes_method?: string;
            race?: string;
            npcClass?: string;
            background?: string;
        } = {
            level: level,
            manual: isManual,
        };

        if (isManual) {
            npcData.race = race.value;
            npcData.npcClass = npcClass;
            npcData.background = background;
            // attributes_method não é enviado pelo form se manual, será tratado no apiService se necessário
        } else {
            npcData.attributes_method = selectedAttributesMethod;
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
                    <label className="block text-indigo-200 mb-2">Modo de Geração</label>
                    <div className="flex space-x-4">
                        <div className="flex items-center">
                            <input
                                type="radio"
                                id="automatic_npc"
                                name="generationModeNpc"
                                value="automatic"
                                checked={!isManual}
                                onChange={() => setIsManual(false)}
                                className="mr-2 text-purple-600 focus:ring-purple-500"
                            />
                            <label htmlFor="automatic_npc" className="text-white">Automático (Atributos Gerados)</label>
                        </div>
                        <div className="flex items-center">
                            <input
                                type="radio"
                                id="manual_npc"
                                name="generationModeNpc"
                                value="manual"
                                checked={isManual}
                                onChange={() => setIsManual(true)}
                                className="mr-2 text-purple-600 focus:ring-purple-500"
                            />
                            <label htmlFor="manual_npc" className="text-white">Manual (Detalhes Personalizados)</label>
                        </div>
                    </div>
                </div>

                {!isManual && (
                    <SelectField
                        label="Método de Geração de Atributos"
                        value={selectedAttributesMethod}
                        onChange={setSelectedAttributesMethod}
                        options={attributeMethods}
                    />
                )}

                {isManual && (
                    <div className="space-y-4 pl-4 border-l-2 border-purple-600">
                        <SelectField
                            label="Raça"
                            value={race.value}
                            onChange={(value) => setRace(racas.find(r => r.value === value)!)}
                            options={racas.map(r => ({ value: r.value, label: r.label }))}
                        />

                        <SelectField
                            label="Classe"
                            value={npcClass}
                            onChange={setNpcClass}
                            options={classes.map(c => ({ value: c, label: c }))}
                        />

                        <SelectField
                            label="Antecedente"
                            value={background}
                            onChange={setBackground}
                            options={antecedentes.map(a => ({ value: a, label: a }))}
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
