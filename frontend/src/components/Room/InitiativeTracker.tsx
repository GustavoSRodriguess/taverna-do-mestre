import React from 'react';
import { Swords, ChevronRight } from 'lucide-react';
import { SceneToken } from '../../types/room';
import { Badge } from '../../ui';

interface InitiativeTrackerProps {
    tokens: SceneToken[];
    currentTurnTokenId: string | null;
    onSelectToken: (tokenId: string) => void;
    onNextTurn: () => void;
}

export const InitiativeTracker: React.FC<InitiativeTrackerProps> = ({
    tokens,
    currentTurnTokenId,
    onSelectToken,
    onNextTurn,
}) => {
    // Filtrar apenas tokens com iniciativa definida e ordenar
    const tokensWithInitiative = tokens
        .filter((token) => token.initiative !== undefined && token.initiative !== null)
        .sort((a, b) => (b.initiative || 0) - (a.initiative || 0));

    if (tokensWithInitiative.length === 0) {
        return (
            <div className="text-sm text-slate-400 text-center py-4">
                Nenhum token com iniciativa definida.
                <br />
                <span className="text-xs">Clique nos tokens para definir iniciativa.</span>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Botão Próximo Turno */}
            <button
                onClick={onNextTurn}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded transition-colors font-semibold"
            >
                <ChevronRight className="w-4 h-4" />
                Próximo Turno
            </button>

            {/* Lista de Iniciativa */}
            <div className="space-y-2">
                {tokensWithInitiative.map((token, index) => {
                    const isCurrentTurn = token.id === currentTurnTokenId;

                    return (
                        <div
                            key={token.id}
                            onClick={() => onSelectToken(token.id)}
                            className={`
                                flex items-center justify-between p-3 rounded border cursor-pointer transition-all
                                ${
                                    isCurrentTurn
                                        ? 'bg-indigo-600/30 border-indigo-500 ring-2 ring-indigo-500 shadow-lg'
                                        : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800 hover:border-slate-600'
                                }
                            `}
                        >
                            <div className="flex items-center gap-3">
                                {/* Posição */}
                                <div
                                    className={`
                                        w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
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
                                <div>
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-4 h-4 rounded-full border border-white/60"
                                            style={{ backgroundColor: token.color || '#6366f1' }}
                                        />
                                        <span className="text-white font-semibold">{token.name}</span>
                                    </div>
                                    {token.current_hp !== undefined && (
                                        <div className="text-xs text-slate-400">
                                            HP: {token.current_hp}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Iniciativa */}
                            <div className="flex items-center gap-2">
                                {isCurrentTurn && (
                                    <Badge text="Turno Atual" variant="warning" />
                                )}
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-indigo-300">
                                        {token.initiative}
                                    </div>
                                    <div className="text-xs text-slate-400">iniciativa</div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Informação */}
            <div className="text-xs text-slate-400 text-center pt-2 border-t border-slate-700">
                Clique em um token para gerenciar HP e iniciativa
            </div>
        </div>
    );
};
