import React from 'react';
import { CardBorder, Button } from '../../ui';
import { PCData } from './PCEditor';

interface PCAttributesProps {
    pcData: PCData;
    updatePCData: (updates: Partial<PCData>) => void;
}

interface AttributeInfo {
    key: keyof PCData['attributes'];
    label: string;
    shortLabel: string;
    description: string;
}

const attributes: AttributeInfo[] = [
    { key: 'strength', label: 'Força', shortLabel: 'FOR', description: 'Poder físico, capacidade atlética' },
    { key: 'dexterity', label: 'Destreza', shortLabel: 'DES', description: 'Agilidade, reflexos e equilíbrio' },
    { key: 'constitution', label: 'Constituição', shortLabel: 'CON', description: 'Saúde, vigor e vitalidade' },
    { key: 'intelligence', label: 'Inteligência', shortLabel: 'INT', description: 'Raciocínio, memória e dedução' },
    { key: 'wisdom', label: 'Sabedoria', shortLabel: 'SAB', description: 'Percepção e insight' },
    { key: 'charisma', label: 'Carisma', shortLabel: 'CAR', description: 'Força de personalidade' }
];

const PCAttributes: React.FC<PCAttributesProps> = ({ pcData, updatePCData }) => {
    const getModifier = (score: number): number => {
        return Math.floor((score - 10) / 2);
    };

    const formatModifier = (modifier: number): string => {
        return modifier >= 0 ? `+${modifier}` : modifier.toString();
    };

    const updateAttribute = (attr: keyof PCData['attributes'], value: number) => {
        value >= 20 ? value = 30 : value
        alert(value)
        const newAttributes = { ...pcData.attributes, [attr]: value };
        updatePCData({ attributes: newAttributes });
    };

    const rollAttributes = () => {
        const rollStat = () => {
            const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
            rolls.sort((a, b) => b - a);
            return rolls.slice(0, 3).reduce((sum, val) => sum + val, 0);
        };

        const newAttributes = {
            strength: rollStat(),
            dexterity: rollStat(),
            constitution: rollStat(),
            intelligence: rollStat(),
            wisdom: rollStat(),
            charisma: rollStat()
        };

        updatePCData({ attributes: newAttributes });
    };

    const useStandardArray = () => {
        const standardArray = [15, 14, 13, 12, 10, 8];
        const attributeKeys = attributes.map(attr => attr.key);

        const newAttributes = attributeKeys.reduce((acc, key, index) => {
            acc[key] = standardArray[index] || 10;
            return acc;
        }, {} as PCData['attributes']);

        updatePCData({ attributes: newAttributes });
    };

    const usePointBuy = () => {
        // Valores padrão do point buy (8 + modificações)
        const newAttributes = {
            strength: 13,
            dexterity: 14,
            constitution: 13,
            intelligence: 12,
            wisdom: 12,
            charisma: 10
        };

        updatePCData({ attributes: newAttributes });
    };

    return (
        <div className="space-y-6">
            {/* Métodos de Geração */}
            <CardBorder className="bg-indigo-950/80">
                <h3 className="text-xl font-bold mb-4 text-purple-400">Métodos de Geração</h3>
                <div className="flex align-center justify-center gap-4">
                    <Button
                        buttonLabel="🎲 Rolar Atributos"
                        onClick={rollAttributes}
                        classname="bg-purple-600 hover:bg-purple-700"
                    />
                    <Button
                        buttonLabel="📊 Array Padrão"
                        onClick={useStandardArray}
                        classname="bg-blue-600 hover:bg-blue-700"
                    />
                    <Button
                        buttonLabel="🛒 Point Buy"
                        onClick={usePointBuy}
                        classname="bg-green-600 hover:bg-green-700"
                    />
                </div>
                <div className="mt-4 text-sm text-indigo-300">
                    <p><strong>Rolar:</strong> 4d6, descartar menor (clássico)</p>
                    <p><strong>Array Padrão:</strong> 15, 14, 13, 12, 10, 8</p>
                    <p><strong>Point Buy:</strong> Distribuição equilibrada</p>
                </div>
            </CardBorder>

            {/* Círculo de Atributos */}
            <CardBorder className="bg-indigo-950/80">
                <h3 className="text-xl font-bold mb-6 text-purple-400 text-center">Atributos</h3>

                <div className="flex justify-center">
                    <div className="relative w-96 h-96">
                        {/* Círculo Central */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                                        w-32 h-32 bg-purple-900/50 rounded-full border-2 border-purple-400
                                        flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-white font-bold text-lg">ATRIBUTOS</div>
                                <div className="text-purple-300 text-sm">
                                    Total: {Object.values(pcData.attributes).reduce((sum, val) => sum + val, 0)}
                                </div>
                            </div>
                        </div>

                        {/* Atributos em Círculo */}
                        {attributes.map((attr, index) => {
                            const angle = (index * 60 - 90) * (Math.PI / 180); // -90 para começar no topo
                            const radius = 140;
                            const x = Math.cos(angle) * radius;
                            const y = Math.sin(angle) * radius;
                            const modifier = getModifier(pcData.attributes[attr.key]);

                            return (
                                <div
                                    key={attr.key}
                                    className="absolute transform -translate-x-1/2 -translate-y-1/2"
                                    style={{
                                        left: `calc(50% + ${x}px)`,
                                        top: `calc(50% + ${y}px)`
                                    }}
                                >
                                    <div className="bg-indigo-900/80 border-2 border-purple-500 rounded-lg p-4 w-24 text-center">
                                        <div className="text-purple-300 font-bold text-xs mb-1">
                                            {attr.shortLabel}
                                        </div>
                                        <input
                                            type="number"
                                            value={pcData.attributes[attr.key]}
                                            onChange={(e) => updateAttribute(attr.key, parseInt(e.target.value) || 0)}
                                            className="w-full bg-transparent text-white text-center text-xl font-bold
                                             border-none focus:outline-none focus:ring-2 focus:ring-purple-400 rounded"
                                            min={1}
                                            max={20}
                                        />
                                        <div className="text-purple-200 text-sm font-bold">
                                            {formatModifier(modifier)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </CardBorder>

            {/* Lista Detalhada */}
            <CardBorder className="bg-indigo-950/80">
                <h3 className="text-xl font-bold mb-4 text-purple-400">Detalhes dos Atributos</h3>

                <div className="grid md:grid-cols-2 gap-4">
                    {attributes.map((attr) => {
                        const value = pcData.attributes[attr.key];
                        const modifier = getModifier(value);

                        return (
                            <div key={attr.key} className="bg-indigo-900/30 p-4 rounded border border-indigo-700">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="font-bold text-white">{attr.label}</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={value}
                                            onChange={(e) => updateAttribute(attr.key, parseInt(e.target.value) || 0)}
                                            className="w-16 px-2 py-1 bg-indigo-800 text-white text-center rounded
                                             border border-indigo-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            min={1}
                                            max={30}
                                        />
                                        <span className="text-purple-300 font-bold min-w-[2rem] text-center">
                                            {formatModifier(modifier)}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-indigo-300 text-sm">{attr.description}</p>

                                {/* Barra visual do valor */}
                                <div className="mt-2 bg-indigo-800 rounded-full h-2">
                                    <div
                                        className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${Math.min((value / 20) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardBorder>

            {/* Saving Throws */}
            <CardBorder className="bg-indigo-950/80">
                <h3 className="text-xl font-bold mb-4 text-purple-400">Testes de Resistência</h3>

                <div className="grid md:grid-cols-3 gap-4">
                    {attributes.map((attr) => {
                        const modifier = getModifier(pcData.attributes[attr.key]);
                        const total = modifier + (pcData.proficiency_bonus || 2); // Assumindo proficiência por padrão

                        return (
                            <div key={`save-${attr.key}`} className="flex justify-between items-center p-3 
                                 bg-indigo-900/30 rounded border border-indigo-700">
                                <span className="text-white font-medium">{attr.label}</span>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 text-purple-600 bg-indigo-800 border-indigo-600 rounded
                                         focus:ring-purple-500"
                                        title="Proficiente"
                                    />
                                    <span className="text-purple-300 font-bold min-w-[2rem] text-center">
                                        {formatModifier(total)}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-4 text-sm text-indigo-300">
                    <p>💡 Marque a caixa para adicionar bônus de proficiência aos testes de resistência</p>
                </div>
            </CardBorder>
        </div>
    );
};

export default PCAttributes;