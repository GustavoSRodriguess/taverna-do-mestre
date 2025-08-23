import React, { createContext, useContext, useState, useEffect, ReactNode, use } from 'react';
import authService from '../services/authService';

// Definição do tipo de usuário
type User = {
    id: number;
    username: string;
    email: string;
};

// Tipo das credenciais de login
type LoginCredentials = {
    email: string;
    password: string;
};

// Tipo dos dados de registro
type RegisterData = {
    username: string;
    email: string;
    password: string;
};

// Interface do contexto de autenticação
interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    isAuthenticated: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (userData: RegisterData) => Promise<void>;
    logout: () => void;
}

// Criação do contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props para o provedor de autenticação
interface AuthProviderProps {
    children: ReactNode;
}

// Provedor de autenticação
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Verificar autenticação ao inicializar
    useEffect(() => {
        const checkAuth = async () => {
            try {
                setLoading(true);
                if (authService.isAuthenticated()) {
                    const userData = await authService.getCurrentUser();
                    if (userData) {
                        setUser(userData);
                    }
                }
            } catch (err) {
                console.error('Erro ao verificar autenticação:', err);
                // Se ocorrer um erro, garantimos que o usuário está deslogado
                authService.logout();
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    // Função de login
    const login = async (credentials: LoginCredentials) => {
        setLoading(true);
        setError(null);

        try {
            const userData = await authService.login(credentials);
            setUser(userData);
        } catch (err) {
            setError('Credenciais inválidas. Por favor, tente novamente.');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Função de registro
    const register = async (userData: RegisterData) => {
        setLoading(true);
        setError(null);

        try {
            const newUser = await authService.register(userData);
            console.log(userData);
            setUser(newUser);
        } catch (err) {
            setError('Erro ao criar conta. Este e-mail pode já estar em uso.');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Função de logout
    const logout = () => {
        authService.logout();
        setUser(null);
    };

    // Valor do contexto
    const value = {
        user,
        loading,
        error,
        isAuthenticated: !!user,
        login,
        register,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook para usar o contexto de autenticação
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }

    return context;
};