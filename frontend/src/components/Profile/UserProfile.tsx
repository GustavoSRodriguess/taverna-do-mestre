import React, { useState, useEffect } from 'react';
import { Page } from '../../ui/Page';
import { CardBorder } from '../../ui/CardBorder';
import { Button } from '../../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { pcService } from '../../services/pcService';
import { campaignService } from '../../services/campaignService';
import { homebrewService } from '../../services/homebrewService';
import { FullCharacter } from '../../types/game';

interface UserStats {
    totalPCs: number;
    totalCampaignsCreated: number;
    totalCampaignsJoined: number;
    totalHomebrews: number;
}

const UserProfile: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [recentPCs, setRecentPCs] = useState<FullCharacter[]>([]);
    const [stats, setStats] = useState<UserStats>({
        totalPCs: 0,
        totalCampaignsCreated: 0,
        totalCampaignsJoined: 0,
        totalHomebrews: 0
    });
    const [loading, setLoading] = useState(true);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setLoading(true);

                // Buscar dados em paralelo
                const [pcsResponse, campaignsResponse, racesResponse, classesResponse, backgroundsResponse] = await Promise.all([
                    pcService.getPCs(100, 0),
                    campaignService.getCampaigns(),
                    homebrewService.getRaces(100, 0),
                    homebrewService.getClasses(100, 0),
                    homebrewService.getBackgrounds(100, 0)
                ]);

                // PCs
                const allPCs = pcsResponse.results?.pcs || pcsResponse.pcs || [];
                const sortedPCs = allPCs.sort((a: FullCharacter, b: FullCharacter) => {
                    const dateA = new Date(a.created_at || 0).getTime();
                    const dateB = new Date(b.created_at || 0).getTime();
                    return dateB - dateA;
                });
                setRecentPCs(sortedPCs.slice(0, 3));

                // Campanhas
                const allCampaigns = campaignsResponse.campaigns || [];
                const campaignsCreated = allCampaigns.filter(c => c.dm_id === user?.id);
                const campaignsJoined = allCampaigns.length;

                // Homebrews
                const totalRaces = racesResponse.races?.length || 0;
                const totalClasses = classesResponse.classes?.length || 0;
                const totalBackgrounds = backgroundsResponse.backgrounds?.length || 0;

                // Atualizar estatísticas
                setStats({
                    totalPCs: allPCs.length,
                    totalCampaignsCreated: campaignsCreated.length,
                    totalCampaignsJoined: campaignsJoined,
                    totalHomebrews: totalRaces + totalClasses + totalBackgrounds
                });
            } catch (error) {
                console.error('Erro ao carregar dados do usuário:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [user?.id]);

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Sem data';

        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Hoje';
        if (diffDays === 1) return 'Ontem';
        if (diffDays < 7) return `${diffDays} dias atrás`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás`;
        return `${Math.floor(diffDays / 30)} meses atrás`;
    };

    return (
        <Page>
            <div className="py-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold text-white mb-8">Meu Perfil</h1>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Informações do usuário */}
                        <CardBorder className="col-span-2 p-6 bg-indigo-950/80">
                            <h2 className="text-xl font-semibold text-white mb-4">Informações Pessoais</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-indigo-300 mb-1">Nome</label>
                                    <div className="text-white font-medium">{user?.username}</div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-indigo-300 mb-1">E-mail</label>
                                    <div className="text-white font-medium">{user?.email}</div>
                                </div>

                                <div className="pt-4 flex display-inline gap-4">
                                    <Button
                                        buttonLabel="Editar Perfil"
                                        onClick={() => alert('Funcionalidade em desenvolvimento')}
                                        classname="mr-4"
                                    />

                                    <Button
                                        buttonLabel="Sair"
                                        onClick={handleLogout}
                                        classname="bg-red-600 hover:bg-red-700"
                                    />
                                </div>
                            </div>
                        </CardBorder>

                        {/* Estatísticas */}
                        <CardBorder className="p-6 bg-indigo-950/80">
                            <h2 className="text-xl font-semibold text-white mb-4">Suas Estatísticas</h2>

                            {loading ? (
                                <div className="space-y-4">
                                    <div className="animate-pulse">
                                        <div className="h-4 bg-indigo-800 rounded w-3/4 mb-2"></div>
                                        <div className="h-8 bg-indigo-800 rounded w-1/2"></div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-indigo-300 mb-1">Personagens Criados</label>
                                        <div className="text-2xl font-bold text-white">{stats.totalPCs}</div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-indigo-300 mb-1">Campanhas Criadas</label>
                                        <div className="text-2xl font-bold text-white">{stats.totalCampaignsCreated}</div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-indigo-300 mb-1">Campanhas Participando</label>
                                        <div className="text-2xl font-bold text-white">{stats.totalCampaignsJoined}</div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-indigo-300 mb-1">Homebrews Criados</label>
                                        <div className="text-2xl font-bold text-white">{stats.totalHomebrews}</div>
                                    </div>

                                    <div className="pt-4">
                                        <Button
                                            buttonLabel="Ver Todos os Personagens"
                                            onClick={() => navigate('/my-characters')}
                                            classname="w-full"
                                        />
                                    </div>
                                </div>
                            )}
                        </CardBorder>
                    </div>

                    {/* Seção de criações recentes */}
                    <div className="mt-8">
                        <CardBorder className="p-6 bg-indigo-950/80">
                            <h2 className="text-xl font-semibold text-white mb-4">Personagens Recentes</h2>

                            {loading ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {[1, 2, 3].map((item) => (
                                        <div key={item} className="p-4 bg-indigo-900/50 rounded-lg animate-pulse">
                                            <div className="h-4 bg-indigo-800 rounded w-3/4 mb-2"></div>
                                            <div className="h-3 bg-indigo-800 rounded w-1/2 mb-3"></div>
                                            <div className="h-8 bg-indigo-800 rounded w-20"></div>
                                        </div>
                                    ))}
                                </div>
                            ) : recentPCs.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {recentPCs.map((pc) => (
                                        <div key={pc.id} className="p-4 bg-indigo-900/50 rounded-lg hover:bg-indigo-800/50 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-medium text-indigo-200">{pc.name}</h3>
                                                <span className="text-xs text-indigo-400">{formatDate(pc.created_at)}</span>
                                            </div>
                                            <p className="text-sm text-indigo-300 mb-3">
                                                {pc.race} {pc.class} - Nível {pc.level}
                                            </p>
                                            <Button
                                                buttonLabel="Editar"
                                                onClick={() => navigate(`/char-creation/${pc.id}`)}
                                                classname="text-sm py-1 px-3"
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-indigo-300 mb-4">Você ainda não criou nenhum personagem.</p>
                                    <Button
                                        buttonLabel="Criar Seu Primeiro Personagem"
                                        onClick={() => navigate('/char-creation')}
                                    />
                                </div>
                            )}

                            {/* Botões de acesso rápido */}
                            {recentPCs.length > 0 && (
                                <div className="mt-8 flex flex-wrap gap-4">
                                    <Button
                                        buttonLabel="Criar Novo Personagem"
                                        onClick={() => navigate('/char-creation')}
                                    />

                                    <Button
                                        buttonLabel="Ver Campanhas"
                                        onClick={() => navigate('/campaigns')}
                                    />

                                    <Button
                                        buttonLabel="Criar Homebrew"
                                        onClick={() => navigate('/homebrew')}
                                    />
                                </div>
                            )}
                        </CardBorder>
                    </div>
                </div>
            </div>
        </Page>
    );
};

export default UserProfile;