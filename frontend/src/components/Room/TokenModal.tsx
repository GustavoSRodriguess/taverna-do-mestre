import React, { useState, useEffect } from 'react';
import { X, Heart, Shield, Zap, Minus, Plus, Dice6, AlertCircle } from 'lucide-react';
import { SceneToken } from '../../types/room';
import { FullCharacter } from '../../types/game';
import { Button } from '../../ui';
import { DND_CONDITIONS, getConditionById } from '../../constants/conditions';
import { calculateHPPercentage, getHPTextColor } from '../../utils/tokenUtils';
import { calculateModifier, rollInitiative } from '../../utils/combatUtils';

interface TokenModalProps {
    token: SceneToken;
    character: FullCharacter | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdateToken: (updates: Partial<SceneToken>) => void;
    onUpdateCharacter?: (characterId: number, updates: Partial<FullCharacter>) => void;
}

export const TokenModal: React.FC<TokenModalProps> = ({
    token,
    character,
    isOpen,
    onClose,
    onUpdateToken,
    onUpdateCharacter,
}) => {
    const [hpAdjust, setHpAdjust] = useState(0);
    const [initiativeValue, setInitiativeValue] = useState(token.initiative || 0);
    const [tempHpValue, setTempHpValue] = useState(token.temp_hp || 0);
    const [maxHpValue, setMaxHpValue] = useState(token.max_hp || character?.hp || 0);
    const [showConditions, setShowConditions] = useState(false);

    useEffect(() => {
        setInitiativeValue(token.initiative || 0);
        setTempHpValue(token.temp_hp || 0);
        setMaxHpValue(token.max_hp || character?.hp || 0);
    }, [token.initiative, token.temp_hp, token.max_hp, character?.hp]);

    if (!isOpen) return null;

    const currentHP = token.current_hp ?? character?.current_hp ?? character?.hp ?? 0;
    const tempHP = token.temp_hp || 0;
    const maxHP = token.max_hp || character?.hp || 0;
    const hpPercentage = calculateHPPercentage(currentHP, maxHP);
    const activeConditions = token.conditions || [];

    const handleApplyDamage = () => {
        if (hpAdjust === 0) return;

        let remainingDamage = hpAdjust;
        let newTempHP = tempHP;
        let newHP = currentHP;

        // Primeiro, reduzir HP temporário
        if (tempHP > 0) {
            if (remainingDamage <= tempHP) {
                newTempHP = tempHP - remainingDamage;
                remainingDamage = 0;
            } else {
                remainingDamage -= tempHP;
                newTempHP = 0;
            }
        }

        // Depois, reduzir HP normal
        if (remainingDamage > 0) {
            newHP = Math.max(0, currentHP - remainingDamage);
        }

        // Atualizar HP no token
        onUpdateToken({ current_hp: newHP, temp_hp: newTempHP });

        // Se tiver personagem vinculado, atualizar também
        if (character && onUpdateCharacter) {
            onUpdateCharacter(character.id!, { current_hp: newHP });
        }

        setHpAdjust(0);
    };

    const handleApplyHealing = () => {
        if (hpAdjust === 0) return;

        const newHP = Math.max(0, Math.min(maxHP, currentHP + hpAdjust));

        onUpdateToken({ current_hp: newHP });

        if (character && onUpdateCharacter) {
            onUpdateCharacter(character.id!, { current_hp: newHP });
        }

        setHpAdjust(0);
    };

    const handleQuickHP = (amount: number) => {
        const newHP = Math.max(0, Math.min(maxHP, currentHP + amount));
        onUpdateToken({ current_hp: newHP });

        if (character && onUpdateCharacter) {
            onUpdateCharacter(character.id!, { current_hp: newHP });
        }
    };

    const handleInitiativeChange = () => {
        onUpdateToken({ initiative: initiativeValue });
    };

    const handleRollInitiative = () => {
        const dexMod = character ? calculateModifier(character.attributes.dexterity) : 0;
        const total = rollInitiative(dexMod);
        setInitiativeValue(total);
        onUpdateToken({ initiative: total });
    };

    const handleSetTempHP = () => {
        onUpdateToken({ temp_hp: tempHpValue });
    };

    const handleSetMaxHP = () => {
        onUpdateToken({ max_hp: maxHpValue });
    };

    const handleToggleCondition = (conditionId: string) => {
        const current = activeConditions;
        const newConditions = current.includes(conditionId)
            ? current.filter((c) => c !== conditionId)
            : [...current, conditionId];
        onUpdateToken({ conditions: newConditions });
    };


    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
            <div
                className="bg-slate-900 rounded-lg shadow-2xl max-w-md w-full border border-slate-700 my-8 max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <div
                            className="w-8 h-8 rounded-full border-2 border-white/60 flex items-center justify-center text-xs font-bold"
                            style={{ backgroundColor: token.color || '#6366f1' }}
                        >
                            {token.name.slice(0, 2).toUpperCase()}
                        </div>
                        {token.name}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                    {/* Informações do Personagem */}
                    {character && (
                        <div className="bg-slate-800/50 rounded p-3 space-y-2">
                            <div className="text-sm text-slate-300">
                                <strong className="text-indigo-300">{character.race} {character.class}</strong> - Nível {character.level}
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-sm">
                                <div className="flex items-center gap-2 text-slate-300">
                                    <Shield className="w-4 h-4 text-blue-400" />
                                    <span>CA: {character.ca}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-300">
                                    <Zap className="w-4 h-4 text-yellow-400" />
                                    <span>Prof: +{character.proficiency_bonus}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Gerenciamento de HP */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-white flex items-center gap-2">
                                <Heart className="w-4 h-4 text-red-400" />
                                Pontos de Vida
                            </label>
                            <div className="flex items-center gap-2">
                                {tempHP > 0 && (
                                    <span className="text-sm text-cyan-400 font-semibold">
                                        +{tempHP}
                                    </span>
                                )}
                                <span className={`text-2xl font-bold ${getHPTextColor(hpPercentage)}`}>
                                    {currentHP} / {maxHP}
                                </span>
                            </div>
                        </div>

                        {/* Barra de HP */}
                        <div className="bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-600">
                            <div
                                className={`h-full transition-all duration-300 ${
                                    hpPercentage > 66 ? 'bg-green-500' : hpPercentage > 33 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${Math.max(0, hpPercentage)}%` }}
                            />
                        </div>

                        {/* Ajustes Rápidos */}
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => handleQuickHP(-1)}
                                className="flex items-center justify-center gap-2 px-3 py-2 bg-red-700 hover:bg-red-600 text-white rounded transition-colors"
                            >
                                <Minus className="w-4 h-4" />
                                -1 HP
                            </button>
                            <button
                                onClick={() => handleQuickHP(1)}
                                className="flex items-center justify-center gap-2 px-3 py-2 bg-green-700 hover:bg-green-600 text-white rounded transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                +1 HP
                            </button>
                            <button
                                onClick={() => handleQuickHP(-5)}
                                className="flex items-center justify-center gap-2 px-3 py-2 bg-red-800 hover:bg-red-700 text-white rounded transition-colors"
                            >
                                <Minus className="w-4 h-4" />
                                -5 HP
                            </button>
                            <button
                                onClick={() => handleQuickHP(5)}
                                className="flex items-center justify-center gap-2 px-3 py-2 bg-green-800 hover:bg-green-700 text-white rounded transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                +5 HP
                            </button>
                        </div>

                        {/* Ajuste Manual */}
                        <div className="flex gap-2">
                            <input
                                type="number"
                                value={hpAdjust}
                                onChange={(e) => setHpAdjust(parseInt(e.target.value) || 0)}
                                className="flex-1 px-3 py-2 bg-slate-800 text-white rounded border border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Quantidade"
                            />
                            <button
                                onClick={handleApplyDamage}
                                disabled={hpAdjust === 0}
                                className="px-4 py-2 bg-red-700 hover:bg-red-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded transition-colors"
                            >
                                Dano
                            </button>
                            <button
                                onClick={handleApplyHealing}
                                disabled={hpAdjust === 0}
                                className="px-4 py-2 bg-green-700 hover:bg-green-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded transition-colors"
                            >
                                Cura
                            </button>
                        </div>

                        {/* HP Temporário */}
                        <div className="flex gap-2 pt-2 border-t border-slate-700">
                            <div className="flex-1">
                                <label className="text-xs text-slate-300 mb-1 block">HP Temporário</label>
                                <input
                                    type="number"
                                    value={tempHpValue || ''}
                                    onChange={(e) => {
                                        const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                        setTempHpValue(isNaN(val) ? 0 : Math.max(0, val));
                                    }}
                                    className="w-full px-3 py-2 bg-slate-800 text-white rounded border border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    placeholder="0"
                                    min="0"
                                />
                            </div>
                            <Button
                                buttonLabel="Aplicar"
                                onClick={handleSetTempHP}
                                classname="bg-cyan-700 hover:bg-cyan-600 self-end"
                            />
                        </div>

                        {/* HP Máximo (para tokens sem personagem) */}
                        {!character && (
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="text-xs text-slate-300 mb-1 block">HP Máximo</label>
                                    <input
                                        type="number"
                                        value={maxHpValue || ''}
                                        onChange={(e) => {
                                            const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                            setMaxHpValue(isNaN(val) ? 0 : Math.max(1, val));
                                        }}
                                        className="w-full px-3 py-2 bg-slate-800 text-white rounded border border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="HP máximo"
                                        min="1"
                                    />
                                </div>
                                <Button
                                    buttonLabel="Definir"
                                    onClick={handleSetMaxHP}
                                    classname="bg-purple-700 hover:bg-purple-600 self-end"
                                />
                            </div>
                        )}
                    </div>

                    {/* Iniciativa */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-white flex items-center gap-2">
                            <Zap className="w-4 h-4 text-yellow-400" />
                            Iniciativa
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                value={initiativeValue || ''}
                                onChange={(e) => {
                                    const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                    setInitiativeValue(isNaN(val) ? 0 : val);
                                }}
                                className="flex-1 px-3 py-2 bg-slate-800 text-white rounded border border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Valor de iniciativa"
                            />
                            {character && (
                                <Button
                                    buttonLabel={
                                        <div className="flex items-center gap-1">
                                            <Dice6 className="w-4 h-4" />
                                            <span>Rolar</span>
                                        </div>
                                    }
                                    onClick={handleRollInitiative}
                                    classname="bg-indigo-700 hover:bg-indigo-600"
                                />
                            )}
                            <Button
                                buttonLabel="Definir"
                                onClick={handleInitiativeChange}
                                classname="bg-purple-700 hover:bg-purple-600"
                            />
                        </div>
                        {character && (
                            <p className="text-xs text-slate-400">
                                Modificador de DEX: {(() => {
                                    const mod = calculateModifier(character.attributes.dexterity);
                                    return mod >= 0 ? `+${mod}` : mod;
                                })()}
                            </p>
                        )}
                    </div>

                    {/* Condições */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-white flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-orange-400" />
                                Condições
                                {activeConditions.length > 0 && (
                                    <span className="text-xs bg-orange-600 text-white px-2 py-0.5 rounded-full">
                                        {activeConditions.length}
                                    </span>
                                )}
                            </label>
                            <button
                                onClick={() => setShowConditions(!showConditions)}
                                className="text-xs text-indigo-400 hover:text-indigo-300"
                            >
                                {showConditions ? 'Ocultar' : 'Mostrar'}
                            </button>
                        </div>

                        {/* Condições Ativas */}
                        {activeConditions.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {activeConditions.map((condId) => {
                                    const cond = getConditionById(condId);
                                    if (!cond) return null;
                                    return (
                                        <span
                                            key={condId}
                                            className="text-xs px-2 py-1 rounded flex items-center gap-1"
                                            style={{ backgroundColor: cond.color + '40', color: cond.color }}
                                            title={cond.description}
                                        >
                                            {cond.name}
                                            <X
                                                className="w-3 h-3 cursor-pointer hover:opacity-70"
                                                onClick={() => handleToggleCondition(condId)}
                                            />
                                        </span>
                                    );
                                })}
                            </div>
                        )}

                        {/* Lista de Condições */}
                        {showConditions && (
                            <div className="max-h-48 overflow-y-auto bg-slate-800/50 rounded p-2 space-y-1 custom-scrollbar">
                                {DND_CONDITIONS.map((cond) => {
                                    const isActive = activeConditions.includes(cond.id);
                                    return (
                                        <button
                                            key={cond.id}
                                            onClick={() => handleToggleCondition(cond.id)}
                                            className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors ${
                                                isActive
                                                    ? 'bg-slate-700 border border-slate-600'
                                                    : 'hover:bg-slate-700/50'
                                            }`}
                                            title={cond.description}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: cond.color }}
                                                />
                                                <span className={isActive ? 'text-white font-semibold' : 'text-slate-300'}>
                                                    {cond.name}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 p-4 border-t border-slate-700 flex-shrink-0">
                    <Button
                        buttonLabel="Fechar"
                        onClick={onClose}
                        classname="bg-slate-700 hover:bg-slate-600"
                    />
                </div>
            </div>
        </div>
    );
};
