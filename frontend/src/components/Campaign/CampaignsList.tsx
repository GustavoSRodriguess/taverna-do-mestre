// frontend/src/components/Campaigns/CampaignsList.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page, Section, Button, CardBorder, Badge, Modal, Alert } from '../../ui';
import { campaignService, Campaign } from '../../services/campaignService';
import CreateCampaignModal from './CreateCampaignModal';
import JoinCampaignModal from './JoinCampaignModal';

const CampaignsList: React.FC = () => {
    const navigate = useNavigate();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);

    const loadCampaigns = async () => {
        try {
            setLoading(true);
            const response = await campaignService.getCampaigns();
            setCampaigns(response.campaigns || []);
        } catch (err) {
            setError('Erro ao carregar campanhas');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCampaigns();
    }, []);

    const getStatusBadge = (status: string) => {
        const statusMap = {
            planning: { variant: 'info' as const, text: 'Planejando' },
            active: { variant: 'success' as const, text: 'Ativa' },
            paused: { variant: 'warning' as const, text: 'Pausada' },
            completed: { variant: 'primary' as const, text: 'Concluída' }
        };

        const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.planning;
        return <Badge text={statusInfo.text} variant={statusInfo.variant} />;
    };

    const handleCreateSuccess = () => {
        setShowCreateModal(false);
        loadCampaigns();
    };

    const handleJoinSuccess = () => {
        setShowJoinModal(false);
        loadCampaigns();
    };

    if (loading) {
        return (
            <Page>
                <Section title="Minhas Campanhas">
                    <div className="text-center">
                        <p>Carregando campanhas...</p>
                    </div>
                </Section>
            </Page>
        );
    }

    return (
        <Page>
            <Section title="Minhas Campanhas" className="py-8">
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
                                {campaigns.length === 0
                                    ? 'Você ainda não participa de nenhuma campanha'
                                    : `${campaigns.length} campanha${campaigns.length !== 1 ? 's' : ''} encontrada${campaigns.length !== 1 ? 's' : ''}`
                                }
                            </h3>
                        </div>
                        <div className="flex gap-4">
                            <Button
                                buttonLabel="Entrar em Campanha"
                                onClick={() => setShowJoinModal(true)}
                                classname="bg-green-600 hover:bg-green-700"
                            />
                            <Button
                                buttonLabel="Criar Nova Campanha"
                                onClick={() => setShowCreateModal(true)}
                            />
                        </div>
                    </div>

                    {/* Lista de campanhas */}
                    {campaigns.length === 0 ? (
                        <CardBorder className="text-center py-12 bg-indigo-950/50">
                            <div className="text-6xl mb-4">🎲</div>
                            <h3 className="text-xl font-bold mb-2">Nenhuma campanha encontrada</h3>
                            <p className="text-indigo-300 mb-6">
                                Crie sua primeira campanha ou entre em uma existente usando um código de convite.
                            </p>
                            <div className="flex justify-center gap-4">
                                <Button
                                    buttonLabel="Criar Campanha"
                                    onClick={() => setShowCreateModal(true)}
                                />
                                <Button
                                    buttonLabel="Entrar com Código"
                                    onClick={() => setShowJoinModal(true)}
                                    classname="bg-green-600 hover:bg-green-700"
                                />
                            </div>
                        </CardBorder>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {campaigns.map((campaign) => (
                                <CardBorder key={campaign.id} className="bg-indigo-950/80 hover:bg-indigo-900/80 transition-colors cursor-pointer">
                                    <div onClick={() => navigate(`/campaigns/${campaign.id}`)}>
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="font-bold text-lg text-white">{campaign.name}</h3>
                                            {getStatusBadge(campaign.status)}
                                        </div>

                                        <p className="text-indigo-300 text-sm mb-4 line-clamp-2">
                                            {campaign.description || 'Sem descrição'}
                                        </p>

                                        <div className="space-y-2 mb-4">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-indigo-400">Jogadores:</span>
                                                <span className="text-white">
                                                    {campaign.player_count || 0}/{campaign.max_players}
                                                </span>
                                            </div>

                                            <div className="flex justify-between text-sm">
                                                <span className="text-indigo-400">Sessão atual:</span>
                                                <span className="text-white">{campaign.current_session || 1}</span>
                                            </div>

                                            {campaign.dm_name && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-indigo-400">Mestre:</span>
                                                    <span className="text-white">{campaign.dm_name}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="text-xs text-indigo-400">
                                            Criada em: {new Date(campaign.created_at).toLocaleDateString('pt-BR')}
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-indigo-800">
                                        <Button
                                            buttonLabel="Ver Detalhes"
                                            onClick={() => navigate(`/campaigns/${campaign.id}`)}
                                            classname="w-full text-sm py-2 text-center"
                                        />
                                    </div>
                                </CardBorder>
                            ))}
                        </div>
                    )}
                </div>
            </Section>

            {/* Modais */}
            <CreateCampaignModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={handleCreateSuccess}
            />

            <JoinCampaignModal
                isOpen={showJoinModal}
                onClose={() => setShowJoinModal(false)}
                onSuccess={handleJoinSuccess}
            />
        </Page>
    );
};

export default CampaignsList;