import React from 'react';
import { CardBorder } from '../../ui';
import { PCData } from './PCEditor';

interface PCBasicInfoProps {
    pcData: PCData;
    updatePCData: (updates: Partial<PCData>) => void;
    races: any[];
    classes: any[];
    backgrounds: any[];
}

const alignments = [
    'Lawful Good', 'Neutral Good', 'Chaotic Good',
    'Lawful Neutral', 'True Neutral', 'Chaotic Neutral',
    'Lawful Evil', 'Neutral Evil', 'Chaotic Evil'
];

const PCBasicInfo: React.FC<PCBasicInfoProps> = ({
    pcData,
    updatePCData,
    races,
    classes,
    backgrounds
}) => {
    return (
        <div className="grid md:grid-cols-2 gap-6">
            {/* Informações Básicas */}
            <CardBorder className="bg-indigo-950/80">
                <h3 className="text-xl font-bold mb-4 text-purple-400">Informações Básicas</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-indigo-200 mb-2 font-medium">
                            Nome do Personagem *
                        </label>
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
                        <label className="block text-indigo-200 mb-2 font-medium">
                            Nome do Jogador
                        </label>
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
                            <label className="block text-indigo-200 mb-2 font-medium">
                                Raça *
                            </label>
                            <select
                                value={pcData.race}
                                onChange={(e) => updatePCData({ race: e.target.value })}
                                className="w-full px-3 py-2 border border-indigo-700 rounded-md 
                                 bg-indigo-900/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="">Selecione uma raça</option>
                                {races.map((race) => (
                                    <option key={race.index} value={race.name}>
                                        {race.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-indigo-200 mb-2 font-medium">
                                Classe *
                            </label>
                            <select
                                value={pcData.class}
                                onChange={(e) => updatePCData({ class: e.target.value })}
                                className="w-full px-3 py-2 border border-indigo-700 rounded-md 
                                 bg-indigo-900/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="">Selecione uma classe</option>
                                {classes.map((cls) => (
                                    <option key={cls.index} value={cls.name}>
                                        {cls.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-indigo-200 mb-2 font-medium">
                                Nível
                            </label>
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
                            <label className="block text-indigo-200 mb-2 font-medium">
                                Bônus de Proficiência
                            </label>
                            <input
                                type="number"
                                value={pcData.proficiency_bonus}
                                onChange={(e) => updatePCData({ proficiency_bonus: parseInt(e.target.value) || 2 })}
                                className="w-full px-3 py-2 border border-indigo-700 rounded-md 
                                 bg-indigo-900/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                min={1}
                                max={6}
                            />
                            <div className="text-xs text-indigo-400 mt-1">
                                Calculado automaticamente pelo nível
                            </div>
                        </div>
                    </div>
                </div>
            </CardBorder>

            {/* Detalhes Adicionais */}
            <CardBorder className="bg-indigo-950/80">
                <h3 className="text-xl font-bold mb-4 text-purple-400">Detalhes</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-indigo-200 mb-2 font-medium">
                            Antecedente
                        </label>
                        <select
                            value={pcData.background}
                            onChange={(e) => updatePCData({ background: e.target.value })}
                            className="w-full px-3 py-2 border border-indigo-700 rounded-md 
                             bg-indigo-900/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="">Selecione um antecedente</option>
                            {backgrounds.map((bg) => (
                                <option key={bg.index} value={bg.name}>
                                    {bg.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-indigo-200 mb-2 font-medium">
                            Alinhamento
                        </label>
                        <select
                            value={pcData.alignment}
                            onChange={(e) => updatePCData({ alignment: e.target.value })}
                            className="w-full px-3 py-2 border border-indigo-700 rounded-md 
                             bg-indigo-900/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="">Selecione um alinhamento</option>
                            {alignments.map((alignment) => (
                                <option key={alignment} value={alignment}>
                                    {alignment}
                                </option>
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
                        <label htmlFor="inspiration" className="text-white font-medium">
                            Inspiração
                        </label>
                    </div>
                </div>

                {/* Preview */}
                <div className="mt-6 p-4 bg-indigo-900/30 rounded border border-indigo-800">
                    <h4 className="font-medium text-indigo-200 mb-2">Preview</h4>
                    <div className="text-sm text-indigo-300">
                        <p className="font-bold text-white">
                            {pcData.name || 'Nome do Personagem'}
                        </p>
                        <p>
                            {pcData.race && pcData.class
                                ? `${pcData.race} ${pcData.class}`
                                : 'Raça e Classe não definidas'
                            }
                        </p>
                        <p>
                            Nível {pcData.level} • {pcData.background || 'Antecedente não definido'}
                        </p>
                        {pcData.alignment && (
                            <p>Alinhamento: {pcData.alignment}</p>
                        )}
                    </div>
                </div>
            </CardBorder>
        </div>
    );
};

export default PCBasicInfo;