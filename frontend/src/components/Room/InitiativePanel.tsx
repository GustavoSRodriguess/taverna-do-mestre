import React, { useState } from 'react';
import { ChevronRight, ChevronUp, ChevronDown, Swords } from 'lucide-react';
import { SceneToken } from '../../types/room';

interface InitiativePanelProps {
    tokens: SceneToken[];
    currentTurnTokenId: string | null;
    onSelectToken: (tokenId: string) => void;
    onNextTurn: () => void;
}

export const InitiativePanel: React.FC<InitiativePanelProps> = ({
    tokens,
    currentTurnTokenId,
    onSelectToken,
    onNextTurn,
}) => {
    const [isExpanded, setIsExpanded] = useState(true);

    // Filtrar e ordenar tokens com iniciativa
    const tokensWithInitiative = tokens
        .filter((token) => token.initiative !== undefined && token.initiative !== null)
        .sort((a, b) => (b.initiative || 0) - (a.initiative || 0));

    if (tokensWithInitiative.length === 0) {
        return null; // Não mostrar painel se não houver iniciativa definida
    }

    const currentTurnIndex = tokensWithInitiative.findIndex((t) => t.id === currentTurnTokenId);
    const currentToken = currentTurnIndex >= 0 ? tokensWithInitiative[currentTurnIndex] : null;

    return (
        <div className="fixed bottom-4 left-4 z-40 flex flex-col gap-2 max-w-sm">
            {/* Painel Compacto */}
            {!isExpanded && (
                <div className="bg-slate-900/95 backdrop-blur-sm border-2 border-indigo-600 rounded-lg shadow-2xl">
                    <div className="p-3 flex items-center gap-3">
                        {/* Ícone e Título */}
                        <div className="flex items-center gap-2">
                            <Swords className="w-5 h-5 text-red-400" />
                            <span className="text-sm font-semibold text-white">Iniciativa</span>
                        </div>

                        {/* Token Atual */}
                        {currentToken && (
                            <div
                                className="flex items-center gap-2 px-3 py-1 bg-indigo-600/30 border border-indigo-500 rounded cursor-pointer hover:bg-indigo-600/40"
                                onClick={() => onSelectToken(currentToken.id)}
                            >
                                <div
                                    className="w-4 h-4 rounded-full border border-white/60"
                                    style={{ backgroundColor: currentToken.color || '#6366f1' }}
                                />
                                <span className="text-white font-medium text-sm">
                                    {currentToken.name}
                                </span>
                                <span className="text-indigo-300 font-bold text-sm">
                                    {currentToken.initiative}
                                </span>
                            </div>
                        )}

                        {/* Botão Próximo Turno */}
                        <button
                            onClick={onNextTurn}
                            className="flex items-center gap-1 px-3 py-1 bg-indigo-700 hover:bg-indigo-600 text-white rounded transition-colors font-semibold text-sm"
                        >
                            <ChevronRight className="w-4 h-4" />
                            Próximo
                        </button>

                        {/* Botão Expandir */}
                        <button
                            onClick={() => setIsExpanded(true)}
                            className="text-slate-400 hover:text-white transition-colors p-1"
                        >
                            <ChevronUp className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Painel Expandido */}
            {isExpanded && (
                <div className="bg-slate-900/95 backdrop-blur-sm border-2 border-indigo-600 rounded-lg shadow-2xl max-h-96 flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-3 border-b border-slate-700">
                        <div className="flex items-center gap-2">
                            <Swords className="w-5 h-5 text-red-400" />
                            <h3 className="text-lg font-bold text-white">Ordem de Iniciativa</h3>
                        </div>
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="text-slate-400 hover:text-white transition-colors p-1"
                            title="Recolher"
                        >
                            <ChevronDown className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Botão Próximo Turno */}
                    <div className="p-3 border-b border-slate-700">
                        <button
                            onClick={onNextTurn}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded transition-colors font-semibold"
                        >
                            <ChevronRight className="w-4 h-4" />
                            Próximo Turno
                        </button>
                    </div>

                    {/* Lista de Iniciativa */}
                    <div className="overflow-y-auto p-3 space-y-2">
                        {tokensWithInitiative.map((token, index) => {
                            const isCurrentTurn = token.id === currentTurnTokenId;

                            return (
                                <div
                                    key={token.id}
                                    onClick={() => onSelectToken(token.id)}
                                    className={`
                                        flex items-center justify-between p-2 rounded border cursor-pointer transition-all
                                        ${
                                            isCurrentTurn
                                                ? 'bg-indigo-600/30 border-indigo-500 ring-2 ring-indigo-500/50'
                                                : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800 hover:border-slate-600'
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-2">
                                        {/* Posição */}
                                        <div
                                            className={`
                                                w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs
                                                ${
                                                    isCurrentTurn
                                                        ? 'bg-indigo-500 text-white'
                                                        : 'bg-slate-700 text-slate-300'
                                                }
                                            `}
                                        >
                                            {index + 1}
                                        </div>

                                        {/* Token Info */}
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full border border-white/60"
                                                style={{ backgroundColor: token.color || '#6366f1' }}
                                            />
                                            <span className={`text-sm font-semibold ${isCurrentTurn ? 'text-white' : 'text-slate-200'}`}>
                                                {token.name}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Iniciativa e HP */}
                                    <div className="flex items-center gap-2">
                                        {token.current_hp !== undefined && (
                                            <span className="text-xs text-slate-400">
                                                HP: {token.current_hp}
                                            </span>
                                        )}
                                        <div className="text-lg font-bold text-indigo-300">
                                            {token.initiative}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer */}
                    <div className="p-2 border-t border-slate-700 text-center text-xs text-slate-400">
                        Clique em um token para gerenciar HP e iniciativa
                    </div>
                </div>
            )}
        </div>
    );
};
