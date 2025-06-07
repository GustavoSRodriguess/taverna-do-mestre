// frontend/src/components/Campaigns/CampaignDetails.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Page, Section, Button, CardBorder, Badge, Alert, Tabs, Modal } from '../../ui';
import { campaignService, Campaign, CampaignCharacter } from '../../services/campaignService';
import { useAuth } from '../../context/AuthContext';
import CampaignCharacters from './CampaignCharacters';
import CampaignSettings from './CampaignSettings';

const CampaignDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [characters, setCharacters] = useState<CampaignCharacter[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteCode, setInviteCode] = useState('');

    const campaignId = parseInt(id || '0');
    const isDM = campaign && user && campaign.dm_id === parseInt(user.id);

    const loadCampaign = async () => {
        try {
            setLoading(true);
            const campaignData = await campaignService.getCampaign(campaignId);
            setCampaign(campaignData);
        } catch (err) {
            setError('Erro ao carregar campanha');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadCharacters = async () => {
        try {
            const response = await campaignService.getCampaignCharacters(campaignId);
            setCharacters(response.characters || []);
        } catch (err) {
            console.error('Erro ao carregar personagens:', err);
        }
    };

    useEffect(() => {
        if (campaignId) {
            loadCampaign();
            loadCharacters();
        }
    }, [campaignId]);

    const handleShowInviteCode = async () => {
        try {
            const response = await campaignService.getInviteCode(campaignId);
            setInviteCode(response.invite_code);
            setShowInviteModal(true);
        } catch (err) {
            setError('Erro ao obter código de convite');
            console.error(err);
        }
    };

    const handleRegenerateCode = async () => {
        try {
            const response = await campaignService.regenerateInviteCode(campaignId);
            setInviteCode(response.invite_code);
            setError(null);
        } catch (err) {
            setError('Erro ao regenerar código');
            console.error(err);
        }
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            alert('Código copiado para a área de transferência!');
        } catch (err) {
            console.error('Erro ao copiar:', err);
        }
    };

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

    const tabs = [
        { id: 'overview', label: 'Visão Geral', icon: '📋' },
        { id: 'characters', label: 'Personagens', icon: '🧙‍♂️' },
        ...(isDM ? [{ id: 'settings', label: 'Configurações', icon: '⚙️' }] : [])
    ];

    if (loading) {
        return (
            <Page>
                <Section title="Carregando campanha...">
                    <div className="text-center">
                        <p>Carregando detalhes da campanha...</p>
                    </div>
                </Section>
            </Page>
        );
    }

    if (!campaign) {
        return (
            <Page>
                <Section title="Campanha não encontrada">
                    <div className="text-center">
                        <p className="mb-4">A campanha solicitada não foi encontrada.</p>
                        <Button
                            buttonLabel="Voltar para Campanhas"
                            onClick={() => navigate('/campaigns')}
                        />
                    </div>
                </Section>
            </Page>
        );
    }

    return (
        <Page>
            <Section title={campaign.name} className="py-8">
                <div className="max-w-6xl mx-auto">
                    {error && (
                        <Alert
                            message={error}
                            variant="error"
                            onClose={() => setError(null)}
                            className="mb-6"
                        />
                    )}

                    {/* Header da campanha */}
                    <CardBorder className="mb-8 bg-indigo-950/80">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-4 mb-2">
                                    <h2 className="text-2xl font-bold text-white">{campaign.name}</h2>
                                    {getStatusBadge(campaign.status)}
                                </div>

                                {campaign.description && (
                                    <p className="text-indigo-300 mb-4">{campaign.description}</p>
                                )}

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <span className="text-indigo-400">Jogadores:</span>
                                        <span className="text-white ml-2">
                                            {campaign.player_count || 0}/{campaign.max_players}
                                        </span>
                                    </div>

                                    <div>
                                        <span className="text-indigo-400">Sessão:</span>
                                        <span className="text-white ml-2">{campaign.current_session || 1}</span>
                                    </div>

                                    <div>
                                        <span className="text-indigo-400">Mestre:</span>
                                        <span className="text-white ml-2">{campaign.dm_name || 'Desconhecido'}</span>
                                    </div>

                                    <div>
                                        <span className="text-indigo-400">Criada em:</span>
                                        <span className="text-white ml-2">
                                            {new Date(campaign.created_at).toLocaleDateString('pt-BR')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    buttonLabel="Voltar"
                                    onClick={() => navigate('/campaigns')}
                                    classname="bg-gray-600 hover:bg-gray-700"
                                />

                                {isDM && (
                                    <Button
                                        buttonLabel="Código de Convite"
                                        onClick={handleShowInviteCode}
                                        classname="bg-green-600 hover:bg-green-700"
                                    />
                                )}
                            </div>
                        </div>
                    </CardBorder>

                    {/* Tabs */}
                    <Tabs
                        tabs={tabs}
                        defaultTabId="overview"
                        onChange={setActiveTab}
                        className="mb-6"
                    />

                    {/* Conteúdo das tabs */}
                    <div className="min-h-96">
                        {activeTab === 'overview' && (
                            <div className="grid md:grid-cols-2 gap-6">
                                <CardBorder className="bg-indigo-950/80">
                                    <h3 className="text-xl font-bold mb-4">Informações da Campanha</h3>

                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-indigo-400">Status:</span>
                                            {getStatusBadge(campaign.status)}
                                        </div>

                                        <div className="flex justify-between">
                                            <span className="text-indigo-400">Máximo de jogadores:</span>
                                            <span className="text-white">{campaign.max_players}</span>
                                        </div>

                                        <div className="flex justify-between">
                                            <span className="text-indigo-400">Sessão atual:</span>
                                            <span className="text-white">{campaign.current_session || 1}</span>
                                        </div>

                                        <div className="flex justify-between">
                                            <span className="text-indigo-400">Última atualização:</span>
                                            <span className="text-white">
                                                {new Date(campaign.updated_at).toLocaleDateString('pt-BR')}
                                            </span>
                                        </div>
                                    </div>
                                </CardBorder>

                                <CardBorder className="bg-indigo-950/80">
                                    <h3 className="text-xl font-bold mb-4">Resumo dos Personagens</h3>

                                    {characters.length === 0 ? (
                                        <p className="text-indigo-300">Nenhum personagem na campanha ainda.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {characters.slice(0, 4).map((character) => (
                                                <div key={character.id} className="flex justify-between items-center p-3 bg-indigo-900/50 rounded">
                                                    <div>
                                                        <div className="font-medium text-white">
                                                            {character.pc?.name || 'Nome não disponível'}
                                                        </div>
                                                        <div className="text-sm text-indigo-300">
                                                            {character.pc?.race} {character.pc?.class} - Nível {character.pc?.level}
                                                        </div>
                                                    </div>
                                                    <div className="text-sm text-indigo-400">
                                                        {character.player?.username}
                                                    </div>
                                                </div>
                                            ))}

                                            {characters.length > 4 && (
                                                <div className="text-center text-indigo-400 text-sm">
                                                    +{characters.length - 4} personagens adicionais
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardBorder>
                            </div>
                        )}

                        {activeTab === 'characters' && (
                            <CampaignCharacters
                                campaignId={campaignId}
                                characters={characters}
                                isDM={isDM || false}
                                onCharactersChange={loadCharacters}
                            />
                        )}

                        {activeTab === 'settings' && isDM && (
                            <CampaignSettings
                                campaign={campaign}
                                onCampaignUpdate={loadCampaign}
                            />
                        )}
                    </div>
                </div>
            </Section>

            {/* Modal do código de convite */}
            <Modal
                isOpen={showInviteModal}
                onClose={() => setShowInviteModal(false)}
                title="Código de Convite da Campanha"
                size="md"
            >
                <div className="space-y-4">
                    <div className="text-center">
                        <div className="text-3xl font-mono bg-indigo-900/50 p-4 rounded-lg border border-indigo-700">
                            {inviteCode}
                        </div>
                        <p className="text-indigo-300 text-sm mt-2">
                            Compartilhe este código com seus jogadores
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            buttonLabel="Copiar Código"
                            onClick={() => copyToClipboard(inviteCode)}
                            classname="flex-1"
                        />
                        <Button
                            buttonLabel="Gerar Novo"
                            onClick={handleRegenerateCode}
                            classname="flex-1 bg-yellow-600 hover:bg-yellow-700"
                        />
                    </div>

                    <div className="bg-yellow-900/20 p-3 rounded border border-yellow-600/30">
                        <p className="text-yellow-200 text-sm">
                            ⚠️ Ao gerar um novo código, o código anterior ficará inválido.
                        </p>
                    </div>
                </div>
            </Modal>
        </Page>
    );
};

export default CampaignDetails;