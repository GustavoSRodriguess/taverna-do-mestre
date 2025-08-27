// frontend/src/components/PC/PCList.tsx - Versão Simplificada
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page, Section, Button, CardBorder, Alert, Modal, ModalConfirmFooter } from '../../ui';
import { pcService } from '../../services/pcService';
import { FullCharacter } from '../../types/game';
import { AttributeDisplay, CombatStats, LevelBadge, CharacterCardSkeleton } from '../Generic';
import { formatDate } from '../../utils/gameUtils';
import { UserPlus, Dice1, Edit3, BarChart3, Trash2, AlertTriangle, Lightbulb, PenTool } from 'lucide-react';

const PCList: React.FC = () => {
    const navigate = useNavigate();
    const [pcs, setPCs] = useState<FullCharacter[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [pcToDelete, setPCToDelete] = useState<FullCharacter | null>(null);

    useEffect(() => {
        loadPCs();
    }, []);

    const loadPCs = async () => {
        try {
            setLoading(true);
            const response = await pcService.getPCs();
            console.log('Fetched PCs:', response);
            console.log('Fetched PCs:', response.pcs);
            setPCs(response.pcs || []);
        } catch (err) {
            setError('Erro ao carregar personagens');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!pcToDelete) return;

        try {
            await pcService.deletePC(pcToDelete.id!);
            setPCs(pcs.filter(pc => pc.id !== pcToDelete.id));
            setShowDeleteModal(false);
            setPCToDelete(null);
        } catch (err: any) {
            setError(err.message || 'Erro ao deletar personagem');
        }
    };

    const confirmDelete = (pc: FullCharacter) => {
        setPCToDelete(pc);
        setShowDeleteModal(true);
    };

    const EmptyState = () => (
        <CardBorder className="text-center py-12 bg-indigo-950/50">
            <UserPlus className="w-24 h-24 mx-auto mb-4 text-indigo-400" />
            <h3 className="text-xl font-bold mb-2">Nenhum personagem encontrado</h3>
            <p className="text-indigo-300 mb-6">
                Comece criando seu primeiro personagem para usar em campanhas.
            </p>
            <div className="flex justify-center gap-4">
                <Button
                    buttonLabel={
                        <div className="flex items-center gap-1">
                            <Dice1 className="w-4 h-4" />
                            <span>Gerar Aleatório</span>
                        </div>
                    }
                    onClick={() => navigate('/generator')}
                    classname="bg-green-600 hover:bg-green-700"
                />
                <Button
                    buttonLabel={
                        <div className="flex items-center gap-1">
                            <PenTool className="w-4 h-4" />
                            <span>Criar Manual</span>
                        </div>
                    }
                    onClick={() => navigate('/pc-editor/new')}
                />
            </div>
        </CardBorder>
    );

    const CharacterCard: React.FC<{ pc: FullCharacter }> = ({ pc }) => (
        <CardBorder className="bg-indigo-950/80 hover:bg-indigo-900/80 transition-colors">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="font-bold text-lg text-white">{pc.name}</h3>
                    <p className="text-indigo-300 text-sm">{pc.race} {pc.class}</p>
                </div>
                <LevelBadge level={pc.level} />
            </div>

            <CombatStats
                hp={pc.hp}
                currentHp={pc.current_hp}
                ca={pc.ca}
                proficiencyBonus={pc.proficiency_bonus}
                className="mb-4"
            />

            <AttributeDisplay
                attributes={pc.attributes}
                layout="grid"
                showModifiers={true}
                className="mb-4 text-xs"
            />

            {/* Additional Info */}
            <div className="space-y-1 mb-4 text-xs">
                {pc.background && (
                    <div className="flex justify-between">
                        <span className="text-indigo-400">Antecedente:</span>
                        <span className="text-white">{pc.background}</span>
                    </div>
                )}
                {pc.alignment && (
                    <div className="flex justify-between">
                        <span className="text-indigo-400">Alinhamento:</span>
                        <span className="text-white">{pc.alignment}</span>
                    </div>
                )}
                {pc.player_name && (
                    <div className="flex justify-between">
                        <span className="text-indigo-400">Jogador:</span>
                        <span className="text-white">{pc.player_name}</span>
                    </div>
                )}
            </div>

            <div className="text-xs text-indigo-400 mb-4">
                Criado em: {formatDate(pc.created_at!)}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t border-indigo-800">
                <Button
                    buttonLabel={
                        <div className="flex items-center gap-1">
                            <Edit3 className="w-3 h-3" />
                            <span>Editar</span>
                        </div>
                    }
                    onClick={() => navigate(`/pc-editor/${pc.id}`)}
                    classname="flex-1 text-sm py-2"
                />
                <Button
                    buttonLabel={
                        <div className="flex items-center gap-1">
                            <BarChart3 className="w-3 h-3" />
                            <span>Campanhas</span>
                        </div>
                    }
                    onClick={() => navigate(`/pc/${pc.id}/campaigns`)}
                    classname="flex-1 text-sm py-2 bg-blue-600 hover:bg-blue-700"
                />
                <Button
                    buttonLabel={<Trash2 className="w-3 h-3" />}
                    onClick={() => confirmDelete(pc)}
                    classname="text-sm py-2 px-3 bg-red-600 hover:bg-red-700"
                />
            </div>
        </CardBorder>
    );

    if (loading) {
        return (
            <Page>
                <Section title="Meus Personagens">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        {Array.from({ length: 6 }, (_, i) => (
                            <CharacterCardSkeleton key={i} />
                        ))}
                    </div>
                </Section>
            </Page>
        );
    }

    return (
        <Page>
            <Section title="Meus Personagens" className="py-8">
                <div className="max-w-6xl mx-auto">
                    {error && (
                        <Alert
                            message={error}
                            variant="error"
                            onClose={() => setError(null)}
                            className="mb-6"
                        />
                    )}

                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-lg text-indigo-200">
                                {pcs.length === 0
                                    ? 'Você ainda não criou nenhum personagem'
                                    : `${pcs.length} personagem${pcs.length !== 1 ? 's' : ''} criado${pcs.length !== 1 ? 's' : ''}`
                                }
                            </h3>
                        </div>
                        <div className="flex gap-4">
                            <Button
                                buttonLabel={
                                    <div className="flex items-center gap-1">
                                        <Dice1 className="w-4 h-4" />
                                        <span>Gerar Personagem</span>
                                    </div>
                                }
                                onClick={() => navigate('/generator')}
                                classname="bg-green-600 hover:bg-green-700"
                            />
                            <Button
                                buttonLabel={
                                    <div className="flex items-center gap-1">
                                        <PenTool className="w-4 h-4" />
                                        <span>Criar Manualmente</span>
                                    </div>
                                }
                                onClick={() => navigate('/pc-editor/new')}
                            />
                        </div>
                    </div>

                    {/* Character List */}
                    {pcs.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {pcs.map((pc) => (
                                <CharacterCard key={pc.id} pc={pc} />
                            ))}
                        </div>
                    )}
                </div>
            </Section>

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
                            Ao deletar o personagem "{pcToDelete?.name}", você irá:
                        </p>
                        <ul className="text-red-300 text-sm mt-2 space-y-1">
                            <li>• Remover permanentemente o personagem</li>
                            <li>• Remover o personagem de todas as campanhas</li>
                            <li>• Perder toda a progressão e histórico</li>
                        </ul>
                    </div>

                    <div className="bg-indigo-900/30 p-4 rounded border border-indigo-800">
                        <p className="text-indigo-200 text-sm">
                            <div className="flex items-start gap-2">
                                <Lightbulb className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                                <span><strong>Alternativa:</strong> Considere simplesmente remover o personagem</span>
                            </div>
                            das campanhas ativas em vez de deletá-lo completamente.
                        </p>
                    </div>

                    <div className="text-center">
                        <p className="text-white font-medium">
                            Tem certeza que deseja deletar <strong>{pcToDelete?.name}</strong>?
                        </p>
                        <p className="text-indigo-300 text-sm mt-1">
                            {pcToDelete?.race} {pcToDelete?.class} - Nível {pcToDelete?.level}
                        </p>
                    </div>
                </div>
            </Modal>
        </Page>
    );
};

export default PCList;