// frontend/src/components/PC/PCCombat.tsx - Versão Refatorada
import React from 'react';
import { CardBorder, Button } from '../../ui';
import { FullCharacter, GameAttack } from '../../types/game';
import { HPBar } from '../Generic';
import { calculateModifier, formatModifier, DAMAGE_TYPES } from '../../utils/gameUtils';
import useGameCalculations from '../../hooks/useGameCalculations';

interface PCCombatProps {
    pcData: FullCharacter;
    updatePCData: (updates: Partial<FullCharacter>) => void;
}

const PCCombat: React.FC<PCCombatProps> = ({ pcData, updatePCData }) => {
    const { modifiers } = useGameCalculations(pcData.attributes, pcData.level);

    const addAttack = () => {
        const newAttack: GameAttack = {
            name: 'Novo Ataque',
            bonus: 0,
            damage: '1d6',
            type: 'Cortante',
            range: '5 pés'
        };
        updatePCData({ attacks: [...pcData.attacks, newAttack] });
    };

    const updateAttack = (index: number, updates: Partial<GameAttack>) => {
        const newAttacks = [...pcData.attacks];
        newAttacks[index] = { ...newAttacks[index], ...updates };
        updatePCData({ attacks: newAttacks });
    };

    const removeAttack = (index: number) => {
        const newAttacks = pcData.attacks.filter((_, i) => i !== index);
        updatePCData({ attacks: newAttacks });
    };

    const rollAttack = (attack: GameAttack) => {
        const attackRoll = Math.floor(Math.random() * 20) + 1;
        const damageRoll = Math.floor(Math.random() * 6) + 1; // Simplified
        alert(`🗡️ ${attack.name}\nAtaque: ${attackRoll} + ${attack.bonus} = ${attackRoll + attack.bonus}\nDano: ${damageRoll} (${attack.damage})`);
    };

    const rollInitiative = () => {
        const roll = Math.floor(Math.random() * 20) + 1;
        const dexMod = modifiers.dexterity;
        const total = roll + dexMod;
        alert(`⚡ Iniciativa\nRolagem: ${roll} + ${dexMod} = ${total}`);
    };

    const CombatStatCard: React.FC<{
        title: string;
        icon: string;
        value: number;
        color: string;
        children?: React.ReactNode;
    }> = ({ title, icon, value, color, children }) => (
        <CardBorder className={`${color} text-center`}>
            <h3 className="text-lg font-bold mb-4">{icon} {title}</h3>
            <div className="text-3xl font-bold text-white mb-2">{value}</div>
            {children}
        </CardBorder>
    );

    const AttackRow: React.FC<{ attack: GameAttack; index: number }> = ({ attack, index }) => (
        <div className="bg-indigo-900/30 p-4 rounded border border-indigo-700">
            <div className="grid md:grid-cols-6 gap-4 items-center">
                <div>
                    <label className="block text-indigo-200 text-sm mb-1">Nome</label>
                    <input
                        type="text"
                        value={attack.name}
                        onChange={(e) => updateAttack(index, { name: e.target.value })}
                        className="w-full px-2 py-1 bg-indigo-800 text-white rounded
                         border border-indigo-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                </div>

                <div>
                    <label className="block text-indigo-200 text-sm mb-1">Bônus</label>
                    <input
                        type="number"
                        value={attack.bonus}
                        onChange={(e) => updateAttack(index, { bonus: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1 bg-indigo-800 text-white text-center rounded
                         border border-indigo-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                </div>

                <div>
                    <label className="block text-indigo-200 text-sm mb-1">Dano</label>
                    <input
                        type="text"
                        value={attack.damage}
                        onChange={(e) => updateAttack(index, { damage: e.target.value })}
                        className="w-full px-2 py-1 bg-indigo-800 text-white text-center rounded
                         border border-indigo-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        placeholder="1d8+3"
                    />
                </div>

                <div>
                    <label className="block text-indigo-200 text-sm mb-1">Tipo</label>
                    <select
                        value={attack.type}
                        onChange={(e) => updateAttack(index, { type: e.target.value })}
                        className="w-full px-2 py-1 bg-indigo-800 text-white rounded
                         border border-indigo-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                        {DAMAGE_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>

                <div className="flex gap-2 mt-4">
                    <Button
                        buttonLabel="🎲"
                        onClick={() => rollAttack(attack)}
                        classname="flex-1 bg-purple-600 hover:bg-purple-700 text-sm"
                    />
                    <Button
                        buttonLabel="🗑️"
                        onClick={() => removeAttack(index)}
                        classname="bg-red-600 hover:bg-red-700 text-sm px-2"
                    />
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Combat Statistics */}
            <div className="grid md:grid-cols-3 gap-6">
                {/* HP */}
                <CardBorder className="bg-red-950/50 border-red-700">
                    <h3 className="text-lg font-bold text-red-300 mb-4">💓 Pontos de Vida</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-red-200 mb-2">HP Máximo</label>
                            <input
                                type="number"
                                value={pcData.hp}
                                onChange={(e) => updatePCData({ hp: parseInt(e.target.value) || 1 })}
                                className="w-full px-3 py-2 bg-red-900/50 text-white text-center text-xl font-bold
                                 border border-red-600 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                                min={1}
                                max={999}
                            />
                        </div>

                        <div>
                            <label className="block text-red-200 mb-2">HP Atual</label>
                            <input
                                type="number"
                                value={pcData.current_hp === 0 ? '' : pcData.current_hp ?? pcData.hp}
                                placeholder="0"
                                onChange={(e) => updatePCData({ current_hp: Math.max(parseInt(e.target.value) || 0, 0) })}
                                className="w-full px-3 py-2 bg-red-900/50 text-white text-center text-xl font-bold
                                 border border-red-600 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                                min={0}
                            />
                        </div>

                        <HPBar
                            current={pcData.current_hp ?? pcData.hp}
                            max={pcData.hp}
                            showNumbers={false}
                        />

                        {pcData.current_hp === 0 && (
                            <div className="text-center text-red-300 text-sm">
                                💀 Personagem inconsciente
                            </div>
                        )}
                    </div>
                </CardBorder>

                {/* AC */}
                <CardBorder className="bg-blue-950/50 border-blue-700">
                    <h3 className="text-lg font-bold text-blue-300 mb-4">🛡️ Defesa</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-blue-200 mb-2">Classe de Armadura</label>
                            <input
                                type="number"
                                value={pcData.ca}
                                onChange={(e) => updatePCData({ ca: parseInt(e.target.value) || 10 })}
                                className="w-full px-3 py-2 bg-blue-900/50 text-white text-center text-xl font-bold
                                 border border-blue-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                min={10}
                                max={30}
                            />
                        </div>
                        <div className="text-sm text-blue-300">
                            <p>Mod. Destreza: {formatModifier(modifiers.dexterity)}</p>
                            <p>Base sugerida: {10 + modifiers.dexterity}</p>
                        </div>
                    </div>
                </CardBorder>

                {/* Initiative */}
                <CardBorder className="bg-purple-950/50 border-purple-700">
                    <h3 className="text-lg font-bold text-purple-300 mb-4">⚡ Iniciativa</h3>
                    <div className="space-y-4">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-white">
                                {formatModifier(modifiers.dexterity)}
                            </div>
                            <div className="text-sm text-purple-300">Modificador</div>
                        </div>
                        <Button
                            buttonLabel="🎲 Rolar Iniciativa"
                            onClick={rollInitiative}
                            classname="w-full bg-purple-600 hover:bg-purple-700"
                        />
                    </div>
                </CardBorder>
            </div>

            {/* Attacks */}
            <CardBorder className="bg-indigo-950/80">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-purple-400">⚔️ Ataques</h3>
                    <Button
                        buttonLabel="+ Novo Ataque"
                        onClick={addAttack}
                        classname="bg-green-600 hover:bg-green-700"
                    />
                </div>

                {pcData.attacks.length === 0 ? (
                    <div className="text-center py-8 text-indigo-300">
                        <div className="text-4xl mb-4">⚔️</div>
                        <p>Nenhum ataque cadastrado</p>
                        <p className="text-sm mt-2">Clique em "Novo Ataque" para adicionar</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {pcData.attacks.map((attack, index) => (
                            <AttackRow key={index} attack={attack} index={index} />
                        ))}
                    </div>
                )}
            </CardBorder>
        </div>
    );
};

export default PCCombat;