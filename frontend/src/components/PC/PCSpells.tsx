import React, { useState } from 'react';
import { CardBorder, Button, Modal } from '../../ui';
import { dndService, getAbilityModifier } from '../../services/dndService';
import { formatModifier } from '../../utils';
import { FullCharacter } from '../../types';

interface PCSpellsProps {
    pcData: FullCharacter;
    updatePCData: (updates: Partial<FullCharacter>) => void;
}

const PCSpells: React.FC<PCSpellsProps> = ({ pcData, updatePCData }) => {
    const [showAddSpellModal, setShowAddSpellModal] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLevel, setSelectedLevel] = useState<number | undefined>();

    const spellcastingModifier = pcData.spells.spellcasting_ability ?
        getAbilityModifier(pcData.attributes[pcData.spells.spellcasting_ability as keyof FullCharacter['attributes']]) : 0;

    const spellAttackBonus = spellcastingModifier + pcData.proficiency_bonus;
    const spellSaveDC = 8 + spellcastingModifier + pcData.proficiency_bonus;

    const searchSpells = async () => {
        try {
            const results = await dndService.getSpells({
                search: searchTerm,
                level: selectedLevel,
                limit: 20
            });
            setSearchResults(results.results);
        } catch (err) {
            console.error('Erro ao buscar magias:', err);
        }
    };

    const addSpell = (spell: any) => {
        const newSpell = {
            name: spell.name,
            level: spell.level,
            school: spell.school?.name || 'Unknown',
            prepared: false
        };

        const updatedSpells = {
            ...pcData.spells,
            known_spells: [...pcData.spells.known_spells, newSpell]
        };

        updatePCData({ spells: updatedSpells });
        setShowAddSpellModal(false);
        setSearchTerm('');
        setSearchResults([]);
    };

    const removeSpell = (index: number) => {
        const updatedSpells = {
            ...pcData.spells,
            known_spells: pcData.spells.known_spells.filter((_, i) => i !== index)
        };
        updatePCData({ spells: updatedSpells });
    };

    const togglePrepared = (index: number) => {
        const updatedSpells = { ...pcData.spells };
        updatedSpells.known_spells[index].prepared = !updatedSpells.known_spells[index].prepared;
        updatePCData({ spells: updatedSpells });
    };

    const updateSpellSlots = (level: string, field: 'total' | 'used', value: number) => {
        const updatedSpells = {
            ...pcData.spells,
            spell_slots: {
                ...pcData.spells.spell_slots,
                [level]: {
                    ...pcData.spells.spell_slots[level],
                    [field]: value
                }
            }
        };
        updatePCData({ spells: updatedSpells });
    };

    const spellsByLevel = pcData.spells.known_spells.reduce((acc, spell) => {
        if (!acc[spell.level]) acc[spell.level] = [];
        acc[spell.level].push(spell);
        return acc;
    }, {} as { [level: number]: typeof pcData.spells.known_spells });

    return (
        <div className="space-y-6">
            {/* Estatísticas de Conjuração */}
            <div className="grid md:grid-cols-3 gap-6">
                <CardBorder className="bg-indigo-950/80">
                    <h3 className="text-lg font-bold text-purple-400 mb-4">📊 Estatísticas</h3>

                    <div className="space-y-3">
                        <div>
                            <label className="block text-indigo-200 mb-2">Atributo de Conjuração</label>
                            <select
                                value={pcData.spells.spellcasting_ability || ''}
                                onChange={(e) => updatePCData({
                                    spells: { ...pcData.spells, spellcasting_ability: e.target.value as keyof typeof pcData.attributes || undefined }
                                })}
                                className="w-full px-3 py-2 bg-indigo-900/50 text-white border border-indigo-700 rounded"
                            >
                                <option value="">Selecione</option>
                                <option value="intelligence">Inteligência</option>
                                <option value="wisdom">Sabedoria</option>
                                <option value="charisma">Carisma</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div>
                                <div className="text-2xl font-bold text-white">
                                    {formatModifier(spellAttackBonus)}
                                </div>
                                <div className="text-sm text-indigo-300">Bônus de Ataque</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">{spellSaveDC}</div>
                                <div className="text-sm text-indigo-300">CD de Resistência</div>
                            </div>
                        </div>
                    </div>
                </CardBorder>

                <CardBorder className="bg-indigo-950/80">
                    <h3 className="text-lg font-bold text-purple-400 mb-4">🎯 Slots de Magia</h3>

                    <div className="space-y-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(level => {
                            const slots = pcData.spells.spell_slots[level] || { total: 0, used: 0 };
                            return (
                                <div key={level} className="flex items-center gap-2 text-sm">
                                    <span className="w-8 text-indigo-300 font-bold">{level}°:</span>
                                    <input
                                        type="number"
                                        value={slots.used}
                                        onChange={(e) => updateSpellSlots(level.toString(), 'used', parseInt(e.target.value) || 0)}
                                        className="w-12 px-1 py-1 bg-indigo-800 text-white text-center rounded border border-indigo-600"
                                        min={0}
                                        max={slots.total}
                                    />
                                    <span className="text-indigo-400">/</span>
                                    <input
                                        type="number"
                                        value={slots.total}
                                        onChange={(e) => updateSpellSlots(level.toString(), 'total', parseInt(e.target.value) || 0)}
                                        className="w-12 px-1 py-1 bg-indigo-800 text-white text-center rounded border border-indigo-600"
                                        min={0}
                                        max={20}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </CardBorder>

                <CardBorder className="bg-indigo-950/80">
                    <h3 className="text-lg font-bold text-purple-400 mb-4">📚 Resumo</h3>

                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-indigo-300">Total de Magias:</span>
                            <span className="text-white font-bold">{pcData.spells.known_spells.length}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-indigo-300">Preparadas:</span>
                            <span className="text-white font-bold">
                                {pcData.spells.known_spells.filter(s => s.prepared).length}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-indigo-300">Cantrips:</span>
                            <span className="text-white font-bold">
                                {spellsByLevel[0]?.length || 0}
                            </span>
                        </div>
                    </div>
                </CardBorder>
            </div>

            {/* Magias por Nível */}
            <CardBorder className="bg-indigo-950/80">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-purple-400">✨ Magias Conhecidas</h3>
                    <Button
                        buttonLabel="+ Adicionar Magia"
                        onClick={() => setShowAddSpellModal(true)}
                        classname="bg-green-600 hover:bg-green-700"
                    />
                </div>

                {pcData.spells.known_spells.length === 0 ? (
                    <div className="text-center py-8 text-indigo-300">
                        <div className="text-4xl mb-4">✨</div>
                        <p>Nenhuma magia conhecida</p>
                        <p className="text-sm mt-2">Clique em "Adicionar Magia" para começar</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(level => {
                            const spells = spellsByLevel[level] || [];
                            if (spells.length === 0) return null;

                            return (
                                <div key={level} className="bg-indigo-900/30 p-4 rounded border border-indigo-700">
                                    <h4 className="font-bold text-white mb-3">
                                        {level === 0 ? 'Cantrips' : `${level}° Nível`} ({spells.length})
                                    </h4>

                                    <div className="grid md:grid-cols-2 gap-2">
                                        {spells.map((spell, index) => {
                                            const globalIndex = pcData.spells.known_spells.findIndex(s => s === spell);
                                            return (
                                                <div key={globalIndex} className="flex items-center justify-between p-2 
                                                     bg-indigo-800/30 rounded border border-indigo-600">
                                                    <div className="flex items-center gap-2">
                                                        {level > 0 && (
                                                            <input
                                                                type="checkbox"
                                                                checked={spell.prepared}
                                                                onChange={() => togglePrepared(globalIndex)}
                                                                className="w-4 h-4 text-purple-600 bg-indigo-800 border-indigo-600 rounded"
                                                                title="Preparada"
                                                            />
                                                        )}
                                                        <div>
                                                            <div className="text-white font-medium">{spell.name}</div>
                                                            <div className="text-xs text-indigo-300">{spell.school}</div>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        buttonLabel="🗑️"
                                                        onClick={() => removeSpell(globalIndex)}
                                                        classname="bg-red-600 hover:bg-red-700 text-xs px-2 py-1"
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardBorder>

            {/* Modal para adicionar magias */}
            <Modal
                isOpen={showAddSpellModal}
                onClose={() => setShowAddSpellModal(false)}
                title="Adicionar Magia"
                size="lg"
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-indigo-200 mb-2">Buscar Magia</label>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-3 py-2 bg-indigo-900/50 text-white border border-indigo-700 rounded"
                                placeholder="Nome da magia..."
                            />
                        </div>
                        <div>
                            <label className="block text-indigo-200 mb-2">Nível</label>
                            <select
                                value={selectedLevel || ''}
                                onChange={(e) => setSelectedLevel(e.target.value ? parseInt(e.target.value) : undefined)}
                                className="w-full px-3 py-2 bg-indigo-900/50 text-white border border-indigo-700 rounded"
                            >
                                <option value="">Todos os níveis</option>
                                <option value="0">Cantrip</option>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(level => (
                                    <option key={level} value={level}>{level}° Nível</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <Button
                        buttonLabel="🔍 Buscar"
                        onClick={searchSpells}
                        classname="w-full"
                    />

                    {searchResults.length > 0 && (
                        <div className="max-h-64 overflow-y-auto space-y-2">
                            {searchResults.map(spell => (
                                <div key={spell.index} className="flex justify-between items-center p-3 
                                     bg-indigo-900/30 rounded border border-indigo-700">
                                    <div>
                                        <div className="text-white font-medium">{spell.name}</div>
                                        <div className="text-sm text-indigo-300">
                                            {spell.level === 0 ? 'Cantrip' : `${spell.level}° Nível`} • {spell.school?.name}
                                        </div>
                                    </div>
                                    <Button
                                        buttonLabel="+ Adicionar"
                                        onClick={() => addSpell(spell)}
                                        classname="bg-green-600 hover:bg-green-700 text-sm"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default PCSpells;