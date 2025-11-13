import React, { useEffect } from 'react';
import { Dices, Sparkles, Skull, X } from 'lucide-react';
import { DiceRoll } from '../../types/dice';

interface DiceNotificationProps {
    roll: DiceRoll;
    onClose: () => void;
    autoClose?: number; // ms
}

export const DiceNotification: React.FC<DiceNotificationProps> = ({ roll, onClose, autoClose = 5000 }) => {
    useEffect(() => {
        if (autoClose) {
            const timer = setTimeout(onClose, autoClose);
            return () => clearTimeout(timer);
        }
    }, [autoClose, onClose]);

    const getBorderColor = () => {
        if (roll.isCritical) return 'border-yellow-400';
        if (roll.isFumble) return 'border-red-400';
        if (roll.advantage) return 'border-green-400';
        if (roll.disadvantage) return 'border-red-400';
        return 'border-purple-600';
    };

    const getBackgroundGradient = () => {
        if (roll.isCritical) return 'from-yellow-600/30 to-yellow-500/30';
        if (roll.isFumble) return 'from-red-600/30 to-red-500/30';
        if (roll.advantage) return 'from-green-600/20 to-green-500/20';
        if (roll.disadvantage) return 'from-red-600/20 to-red-500/20';
        return 'from-indigo-950 to-purple-950';
    };

    const getTotalColor = () => {
        if (roll.isCritical) return 'text-yellow-400';
        if (roll.isFumble) return 'text-red-400';
        return 'text-purple-300';
    };

    return (
        <div className={`fixed bottom-4 left-4 bg-gradient-to-br ${getBackgroundGradient()} rounded-lg shadow-2xl border-2 ${getBorderColor()} z-50 w-80 animate-slideIn`}>
            <div className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Dices className="w-5 h-5 text-purple-400" />
                        <span className="font-bold text-white text-sm">
                            {roll.label || roll.notation}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-purple-300 hover:text-white transition-colors"
                        title="Fechar"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1 mb-2">
                    {roll.advantage && (
                        <span className="text-xs bg-green-600/30 text-green-400 px-2 py-1 rounded border border-green-600">
                            VANTAGEM
                        </span>
                    )}
                    {roll.disadvantage && (
                        <span className="text-xs bg-red-600/30 text-red-400 px-2 py-1 rounded border border-red-600">
                            DESVANTAGEM
                        </span>
                    )}
                    {roll.isCritical && (
                        <span className="text-xs bg-yellow-600/30 text-yellow-400 px-2 py-1 rounded border border-yellow-600 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            CRÍTICO!
                        </span>
                    )}
                    {roll.isFumble && (
                        <span className="text-xs bg-red-600/30 text-red-400 px-2 py-1 rounded border border-red-600 flex items-center gap-1">
                            <Skull className="w-3 h-3" />
                            FALHA CRÍTICA
                        </span>
                    )}
                </div>

                {/* Rolls */}
                <div className="text-sm text-purple-300 mb-2">
                    <span className="font-semibold">Dados: </span>
                    <span className="font-mono">[{roll.rolls.join(', ')}]</span>
                    {roll.droppedRolls && roll.droppedRolls.length > 0 && (
                        <span className="text-gray-500 line-through ml-2 font-mono">
                            [{roll.droppedRolls.join(', ')}]
                        </span>
                    )}
                </div>

                {/* Total */}
                <div className="flex items-center justify-between pt-2 border-t border-purple-700/50">
                    <span className="text-sm text-purple-300">
                        {roll.modifier !== 0 && (
                            <span className="font-mono">
                                {roll.rolls.reduce((a, b) => a + b, 0)} {roll.modifier > 0 ? '+' : ''}{roll.modifier} =
                            </span>
                        )}
                    </span>
                    <div className="flex items-center gap-2">
                        {roll.isCritical && <Sparkles className="w-5 h-5 text-yellow-400" />}
                        {roll.isFumble && <Skull className="w-5 h-5 text-red-400" />}
                        <span className={`text-3xl font-bold ${getTotalColor()}`}>
                            {roll.total}
                        </span>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateX(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                .animate-slideIn {
                    animation: slideIn 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};
