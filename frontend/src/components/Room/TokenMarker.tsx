import React, { useEffect, useState } from 'react';
import { SceneToken } from '../../types/room';
import { FullCharacter } from '../../types/game';
import { pcService } from '../../services/pcService';
import { getConditionById } from '../../constants/conditions';
import { clampPercent, calculateHPPercentage, getHPColor, getHPTextColor } from '../../utils/tokenUtils';

interface TokenMarkerProps {
    token: SceneToken;
    onMouseDown: (e: React.MouseEvent) => void;
    onClick?: () => void;
    isCurrentTurn?: boolean;
}

export const TokenMarker: React.FC<TokenMarkerProps> = ({ token, onMouseDown, onClick, isCurrentTurn = false }) => {
    const [character, setCharacter] = useState<FullCharacter | null>(null);
    const [characterError, setCharacterError] = useState<string | null>(null);
    const [isCharacterLoading, setIsCharacterLoading] = useState(false);

    useEffect(() => {
        const charId = token.character_id;
        if (charId === undefined || charId === null) {
            setCharacter(null);
            setCharacterError(null);
            setIsCharacterLoading(false);
            return;
        }

        let isCurrentRequest = true;

        const fetchCharacter = async () => {
            try {
                setIsCharacterLoading(true);
                setCharacter(null);
                setCharacterError(null);
                const char = await pcService.getPC(charId);
                if (!isCurrentRequest) return;
                setCharacter(char);
            } catch (error) {
                if (!isCurrentRequest) return;
                console.error(`Erro ao carregar personagem ${charId}`, error);
                setCharacter(null);
                setCharacterError('Personagem não encontrado');
            } finally {
                if (!isCurrentRequest) return;
                setIsCharacterLoading(false);
            }
        };

        fetchCharacter();

        return () => {
            isCurrentRequest = false;
        };
    }, [token.character_id]);

    const currentHP = token.current_hp ?? character?.current_hp ?? character?.hp ?? 0;
    const tempHP = token.temp_hp || 0;
    const maxHP = token.max_hp || character?.hp || 0;
    const hpPercentage = calculateHPPercentage(currentHP, maxHP);
    const activeConditions = token.conditions || [];
    const showTooltip = Boolean(character || characterError || maxHP > 0 || activeConditions.length > 0);

    return (
        <div
            className="absolute group"
            style={{
                left: `${clampPercent(token.x)}%`,
                top: `${clampPercent(token.y)}%`,
                transform: 'translate(-50%, -50%)',
            }}
        >
            {/* Token principal */}
            <div
                className="flex flex-col items-center cursor-grab active:cursor-grabbing select-none"
                onMouseDown={onMouseDown}
                onDoubleClick={(e) => {
                    e.stopPropagation();
                    onClick?.();
                }}
            >
                {/* Círculo do token */}
                <div className="relative">
                    <div
                        className={`flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full text-sm md:text-base font-bold shadow-2xl transition-all hover:scale-110 ${
                            isCurrentTurn
                                ? 'border-4 border-yellow-400 ring-4 ring-yellow-400/50 animate-pulse'
                                : 'border-2 border-white/60'
                        }`}
                        style={{
                            backgroundColor: token.color || '#6366f1',
                        }}
                        title={token.name}
                    >
                        {token.name.slice(0, 3).toUpperCase()}
                    </div>

                    {/* Indicadores de Condições */}
                    {activeConditions.length > 0 && (
                        <div className="absolute -top-1 -right-1 flex gap-0.5">
                            {activeConditions.slice(0, 3).map((condId) => {
                                const cond = getConditionById(condId);
                                if (!cond) return null;
                                return (
                                    <div
                                        key={condId}
                                        className="w-3 h-3 md:w-4 md:h-4 rounded-full border-2 border-white shadow-lg"
                                        style={{ backgroundColor: cond.color }}
                                        title={cond.name}
                                    />
                                );
                            })}
                            {activeConditions.length > 3 && (
                                <div
                                    className="w-3 h-3 md:w-4 md:h-4 rounded-full border-2 border-white shadow-lg bg-slate-700 flex items-center justify-center text-[8px] font-bold text-white"
                                    title={`+${activeConditions.length - 3} condições`}
                                >
                                    +{activeConditions.length - 3}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Barra de HP (mostra sempre se tiver HP definido) */}
                {maxHP > 0 && (
                    <div className="mt-1 w-12 md:w-16">
                        <div className="bg-slate-800/80 rounded-full h-2 overflow-hidden border border-slate-600">
                            <div
                                className={`h-full transition-all duration-300 ${getHPColor(hpPercentage)}`}
                                style={{ width: `${hpPercentage}%` }}
                            />
                        </div>
                        <div className="text-center text-xs text-white font-semibold mt-0.5 drop-shadow-lg flex items-center justify-center gap-1">
                            {tempHP > 0 && (
                                <span className="text-cyan-400">+{tempHP}</span>
                            )}
                            <span>{currentHP}/{maxHP}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Tooltip com informações detalhadas (aparece ao hover) */}
            {showTooltip && (
                <div className="absolute left-full ml-2 top-0 hidden group-hover:block z-10 pointer-events-none">
                    <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg p-3 shadow-xl min-w-[200px]">
                        <div className="space-y-1 text-sm text-white">
                            <div className="font-bold text-base text-indigo-300">
                                {character?.name || token.name}
                            </div>
                            <div className="text-xs text-yellow-400 italic">
                                Duplo clique para editar
                            </div>
                            {isCharacterLoading && (
                                <div className="text-xs text-slate-400">Carregando personagem...</div>
                            )}
                            {character && (
                                <div className="text-slate-300">
                                    {character.race} {character.class} - Nível {character.level}
                                </div>
                            )}
                            {characterError && !isCharacterLoading && (
                                <div className="text-xs text-red-300">{characterError}</div>
                            )}
                            <div className="border-t border-slate-700 pt-1 mt-2 space-y-1">
                                {character && (
                                    <>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">CA:</span>
                                            <span className="font-semibold">{character.ca}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Proficiência:</span>
                                            <span className="font-semibold">+{character.proficiency_bonus}</span>
                                        </div>
                                    </>
                                )}
                                {maxHP > 0 && (
                                    <>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">HP:</span>
                                            <span className={`font-semibold ${getHPTextColor(hpPercentage)}`}>
                                                {currentHP} / {maxHP}
                                            </span>
                                        </div>
                                        {tempHP > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">HP Temp:</span>
                                                <span className="font-semibold text-cyan-400">+{tempHP}</span>
                                            </div>
                                        )}
                                    </>
                                )}
                                {activeConditions.length > 0 && (
                                    <div className="border-t border-slate-700 pt-1 mt-1">
                                        <div className="text-slate-400 text-xs mb-1">Condições:</div>
                                        <div className="flex flex-wrap gap-1">
                                            {activeConditions.map((condId) => {
                                                const cond = getConditionById(condId);
                                                if (!cond) return null;
                                                return (
                                                    <span
                                                        key={condId}
                                                        className="text-xs px-1.5 py-0.5 rounded"
                                                        style={{ backgroundColor: cond.color + '40', color: cond.color }}
                                                        title={cond.description}
                                                    >
                                                        {cond.name}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
