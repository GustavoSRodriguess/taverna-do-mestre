import React, { useState } from 'react';
import { Modal, Button, Alert } from '../../ui';
import { homebrewService, HomebrewClass, HomebrewTrait } from '../../services/homebrewService';
import { Plus, X, Save } from 'lucide-react';

interface Props {
    classData: HomebrewClass | null;
    onSave: () => void;
    onClose: () => void;
}

const HomebrewClassEditor: React.FC<Props> = ({ classData, onSave, onClose }) => {
    const [formData, setFormData] = useState<Partial<HomebrewClass>>(
        classData || homebrewService.createEmptyClass()
    );
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [currentLevel, setCurrentLevel] = useState<string>('1');

    const abilities = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
    const skillOptions = [
        'acrobatics', 'animal_handling', 'arcana', 'athletics', 'deception',
        'history', 'insight', 'intimidation', 'investigation', 'medicine',
        'nature', 'perception', 'performance', 'persuasion', 'religion',
        'sleight_of_hand', 'stealth', 'survival'
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const errors = homebrewService.validateClass(formData);
        if (errors.length > 0) {
            setError(errors.join(', '));
            return;
        }

        try {
            setSaving(true);
            if (classData?.id) {
                await homebrewService.updateClass(classData.id, formData);
            } else {
                await homebrewService.createClass(formData as Omit<HomebrewClass, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'owner_username'>);
            }
            onSave();
        } catch (err: any) {
            setError(err.message || 'Erro ao salvar classe');
        } finally {
            setSaving(false);
        }
    };

    const toggleSavingThrow = (ability: string) => {
        const current = formData.saving_throws || [];
        if (current.includes(ability)) {
            setFormData({
                ...formData,
                saving_throws: current.filter(a => a !== ability)
            });
        } else if (current.length < 2) {
            setFormData({
                ...formData,
                saving_throws: [...current, ability]
            });
        }
    };

    const toggleArrayItem = (field: 'armor_proficiency' | 'weapon_proficiency' | 'tool_proficiency', item: string) => {
        const current = formData[field] || [];
        if (current.includes(item)) {
            setFormData({
                ...formData,
                [field]: current.filter(i => i !== item)
            });
        } else {
            setFormData({
                ...formData,
                [field]: [...current, item]
            });
        }
    };

    const updateSkillChoices = (field: 'count' | 'options', value: any) => {
        setFormData({
            ...formData,
            skill_choices: {
                ...(formData.skill_choices || { count: 2, options: [] }),
                [field]: value
            }
        });
    };

    const toggleSkillOption = (skill: string) => {
        const current = formData.skill_choices?.options || [];
        if (current.includes(skill)) {
            updateSkillChoices('options', current.filter(s => s !== skill));
        } else {
            updateSkillChoices('options', [...current, skill]);
        }
    };

    const addFeature = () => {
        const level = currentLevel;
        const features = formData.features || {};
        const levelFeatures = features[level] || [];

        setFormData({
            ...formData,
            features: {
                ...features,
                [level]: [...levelFeatures, { name: '', description: '' }]
            }
        });
    };

    const removeFeature = (level: string, index: number) => {
        const features = { ...formData.features };
        features[level] = features[level].filter((_, i) => i !== index);
        if (features[level].length === 0) {
            delete features[level];
        }
        setFormData({ ...formData, features });
    };

    const updateFeature = (level: string, index: number, field: keyof HomebrewTrait, value: string) => {
        const features = { ...formData.features };
        features[level][index] = { ...features[level][index], [field]: value };
        setFormData({ ...formData, features });
    };

    const toggleSpellcasting = () => {
        if (formData.spellcasting) {
            setFormData({ ...formData, spellcasting: null });
        } else {
            setFormData({
                ...formData,
                spellcasting: {
                    ability: 'intelligence',
                    cantrips_known: {},
                    spells_known: {},
                    spell_slots: {}
                }
            });
        }
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={classData ? 'Editar Classe Homebrew' : 'Nova Classe Homebrew'}
            size="xl"
            footer={
                <div className="flex gap-2">
                    <Button
                        buttonLabel="Cancelar"
                        onClick={onClose}
                        classname="bg-gray-600 hover:bg-gray-700"
                    />
                    <Button
                        buttonLabel={
                            <div className="flex items-center gap-2">
                                <Save className="w-4 h-4" />
                                <span>{saving ? 'Salvando...' : 'Salvar'}</span>
                            </div>
                        }
                        onClick={handleSubmit}
                        disabled={saving}
                        classname="bg-green-600 hover:bg-green-700"
                    />
                </div>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                {error && (
                    <Alert
                        message={error}
                        variant="error"
                        onClose={() => setError(null)}
                    />
                )}

                {/* Basic Info */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-indigo-300 mb-2">
                            Nome da Classe *
                        </label>
                        <input
                            type="text"
                            value={formData.name || ''}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 bg-indigo-900/50 border border-indigo-700 rounded text-white"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-indigo-300 mb-2">
                            Descrição *
                        </label>
                        <textarea
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-3 py-2 bg-indigo-900/50 border border-indigo-700 rounded text-white"
                            rows={3}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-indigo-300 mb-2">
                                Dado de Vida (Hit Die) *
                            </label>
                            <select
                                value={formData.hit_die || 8}
                                onChange={(e) => setFormData({ ...formData, hit_die: parseInt(e.target.value) })}
                                className="w-full px-3 py-2 bg-indigo-900/50 border border-indigo-700 rounded text-white"
                            >
                                <option value="6">d6</option>
                                <option value="8">d8</option>
                                <option value="10">d10</option>
                                <option value="12">d12</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-indigo-300 mb-2">
                                Habilidade Primária *
                            </label>
                            <select
                                value={formData.primary_ability || 'strength'}
                                onChange={(e) => setFormData({ ...formData, primary_ability: e.target.value })}
                                className="w-full px-3 py-2 bg-indigo-900/50 border border-indigo-700 rounded text-white"
                            >
                                {abilities.map(ability => (
                                    <option key={ability} value={ability}>
                                        {ability.charAt(0).toUpperCase() + ability.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Saving Throws */}
                <div>
                    <label className="block text-sm font-medium text-indigo-300 mb-2">
                        Testes de Resistência * (escolha exatamente 2)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        {abilities.map(ability => (
                            <button
                                key={ability}
                                type="button"
                                onClick={() => toggleSavingThrow(ability)}
                                className={`px-3 py-2 rounded text-sm transition-colors ${(formData.saving_throws || []).includes(ability)
                                    ? 'bg-green-600 text-white'
                                    : 'bg-indigo-900/50 border border-indigo-700 text-indigo-300 hover:bg-indigo-800/50'
                                    }`}
                            >
                                {ability.substring(0, 3).toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Proficiencies */}
                <div>
                    <label className="block text-sm font-medium text-indigo-300 mb-2">
                        Proficiências de Armadura
                    </label>
                    <div className="flex gap-2 flex-wrap">
                        {['light', 'medium', 'heavy', 'shields'].map(armor => (
                            <button
                                key={armor}
                                type="button"
                                onClick={() => toggleArrayItem('armor_proficiency', armor)}
                                className={`px-3 py-1 rounded text-sm transition-colors ${(formData.armor_proficiency || []).includes(armor)
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-indigo-900/50 border border-indigo-700 text-indigo-300'
                                    }`}
                            >
                                {armor.charAt(0).toUpperCase() + armor.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-indigo-300 mb-2">
                        Proficiências de Armas
                    </label>
                    <div className="flex gap-2 flex-wrap">
                        {['simple', 'martial', 'crossbows', 'longswords', 'shortswords'].map(weapon => (
                            <button
                                key={weapon}
                                type="button"
                                onClick={() => toggleArrayItem('weapon_proficiency', weapon)}
                                className={`px-3 py-1 rounded text-sm transition-colors ${(formData.weapon_proficiency || []).includes(weapon)
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-indigo-900/50 border border-indigo-700 text-indigo-300'
                                    }`}
                            >
                                {weapon.charAt(0).toUpperCase() + weapon.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Skill Choices */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-indigo-300">
                            Escolha de Perícias
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="6"
                            value={formData.skill_choices?.count || 2}
                            onChange={(e) => updateSkillChoices('count', parseInt(e.target.value))}
                            className="w-16 px-2 py-1 bg-indigo-900/50 border border-indigo-700 rounded text-white text-sm"
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                        {skillOptions.map(skill => (
                            <button
                                key={skill}
                                type="button"
                                onClick={() => toggleSkillOption(skill)}
                                className={`px-2 py-1 rounded text-xs transition-colors ${(formData.skill_choices?.options || []).includes(skill)
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-indigo-900/50 border border-indigo-700 text-indigo-300'
                                    }`}
                            >
                                {skill.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Class Features */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-indigo-300">
                            Habilidades de Classe por Nível
                        </label>
                        <div className="flex items-center gap-2">
                            <select
                                value={currentLevel}
                                onChange={(e) => setCurrentLevel(e.target.value)}
                                className="px-2 py-1 bg-indigo-900/50 border border-indigo-700 rounded text-white text-sm"
                            >
                                {Array.from({ length: 20 }, (_, i) => i + 1).map(level => (
                                    <option key={level} value={level}>Nível {level}</option>
                                ))}
                            </select>
                            <Button
                                buttonLabel={
                                    <div className="flex items-center gap-1">
                                        <Plus className="w-3 h-3" />
                                        <span>Adicionar</span>
                                    </div>
                                }
                                onClick={addFeature}
                                classname="text-sm py-1 px-3"
                            />
                        </div>
                    </div>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                        {Object.entries(formData.features || {})
                            .sort(([a], [b]) => parseInt(a) - parseInt(b))
                            .map(([level, features]) => (
                                <div key={level}>
                                    <h4 className="text-sm font-medium text-indigo-400 mb-2">Nível {level}</h4>
                                    {features.map((feature, index) => (
                                        <div key={index} className="bg-indigo-900/30 p-3 rounded border border-indigo-700 mb-2">
                                            <div className="flex justify-between items-start mb-2">
                                                <input
                                                    type="text"
                                                    value={feature.name}
                                                    onChange={(e) => updateFeature(level, index, 'name', e.target.value)}
                                                    placeholder="Nome da habilidade"
                                                    className="flex-1 px-2 py-1 bg-indigo-900/50 border border-indigo-700 rounded text-white text-sm mr-2"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeFeature(level, index)}
                                                    className="text-red-400 hover:text-red-300"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <textarea
                                                value={feature.description}
                                                onChange={(e) => updateFeature(level, index, 'description', e.target.value)}
                                                placeholder="Descrição da habilidade"
                                                className="w-full px-2 py-1 bg-indigo-900/50 border border-indigo-700 rounded text-white text-sm"
                                                rows={2}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ))}
                    </div>
                </div>

                {/* Spellcasting */}
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <input
                            type="checkbox"
                            id="has_spellcasting"
                            checked={!!formData.spellcasting}
                            onChange={toggleSpellcasting}
                            className="w-4 h-4 text-orange-600 bg-indigo-900 border-indigo-700 rounded"
                        />
                        <label htmlFor="has_spellcasting" className="text-sm text-indigo-300">
                            Esta classe tem conjuração de magias
                        </label>
                    </div>
                    {formData.spellcasting && (
                        <div className="bg-indigo-900/30 p-3 rounded border border-indigo-700">
                            <label className="block text-sm font-medium text-indigo-300 mb-2">
                                Habilidade de Conjuração
                            </label>
                            <select
                                value={formData.spellcasting.ability}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    spellcasting: { ...formData.spellcasting!, ability: e.target.value }
                                })}
                                className="w-full px-3 py-2 bg-indigo-900/50 border border-indigo-700 rounded text-white"
                            >
                                {abilities.map(ability => (
                                    <option key={ability} value={ability}>
                                        {ability.charAt(0).toUpperCase() + ability.slice(1)}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-indigo-400 mt-2">
                                Nota: Configure slots e truques conhecidos conforme necessário
                            </p>
                        </div>
                    )}
                </div>

                {/* Public Toggle */}
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="is_public"
                        checked={formData.is_public || false}
                        onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                        className="w-4 h-4 text-orange-600 bg-indigo-900 border-indigo-700 rounded"
                    />
                    <label htmlFor="is_public" className="text-sm text-indigo-300">
                        Tornar esta classe pública (outros jogadores poderão vê-la)
                    </label>
                </div>
            </form>
        </Modal>
    );
};

export default HomebrewClassEditor;