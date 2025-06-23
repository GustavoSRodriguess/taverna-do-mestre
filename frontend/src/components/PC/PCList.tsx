import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page, Section, Button, CardBorder, Badge, Alert, Modal, ModalConfirmFooter } from '../../ui';
import { pcService, PC } from '../../services/pcService';

const PCList: React.FC = () => {
    const navigate = useNavigate();
    const [pcs, setPCs] = useState<PC[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [pcToDelete, setPCToDelete] = useState<PC | null>(null);

    const loadPCs = async () => {
        try {
            setLoading(true);
            const response = await pcService.getPCs();
            setPCs(response.pcs || []);
        } catch (err) {
            setError('Erro ao carregar personagens');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPCs();
    }, []);

    const handleDelete = async () => {
        if (!pcToDelete) return;

        try {
            await pcService.deletePC(pcToDelete.id);
            setPCs(pcs.filter(pc => pc.id !== pcToDelete.id));
            setShowDeleteModal(false);
            setPCToDelete(null);
        } catch (err: any) {
            setError(err.message || 'Erro ao deletar personagem');
        }
    };

    const confirmDelete = (pc: PC) => {
        setPCToDelete(pc);
        setShowDeleteModal(true);
    };

    const getModifier = (score: number): number => {
        return Math.floor((score - 10) / 2);
    };

    const formatModifier = (modifier: number): string => {
        return modifier >= 0 ? `+${modifier}` : modifier.toString();
    };

    const getLevelColor = (level: number): string => {
        if (level <= 5) return 'text-green-400';
        if (level <= 10) return 'text-blue-400';
        if (level <= 15) return 'text-purple-400';
        return 'text-yellow-400';
    };

    if (loading) {
        return (
            <Page>
                <Section title="Meus Personagens">
                    <div className="text-center">
                        <p>Carregando personagens...</p>
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

                    {/* Header com botões de ação */}
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
                                buttonLabel="🎲 Gerar Personagem"
                                onClick={() => navigate('/generator')}
                                classname="bg-green-600 hover:bg-green-700"
                            />
                            <Button
                                buttonLabel="✍️ Criar Manualmente"
                                onClick={() => navigate('/pc-editor/new')}
                            />
                        </div>
                    </div>

                    {/* Lista de personagens */}
                    {pcs.length === 0 ? (
                        <CardBorder className="text-center py-12 bg-indigo-950/50">
                            <div className="text-6xl mb-4">🧙‍♂️</div>
                            <h3 className="text-xl font-bold mb-2">Nenhum personagem encontrado</h3>
                            <p className="text-indigo-300 mb-6">
                                Comece criando seu primeiro personagem para usar em campanhas.
                            </p>
                            <div className="flex justify-center gap-4">
                                <Button
                                    buttonLabel="🎲 Gerar Aleatório"
                                    onClick={() => navigate('/generator')}
                                    classname="bg-green-600 hover:bg-green-700"
                                />
                                <Button
                                    buttonLabel="✍️ Criar Manual"
                                    onClick={() => navigate('/pc-editor/new')}
                                />
                            </div>
                        </CardBorder>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {pcs.map((pc) => (
                                <CardBorder key={pc.id} className="bg-indigo-950/80 hover:bg-indigo-900/80 transition-colors">
                                    {/* Header do card */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-lg text-white">{pc.name}</h3>
                                            <p className="text-indigo-300 text-sm">
                                                {pc.race} {pc.class}
                                            </p>
                                        </div>
                                        <Badge
                                            text={`Nível ${pc.level}`}
                                            variant="primary"
                                            className={getLevelColor(pc.level)}
                                        />
                                    </div>

                                    {/* Atributos principais */}
                                    <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
                                        <div className="text-center p-2 bg-red-900/30 rounded">
                                            <div className="text-red-300 text-xs">HP</div>
                                            <div className="text-white font-bold">
                                                {pc.current_hp || pc.hp}/{pc.hp}
                                            </div>
                                        </div>
                                        <div className="text-center p-2 bg-blue-900/30 rounded">
                                            <div className="text-blue-300 text-xs">CA</div>
                                            <div className="text-white font-bold">{pc.ca}</div>
                                        </div>
                                        <div className="text-center p-2 bg-purple-900/30 rounded">
                                            <div className="text-purple-300 text-xs">PROF</div>
                                            <div className="text-white font-bold">+{pc.proficiency_bonus}</div>
                                        </div>
                                    </div>

                                    {/* Atributos */}
                                    <div className="grid grid-cols-6 gap-1 mb-4 text-xs">
                                        {Object.entries(pc.attributes).map(([attr, value]) => {
                                            const modifier = getModifier(value);
                                            const shortAttr = attr.substring(0, 3).toUpperCase();

                                            return (
                                                <div key={attr} className="text-center p-1 bg-indigo-900/30 rounded">
                                                    <div className="text-indigo-300">{shortAttr}</div>
                                                    <div className="text-white font-bold">{value}</div>
                                                    <div className="text-purple-300">{formatModifier(modifier)}</div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Informações adicionais */}
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

                                    {/* Data de criação */}
                                    <div className="text-xs text-indigo-400 mb-4">
                                        Criado em: {new Date(pc.created_at).toLocaleDateString('pt-BR')}
                                    </div>

                                    {/* Ações */}
                                    <div className="flex gap-2 pt-4 border-t border-indigo-800">
                                        <Button
                                            buttonLabel="✏️ Editar"
                                            onClick={() => navigate(`/pc-editor/${pc.id}`)}
                                            classname="flex-1 text-sm py-2"
                                        />
                                        <Button
                                            buttonLabel="📊 Campanhas"
                                            onClick={() => navigate(`/pc/${pc.id}/campaigns`)}
                                            classname="flex-1 text-sm py-2 bg-blue-600 hover:bg-blue-700"
                                        />
                                        <Button
                                            buttonLabel="🗑️"
                                            onClick={() => confirmDelete(pc)}
                                            classname="text-sm py-2 px-3 bg-red-600 hover:bg-red-700"
                                        />
                                    </div>
                                </CardBorder>
                            ))}
                        </div>
                    )}
                </div>
            </Section>

            {/* Modal de confirmação de exclusão */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="⚠️ Confirmar Exclusão"
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
                            💡 <strong>Alternativa:</strong> Considere simplesmente remover o personagem
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