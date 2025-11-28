import React, { useState, useEffect } from 'react';
import { Button, CardBorder, Alert, Modal, ModalConfirmFooter } from '../../ui';
import { homebrewService, HomebrewBackground } from '../../services/homebrewService';
import { Plus, Edit3, Trash2, Eye, Globe, Lock, AlertTriangle, Scroll } from 'lucide-react';
import HomebrewBackgroundEditor from './HomebrewBackgroundEditor';
import { CharacterCardSkeleton } from '../Generic';
import { useHomebrewFilters } from '../../hooks/useHomebrewFilters';
import HomebrewFilterBar from './HomebrewFilterBar';
import HomebrewEmptyState from './HomebrewEmptyState';

const HomebrewBackgroundsList: React.FC = () => {
    const [backgrounds, setBackgrounds] = useState<HomebrewBackground[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showEditor, setShowEditor] = useState(false);
    const [editingBackground, setEditingBackground] = useState<HomebrewBackground | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [backgroundToDelete, setBackgroundToDelete] = useState<HomebrewBackground | null>(null);
    const [viewingBackground, setViewingBackground] = useState<HomebrewBackground | null>(null);

    // Use the generic filter hook
    const {
        searchTerm,
        setSearchTerm,
        filterVisibility,
        setFilterVisibility,
        filteredItems: filteredBackgrounds,
        clearFilters,
        hasActiveFilters,
        totalCount,
        filteredCount,
    } = useHomebrewFilters<HomebrewBackground>(backgrounds, {
        searchFields: ['name', 'description'],
    });

    useEffect(() => {
        loadBackgrounds();
    }, []);

    const loadBackgrounds = async () => {
        try {
            setLoading(true);
            const response = await homebrewService.getBackgrounds();
            setBackgrounds(response.backgrounds || []);
        } catch (err: any) {
            setError('Erro ao carregar antecedentes homebrew');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingBackground(null);
        setShowEditor(true);
    };

    const handleEdit = (background: HomebrewBackground) => {
        setEditingBackground(background);
        setShowEditor(true);
    };

    const handleView = (background: HomebrewBackground) => {
        setViewingBackground(background);
    };

    const handleSave = async () => {
        await loadBackgrounds();
        setShowEditor(false);
    };

    const confirmDelete = (background: HomebrewBackground) => {
        setBackgroundToDelete(background);
        setShowDeleteModal(true);
    };

    const handleDelete = async () => {
        if (!backgroundToDelete?.id) return;

        try {
            await homebrewService.deleteBackground(backgroundToDelete.id);
            setBackgrounds(backgrounds.filter(b => b.id !== backgroundToDelete.id));
            setShowDeleteModal(false);
            setBackgroundToDelete(null);
        } catch (err: any) {
            setError(err.message || 'Erro ao deletar antecedente');
        }
    };

    const BackgroundCard: React.FC<{ background: HomebrewBackground }> = ({ background }) => (
        <CardBorder className="bg-indigo-950/80 hover:bg-indigo-900/80 transition-colors">
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg text-white">{background.name}</h3>
                        {background.is_public ? (
                            <Globe className="w-4 h-4 text-green-400" />
                        ) : (
                            <Lock className="w-4 h-4 text-gray-400" />
                        )}
                    </div>
                    {background.owner_username && (
                        <p className="text-indigo-400 text-xs mt-1">por {background.owner_username}</p>
                    )}
                </div>
            </div>

            <p className="text-indigo-200 text-sm mb-4 line-clamp-2">{background.description}</p>

            {/* Skills */}
            {background.skill_proficiencies && background.skill_proficiencies.length > 0 && (
                <div className="mb-4">
                    <h4 className="text-xs text-indigo-400 mb-2">Perícias:</h4>
                    <div className="flex flex-wrap gap-2">
                        {background.skill_proficiencies.map((skill) => (
                            <span key={skill} className="text-xs bg-indigo-900/50 px-2 py-1 rounded">
                                {skill.replace(/_/g, ' ')}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Feature */}
            {background.feature && background.feature.name && (
                <div className="mb-4">
                    <p className="text-xs text-indigo-400">
                        Habilidade: <span className="text-white">{background.feature.name}</span>
                    </p>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t border-indigo-800">
                <Button
                    buttonLabel={
                        <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            <span>Ver</span>
                        </div>
                    }
                    onClick={() => handleView(background)}
                    classname="flex-1 text-sm py-2 bg-blue-600 hover:bg-blue-700"
                />
                <Button
                    buttonLabel={
                        <div className="flex items-center gap-1">
                            <Edit3 className="w-3 h-3" />
                            <span>Editar</span>
                        </div>
                    }
                    onClick={() => handleEdit(background)}
                    classname="flex-1 text-sm py-2"
                />
                <Button
                    buttonLabel={<Trash2 className="w-3 h-3" />}
                    onClick={() => confirmDelete(background)}
                    classname="text-sm py-2 px-3 bg-red-600 hover:bg-red-700"
                />
            </div>
        </CardBorder>
    );


    if (loading) {
        return (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }, (_, i) => (
                    <CharacterCardSkeleton key={i} />
                ))}
            </div>
        );
    }

    return (
        <>
            <div>
                {error && (
                    <Alert
                        message={error}
                        variant="error"
                        onClose={() => setError(null)}
                        className="mb-6"
                    />
                )}

                {/* Search and Filters */}
                <HomebrewFilterBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    searchPlaceholder="Buscar antecedentes por nome ou descrição..."
                    filterVisibility={filterVisibility}
                    onVisibilityChange={setFilterVisibility}
                    onClearFilters={clearFilters}
                    hasActiveFilters={hasActiveFilters}
                />

                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg text-indigo-200">
                            {filteredCount === 0
                                ? 'Nenhum antecedente encontrado'
                                : `${filteredCount} antecedente${filteredCount !== 1 ? 's' : ''} encontrado${filteredCount !== 1 ? 's' : ''}`
                            }
                            {totalCount !== filteredCount && (
                                <span className="text-sm text-indigo-400"> (de {totalCount} total)</span>
                            )}
                        </h3>
                    </div>
                    <Button
                        buttonLabel={
                            <div className="flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                <span>Novo Antecedente</span>
                            </div>
                        }
                        onClick={handleCreate}
                        classname="bg-green-600 hover:bg-green-700"
                    />
                </div>

                {/* Background List */}
                {totalCount === 0 ? (
                    <HomebrewEmptyState
                        icon={Scroll}
                        title="Nenhum antecedente homebrew criado"
                        description="Crie antecedentes customizados para usar em suas campanhas."
                        buttonLabel="Criar Primeiro Antecedente"
                        onButtonClick={handleCreate}
                    />
                ) : filteredCount === 0 ? (
                    <HomebrewEmptyState
                        icon={Scroll}
                        title="Nenhum antecedente encontrado"
                        description="Tente ajustar os filtros ou buscar por outros termos."
                        variant="no-results"
                        onClearFilters={clearFilters}
                    />
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredBackgrounds.map((background) => (
                            <BackgroundCard key={background.id} background={background} />
                        ))}
                    </div>
                )}
            </div>

            {/* Editor Modal */}
            {showEditor && (
                <HomebrewBackgroundEditor
                    background={editingBackground}
                    onSave={handleSave}
                    onClose={() => setShowEditor(false)}
                />
            )}

            {/* View Modal */}
            <Modal
                isOpen={!!viewingBackground}
                onClose={() => setViewingBackground(null)}
                title={viewingBackground?.name || ''}
                size="lg"
            >
                {viewingBackground && (
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                        <div>
                            <h4 className="text-indigo-400 text-sm mb-1">Descrição</h4>
                            <p className="text-white">{viewingBackground.description}</p>
                        </div>

                        {viewingBackground.skill_proficiencies && viewingBackground.skill_proficiencies.length > 0 && (
                            <div>
                                <h4 className="text-indigo-400 text-sm mb-2">Proficiências em Perícias</h4>
                                <div className="flex gap-2 flex-wrap">
                                    {viewingBackground.skill_proficiencies.map(skill => (
                                        <span key={skill} className="bg-indigo-900/50 px-3 py-1 rounded text-white">
                                            {skill.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {viewingBackground.tool_proficiencies && viewingBackground.tool_proficiencies.length > 0 && (
                            <div>
                                <h4 className="text-indigo-400 text-sm mb-2">Proficiências em Ferramentas</h4>
                                <div className="space-y-1">
                                    {viewingBackground.tool_proficiencies.map((tool, i) => (
                                        <p key={i} className="text-white text-sm">• {tool}</p>
                                    ))}
                                </div>
                            </div>
                        )}

                        {viewingBackground.languages > 0 && (
                            <div>
                                <h4 className="text-indigo-400 text-sm mb-1">Idiomas Adicionais</h4>
                                <p className="text-white">{viewingBackground.languages}</p>
                            </div>
                        )}

                        {viewingBackground.equipment && viewingBackground.equipment.length > 0 && (
                            <div>
                                <h4 className="text-indigo-400 text-sm mb-2">Equipamento Inicial</h4>
                                <div className="space-y-1">
                                    {viewingBackground.equipment.map((item, i) => (
                                        <p key={i} className="text-white text-sm">
                                            • {item.name} {item.quantity > 1 && `(x${item.quantity})`}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        )}

                        {viewingBackground.feature && viewingBackground.feature.name && (
                            <div className="bg-indigo-900/30 p-3 rounded">
                                <h4 className="text-indigo-400 text-sm mb-1">Habilidade Especial</h4>
                                <h5 className="font-bold text-white mb-1">{viewingBackground.feature.name}</h5>
                                <p className="text-indigo-200 text-sm">{viewingBackground.feature.description}</p>
                            </div>
                        )}

                        {viewingBackground.suggested_traits && (
                            <div>
                                <h4 className="text-indigo-400 text-sm mb-2">Características Sugeridas</h4>
                                <div className="space-y-2">
                                    {viewingBackground.suggested_traits.personality && viewingBackground.suggested_traits.personality.length > 0 && (
                                        <div className="bg-indigo-900/20 p-2 rounded">
                                            <h6 className="text-xs text-indigo-300 mb-1">Personalidade</h6>
                                            {viewingBackground.suggested_traits.personality.slice(0, 3).map((trait, i) => (
                                                <p key={i} className="text-white text-xs">• {trait}</p>
                                            ))}
                                        </div>
                                    )}
                                    {viewingBackground.suggested_traits.ideals && viewingBackground.suggested_traits.ideals.length > 0 && (
                                        <div className="bg-indigo-900/20 p-2 rounded">
                                            <h6 className="text-xs text-indigo-300 mb-1">Ideais</h6>
                                            {viewingBackground.suggested_traits.ideals.slice(0, 2).map((ideal, i) => (
                                                <p key={i} className="text-white text-xs">• {ideal}</p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title={
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-orange-400" />
                        <span>Confirmar Exclusão</span>
                    </div>
                }
                size="md"
                footer={
                    <ModalConfirmFooter
                        onConfirm={handleDelete}
                        onCancel={() => setShowDeleteModal(false)}
                        confirmLabel="Sim, Deletar"
                        cancelLabel="Cancelar"
                        confirmVariant="bg-red-600 hover:bg-red-700"
                    />
                }
            >
                <div className="space-y-4">
                    <div className="bg-red-900/20 p-4 rounded border border-red-600/30">
                        <h4 className="font-bold text-red-200 mb-2">Esta ação é irreversível!</h4>
                        <p className="text-red-300 text-sm">
                            Ao deletar o antecedente "{backgroundToDelete?.name}", você irá removê-lo permanentemente.
                        </p>
                    </div>

                    <div className="text-center">
                        <p className="text-white font-medium">
                            Tem certeza que deseja deletar <strong>{backgroundToDelete?.name}</strong>?
                        </p>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default HomebrewBackgroundsList;
