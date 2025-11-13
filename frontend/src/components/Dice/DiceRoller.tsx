import React, { useState } from 'react';
import { Dices, X, Minimize2, Maximize2, Trash2, AlertCircle, Sparkles, Skull } from 'lucide-react';
import { diceService } from '../../services/diceService';
import { DiceRoll, DiceType } from '../../types/dice';
import { D4Icon, D6Icon, D8Icon, D10Icon, D12Icon, D20Icon, D100Icon } from './DiceIcons';

const COMMON_DICE: { sides: DiceType; color: string; icon: React.ReactNode }[] = [
    { sides: 4, color: 'bg-blue-600 hover:bg-blue-700', icon: <D4Icon className="w-6 h-6" /> },
    { sides: 6, color: 'bg-green-600 hover:bg-green-700', icon: <D6Icon className="w-6 h-6" /> },
    { sides: 8, color: 'bg-yellow-600 hover:bg-yellow-700', icon: <D8Icon className="w-6 h-6" /> },
    { sides: 10, color: 'bg-orange-600 hover:bg-orange-700', icon: <D10Icon className="w-6 h-6" /> },
    { sides: 12, color: 'bg-red-600 hover:bg-red-700', icon: <D12Icon className="w-6 h-6" /> },
    { sides: 20, color: 'bg-purple-600 hover:bg-purple-700', icon: <D20Icon className="w-6 h-6" /> },
    { sides: 100, color: 'bg-pink-600 hover:bg-pink-700', icon: <D100Icon className="w-6 h-6" /> },
];

export const DiceRoller: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [history, setHistory] = useState<DiceRoll[]>([]);
    const [customNotation, setCustomNotation] = useState('');
    const [isRolling, setIsRolling] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [rollingDice, setRollingDice] = useState(false);
    const [advantageMode, setAdvantageMode] = useState<'normal' | 'advantage' | 'disadvantage'>('normal');

    const rollDice = async (notation: string, label?: string, advantage?: boolean, disadvantage?: boolean) => {
        setError(null);
        setIsRolling(true);
        setRollingDice(true);

        try {
            const result = await diceService.roll(notation, label, advantage, disadvantage);

            // Detectar crítico (natural 20) ou falha (natural 1)
            const isCritical = result.sides === 20 && result.quantity === 1 && result.rolls[0] === 20;
            const isFumble = result.sides === 20 && result.quantity === 1 && result.rolls[0] === 1;

            const roll: DiceRoll = {
                notation: result.notation,
                rolls: result.rolls,
                modifier: result.modifier,
                total: result.total,
                timestamp: new Date(result.timestamp),
                label: result.label,
                isCritical,
                isFumble,
                advantage: result.advantage,
                disadvantage: result.disadvantage,
                droppedRolls: result.dropped_rolls,
            };

            // Simular delay de animação
            setTimeout(() => {
                setHistory(prev => [roll, ...prev]);
                setRollingDice(false);
                setCustomNotation('');
                setAdvantageMode('normal'); // Reset após rolagem
            }, 800);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao rolar dados');
            setRollingDice(false);
        } finally {
            setIsRolling(false);
        }
    };

    const handleQuickRoll = (sides: DiceType) => {
        const advantage = advantageMode === 'advantage';
        const disadvantage = advantageMode === 'disadvantage';
        rollDice(`1d${sides}`, `d${sides}`, advantage, disadvantage);
    };

    const handleCustomRoll = () => {
        if (!customNotation.trim()) return;
        const advantage = advantageMode === 'advantage';
        const disadvantage = advantageMode === 'disadvantage';
        rollDice(customNotation.trim(), undefined, advantage, disadvantage);
    };

    const clearHistory = () => {
        setHistory([]);
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-50"
                title="Abrir Rolador de Dados"
            >
                <Dices className="w-6 h-6" />
            </button>
        );
    }

    return (
        <div className={`fixed bottom-4 right-4 bg-gradient-to-br from-indigo-950 to-purple-950 rounded-lg shadow-2xl border-2 border-purple-800 z-50 transition-all duration-300 max-h-[90vh] flex flex-col ${
            isMinimized ? 'w-80' : 'w-96'
        }`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-purple-800 bg-purple-900/30">
                <div className="flex items-center gap-2">
                    <Dices className="w-5 h-5 text-purple-400" />
                    <h3 className="font-bold text-white">Rolador de Dados</h3>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="text-purple-300 hover:text-white transition-colors"
                        title={isMinimized ? "Maximizar" : "Minimizar"}
                    >
                        {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-purple-300 hover:text-white transition-colors"
                        title="Fechar"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <div className="overflow-y-auto custom-scrollbar flex-1">
                    {/* Vantagem/Desvantagem (D&D 5e) */}
                    <div className="p-4 border-b border-purple-800 bg-indigo-900/20">
                        <p className="text-xs text-purple-300 mb-2 font-semibold">MODO D&D 5e</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setAdvantageMode('normal')}
                                className={`flex-1 px-3 py-2 rounded font-semibold transition-all ${
                                    advantageMode === 'normal'
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-indigo-900/50 text-purple-300 hover:bg-indigo-800'
                                }`}
                            >
                                Normal
                            </button>
                            <button
                                onClick={() => setAdvantageMode('advantage')}
                                className={`flex-1 px-3 py-2 rounded font-semibold transition-all ${
                                    advantageMode === 'advantage'
                                        ? 'bg-green-600 text-white'
                                        : 'bg-indigo-900/50 text-green-400 hover:bg-indigo-800'
                                }`}
                            >
                                Vantagem
                            </button>
                            <button
                                onClick={() => setAdvantageMode('disadvantage')}
                                className={`flex-1 px-3 py-2 rounded font-semibold transition-all ${
                                    advantageMode === 'disadvantage'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-indigo-900/50 text-red-400 hover:bg-indigo-800'
                                }`}
                            >
                                Desvantagem
                            </button>
                        </div>
                    </div>

                    {/* Dados Rápidos */}
                    <div className="p-4 border-b border-purple-800">
                        <p className="text-xs text-purple-300 mb-2 font-semibold">DADOS RÁPIDOS</p>
                        <div className="grid grid-cols-7 gap-2">
                            {COMMON_DICE.map(({ sides, color, icon }) => (
                                <button
                                    key={sides}
                                    onClick={() => handleQuickRoll(sides)}
                                    disabled={isRolling}
                                    className={`${color} text-white p-3 rounded-lg transition-all duration-200 transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center shadow-lg`}
                                    title={`Rolar d${sides}`}
                                >
                                    {icon}
                                    <span className="text-xs font-bold mt-1">d{sides}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Rolagem Customizada */}
                    <div className="p-4 border-b border-purple-800">
                        <p className="text-xs text-purple-300 mb-2 font-semibold">ROLAGEM CUSTOMIZADA</p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={customNotation}
                                onChange={(e) => setCustomNotation(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleCustomRoll()}
                                placeholder="Ex: 2d6+3, 1d20"
                                disabled={isRolling}
                                className="flex-1 px-3 py-2 bg-indigo-900/50 border border-purple-700 rounded text-white placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                            />
                            <button
                                onClick={handleCustomRoll}
                                disabled={isRolling || !customNotation.trim()}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <Dices className="w-4 h-4" />
                                Rolar
                            </button>
                        </div>
                        {error && (
                            <div className="mt-2 flex items-center gap-2 text-red-400 text-sm">
                                <AlertCircle className="w-4 h-4" />
                                <span>{error}</span>
                            </div>
                        )}
                    </div>

                    {/* Animação de Rolagem */}
                    {rollingDice && (
                        <div className="p-4 border-b border-purple-800 bg-purple-900/30">
                            <div className="flex items-center justify-center gap-3">
                                <D20Icon className="w-10 h-10 text-purple-400 animate-spin-slow" />
                                <D6Icon className="w-8 h-8 text-purple-300 animate-bounce" />
                                <D12Icon className="w-10 h-10 text-purple-400 animate-spin-slow-reverse" />
                            </div>
                            <p className="text-center text-purple-300 mt-3 animate-pulse font-semibold">Rolando dados...</p>
                        </div>
                    )}

                    {/* Histórico */}
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-purple-300 font-semibold">HISTÓRICO</p>
                            {history.length > 0 && (
                                <button
                                    onClick={clearHistory}
                                    className="text-purple-400 hover:text-purple-200 transition-colors"
                                    title="Limpar histórico"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                            {history.length === 0 ? (
                                <p className="text-center text-purple-400 text-sm py-4">Nenhuma rolagem ainda</p>
                            ) : (
                                history.map((roll, index) => (
                                    <div
                                        key={index}
                                        className={`p-3 rounded-lg transition-all duration-300 animate-slideIn ${
                                            roll.isCritical
                                                ? 'bg-gradient-to-r from-yellow-600/30 to-yellow-500/30 border-2 border-yellow-400'
                                                : roll.isFumble
                                                ? 'bg-gradient-to-r from-red-600/30 to-red-500/30 border-2 border-red-400'
                                                : 'bg-indigo-900/30 border border-purple-700'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-mono font-bold text-white">
                                                {roll.notation}
                                                {roll.label && (
                                                    <span className="text-purple-300 text-xs ml-2">({roll.label})</span>
                                                )}
                                                {roll.advantage && (
                                                    <span className="text-green-400 text-xs ml-2">[VANTAGEM]</span>
                                                )}
                                                {roll.disadvantage && (
                                                    <span className="text-red-400 text-xs ml-2">[DESVANTAGEM]</span>
                                                )}
                                            </span>
                                            <span className="text-xs text-purple-400">{formatTime(roll.timestamp)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-sm text-purple-300">
                                                Dados: [{roll.rolls.join(', ')}]
                                                {roll.droppedRolls && roll.droppedRolls.length > 0 && (
                                                    <span className="text-gray-500 line-through ml-2">
                                                        [{roll.droppedRolls.join(', ')}]
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-purple-700/50">
                                            <span className="text-sm text-purple-300">
                                                {roll.modifier !== 0 && (
                                                    <span>
                                                        {roll.rolls.reduce((a, b) => a + b, 0)} {roll.modifier > 0 ? '+' : ''}{roll.modifier} =
                                                    </span>
                                                )}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                {roll.isCritical && <Sparkles className="w-5 h-5 text-yellow-400" />}
                                                {roll.isFumble && <Skull className="w-5 h-5 text-red-400" />}
                                                <span className={`text-2xl font-bold ${
                                                    roll.isCritical ? 'text-yellow-400' :
                                                    roll.isFumble ? 'text-red-400' :
                                                    'text-purple-300'
                                                }`}>
                                                    {roll.total}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes spin-slow {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }
                @keyframes spin-slow-reverse {
                    from {
                        transform: rotate(360deg);
                    }
                    to {
                        transform: rotate(0deg);
                    }
                }
                .animate-slideIn {
                    animation: slideIn 0.3s ease-out;
                }
                .animate-spin-slow {
                    animation: spin-slow 2s linear infinite;
                }
                .animate-spin-slow-reverse {
                    animation: spin-slow-reverse 2s linear infinite;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(88, 28, 135, 0.2);
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(147, 51, 234, 0.5);
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(147, 51, 234, 0.7);
                }
            `}</style>
        </div>
    );
};
