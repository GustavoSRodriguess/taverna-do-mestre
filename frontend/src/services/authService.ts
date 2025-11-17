type LoginCredentials = {
    email: string;
    password: string;
};

type RegisterData = {
    username: string;
    email: string;
    password: string;
};

type User = {
    id: number;
    username: string;
    email: string;
};

const API_BASE_URL =
  import.meta.env.DEV
    ? "http://localhost:8080/api" // desenvolvimento
    : "/api";                     // produção (SWA vai fazer o proxy)

export const login = async (credentials: LoginCredentials): Promise<User> => {
    try {
        const response = await fetch(`${API_BASE_URL}/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
        });

        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status}`);
        }

        const data = await response.json();

        if (data.token) {
            localStorage.setItem('authToken', data.token);
        }

        return data.user;
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        throw error;
    }
};

export const register = async (userData: RegisterData): Promise<User> => {
    try {
        console.log(userData)
        const response = await fetch(`${API_BASE_URL}/users/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });

        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status}`);
        }

        const data = await response.json();

        // Salvar token no localStorage para uso futuro
        if (data.token) {
            localStorage.setItem('authToken', data.token);
        }

        return data.user;
    } catch (error) {
        console.error('Erro ao fazer registro:', error);
        throw error;
    }
};

// Logout
export const logout = (): void => {
    localStorage.removeItem('authToken');
};

// Verificar se o usuário está autenticado
export const isAuthenticated = (): boolean => {
    console.log('chego aqui');
    console.log(!!localStorage.getItem('authToken'));
    return !!localStorage.getItem('authToken');
};

// Obter token de autenticação
export const getAuthToken = (): string | null => {
    return localStorage.getItem('authToken');
};

// Obter usuário atual (pode ser usado para verificar a sessão ao carregar a página)
export const getCurrentUser = async (): Promise<User | null> => {
    const token = getAuthToken();

    if (!token) {
        return null;
    }

    try {
        if (USE_MOCKS) {
            await new Promise(resolve => setTimeout(resolve, 300));

            return {
                id: 1,
                username: 'Usuário Mockado',
                email: 'usuario@exemplo.com',
            };
        }

        const response = await fetch(`${API_BASE_URL}/users/me`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('authToken');
                return null;
            }
            throw new Error(`Erro na API: ${response.status}`);
        }

        return response.json();
    } catch (error) {
        console.error('Erro ao obter usuário atual:', error);
        return null;
    }
};

// Para desenvolvimento (versões mockadas)
export const mockLogin = async (credentials: LoginCredentials): Promise<User> => {
    // Simula um atraso de rede
    await new Promise(resolve => setTimeout(resolve, 800));

    // Verifica as credenciais (para testes)
    if (credentials.email === 'admin@example.com' && credentials.password === 'password') {
        const user = {
            id: 1,
            username: 'Admin User',
            email: credentials.email,
        };

        // Simula um token
        localStorage.setItem('authToken', 'mock-jwt-token-12345');

        return user;
    }

    throw new Error('Credenciais inválidas');
};

export const mockRegister = async (userData: RegisterData): Promise<User> => {
    // Simula um atraso de rede
    await new Promise(resolve => setTimeout(resolve, 800));

    // Simula verificação de email já existente
    if (userData.email === 'admin@example.com') {
        throw new Error('Este e-mail já está em uso.');
    }

    const user = {
        id: Math.floor(Math.random() * 1000),
        username: userData.username,
        email: userData.email,
    };

    // Simula um token
    localStorage.setItem('authToken', 'mock-jwt-token-' + Math.random().toString(36).substr(2, 9));

    return user;
};

// Função auxiliar para decidir qual versão usar (real ou mock)
const USE_MOCKS = false;

export default {
    login: USE_MOCKS ? mockLogin : login,
    register: USE_MOCKS ? mockRegister : register,
    logout,
    isAuthenticated,
    getAuthToken,
    getCurrentUser,
};