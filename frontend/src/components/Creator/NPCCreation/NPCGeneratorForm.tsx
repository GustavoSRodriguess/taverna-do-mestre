import React, { useState } from 'react';
import { Button, SelectField, NumberField } from '../../../ui';
import { RACES, CLASSES, BACKGROUNDS, ATTRIBUTE_METHODS, LEVEL_RANGE } from '../../../constants';

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
    const [selectedAttributesMethod, setSelectedAttributesMethod] = useState(ATTRIBUTE_METHODS[0].value);
    const [race, setRace] = useState(RACES[0]);
    const [npcClass, setNpcClass] = useState(CLASSES[0].label);
    const [background, setBackground] = useState(BACKGROUNDS[0].label);

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
                        options={ATTRIBUTE_METHODS}
                    />
                )}

                {isManual && (
                    <div className="space-y-4 pl-4 border-l-2 border-purple-600">
                        <SelectField
                            label="Raça"
                            value={race.value}
                            onChange={(value) => setRace(RACES.find(r => r.value === value)!)}
                            options={RACES}
                        />

                        <SelectField
                            label="Classe"
                            value={npcClass}
                            onChange={setNpcClass}
                            options={CLASSES}
                        />

                        <SelectField
                            label="Antecedente"
                            value={background}
                            onChange={setBackground}
                            options={BACKGROUNDS}
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
