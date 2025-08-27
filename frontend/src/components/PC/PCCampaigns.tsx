import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Page, Section, Button, CardBorder, Badge, Alert, Loading } from '../../ui';
import { pcService, PCCampaign } from '../../services/pcService';
import { FullCharacter } from '../../types/game';
import { ArrowLeft, Edit3, User, Sword, Zap, Theater, Search, Eye } from 'lucide-react';

const PCCampaigns: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [pc, setPC] = useState<FullCharacter | null>(null);
    const [campaigns, setCampaigns] = useState<PCCampaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const pcId = parseInt(id || '0');

    useEffect(() => {
        if (pcId) {
            loadPCAndCampaigns();
        }
    }, [pcId]);

    const loadPCAndCampaigns = async () => {
        try {
            setLoading(true);
            const [pcData, campaignsData] = await Promise.all([
                pcService.getPC(pcId),
                pcService.getPCCampaigns(pcId)
            ]);

            setPC(pcData);
            setCampaigns(campaignsData.campaigns || []);
        } catch (err: any) {
            setError(err.message || 'Erro ao carregar dados do personagem');
        } finally {
            setLoading(false);
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

    const getCharacterStatusBadge = (status: string) => {
        const statusMap = {
            active: { variant: 'success' as const, text: 'Ativo' },
            inactive: { variant: 'info' as const, text: 'Inativo' },
            dead: { variant: 'danger' as const, text: 'Morto' },
            retired: { variant: 'warning' as const, text: 'Aposentado' }
        };

        const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.active;
        return <Badge text={statusInfo.text} variant={statusInfo.variant} />;
    };

    const getModifier = (score: number): number => {
        return Math.floor((score - 10) / 2);
    };

    const formatModifier = (modifier: number): string => {
        return modifier >= 0 ? `+${modifier}` : modifier.toString();
    };

    if (loading) {
        return (
            <Page>
                <Section title="Carregando...">
                    <Loading text="Carregando campanhas do personagem..." />
                </Section>
            </Page>
        );
    }

    if (!pc) {
        return (
            <Page>
                <Section title="Personagem não encontrado">
                    <div className="text-center">
                        <p className="mb-4">O personagem solicitado não foi encontrado.</p>
                        <Button
                            buttonLabel="Voltar para Personagens"
                            onClick={() => navigate('/characters')}
                        />
                    </div>
                </Section>
            </Page>
        );
    }

    return (
        <Page>
            <Section title={`Campanhas de ${pc.name}`} className="py-8">
                <div className="max-w-6xl mx-auto">
                    {error && (
                        <Alert
                            message={error}
                            variant="error"
                            onClose={() => setError(null)}
                            className="mb-6"
                        />
                    )}

                    {/* Header com informações do personagem */}
                    <CardBorder className="mb-8 bg-indigo-950/80">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <div className="flex items-center gap-4 mb-4">
                                    <h2 className="text-2xl font-bold text-white">{pc.name}</h2>
                                    <Badge text={`Nível ${pc.level}`} variant="primary" />
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Informações básicas */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <User className="w-5 h-5 text-purple-400" />
                                            <h3 className="text-lg font-bold text-purple-400">Informações Básicas</h3>
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-indigo-400">Raça:</span>
                                                <span className="text-white">{pc.race}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-indigo-400">Classe:</span>
                                                <span className="text-white">{pc.class}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-indigo-400">Antecedente:</span>
                                                <span className="text-white">{pc.background || 'Não definido'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-indigo-400">Alinhamento:</span>
                                                <span className="text-white">{pc.alignment || 'Não definido'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Atributos de combate */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Sword className="w-5 h-5 text-purple-400" />
                                            <h3 className="text-lg font-bold text-purple-400">Combate</h3>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="text-center p-3 bg-red-900/30 rounded">
                                                <div className="text-red-300 text-xs">HP</div>
                                                <div className="text-white font-bold text-lg">
                                                    {pc.current_hp || pc.hp}/{pc.hp}
                                                </div>
                                            </div>
                                            <div className="text-center p-3 bg-blue-900/30 rounded">
                                                <div className="text-blue-300 text-xs">CA</div>
                                                <div className="text-white font-bold text-lg">{pc.ca}</div>
                                            </div>
                                            <div className="text-center p-3 bg-purple-900/30 rounded">
                                                <div className="text-purple-300 text-xs">PROF</div>
                                                <div className="text-white font-bold text-lg">+{pc.proficiency_bonus}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Atributos */}
                                <div className="mt-6">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Zap className="w-5 h-5 text-purple-400" />
                                        <h3 className="text-lg font-bold text-purple-400">Atributos</h3>
                                    </div>
                                    <div className="grid grid-cols-6 gap-4">
                                        {Object.entries(pc.attributes).map(([attr, value]) => {
                                            const modifier = getModifier(value as number);
                                            const labels = {
                                                strength: 'FOR',
                                                dexterity: 'DES',
                                                constitution: 'CON',
                                                intelligence: 'INT',
                                                wisdom: 'SAB',
                                                charisma: 'CAR'
                                            };

                                            return (
                                                <div key={attr} className="text-center p-3 bg-indigo-900/30 rounded">
                                                    <div className="text-indigo-300 text-xs font-bold">
                                                        {labels[attr as keyof typeof labels]}
                                                    </div>
                                                    <div className="text-white font-bold text-lg">{value as number}</div>
                                                    <div className="text-purple-300 text-sm">{formatModifier(modifier)}</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    buttonLabel={
                                        <div className="flex items-center gap-1">
                                            <ArrowLeft className="w-4 h-4" />
                                            <span>Voltar</span>
                                        </div>
                                    }
                                    onClick={() => navigate('/characters')}
                                    classname="bg-gray-600 hover:bg-gray-700"
                                />
                                <Button
                                    buttonLabel={
                                        <div className="flex items-center gap-1">
                                            <Edit3 className="w-4 h-4" />
                                            <span>Editar</span>
                                        </div>
                                    }
                                    onClick={() => navigate(`/pc-editor/${pc.id}`)}
                                />
                            </div>
                        </div>
                    </CardBorder>

                    {/* Lista de campanhas */}
                    <CardBorder className="bg-indigo-950/80">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2">
                                <Theater className="w-6 h-6 text-purple-400" />
                                <h3 className="text-xl font-bold text-purple-400">
                                    Campanhas ({campaigns.length})
                                </h3>
                            </div>
                            <Button
                                buttonLabel={
                                    <div className="flex items-center gap-1">
                                        <Search className="w-4 h-4" />
                                        <span>Procurar Campanhas</span>
                                    </div>
                                }
                                onClick={() => navigate('/campaigns')}
                                classname="bg-green-600 hover:bg-green-700"
                            />
                        </div>

                        {campaigns.length === 0 ? (
                            <div className="text-center py-8 text-indigo-300">
                                <Theater className="w-16 h-16 mx-auto mb-4 text-indigo-400" />
                                <h4 className="text-lg font-bold mb-2">Nenhuma campanha ativa</h4>
                                <p className="mb-4">
                                    Este personagem ainda não está participando de nenhuma campanha.
                                </p>
                                <Button
                                    buttonLabel={
                                        <div className="flex items-center gap-1">
                                            <Search className="w-4 h-4" />
                                            <span>Buscar Campanhas</span>
                                        </div>
                                    }
                                    onClick={() => navigate('/campaigns')}
                                    classname="bg-green-600 hover:bg-green-700"
                                />
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-4">
                                {campaigns.map((campaign) => (
                                    <CardBorder key={campaign.id} className="bg-indigo-900/50 hover:bg-indigo-800/50 transition-colors cursor-pointer">
                                        <div onClick={() => navigate(`/campaigns/${campaign.id}`)}>
                                            <div className="flex justify-between items-start mb-3">
                                                <h4 className="font-bold text-lg text-white">{campaign.name}</h4>
                                                <div className="flex flex-col gap-1">
                                                    {getStatusBadge(campaign.status)}
                                                    {getCharacterStatusBadge(campaign.character_status)}
                                                </div>
                                            </div>

                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-indigo-400">Mestre:</span>
                                                    <span className="text-white">{campaign.dm_name}</span>
                                                </div>

                                                <div className="flex justify-between">
                                                    <span className="text-indigo-400">Status do Personagem:</span>
                                                    <span className="text-white capitalize">{campaign.character_status}</span>
                                                </div>

                                                {campaign.current_hp !== undefined && (
                                                    <div className="flex justify-between">
                                                        <span className="text-indigo-400">HP na Campanha:</span>
                                                        <span className="text-white">
                                                            {campaign.current_hp}/{pc.hp}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Barra de HP específica da campanha */}
                                            {campaign.current_hp !== undefined && (
                                                <div className="mt-3">
                                                    <div className="bg-red-900 rounded-full h-2">
                                                        <div
                                                            className="bg-red-500 h-2 rounded-full transition-all duration-300"
                                                            style={{
                                                                width: `${Math.max((campaign.current_hp / pc.hp) * 100, 0)}%`
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-indigo-700">
                                            <Button
                                                buttonLabel={
                                                    <div className="flex items-center gap-1">
                                                        <Eye className="w-3 h-3" />
                                                        <span>Ver Campanha</span>
                                                    </div>
                                                }
                                                onClick={() => navigate(`/campaigns/${campaign.id}`)}
                                                classname="w-full text-sm py-2"
                                            />
                                        </div>
                                    </CardBorder>
                                ))}
                            </div>
                        )}
                    </CardBorder>
                </div>
            </Section>
        </Page>
    );
};

export default PCCampaigns;