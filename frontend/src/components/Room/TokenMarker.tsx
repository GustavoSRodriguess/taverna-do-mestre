import React, { useEffect, useState } from 'react';
import { SceneToken } from '../../types/room';
import { FullCharacter } from '../../types/game';
import { pcService } from '../../services/pcService';

interface TokenMarkerProps {
    token: SceneToken;
    onMouseDown: (e: React.MouseEvent) => void;
    onClick?: () => void;
    isCurrentTurn?: boolean;
}

const clampPercent = (value: number) => Math.max(0, Math.min(100, value));

export const TokenMarker: React.FC<TokenMarkerProps> = ({ token, onMouseDown, onClick, isCurrentTurn = false }) => {
    const [character, setCharacter] = useState<FullCharacter | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchCharacter = async () => {
            if (!token.character_id) {
                setCharacter(null);
                return;
            }

            try {
                setLoading(true);
                const char = await pcService.getPC(token.character_id);
                setCharacter(char);
            } catch (error) {
                console.error('Erro ao buscar personagem:', error);
                setCharacter(null);
            } finally {
                setLoading(false);
            }
        };

        fetchCharacter();
    }, [token.character_id]);

    const currentHP = token.current_hp ?? character?.current_hp ?? character?.hp ?? 0;
    const maxHP = character?.hp ?? 0;
    const hpPercentage = maxHP > 0 ? (currentHP / maxHP) * 100 : 100;

    // Determinar cor da barra de HP
    const getHPColor = () => {
        if (hpPercentage > 66) return 'bg-green-500';
        if (hpPercentage > 33) return 'bg-yellow-500';
        return 'bg-red-500';
    };

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
                onClick={(e) => {
                    e.stopPropagation();
                    onClick?.();
                }}
            >
                {/* Círculo do token */}
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

                {/* Barra de HP (se personagem estiver vinculado) */}
                {character && (
                    <div className="mt-1 w-12 md:w-16">
                        <div className="bg-slate-800/80 rounded-full h-2 overflow-hidden border border-slate-600">
                            <div
                                className={`h-full transition-all duration-300 ${getHPColor()}`}
                                style={{ width: `${Math.max(0, hpPercentage)}%` }}
                            />
                        </div>
                        <div className="text-center text-xs text-white font-semibold mt-0.5 drop-shadow-lg">
                            {currentHP}/{maxHP}
                        </div>
                    </div>
                )}
            </div>

            {/* Tooltip com informações detalhadas (aparece ao hover) */}
            {character && (
                <div className="absolute left-full ml-2 top-0 hidden group-hover:block z-10 pointer-events-none">
                    <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg p-3 shadow-xl min-w-[200px]">
                        <div className="space-y-1 text-sm text-white">
                            <div className="font-bold text-base text-indigo-300">{character.name}</div>
                            <div className="text-slate-300">
                                {character.race} {character.class} - Nível {character.level}
                            </div>
                            <div className="border-t border-slate-700 pt-1 mt-2">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">CA:</span>
                                    <span className="font-semibold">{character.ca}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">HP:</span>
                                    <span className={`font-semibold ${hpPercentage <= 33 ? 'text-red-400' : hpPercentage <= 66 ? 'text-yellow-400' : 'text-green-400'}`}>
                                        {currentHP} / {maxHP}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Proficiência:</span>
                                    <span className="font-semibold">+{character.proficiency_bonus}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
