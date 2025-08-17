// frontend/src/components/PC/PCBasicInfo.tsx - Versão Refatorada
import React from 'react';
import { CardBorder } from '../../ui';
import { FullCharacter } from '../../types/game';
import { ALIGNMENTS } from '../../utils/gameUtils';

interface PCBasicInfoProps {
    pcData: FullCharacter;
    updatePCData: (updates: Partial<FullCharacter>) => void;
    races: any[];
    classes: any[];
    backgrounds: any[];
}

const PCBasicInfo: React.FC<PCBasicInfoProps> = ({
    pcData,
    updatePCData,
    races,
    classes,
    backgrounds
}) => {
    const handleRaceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedRace = races.find(r => r.name === e.target.value);
        if (selectedRace) {
            // Apply racial modifiers logic would go here
            updatePCData({ race: selectedRace.name });
        }
    };

    const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedClass = classes.find(c => c.name === e.target.value);
        if (selectedClass) {
            // Apply class-based HP calculation would go here
            const hitDie = selectedClass.hit_die || 8;
            const conMod = Math.floor((pcData.attributes.constitution - 10) / 2);
            const newHP = hitDie + conMod + (pcData.level - 1) * (Math.floor(hitDie / 2) + 1 + conMod);

            updatePCData({
                class: selectedClass.name,
                hp: Math.max(newHP, 1)
            });
        }
    };

    return (
        <div className="grid md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <CardBorder className="bg-indigo-950/80">
                <h3 className="text-xl font-bold mb-4 text-purple-400">Informações Básicas</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-indigo-200 mb-2 font-medium">Nome do Personagem *</label>
                        <input
                            type="text"
                            value={pcData.name}
                            onChange={(e) => updatePCData({ name: e.target.value })}
                            className="w-full px-3 py-2 border border-indigo-700 rounded-md 
                             bg-indigo-900/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Ex: Gandalf, Legolas..."
                            maxLength={100}
                        />
                    </div>

                    <div>
                        <label className="block text-indigo-200 mb-2 font-medium">Nome do Jogador</label>
                        <input
                            type="text"
                            value={pcData.player_name || ''}
                            onChange={(e) => updatePCData({ player_name: e.target.value })}
                            className="w-full px-3 py-2 border border-indigo-700 rounded-md 
                             bg-indigo-900/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Seu nome"
                            maxLength={100}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-indigo-200 mb-2 font-medium">Raça *</label>
                            <select
                                value={pcData.race}
                                onChange={handleRaceChange}
                                className="w-full px-3 py-2 border border-indigo-700 rounded-md 
                                 bg-indigo-900/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="">Selecione uma raça</option>
                                {races.map((race) => (
                                    <option key={race.api_index} value={race.name}>{race.name}</option>
                                ))}
                            </select>
                            {races.length === 0 && (
                                <div className="text-xs text-yellow-400 mt-1">Carregando raças...</div>
                            )}
                        </div>

                        <div>
                            <label className="block text-indigo-200 mb-2 font-medium">Classe *</label>
                            <select
                                value={pcData.class}
                                onChange={handleClassChange}
                                className="w-full px-3 py-2 border border-indigo-700 rounded-md 
                                 bg-indigo-900/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="">Selecione uma classe</option>
                                {classes.map((cls) => (
                                    <option key={cls.api_index} value={cls.name}>{cls.name}</option>
                                ))}
                            </select>
                            {classes.length === 0 && (
                                <div className="text-xs text-yellow-400 mt-1">Carregando classes...</div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-indigo-200 mb-2 font-medium">Nível</label>
                            <input
                                type="number"
                                value={pcData.level}
                                onChange={(e) => updatePCData({ level: parseInt(e.target.value) || 1 })}
                                className="w-full px-3 py-2 border border-indigo-700 rounded-md 
                                 bg-indigo-900/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                min={1}
                                max={20}
                            />
                        </div>

                        <div>
                            <label className="block text-indigo-200 mb-2 font-medium">Bônus de Proficiência</label>
                            <input
                                type="number"
                                value={pcData.proficiency_bonus}
                                onChange={(e) => updatePCData({ proficiency_bonus: parseInt(e.target.value) || 2 })}
                                className="w-full px-3 py-2 border border-indigo-700 rounded-md 
                                 bg-indigo-900/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                min={1}
                                max={6}
                            />
                            <div className="text-xs text-indigo-400 mt-1">Calculado automaticamente pelo nível</div>
                        </div>
                    </div>
                </div>
            </CardBorder>

            {/* Additional Details */}
            <CardBorder className="bg-indigo-950/80">
                <h3 className="text-xl font-bold mb-4 text-purple-400">Detalhes</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-indigo-200 mb-2 font-medium">Antecedente</label>
                        <select
                            value={pcData.background}
                            onChange={(e) => updatePCData({ background: e.target.value })}
                            className="w-full px-3 py-2 border border-indigo-700 rounded-md 
                             bg-indigo-900/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="">Selecione um antecedente</option>
                            {backgrounds.map((bg) => (
                                <option key={bg.api_index} value={bg.name}>{bg.name}</option>
                            ))}
                        </select>
                        {backgrounds.length === 0 && (
                            <div className="text-xs text-yellow-400 mt-1">Carregando antecedentes...</div>
                        )}
                    </div>

                    <div>
                        <label className="block text-indigo-200 mb-2 font-medium">Alinhamento</label>
                        <select
                            value={pcData.alignment}
                            onChange={(e) => updatePCData({ alignment: e.target.value })}
                            className="w-full px-3 py-2 border border-indigo-700 rounded-md 
                             bg-indigo-900/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="">Selecione um alinhamento</option>
                            {ALIGNMENTS.map((alignment) => (
                                <option key={alignment} value={alignment}>{alignment}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="inspiration"
                            checked={pcData.inspiration}
                            onChange={(e) => updatePCData({ inspiration: e.target.checked })}
                            className="mr-3 w-4 h-4 text-purple-600 focus:ring-purple-500 
                             border-indigo-600 rounded bg-indigo-900/50"
                        />
                        <label htmlFor="inspiration" className="text-white font-medium">Inspiração</label>
                    </div>
                </div>

                {/* Preview */}
                <div className="mt-6 p-4 bg-indigo-900/30 rounded border border-indigo-800">
                    <h4 className="font-medium text-indigo-200 mb-2">Preview</h4>
                    <div className="text-sm text-indigo-300">
                        <p className="font-bold text-white">{pcData.name || 'Nome do Personagem'}</p>
                        <p>
                            {pcData.race && pcData.class
                                ? `${pcData.race} ${pcData.class}`
                                : 'Raça e Classe não definidas'
                            }
                        </p>
                        <p>Nível {pcData.level} • Proficiência +{pcData.proficiency_bonus}</p>
                        <p>{pcData.background || 'Antecedente não definido'}</p>
                        {pcData.alignment && <p>Alinhamento: {pcData.alignment}</p>}
                        {pcData.inspiration && <p className="text-yellow-400">✨ Inspirado</p>}
                    </div>
                </div>

                {/* D&D API Info */}
                {(pcData.race || pcData.class || pcData.background) && (
                    <div className="mt-4 p-3 bg-purple-900/20 rounded border border-purple-800">
                        <h5 className="text-sm font-bold text-purple-300 mb-2">📚 Dados do D&D 5e API</h5>
                        <div className="text-xs text-purple-200 space-y-1">
                            {pcData.race && <p>🧝 Modificadores raciais aplicados automaticamente</p>}
                            {pcData.class && <p>⚔️ Dado de vida e HP calculados pela classe</p>}
                            {pcData.background && <p>📜 Proficiências do antecedente disponíveis</p>}
                        </div>
                    </div>
                )}
            </CardBorder>
        </div>
    );
};

export default PCBasicInfo;