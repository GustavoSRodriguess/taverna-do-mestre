import React, { useState, useEffect } from 'react';
import { Page } from '../../ui/Page';
import { CardBorder } from '../../ui/CardBorder';
import { Button } from '../../ui/Button';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, register, isAuthenticated, error: authError, loading } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');

    useEffect(() => {
        if (isAuthenticated) {
            const from = (location.state as any)?.from?.pathname || '/';
            navigate(from);
        }
    }, [isAuthenticated, navigate, location]);

    useEffect(() => {
        if (authError) {
            setError(authError);
        }
    }, [authError]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setError(null);

        if (!email || !password) {
            setError('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        if (isRegisterMode) {
            if (!name) {
                setError('Por favor, informe seu nome.');
                return;
            }

            if (password !== confirmPassword) {
                setError('As senhas não coincidem.');
                return;
            }

            try {
                await register({ name, email, password });
            } catch (err) {
                console.error('Erro', err);
            }
        } else {
            try {
                await login({ email, password });
            } catch (err) {
                console.error('Erro', err);
            }
        }
    };

    return (
        <Page>
            <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <CardBorder className="max-w-md w-full p-8 bg-indigo-950/80">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-white">
                            {isRegisterMode ? 'Criar Conta' : 'Login'}
                        </h2>
                        <p className="mt-2 text-indigo-300">
                            {isRegisterMode
                                ? 'Crie sua conta para começar a criar aventuras incríveis!'
                                : 'Entre em sua conta para acessar suas criações de RPG.'}
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-900/50 border border-red-800 text-red-200 px-4 py-3 rounded mb-4">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {isRegisterMode && (
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-indigo-200 mb-1">
                                    Nome Completo
                                </label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-3 py-2 border border-indigo-700 rounded-md 
                             focus:outline-none focus:ring-2 focus:ring-indigo-500 
                             bg-indigo-900/50 text-white"
                                    placeholder="Seu nome completo"
                                />
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-indigo-200 mb-1">
                                E-mail
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 py-2 border border-indigo-700 rounded-md 
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 
                           bg-indigo-900/50 text-white"
                                placeholder="seu-email@exemplo.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-indigo-200 mb-1">
                                Senha
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete={isRegisterMode ? "new-password" : "current-password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-indigo-700 rounded-md 
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 
                           bg-indigo-900/50 text-white"
                                placeholder={isRegisterMode ? "Crie uma senha forte" : "Sua senha"}
                            />
                        </div>

                        {isRegisterMode && (
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-indigo-200 mb-1">
                                    Confirmar Senha
                                </label>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-3 py-2 border border-indigo-700 rounded-md 
                             focus:outline-none focus:ring-2 focus:ring-indigo-500 
                             bg-indigo-900/50 text-white"
                                    placeholder="Confirme sua senha"
                                />
                            </div>
                        )}

                        {!isRegisterMode && (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <input
                                        id="remember_me"
                                        name="remember_me"
                                        type="checkbox"
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-indigo-700 rounded"
                                    />
                                    <label htmlFor="remember_me" className="ml-2 block text-sm text-indigo-200">
                                        Lembrar de mim
                                    </label>
                                </div>

                                <div className="text-sm">
                                    <a href="#" className="text-indigo-400 hover:text-indigo-300">
                                        Esqueceu sua senha?
                                    </a>
                                </div>
                            </div>
                        )}

                        <div>
                            <Button
                                buttonLabel={isRegisterMode ? "Criar Conta" : "Entrar"}
                                onClick={() => { }}
                                classname="w-full py-3 text-lg"
                                type="submit"
                                disabled={loading}
                            />

                            {loading && (
                                <div className="text-center mt-2 text-indigo-300">
                                    <p>Processando...</p>
                                </div>
                            )}
                        </div>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-indigo-300">
                            {isRegisterMode
                                ? "Já tem uma conta?"
                                : "Não tem uma conta ainda?"}
                            {" "}
                            <button
                                onClick={() => {
                                    setIsRegisterMode(!isRegisterMode);
                                    setError(null);
                                }}
                                className="text-purple-400 hover:text-purple-300 font-medium"
                            >
                                {isRegisterMode ? "Faça login" : "Registre-se"}
                            </button>
                        </p>
                    </div>
                </CardBorder>
            </div>
        </Page>
    );
};

export default Login;