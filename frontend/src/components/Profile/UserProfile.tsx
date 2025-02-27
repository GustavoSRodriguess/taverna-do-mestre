import React from 'react';
import { Page } from '../../ui/Page';
import { CardBorder } from '../../ui/CardBorder';
import { Button } from '../../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const UserProfile: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
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
                                    <div className="text-white font-medium">{user?.name}</div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-indigo-300 mb-1">E-mail</label>
                                    <div className="text-white font-medium">{user?.email}</div>
                                </div>

                                <div className="pt-4">
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

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-indigo-300 mb-1">Personagens Criados</label>
                                    <div className="text-2xl font-bold text-white">3</div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-indigo-300 mb-1">NPCs Gerados</label>
                                    <div className="text-2xl font-bold text-white">12</div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-indigo-300 mb-1">Encontros Preparados</label>
                                    <div className="text-2xl font-bold text-white">5</div>
                                </div>

                                <div className="pt-4">
                                    <Button
                                        buttonLabel="Ver Todas as Criações"
                                        onClick={() => alert('Funcionalidade em desenvolvimento')}
                                        classname="w-full"
                                    />
                                </div>
                            </div>
                        </CardBorder>
                    </div>

                    {/* Seção de criações recentes */}
                    <div className="mt-8">
                        <CardBorder className="p-6 bg-indigo-950/80">
                            <h2 className="text-xl font-semibold text-white mb-4">Criações Recentes</h2>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Exemplo de criação recente */}
                                {[1, 2, 3].map((item) => (
                                    <div key={item} className="p-4 bg-indigo-900/50 rounded-lg hover:bg-indigo-800/50 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-medium text-indigo-200">Eldrin, o Guerreiro</h3>
                                            <span className="text-xs text-indigo-400">3 dias atrás</span>
                                        </div>
                                        <p className="text-sm text-indigo-300 mb-3">Humano - Nível 5</p>
                                        <Button
                                            buttonLabel="Editar"
                                            onClick={() => navigate('/char-creation')}
                                            classname="text-sm py-1 px-3"
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Botões de acesso rápido */}
                            <div className="mt-8 flex flex-wrap gap-4">
                                <Button
                                    buttonLabel="Criar Novo Personagem"
                                    onClick={() => navigate('/char-creation')}
                                />

                                <Button
                                    buttonLabel="Gerar NPC"
                                    onClick={() => navigate('/npc-creation')}
                                />

                                <Button
                                    buttonLabel="Preparar Encontro"
                                    onClick={() => navigate('/encounter-creation')}
                                />
                            </div>
                        </CardBorder>
                    </div>
                </div>
            </div>
        </Page>
    );
};

export default UserProfile;