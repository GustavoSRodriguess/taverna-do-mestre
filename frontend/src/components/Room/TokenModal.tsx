import React, { useState, useEffect } from 'react';
import { X, Heart, Shield, Zap, Minus, Plus } from 'lucide-react';
import { SceneToken } from '../../types/room';
import { FullCharacter } from '../../types/game';
import { Button } from '../../ui';

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

    useEffect(() => {
        setInitiativeValue(token.initiative || 0);
    }, [token.initiative]);

    if (!isOpen) return null;

    const currentHP = token.current_hp ?? character?.current_hp ?? character?.hp ?? 0;
    const maxHP = character?.hp ?? 0;
    const hpPercentage = maxHP > 0 ? (currentHP / maxHP) * 100 : 100;

    const handleApplyDamage = () => {
        if (hpAdjust === 0) return;

        const newHP = Math.max(0, Math.min(maxHP, currentHP - hpAdjust));

        // Atualizar HP no token
        onUpdateToken({ current_hp: newHP });

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

    const getHPColor = () => {
        if (hpPercentage > 66) return 'text-green-400';
        if (hpPercentage > 33) return 'text-yellow-400';
        return 'text-red-400';
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-slate-900 rounded-lg shadow-2xl max-w-md w-full border border-slate-700"
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
                <div className="p-4 space-y-4">
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
                            <span className={`text-2xl font-bold ${getHPColor()}`}>
                                {currentHP} / {maxHP}
                            </span>
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
                                value={initiativeValue}
                                onChange={(e) => setInitiativeValue(parseInt(e.target.value) || 0)}
                                className="flex-1 px-3 py-2 bg-slate-800 text-white rounded border border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Valor de iniciativa"
                            />
                            <Button
                                buttonLabel="Definir"
                                onClick={handleInitiativeChange}
                                classname="bg-purple-700 hover:bg-purple-600"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 p-4 border-t border-slate-700">
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
