import React, { useState, useEffect, useMemo } from 'react';
import { Button, CardBorder, Alert, Modal, ModalConfirmFooter } from '../../ui';
import { homebrewService, HomebrewRace } from '../../services/homebrewService';
import { Plus, Edit3, Trash2, Eye, Globe, Lock, AlertTriangle, Search, Filter, Wand2 } from 'lucide-react';
import HomebrewRaceEditor from './HomebrewRaceEditor';
import { CharacterCardSkeleton } from '../Generic';

const HomebrewRacesList: React.FC = () => {
    const [races, setRaces] = useState<HomebrewRace[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showEditor, setShowEditor] = useState(false);
    const [editingRace, setEditingRace] = useState<HomebrewRace | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [raceToDelete, setRaceToDelete] = useState<HomebrewRace | null>(null);
    const [viewingRace, setViewingRace] = useState<HomebrewRace | null>(null);

    // Search and filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [filterVisibility, setFilterVisibility] = useState<'all' | 'public' | 'private'>('all');
    const [filterSize, setFilterSize] = useState<string>('all');

    useEffect(() => {
        loadRaces();
    }, []);

    const loadRaces = async () => {
        try {
            setLoading(true);
            const response = await homebrewService.getRaces();
            setRaces(response.races || []);
        } catch (err: any) {
            setError('Erro ao carregar raças homebrew');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingRace(null);
        setShowEditor(true);
    };

    const handleEdit = (race: HomebrewRace) => {
        setEditingRace(race);
        setShowEditor(true);
    };

    const handleView = (race: HomebrewRace) => {
        setViewingRace(race);
    };

    const handleSave = async () => {
        await loadRaces();
        setShowEditor(false);
    };

    const confirmDelete = (race: HomebrewRace) => {
        setRaceToDelete(race);
        setShowDeleteModal(true);
    };

    const handleDelete = async () => {
        if (!raceToDelete?.id) return;

        try {
            await homebrewService.deleteRace(raceToDelete.id);
            setRaces(races.filter(r => r.id !== raceToDelete.id));
            setShowDeleteModal(false);
            setRaceToDelete(null);
        } catch (err: any) {
            setError(err.message || 'Erro ao deletar raça');
        }
    };

    // Filtered races based on search and filters
    const filteredRaces = useMemo(() => {
        return races.filter(race => {
            // Search filter
            const matchesSearch = searchTerm === '' ||
                race.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                race.description.toLowerCase().includes(searchTerm.toLowerCase());

            // Visibility filter
            const matchesVisibility = filterVisibility === 'all' ||
                (filterVisibility === 'public' && race.is_public) ||
                (filterVisibility === 'private' && !race.is_public);

            // Size filter
            const matchesSize = filterSize === 'all' || race.size === filterSize;

            return matchesSearch && matchesVisibility && matchesSize;
        });
    }, [races, searchTerm, filterVisibility, filterSize]);

    const RaceCard: React.FC<{ race: HomebrewRace }> = ({ race }) => (
        <CardBorder className="bg-indigo-950/80 hover:bg-indigo-900/80 transition-colors">
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg text-white">{race.name}</h3>
                        {race.is_public ? (
                            <Globe className="w-4 h-4 text-green-400" />
                        ) : (
                            <Lock className="w-4 h-4 text-gray-400" />
                        )}
                    </div>
                    <p className="text-indigo-300 text-sm">{race.size} • {race.speed}ft</p>
                    {race.owner_username && (
                        <p className="text-indigo-400 text-xs mt-1">por {race.owner_username}</p>
                    )}
                </div>
            </div>

            <p className="text-indigo-200 text-sm mb-4 line-clamp-2">{race.description}</p>

            {/* Ability Bonuses */}
            {race.abilities && Object.keys(race.abilities).length > 0 && (
                <div className="mb-4">
                    <h4 className="text-xs text-indigo-400 mb-2">Bônus de Atributos:</h4>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(race.abilities).map(([attr, bonus]) => (
                            <span key={attr} className="text-xs bg-indigo-900/50 px-2 py-1 rounded">
                                {attr.substring(0, 3).toUpperCase()} +{bonus}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Languages */}
            {race.languages && race.languages.length > 0 && (
                <div className="mb-4">
                    <h4 className="text-xs text-indigo-400 mb-2">Idiomas:</h4>
                    <p className="text-sm text-indigo-200">{race.languages.join(', ')}</p>
                </div>
            )}

            {/* Traits Count */}
            {race.traits && race.traits.length > 0 && (
                <div className="mb-4">
                    <p className="text-xs text-indigo-400">
                        {race.traits.length} traço{race.traits.length !== 1 ? 's' : ''} racial{race.traits.length !== 1 ? 'is' : ''}
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
                    onClick={() => handleView(race)}
                    classname="flex-1 text-sm py-2 bg-blue-600 hover:bg-blue-700"
                />
                <Button
                    buttonLabel={
                        <div className="flex items-center gap-1">
                            <Edit3 className="w-3 h-3" />
                            <span>Editar</span>
                        </div>
                    }
                    onClick={() => handleEdit(race)}
                    classname="flex-1 text-sm py-2"
                />
                <Button
                    buttonLabel={<Trash2 className="w-3 h-3" />}
                    onClick={() => confirmDelete(race)}
                    classname="text-sm py-2 px-3 bg-red-600 hover:bg-red-700"
                />
            </div>
        </CardBorder>
    );

    const EmptyState = () => (
        <CardBorder className="text-center py-12 bg-indigo-950/50">
            <Wand2 className="w-24 h-24 mx-auto mb-4 text-indigo-400" />
            <h3 className="text-xl font-bold mb-2">Nenhuma raça homebrew criada</h3>
            <p className="text-indigo-300 mb-6">
                Crie raças customizadas para usar em suas campanhas.
            </p>
            <Button
                buttonLabel={
                    <div className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        <span>Criar Primeira Raça</span>
                    </div>
                }
                onClick={handleCreate}
                classname="bg-green-600 hover:bg-green-700"
            />
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
                <CardBorder className="bg-indigo-950/50 mb-6">
                    <div className="space-y-4">
                        {/* Search Bar */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Buscar raças por nome ou descrição..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-indigo-900/50 border border-indigo-700 rounded-md
                                 text-white placeholder-indigo-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-indigo-400" />
                                <span className="text-sm text-indigo-300">Filtros:</span>
                            </div>

                            {/* Visibility Filter */}
                            <select
                                value={filterVisibility}
                                onChange={(e) => setFilterVisibility(e.target.value as any)}
                                className="px-3 py-1 bg-indigo-900/50 border border-indigo-700 rounded-md
                                 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="all">Todas</option>
                                <option value="public">Públicas</option>
                                <option value="private">Privadas</option>
                            </select>

                            {/* Size Filter */}
                            <select
                                value={filterSize}
                                onChange={(e) => setFilterSize(e.target.value)}
                                className="px-3 py-1 bg-indigo-900/50 border border-indigo-700 rounded-md
                                 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="all">Todos os Tamanhos</option>
                                <option value="Tiny">Minúsculo</option>
                                <option value="Small">Pequeno</option>
                                <option value="Medium">Médio</option>
                                <option value="Large">Grande</option>
                                <option value="Huge">Enorme</option>
                                <option value="Gargantuan">Colossal</option>
                            </select>

                            {/* Clear Filters */}
                            {(searchTerm || filterVisibility !== 'all' || filterSize !== 'all') && (
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setFilterVisibility('all');
                                        setFilterSize('all');
                                    }}
                                    className="text-sm text-purple-400 hover:text-purple-300 underline"
                                >
                                    Limpar Filtros
                                </button>
                            )}
                        </div>
                    </div>
                </CardBorder>

                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg text-indigo-200">
                            {filteredRaces.length === 0
                                ? 'Nenhuma raça encontrada'
                                : `${filteredRaces.length} raça${filteredRaces.length !== 1 ? 's' : ''} encontrada${filteredRaces.length !== 1 ? 's' : ''}`
                            }
                            {races.length !== filteredRaces.length && (
                                <span className="text-sm text-indigo-400"> (de {races.length} total)</span>
                            )}
                        </h3>
                    </div>
                    <Button
                        buttonLabel={
                            <div className="flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                <span>Nova Raça</span>
                            </div>
                        }
                        onClick={handleCreate}
                        classname="bg-green-600 hover:bg-green-700"
                    />
                </div>

                {/* Race List */}
                {races.length === 0 ? (
                    <EmptyState />
                ) : filteredRaces.length === 0 ? (
                    <CardBorder className="text-center py-12 bg-indigo-950/50">
                        <Search className="w-16 h-16 mx-auto mb-4 text-indigo-400" />
                        <h3 className="text-xl font-bold mb-2">Nenhuma raça encontrada</h3>
                        <p className="text-indigo-300 mb-4">
                            Tente ajustar os filtros ou buscar por outros termos.
                        </p>
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setFilterVisibility('all');
                                setFilterSize('all');
                            }}
                            className="text-purple-400 hover:text-purple-300 underline"
                        >
                            Limpar todos os filtros
                        </button>
                    </CardBorder>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredRaces.map((race) => (
                            <RaceCard key={race.id} race={race} />
                        ))}
                    </div>
                )}
            </div>

            {/* Editor Modal */}
            {showEditor && (
                <HomebrewRaceEditor
                    race={editingRace}
                    onSave={handleSave}
                    onClose={() => setShowEditor(false)}
                />
            )}

            {/* View Modal */}
            <Modal
                isOpen={!!viewingRace}
                onClose={() => setViewingRace(null)}
                title={viewingRace?.name || ''}
                size="lg"
            >
                {viewingRace && (
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-indigo-400 text-sm mb-1">Descrição</h4>
                            <p className="text-white">{viewingRace.description}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h4 className="text-indigo-400 text-sm mb-1">Tamanho</h4>
                                <p className="text-white">{viewingRace.size}</p>
                            </div>
                            <div>
                                <h4 className="text-indigo-400 text-sm mb-1">Velocidade</h4>
                                <p className="text-white">{viewingRace.speed}ft</p>
                            </div>
                        </div>

                        {viewingRace.languages && viewingRace.languages.length > 0 && (
                            <div>
                                <h4 className="text-indigo-400 text-sm mb-1">Idiomas</h4>
                                <p className="text-white">{viewingRace.languages.join(', ')}</p>
                            </div>
                        )}

                        {viewingRace.abilities && Object.keys(viewingRace.abilities).length > 0 && (
                            <div>
                                <h4 className="text-indigo-400 text-sm mb-2">Bônus de Atributos</h4>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(viewingRace.abilities).map(([attr, bonus]) => (
                                        <span key={attr} className="bg-indigo-900/50 px-3 py-1 rounded text-white">
                                            {attr.charAt(0).toUpperCase() + attr.slice(1)} +{bonus}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {viewingRace.traits && viewingRace.traits.length > 0 && (
                            <div>
                                <h4 className="text-indigo-400 text-sm mb-2">Traços Raciais</h4>
                                <div className="space-y-3">
                                    {viewingRace.traits.map((trait, index) => (
                                        <div key={index} className="bg-indigo-900/30 p-3 rounded">
                                            <h5 className="font-bold text-white mb-1">{trait.name}</h5>
                                            <p className="text-indigo-200 text-sm">{trait.description}</p>
                                        </div>
                                    ))}
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
                            Ao deletar a raça "{raceToDelete?.name}", você irá removê-la permanentemente.
                        </p>
                    </div>

                    <div className="text-center">
                        <p className="text-white font-medium">
                            Tem certeza que deseja deletar <strong>{raceToDelete?.name}</strong>?
                        </p>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default HomebrewRacesList;
