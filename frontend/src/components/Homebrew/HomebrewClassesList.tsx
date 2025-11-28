import React, { useState, useEffect } from 'react';
import { Button, CardBorder, Alert, Modal, ModalConfirmFooter } from '../../ui';
import { homebrewService, HomebrewClass } from '../../services/homebrewService';
import { Plus, Edit3, Trash2, Eye, Globe, Lock, AlertTriangle, Swords } from 'lucide-react';
import HomebrewClassEditor from './HomebrewClassEditor';
import { CharacterCardSkeleton } from '../Generic';
import { useHomebrewFilters } from '../../hooks/useHomebrewFilters';
import HomebrewFilterBar from './HomebrewFilterBar';
import HomebrewEmptyState from './HomebrewEmptyState';

const HomebrewClassesList: React.FC = () => {
    const [classes, setClasses] = useState<HomebrewClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showEditor, setShowEditor] = useState(false);
    const [editingClass, setEditingClass] = useState<HomebrewClass | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [classToDelete, setClassToDelete] = useState<HomebrewClass | null>(null);
    const [viewingClass, setViewingClass] = useState<HomebrewClass | null>(null);

    // Use the generic filter hook
    const {
        searchTerm,
        setSearchTerm,
        filterVisibility,
        setFilterVisibility,
        customFilterValues,
        setCustomFilterValue,
        filteredItems: filteredClasses,
        clearFilters,
        hasActiveFilters,
        totalCount,
        filteredCount,
    } = useHomebrewFilters<HomebrewClass>(classes, {
        searchFields: ['name', 'description'],
        customFilters: {
            spellcaster: (classData, value) => {
                if (value === 'caster') return !!classData.spellcasting;
                if (value === 'non-caster') return !classData.spellcasting;
                return true;
            },
        },
    });

    useEffect(() => {
        loadClasses();
    }, []);

    const loadClasses = async () => {
        try {
            setLoading(true);
            const response = await homebrewService.getClasses();
            setClasses(response.classes || []);
        } catch (err: any) {
            setError('Erro ao carregar classes homebrew');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingClass(null);
        setShowEditor(true);
    };

    const handleEdit = (classData: HomebrewClass) => {
        setEditingClass(classData);
        setShowEditor(true);
    };

    const handleView = (classData: HomebrewClass) => {
        setViewingClass(classData);
    };

    const handleSave = async () => {
        await loadClasses();
        setShowEditor(false);
    };

    const confirmDelete = (classData: HomebrewClass) => {
        setClassToDelete(classData);
        setShowDeleteModal(true);
    };

    const handleDelete = async () => {
        if (!classToDelete?.id) return;

        try {
            await homebrewService.deleteClass(classToDelete.id);
            setClasses(classes.filter(c => c.id !== classToDelete.id));
            setShowDeleteModal(false);
            setClassToDelete(null);
        } catch (err: any) {
            setError(err.message || 'Erro ao deletar classe');
        }
    };

    const ClassCard: React.FC<{ classData: HomebrewClass }> = ({ classData }) => (
        <CardBorder className="bg-indigo-950/80 hover:bg-indigo-900/80 transition-colors">
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg text-white">{classData.name}</h3>
                        {classData.is_public ? (
                            <Globe className="w-4 h-4 text-green-400" />
                        ) : (
                            <Lock className="w-4 h-4 text-gray-400" />
                        )}
                    </div>
                    <p className="text-indigo-300 text-sm">
                        Hit Die: d{classData.hit_die} • {classData.primary_ability.toUpperCase()}
                    </p>
                    {classData.owner_username && (
                        <p className="text-indigo-400 text-xs mt-1">por {classData.owner_username}</p>
                    )}
                </div>
            </div>

            <p className="text-indigo-200 text-sm mb-4 line-clamp-2">{classData.description}</p>

            {/* Saving Throws */}
            {classData.saving_throws && classData.saving_throws.length > 0 && (
                <div className="mb-4">
                    <h4 className="text-xs text-indigo-400 mb-2">Testes de Resistência:</h4>
                    <div className="flex flex-wrap gap-2">
                        {classData.saving_throws.map((save) => (
                            <span key={save} className="text-xs bg-indigo-900/50 px-2 py-1 rounded">
                                {save.substring(0, 3).toUpperCase()}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Features Count */}
            {classData.features && Object.keys(classData.features).length > 0 && (
                <div className="mb-4">
                    <p className="text-xs text-indigo-400">
                        {Object.keys(classData.features).length} níveis com habilidades
                        {classData.spellcasting && ' • Conjurador'}
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
                    onClick={() => handleView(classData)}
                    classname="flex-1 text-sm py-2 bg-blue-600 hover:bg-blue-700"
                />
                <Button
                    buttonLabel={
                        <div className="flex items-center gap-1">
                            <Edit3 className="w-3 h-3" />
                            <span>Editar</span>
                        </div>
                    }
                    onClick={() => handleEdit(classData)}
                    classname="flex-1 text-sm py-2"
                />
                <Button
                    buttonLabel={<Trash2 className="w-3 h-3" />}
                    onClick={() => confirmDelete(classData)}
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
                    searchPlaceholder="Buscar classes por nome ou descrição..."
                    filterVisibility={filterVisibility}
                    onVisibilityChange={setFilterVisibility}
                    customFilters={[
                        {
                            key: 'spellcaster',
                            label: 'Tipo de Classe',
                            options: [
                                { value: 'caster', label: 'Conjurador' },
                                { value: 'non-caster', label: 'Não-Conjurador' },
                            ],
                        },
                    ]}
                    customFilterValues={customFilterValues}
                    onCustomFilterChange={setCustomFilterValue}
                    onClearFilters={clearFilters}
                    hasActiveFilters={hasActiveFilters}
                />

                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg text-indigo-200">
                            {filteredCount === 0
                                ? 'Nenhuma classe encontrada'
                                : `${filteredCount} classe${filteredCount !== 1 ? 's' : ''} encontrada${filteredCount !== 1 ? 's' : ''}`
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
                                <span>Nova Classe</span>
                            </div>
                        }
                        onClick={handleCreate}
                        classname="bg-green-600 hover:bg-green-700"
                    />
                </div>

                {/* Class List */}
                {totalCount === 0 ? (
                    <HomebrewEmptyState
                        icon={Swords}
                        title="Nenhuma classe homebrew criada"
                        description="Crie classes customizadas para usar em suas campanhas."
                        buttonLabel="Criar Primeira Classe"
                        onButtonClick={handleCreate}
                    />
                ) : filteredCount === 0 ? (
                    <HomebrewEmptyState
                        icon={Swords}
                        title="Nenhuma classe encontrada"
                        description="Tente ajustar os filtros ou buscar por outros termos."
                        variant="no-results"
                        onClearFilters={clearFilters}
                    />
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredClasses.map((classData) => (
                            <ClassCard key={classData.id} classData={classData} />
                        ))}
                    </div>
                )}
            </div>

            {/* Editor Modal */}
            {showEditor && (
                <HomebrewClassEditor
                    classData={editingClass}
                    onSave={handleSave}
                    onClose={() => setShowEditor(false)}
                />
            )}

            {/* View Modal */}
            <Modal
                isOpen={!!viewingClass}
                onClose={() => setViewingClass(null)}
                title={viewingClass?.name || ''}
                size="lg"
            >
                {viewingClass && (
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                        <div>
                            <h4 className="text-indigo-400 text-sm mb-1">Descrição</h4>
                            <p className="text-white">{viewingClass.description}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h4 className="text-indigo-400 text-sm mb-1">Dado de Vida</h4>
                                <p className="text-white">d{viewingClass.hit_die}</p>
                            </div>
                            <div>
                                <h4 className="text-indigo-400 text-sm mb-1">Habilidade Primária</h4>
                                <p className="text-white">{viewingClass.primary_ability.toUpperCase()}</p>
                            </div>
                        </div>

                        {viewingClass.saving_throws && viewingClass.saving_throws.length > 0 && (
                            <div>
                                <h4 className="text-indigo-400 text-sm mb-2">Testes de Resistência</h4>
                                <div className="flex gap-2">
                                    {viewingClass.saving_throws.map(save => (
                                        <span key={save} className="bg-indigo-900/50 px-3 py-1 rounded text-white">
                                            {save.charAt(0).toUpperCase() + save.slice(1)}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {viewingClass.features && Object.keys(viewingClass.features).length > 0 && (
                            <div>
                                <h4 className="text-indigo-400 text-sm mb-2">Habilidades de Classe</h4>
                                <div className="space-y-3">
                                    {Object.entries(viewingClass.features)
                                        .sort(([a], [b]) => parseInt(a) - parseInt(b))
                                        .map(([level, features]) => (
                                            <div key={level}>
                                                <h5 className="text-white font-bold mb-2">Nível {level}</h5>
                                                {features.map((feature, index) => (
                                                    <div key={index} className="bg-indigo-900/30 p-3 rounded mb-2">
                                                        <h6 className="font-bold text-white mb-1">{feature.name}</h6>
                                                        <p className="text-indigo-200 text-sm">{feature.description}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}

                        {viewingClass.spellcasting && (
                            <div className="bg-purple-900/20 p-3 rounded border border-purple-700/30">
                                <h4 className="text-purple-300 text-sm mb-1">Conjurador</h4>
                                <p className="text-white text-sm">
                                    Habilidade de Conjuração: {viewingClass.spellcasting.ability.toUpperCase()}
                                </p>
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
                            Ao deletar a classe "{classToDelete?.name}", você irá removê-la permanentemente.
                        </p>
                    </div>

                    <div className="text-center">
                        <p className="text-white font-medium">
                            Tem certeza que deseja deletar <strong>{classToDelete?.name}</strong>?
                        </p>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default HomebrewClassesList;
