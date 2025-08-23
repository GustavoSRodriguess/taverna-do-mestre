import React from 'react';
import { CardBorder } from '../../ui';
// import { PCData } from './PCEditor';
import { FullCharacter } from '../../types';

interface PCDescriptionProps {
    pcData: FullCharacter;
    updatePCData: (updates: Partial<FullCharacter>) => void;
}

const PCDescription: React.FC<PCDescriptionProps> = ({ pcData, updatePCData }) => {
    return (
        <div className="space-y-6">
            {/* Descrição Geral */}
            <CardBorder className="bg-indigo-950/80">
                <h3 className="text-xl font-bold text-purple-400 mb-4">📝 Descrição do Personagem</h3>

                <div>
                    <label className="block text-indigo-200 mb-2 font-medium">
                        Aparência e História
                    </label>
                    <textarea
                        value={pcData.description}
                        onChange={(e) => updatePCData({ description: e.target.value })}
                        className="w-full px-3 py-2 border border-indigo-700 rounded-md 
                         bg-indigo-900/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                        rows={6}
                        placeholder="Descreva a aparência física, história pessoal, motivações e objetivos do seu personagem..."
                        maxLength={2000}
                    />
                    <div className="text-xs text-indigo-400 mt-1">
                        {pcData.description.length}/2000 caracteres
                    </div>
                </div>
            </CardBorder>

            {/* Traços de Personalidade */}
            <div className="grid md:grid-cols-2 gap-6">
                <CardBorder className="bg-indigo-950/80">
                    <h3 className="text-lg font-bold text-purple-400 mb-4">😄 Traços de Personalidade</h3>

                    <textarea
                        value={pcData.personality_traits}
                        onChange={(e) => updatePCData({ personality_traits: e.target.value })}
                        className="w-full px-3 py-2 border border-indigo-700 rounded-md 
                         bg-indigo-900/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                        rows={4}
                        placeholder="Como seu personagem se comporta? Quais são seus maneirismos e peculiaridades?"
                        maxLength={500}
                    />
                    <div className="text-xs text-indigo-400 mt-1">
                        {pcData.personality_traits.length}/500 caracteres
                    </div>
                </CardBorder>

                <CardBorder className="bg-indigo-950/80">
                    <h3 className="text-lg font-bold text-purple-400 mb-4">💡 Ideais</h3>

                    <textarea
                        value={pcData.ideals}
                        onChange={(e) => updatePCData({ ideals: e.target.value })}
                        className="w-full px-3 py-2 border border-indigo-700 rounded-md 
                         bg-indigo-900/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                        rows={4}
                        placeholder="Quais princípios guiam seu personagem? No que ele acredita?"
                        maxLength={500}
                    />
                    <div className="text-xs text-indigo-400 mt-1">
                        {pcData.ideals.length}/500 caracteres
                    </div>
                </CardBorder>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <CardBorder className="bg-indigo-950/80">
                    <h3 className="text-lg font-bold text-purple-400 mb-4">💝 Laços</h3>

                    <textarea
                        value={pcData.bonds}
                        onChange={(e) => updatePCData({ bonds: e.target.value })}
                        className="w-full px-3 py-2 border border-indigo-700 rounded-md 
                         bg-indigo-900/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                        rows={4}
                        placeholder="Quais pessoas, lugares ou memórias são importantes? O que conecta seu personagem ao mundo?"
                        maxLength={500}
                    />
                    <div className="text-xs text-indigo-400 mt-1">
                        {pcData.bonds.length}/500 caracteres
                    </div>
                </CardBorder>

                <CardBorder className="bg-indigo-950/80">
                    <h3 className="text-lg font-bold text-purple-400 mb-4">😟 Defeitos</h3>

                    <textarea
                        value={pcData.flaws}
                        onChange={(e) => updatePCData({ flaws: e.target.value })}
                        className="w-full px-3 py-2 border border-indigo-700 rounded-md 
                         bg-indigo-900/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                        rows={4}
                        placeholder="Quais são as fraquezas e vícios do seu personagem? O que pode causar problemas?"
                        maxLength={500}
                    />
                    <div className="text-xs text-indigo-400 mt-1">
                        {pcData.flaws.length}/500 caracteres
                    </div>
                </CardBorder>
            </div>

            {/* Características e Traços */}
            <CardBorder className="bg-indigo-950/80">
                <h3 className="text-lg font-bold text-purple-400 mb-4">⭐ Características Especiais</h3>

                <div>
                    <label className="block text-indigo-200 mb-2 font-medium">
                        Traços de Raça, Classe e Antecedente
                    </label>
                    <textarea
                        value={pcData.features.join('\n')}
                        onChange={(e) => updatePCData({ features: e.target.value.split('\n').filter(f => f.trim()) })}
                        className="w-full px-3 py-2 border border-indigo-700 rounded-md 
                         bg-indigo-900/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                        rows={6}
                        placeholder="Liste as características especiais do personagem (uma por linha):&#10;- Visão no Escuro&#10;- Fúria Bárbara&#10;- Inspiração Bárdica&#10;- etc..."
                        maxLength={1000}
                    />
                    <div className="text-xs text-indigo-400 mt-1">
                        Uma característica por linha • {pcData.features.length} características cadastradas
                    </div>
                </div>
            </CardBorder>

            {/* Preview */}
            <CardBorder className="bg-purple-950/30 border-purple-700">
                <h3 className="text-lg font-bold text-purple-400 mb-4">👁️ Preview do Personagem</h3>

                <div className="space-y-4 text-sm">
                    <div>
                        <h4 className="font-bold text-white mb-2">Resumo:</h4>
                        <p className="text-indigo-300">
                            {pcData.name || 'Nome'} é um(a) {pcData.race} {pcData.class} de nível {pcData.level},
                            com antecedente de {pcData.background}. {pcData.description.substring(0, 150)}
                            {pcData.description.length > 150 ? '...' : ''}
                        </p>
                    </div>

                    {pcData.personality_traits && (
                        <div>
                            <h4 className="font-bold text-white mb-1">Personalidade:</h4>
                            <p className="text-indigo-300">{pcData.personality_traits}</p>
                        </div>
                    )}

                    {pcData.features.length > 0 && (
                        <div>
                            <h4 className="font-bold text-white mb-1">Características:</h4>
                            <ul className="text-indigo-300 list-disc list-inside">
                                {pcData.features.slice(0, 5).map((feature, index) => (
                                    <li key={index}>{feature}</li>
                                ))}
                                {pcData.features.length > 5 && (
                                    <li className="text-indigo-400">... e mais {pcData.features.length - 5} características</li>
                                )}
                            </ul>
                        </div>
                    )}
                </div>
            </CardBorder>
        </div>
    );
};

export default PCDescription;