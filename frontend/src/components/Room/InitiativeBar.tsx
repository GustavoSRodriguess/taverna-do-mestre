import React from 'react';
import { ChevronRight, Swords } from 'lucide-react';
import { SceneToken } from '../../types/room';

interface InitiativeBarProps {
    tokens: SceneToken[];
    currentTurnTokenId: string | null;
    currentRound: number;
    onSelectToken: (tokenId: string) => void;
    onNextTurn: () => void;
}

export const InitiativeBar: React.FC<InitiativeBarProps> = ({
    tokens,
    currentTurnTokenId,
    currentRound,
    onSelectToken,
    onNextTurn,
}) => {
    // Filtrar e ordenar tokens com iniciativa
    const tokensWithInitiative = tokens
        .filter((token) => token.initiative !== undefined && token.initiative !== null)
        .sort((a, b) => (b.initiative || 0) - (a.initiative || 0));

    if (tokensWithInitiative.length === 0) {
        return null; // Não mostrar barra se não houver iniciativa
    }

    const currentTurnIndex = tokensWithInitiative.findIndex((t) => t.id === currentTurnTokenId);

    return (
        <div className="fixed top-16 left-0 right-0 z-30 flex justify-center pointer-events-none">
            <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg shadow-xl pointer-events-auto">
                <div className="px-3 py-2 flex items-center gap-2">
                    {/* Ícone de Combate */}
                    <div className="flex items-center gap-1.5 pr-2 border-r border-slate-700">
                        <Swords className="w-4 h-4 text-red-400" />
                        <span className="text-xs font-bold text-white hidden sm:block">Iniciativa</span>
                    </div>

                    {/* Contador de Round */}
                    <div className="flex flex-col items-center px-2 border-r border-slate-700">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wide">Round</span>
                        <span className="text-lg font-bold text-indigo-300">{currentRound}</span>
                    </div>

                    {/* Tokens em sequência horizontal */}
                    <div className="flex items-center gap-1.5">
                        {tokensWithInitiative.map((token, index) => {
                            const isCurrentTurn = token.id === currentTurnTokenId;
                            const isPastTurn = currentTurnIndex >= 0 && index < currentTurnIndex;
                            const isFutureTurn = currentTurnIndex >= 0 && index > currentTurnIndex;

                            return (
                                <React.Fragment key={token.id}>
                                    {/* Token Avatar */}
                                    <div
                                        onClick={() => onSelectToken(token.id)}
                                        className={`
                                            relative flex flex-col items-center gap-0.5 cursor-pointer transition-all
                                            ${isCurrentTurn ? 'scale-105' : 'hover:scale-105'}
                                        `}
                                    >
                                        {/* Indicador "SEU TURNO" */}
                                        {isCurrentTurn && (
                                            <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                                                <div className="bg-yellow-500 text-slate-900 text-[10px] font-bold px-1.5 py-0.5 rounded animate-pulse">
                                                    TURNO
                                                </div>
                                            </div>
                                        )}

                                        {/* Avatar do Token */}
                                        <div
                                            className={`
                                                relative w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs
                                                transition-all
                                                ${
                                                    isCurrentTurn
                                                        ? 'border-3 border-yellow-400 ring-2 ring-yellow-400/50'
                                                        : isPastTurn
                                                        ? 'border border-slate-600 opacity-60'
                                                        : 'border border-white/60'
                                                }
                                            `}
                                            style={{
                                                backgroundColor: token.color || '#6366f1',
                                            }}
                                        >
                                            {token.name.slice(0, 2).toUpperCase()}

                                            {/* Número de Iniciativa */}
                                            <div
                                                className={`
                                                    absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold
                                                    ${
                                                        isCurrentTurn
                                                            ? 'bg-yellow-400 text-slate-900'
                                                            : 'bg-indigo-600 text-white'
                                                    }
                                                    border border-slate-900
                                                `}
                                            >
                                                {token.initiative}
                                            </div>
                                        </div>

                                        {/* Nome e HP */}
                                        <div className="flex flex-col items-center gap-0.5 min-w-[50px]">
                                            <span
                                                className={`
                                                    text-[10px] font-semibold truncate max-w-[50px]
                                                    ${isCurrentTurn ? 'text-yellow-300' : 'text-white'}
                                                `}
                                            >
                                                {token.name}
                                            </span>
                                            {token.current_hp !== undefined && (
                                                <div className="flex items-center gap-1">
                                                    <div className="w-10 bg-slate-800 rounded-full h-1 overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all ${
                                                                (token.current_hp / (token.current_hp + 10)) * 100 > 50
                                                                    ? 'bg-green-500'
                                                                    : (token.current_hp / (token.current_hp + 10)) * 100 > 25
                                                                    ? 'bg-yellow-500'
                                                                    : 'bg-red-500'
                                                            }`}
                                                            style={{
                                                                width: `${Math.min(100, (token.current_hp / Math.max(token.current_hp, 50)) * 100)}%`,
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] text-slate-400 font-mono">
                                                        {token.current_hp}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Seta indicando "próximo" */}
                                    {index < tokensWithInitiative.length - 1 && (
                                        <ChevronRight
                                            className={`
                                                w-3 h-3 flex-shrink-0
                                                ${
                                                    index === currentTurnIndex
                                                        ? 'text-yellow-400 animate-pulse'
                                                        : 'text-slate-600'
                                                }
                                            `}
                                        />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>

                    {/* Botão Próximo Turno */}
                    <div className="pl-2 border-l border-slate-700">
                        <button
                            onClick={onNextTurn}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white rounded transition-colors font-semibold text-xs"
                        >
                            <ChevronRight className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Próximo</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
