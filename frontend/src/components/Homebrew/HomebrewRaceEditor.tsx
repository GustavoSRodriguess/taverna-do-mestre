import React, { useState } from 'react';
import { Modal, Button, Alert } from '../../ui';
import { homebrewService, HomebrewRace, HomebrewTrait } from '../../services/homebrewService';
import { Plus, X, Save } from 'lucide-react';

interface Props {
    race: HomebrewRace | null;
    onSave: () => void;
    onClose: () => void;
}

const HomebrewRaceEditor: React.FC<Props> = ({ race, onSave, onClose }) => {
    const [formData, setFormData] = useState<Partial<HomebrewRace>>(
        race || homebrewService.createEmptyRace()
    );
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const errors = homebrewService.validateRace(formData);
        if (errors.length > 0) {
            setError(errors.join(', '));
            return;
        }

        try {
            setSaving(true);
            if (race?.id) {
                await homebrewService.updateRace(race.id, formData);
            } else {
                await homebrewService.createRace(formData as Omit<HomebrewRace, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'owner_username'>);
            }
            onSave();
        } catch (err: any) {
            setError(err.message || 'Erro ao salvar raça');
        } finally {
            setSaving(false);
        }
    };

    const addTrait = () => {
        setFormData({
            ...formData,
            traits: [...(formData.traits || []), { name: '', description: '' }]
        });
    };

    const removeTrait = (index: number) => {
        setFormData({
            ...formData,
            traits: (formData.traits || []).filter((_, i) => i !== index)
        });
    };

    const updateTrait = (index: number, field: keyof HomebrewTrait, value: string) => {
        const newTraits = [...(formData.traits || [])];
        newTraits[index] = { ...newTraits[index], [field]: value };
        setFormData({ ...formData, traits: newTraits });
    };

    const updateAbility = (ability: string, value: number) => {
        setFormData({
            ...formData,
            abilities: { ...(formData.abilities || {}), [ability]: value }
        });
    };

    const addLanguage = (lang: string) => {
        if (!lang.trim()) return;
        setFormData({
            ...formData,
            languages: [...(formData.languages || []), lang]
        });
    };

    const removeLanguage = (index: number) => {
        setFormData({
            ...formData,
            languages: (formData.languages || []).filter((_, i) => i !== index)
        });
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={race ? 'Editar Raça Homebrew' : 'Nova Raça Homebrew'}
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
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <Alert
                        message={error}
                        variant="error"
                        onClose={() => setError(null)}
                    />
                )}

                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-indigo-300 mb-2">
                            Nome *
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
                            Tamanho *
                        </label>
                        <select
                            value={formData.size || 'Medium'}
                            onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                            className="w-full px-3 py-2 bg-indigo-900/50 border border-indigo-700 rounded text-white"
                        >
                            <option value="Tiny">Tiny</option>
                            <option value="Small">Small</option>
                            <option value="Medium">Medium</option>
                            <option value="Large">Large</option>
                        </select>
                    </div>
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

                <div>
                    <label className="block text-sm font-medium text-indigo-300 mb-2">
                        Velocidade (ft)
                    </label>
                    <input
                        type="number"
                        value={formData.speed || 30}
                        onChange={(e) => setFormData({ ...formData, speed: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 bg-indigo-900/50 border border-indigo-700 rounded text-white"
                        min="0"
                    />
                </div>

                {/* Ability Bonuses */}
                <div>
                    <label className="block text-sm font-medium text-indigo-300 mb-2">
                        Bônus de Atributos
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        {['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].map(attr => (
                            <div key={attr} className="flex items-center gap-2">
                                <label className="text-sm text-indigo-400 w-16">
                                    {attr.substring(0, 3).toUpperCase()}
                                </label>
                                <input
                                    type="number"
                                    value={(formData.abilities && formData.abilities[attr as keyof typeof formData.abilities]) || 0}
                                    onChange={(e) => updateAbility(attr, parseInt(e.target.value) || 0)}
                                    className="flex-1 px-2 py-1 bg-indigo-900/50 border border-indigo-700 rounded text-white text-sm"
                                    min="0"
                                    max="3"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Languages */}
                <div>
                    <label className="block text-sm font-medium text-indigo-300 mb-2">
                        Idiomas
                    </label>
                    <div className="flex gap-2 mb-2">
                        {(formData.languages || []).map((lang, index) => (
                            <span
                                key={index}
                                className="inline-flex items-center gap-1 bg-indigo-900/50 px-2 py-1 rounded text-sm"
                            >
                                {lang}
                                <button
                                    type="button"
                                    onClick={() => removeLanguage(index)}
                                    className="text-red-400 hover:text-red-300"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Adicionar idioma (pressione Enter para adicionar)"
                            onKeyUp={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addLanguage(e.currentTarget.value);
                                    e.currentTarget.value = '';
                                    console.log('Language added')
                                    console.log(formData.languages)
                                }
                            }}
                            className="flex-1 px-3 py-2 bg-indigo-900/50 border border-indigo-700 rounded text-white text-sm"
                        />
                    </div>
                </div>

                {/* Traits */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-indigo-300">
                            Traços Raciais
                        </label>
                        <Button
                            buttonLabel={
                                <div className="flex items-center gap-1">
                                    <Plus className="w-3 h-3" />
                                    <span>Adicionar Traço</span>
                                </div>
                            }
                            onClick={addTrait}
                            classname="text-sm py-1 px-3"
                        />
                    </div>
                    <div className="space-y-3">
                        {(formData.traits || []).map((trait, index) => (
                            <div key={index} className="bg-indigo-900/30 p-3 rounded border border-indigo-700">
                                <div className="flex justify-between items-start mb-2">
                                    <input
                                        type="text"
                                        value={trait.name}
                                        onChange={(e) => updateTrait(index, 'name', e.target.value)}
                                        placeholder="Nome do traço"
                                        className="flex-1 px-2 py-1 bg-indigo-900/50 border border-indigo-700 rounded text-white text-sm mr-2"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeTrait(index)}
                                        className="text-red-400 hover:text-red-300"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <textarea
                                    value={trait.description}
                                    onChange={(e) => updateTrait(index, 'description', e.target.value)}
                                    placeholder="Descrição do traço"
                                    className="w-full px-2 py-1 bg-indigo-900/50 border border-indigo-700 rounded text-white text-sm"
                                    rows={2}
                                />
                            </div>
                        ))}
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
                        Tornar esta raça pública (outros jogadores poderão vê-la)
                    </label>
                </div>
            </form>
        </Modal>
    );
};

export default HomebrewRaceEditor;
