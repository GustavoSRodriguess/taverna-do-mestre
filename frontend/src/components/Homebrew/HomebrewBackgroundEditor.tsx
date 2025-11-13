import React, { useState } from 'react';
import { Modal, Button, Alert } from '../../ui';
import { homebrewService, HomebrewBackground, HomebrewEquipment } from '../../services/homebrewService';
import { Plus, X, Save } from 'lucide-react';

interface Props {
    background: HomebrewBackground | null;
    onSave: () => void;
    onClose: () => void;
}

const HomebrewBackgroundEditor: React.FC<Props> = ({ background, onSave, onClose }) => {
    const [formData, setFormData] = useState<Partial<HomebrewBackground>>(
        background || homebrewService.createEmptyBackground()
    );
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const skillOptions = [
        'acrobatics', 'animal_handling', 'arcana', 'athletics', 'deception',
        'history', 'insight', 'intimidation', 'investigation', 'medicine',
        'nature', 'perception', 'performance', 'persuasion', 'religion',
        'sleight_of_hand', 'stealth', 'survival'
    ];

    const toolOptions = [
        "alchemist's supplies", "brewer's supplies", "calligrapher's supplies",
        "carpenter's tools", "cartographer's tools", "cobbler's tools",
        "cook's utensils", "glassblower's tools", "jeweler's tools",
        "leatherworker's tools", "mason's tools", "painter's supplies",
        "potter's tools", "smith's tools", "tinker's tools", "weaver's tools",
        "woodcarver's tools", "disguise kit", "forgery kit", "herbalism kit",
        "navigator's tools", "poisoner's kit", "thieves' tools",
        "gaming set", "musical instrument", "vehicles (land)", "vehicles (water)"
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const errors = homebrewService.validateBackground(formData);
        if (errors.length > 0) {
            setError(errors.join(', '));
            return;
        }

        try {
            setSaving(true);
            if (background?.id) {
                await homebrewService.updateBackground(background.id, formData);
            } else {
                await homebrewService.createBackground(formData as Omit<HomebrewBackground, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'owner_username'>);
            }
            onSave();
        } catch (err: any) {
            setError(err.message || 'Erro ao salvar antecedente');
        } finally {
            setSaving(false);
        }
    };

    const toggleSkillProficiency = (skill: string) => {
        const current = formData.skill_proficiencies || [];
        if (current.includes(skill)) {
            setFormData({
                ...formData,
                skill_proficiencies: current.filter(s => s !== skill)
            });
        } else {
            setFormData({
                ...formData,
                skill_proficiencies: [...current, skill]
            });
        }
    };

    const toggleToolProficiency = (tool: string) => {
        const current = formData.tool_proficiencies || [];
        if (current.includes(tool)) {
            setFormData({
                ...formData,
                tool_proficiencies: current.filter(t => t !== tool)
            });
        } else {
            setFormData({
                ...formData,
                tool_proficiencies: [...current, tool]
            });
        }
    };

    const addEquipment = () => {
        setFormData({
            ...formData,
            equipment: [...(formData.equipment || []), { name: '', quantity: 1 }]
        });
    };

    const removeEquipment = (index: number) => {
        setFormData({
            ...formData,
            equipment: (formData.equipment || []).filter((_, i) => i !== index)
        });
    };

    const updateEquipment = (index: number, field: keyof HomebrewEquipment, value: string | number) => {
        const newEquipment = [...(formData.equipment || [])];
        newEquipment[index] = { ...newEquipment[index], [field]: value };
        setFormData({ ...formData, equipment: newEquipment });
    };

    const addSuggestedTrait = (category: 'personality' | 'ideals' | 'bonds' | 'flaws', value: string) => {
        if (!value.trim()) return;
        const current = formData.suggested_traits || { personality: [], ideals: [], bonds: [], flaws: [] };
        setFormData({
            ...formData,
            suggested_traits: {
                ...current,
                [category]: [...(current[category] || []), value]
            }
        });
    };

    const removeSuggestedTrait = (category: 'personality' | 'ideals' | 'bonds' | 'flaws', index: number) => {
        const current = formData.suggested_traits || { personality: [], ideals: [], bonds: [], flaws: [] };
        setFormData({
            ...formData,
            suggested_traits: {
                ...current,
                [category]: current[category].filter((_, i) => i !== index)
            }
        });
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={background ? 'Editar Antecedente Homebrew' : 'Novo Antecedente Homebrew'}
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
                            Nome do Antecedente *
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
                </div>

                {/* Skill Proficiencies */}
                <div>
                    <label className="block text-sm font-medium text-indigo-300 mb-2">
                        Proficiências em Perícias (geralmente 2)
                    </label>
                    <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                        {skillOptions.map(skill => (
                            <button
                                key={skill}
                                type="button"
                                onClick={() => toggleSkillProficiency(skill)}
                                className={`px-2 py-1 rounded text-xs transition-colors ${(formData.skill_proficiencies || []).includes(skill)
                                    ? 'bg-green-600 text-white'
                                    : 'bg-indigo-900/50 border border-indigo-700 text-indigo-300'
                                    }`}
                            >
                                {skill.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tool Proficiencies */}
                <div>
                    <label className="block text-sm font-medium text-indigo-300 mb-2">
                        Proficiências em Ferramentas
                    </label>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                        {toolOptions.map(tool => (
                            <button
                                key={tool}
                                type="button"
                                onClick={() => toggleToolProficiency(tool)}
                                className={`px-2 py-1 rounded text-xs transition-colors text-left ${(formData.tool_proficiencies || []).includes(tool)
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-indigo-900/50 border border-indigo-700 text-indigo-300'
                                    }`}
                            >
                                {tool.charAt(0).toUpperCase() + tool.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Languages */}
                <div>
                    <label className="block text-sm font-medium text-indigo-300 mb-2">
                        Número de Idiomas Adicionais
                    </label>
                    <input
                        type="number"
                        min="0"
                        max="5"
                        value={formData.languages || 0}
                        onChange={(e) => setFormData({ ...formData, languages: parseInt(e.target.value) })}
                        className="w-32 px-3 py-2 bg-indigo-900/50 border border-indigo-700 rounded text-white"
                    />
                </div>

                {/* Equipment */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-indigo-300">
                            Equipamento Inicial
                        </label>
                        <Button
                            buttonLabel={
                                <div className="flex items-center gap-1">
                                    <Plus className="w-3 h-3" />
                                    <span>Adicionar Item</span>
                                </div>
                            }
                            onClick={addEquipment}
                            classname="text-sm py-1 px-3"
                        />
                    </div>
                    <div className="space-y-2">
                        {(formData.equipment || []).map((item, index) => (
                            <div key={index} className="flex gap-2 items-center bg-indigo-900/30 p-2 rounded">
                                <input
                                    type="text"
                                    value={item.name}
                                    onChange={(e) => updateEquipment(index, 'name', e.target.value)}
                                    placeholder="Nome do item"
                                    className="flex-1 px-2 py-1 bg-indigo-900/50 border border-indigo-700 rounded text-white text-sm"
                                />
                                <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => updateEquipment(index, 'quantity', parseInt(e.target.value))}
                                    className="w-16 px-2 py-1 bg-indigo-900/50 border border-indigo-700 rounded text-white text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeEquipment(index)}
                                    className="text-red-400 hover:text-red-300"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Feature */}
                <div>
                    <label className="block text-sm font-medium text-indigo-300 mb-2">
                        Habilidade Especial do Antecedente
                    </label>
                    <div className="bg-indigo-900/30 p-3 rounded border border-indigo-700 space-y-2">
                        <input
                            type="text"
                            value={formData.feature?.name || ''}
                            onChange={(e) => setFormData({
                                ...formData,
                                feature: { ...(formData.feature || { name: '', description: '' }), name: e.target.value }
                            })}
                            placeholder="Nome da habilidade"
                            className="w-full px-2 py-1 bg-indigo-900/50 border border-indigo-700 rounded text-white text-sm"
                        />
                        <textarea
                            value={formData.feature?.description || ''}
                            onChange={(e) => setFormData({
                                ...formData,
                                feature: { ...(formData.feature || { name: '', description: '' }), description: e.target.value }
                            })}
                            placeholder="Descrição da habilidade especial"
                            className="w-full px-2 py-1 bg-indigo-900/50 border border-indigo-700 rounded text-white text-sm"
                            rows={3}
                        />
                    </div>
                </div>

                {/* Suggested Traits */}
                <div>
                    <label className="block text-sm font-medium text-indigo-300 mb-3">
                        Características Sugeridas para Roleplay
                    </label>

                    {/* Personality Traits */}
                    <div className="mb-3">
                        <h4 className="text-sm text-indigo-400 mb-1">Traços de Personalidade</h4>
                        <div className="space-y-1 mb-2">
                            {(formData.suggested_traits?.personality || []).map((trait, index) => (
                                <div key={index} className="flex items-center gap-2 bg-indigo-900/30 px-2 py-1 rounded">
                                    <span className="flex-1 text-sm text-white">{trait}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeSuggestedTrait('personality', index)}
                                        className="text-red-400 hover:text-red-300"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <input
                            type="text"
                            placeholder="Adicionar traço de personalidade (Enter)"
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addSuggestedTrait('personality', e.currentTarget.value);
                                    e.currentTarget.value = '';
                                }
                            }}
                            className="w-full px-2 py-1 bg-indigo-900/50 border border-indigo-700 rounded text-white text-sm"
                        />
                    </div>

                    {/* Ideals */}
                    <div className="mb-3">
                        <h4 className="text-sm text-indigo-400 mb-1">Ideais</h4>
                        <div className="space-y-1 mb-2">
                            {(formData.suggested_traits?.ideals || []).map((ideal, index) => (
                                <div key={index} className="flex items-center gap-2 bg-indigo-900/30 px-2 py-1 rounded">
                                    <span className="flex-1 text-sm text-white">{ideal}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeSuggestedTrait('ideals', index)}
                                        className="text-red-400 hover:text-red-300"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <input
                            type="text"
                            placeholder="Adicionar ideal (Enter)"
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addSuggestedTrait('ideals', e.currentTarget.value);
                                    e.currentTarget.value = '';
                                }
                            }}
                            className="w-full px-2 py-1 bg-indigo-900/50 border border-indigo-700 rounded text-white text-sm"
                        />
                    </div>

                    {/* Bonds */}
                    <div className="mb-3">
                        <h4 className="text-sm text-indigo-400 mb-1">Vínculos</h4>
                        <div className="space-y-1 mb-2">
                            {(formData.suggested_traits?.bonds || []).map((bond, index) => (
                                <div key={index} className="flex items-center gap-2 bg-indigo-900/30 px-2 py-1 rounded">
                                    <span className="flex-1 text-sm text-white">{bond}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeSuggestedTrait('bonds', index)}
                                        className="text-red-400 hover:text-red-300"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <input
                            type="text"
                            placeholder="Adicionar vínculo (Enter)"
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addSuggestedTrait('bonds', e.currentTarget.value);
                                    e.currentTarget.value = '';
                                }
                            }}
                            className="w-full px-2 py-1 bg-indigo-900/50 border border-indigo-700 rounded text-white text-sm"
                        />
                    </div>

                    {/* Flaws */}
                    <div>
                        <h4 className="text-sm text-indigo-400 mb-1">Defeitos</h4>
                        <div className="space-y-1 mb-2">
                            {(formData.suggested_traits?.flaws || []).map((flaw, index) => (
                                <div key={index} className="flex items-center gap-2 bg-indigo-900/30 px-2 py-1 rounded">
                                    <span className="flex-1 text-sm text-white">{flaw}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeSuggestedTrait('flaws', index)}
                                        className="text-red-400 hover:text-red-300"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <input
                            type="text"
                            placeholder="Adicionar defeito (Enter)"
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addSuggestedTrait('flaws', e.currentTarget.value);
                                    e.currentTarget.value = '';
                                }
                            }}
                            className="w-full px-2 py-1 bg-indigo-900/50 border border-indigo-700 rounded text-white text-sm"
                        />
                    </div>
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
                        Tornar este antecedente público (outros jogadores poderão vê-lo)
                    </label>
                </div>
            </form>
        </Modal>
    );
};

export default HomebrewBackgroundEditor;
