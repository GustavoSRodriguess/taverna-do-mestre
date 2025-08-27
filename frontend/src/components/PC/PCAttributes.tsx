// frontend/src/components/PC/PCAttributes.tsx - Versão Refatorada
import React from 'react';
import { CardBorder, Button } from '../../ui';
import { FullCharacter, GameAttributes } from '../../types/game';
import { Dice1, BarChart3, ShoppingCart, Lightbulb } from 'lucide-react';
import {
    STANDARD_ARRAY,
    POINT_BUY_DEFAULTS,
    ATTRIBUTE_LABELS,
    ATTRIBUTE_SHORT_LABELS,
    calculateModifier,
    formatModifier,
    calculateProficiencyBonus
} from '../../utils/gameUtils';
import { AttributeDisplay } from '../Generic';
import useGameCalculations from '../../hooks/useGameCalculations';

interface PCAttributesProps {
    pcData: FullCharacter;
    updatePCData: (updates: Partial<FullCharacter>) => void;
}

const PCAttributes: React.FC<PCAttributesProps> = ({ pcData, updatePCData }) => {
    useGameCalculations(
        pcData.attributes,
        pcData.level
    );

    const updateAttribute = (attr: keyof GameAttributes, value: number) => {
        const clampedValue = Math.min(Math.max(value, 1), 30);
        const newAttributes = { ...pcData.attributes, [attr]: clampedValue };
        updatePCData({ attributes: newAttributes });
    };

    const rollAttributes = () => {
        const rollStat = () => {
            const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
            rolls.sort((a, b) => b - a);
            return rolls.slice(0, 3).reduce((sum, val) => sum + val, 0);
        };

        const newAttributes: GameAttributes = {
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
        const attributeKeys = Object.keys(pcData.attributes) as (keyof GameAttributes)[];
        const newAttributes = attributeKeys.reduce((acc, key, index) => {
            acc[key] = STANDARD_ARRAY[index] || 10;
            return acc;
        }, {} as GameAttributes);

        updatePCData({ attributes: newAttributes });
    };

    const usePointBuy = () => {
        updatePCData({ attributes: { ...POINT_BUY_DEFAULTS } });
    };

    const renderAttributeCircle = () => {
        const attributes = Object.entries(pcData.attributes) as [keyof GameAttributes, number][];

        return (
            <div className="flex justify-center">
                <div className="relative w-96 h-96">
                    {/* Central Circle */}
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

                    {/* Attributes in Circle */}
                    {attributes.map(([key, value], index) => {
                        const angle = (index * 60 - 90) * (Math.PI / 180);
                        const radius = 140;
                        const x = Math.cos(angle) * radius;
                        const y = Math.sin(angle) * radius;
                        const modifier = calculateModifier(value);

                        return (
                            <div
                                key={key}
                                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                                style={{
                                    left: `calc(50% + ${x}px)`,
                                    top: `calc(50% + ${y}px)`
                                }}
                            >
                                <div className="bg-indigo-900/80 border-2 border-purple-500 rounded-lg p-4 w-24 text-center">
                                    <div className="text-purple-300 font-bold text-xs mb-1">
                                        {ATTRIBUTE_SHORT_LABELS[key]}
                                    </div>
                                    <input
                                        type="number"
                                        value={value}
                                        onChange={(e) => updateAttribute(key, parseInt(e.target.value) || 0)}
                                        className="w-full bg-transparent text-white text-center text-xl font-bold
                                         border-none focus:outline-none focus:ring-2 focus:ring-purple-400 rounded"
                                        min={1}
                                        max={30}
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
        );
    };

    const renderAttributeDetails = () => {
        return (
            <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(pcData.attributes).map(([key, value]) => {
                    const attrKey = key as keyof GameAttributes;
                    const modifier = calculateModifier(value);

                    return (
                        <div key={key} className="bg-indigo-900/30 p-4 rounded border border-indigo-700">
                            <div className="flex justify-between items-center mb-2">
                                <label className="font-bold text-white">{ATTRIBUTE_LABELS[attrKey]}</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={value}
                                        onChange={(e) => updateAttribute(attrKey, parseInt(e.target.value) || 0)}
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

                            {/* Visual bar */}
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
        );
    };

    const renderSavingThrows = () => {
        return (
            <div className="grid md:grid-cols-3 gap-4">
                {Object.entries(pcData.attributes).map(([key, value]) => {
                    const attrKey = key as keyof GameAttributes;
                    const modifier = calculateModifier(value);
                    const total = modifier + pcData.proficiency_bonus;

                    return (
                        <div key={key} className="flex justify-between items-center p-3 
                             bg-indigo-900/30 rounded border border-indigo-700">
                            <span className="text-white font-medium">{ATTRIBUTE_LABELS[attrKey]}</span>
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
        );
    };

    return (
        <div className="space-y-6">
            {/* Generation Methods */}
            <CardBorder className="bg-indigo-950/80">
                <h3 className="text-xl font-bold mb-4 text-purple-400">Métodos de Geração</h3>
                <div className="flex align-center justify-center gap-4">
                    <Button
                        buttonLabel={
                            <div className="flex items-center gap-1">
                                <Dice1 className="w-4 h-4" />
                                <span>Rolar Atributos</span>
                            </div>
                        }
                        onClick={rollAttributes}
                        classname="bg-purple-600 hover:bg-purple-700"
                    />
                    <Button
                        buttonLabel={
                            <div className="flex items-center gap-1">
                                <BarChart3 className="w-4 h-4" />
                                <span>Array Padrão</span>
                            </div>
                        }
                        onClick={useStandardArray}
                        classname="bg-blue-600 hover:bg-blue-700"
                    />
                    <Button
                        buttonLabel={
                            <div className="flex items-center gap-1">
                                <ShoppingCart className="w-4 h-4" />
                                <span>Point Buy</span>
                            </div>
                        }
                        onClick={usePointBuy}
                        classname="bg-green-600 hover:bg-green-700"
                    />
                </div>
                <div className="mt-4 text-sm text-indigo-300">
                    <p><strong>Rolar:</strong> 4d6, descartar menor (clássico)</p>
                    <p><strong>Array Padrão:</strong> {STANDARD_ARRAY.join(', ')}</p>
                    <p><strong>Point Buy:</strong> Distribuição equilibrada</p>
                </div>
            </CardBorder>

            {/* Attribute Circle */}
            <CardBorder className="bg-indigo-950/80">
                <h3 className="text-xl font-bold mb-6 text-purple-400 text-center">Atributos</h3>
                {renderAttributeCircle()}
            </CardBorder>

            {/* Detailed List */}
            <CardBorder className="bg-indigo-950/80">
                <h3 className="text-xl font-bold mb-4 text-purple-400">Detalhes dos Atributos</h3>
                {renderAttributeDetails()}
            </CardBorder>

            {/* Saving Throws */}
            <CardBorder className="bg-indigo-950/80">
                <h3 className="text-xl font-bold mb-4 text-purple-400">Testes de Resistência</h3>
                {renderSavingThrows()}
                <div className="mt-4 text-sm text-indigo-300">
                    <div className="flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-yellow-400" />
                        <span>Marque a caixa para adicionar bônus de proficiência aos testes de resistência</span>
                    </div>
                </div>
            </CardBorder>
        </div>
    );
};

export default PCAttributes;