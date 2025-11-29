import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ReactNode } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from './Login';

const mockNavigate = vi.fn();
const mockLogin = vi.fn();
const mockRegister = vi.fn();

let authState = {
  login: mockLogin,
  register: mockRegister,
  isAuthenticated: false,
  error: null as string | null,
  loading: false,
};

let locationState: any = { state: undefined };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => locationState,
  };
});

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => authState,
}));

vi.mock('../../ui/Page', () => ({
  Page: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('../../ui/CardBorder', () => ({
  CardBorder: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

describe('Login', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockLogin.mockReset();
    mockRegister.mockReset();
    authState = {
      login: mockLogin,
      register: mockRegister,
      isAuthenticated: false,
      error: null,
      loading: false,
    };
    locationState = { state: undefined };
  });

  it('validates required fields on submit', () => {
    render(<Login />);

    const submitButton = screen.getByRole('button', { name: 'Entrar' });
    const form = submitButton.closest('form')!;
    form.noValidate = true;
    fireEvent.submit(form);
    expect(screen.getByText('Por favor, preencha todos os campos obrigatórios.')).toBeInTheDocument();
  });

  it('toggles register mode and validates password confirmation', () => {
    render(<Login />);

    fireEvent.click(screen.getByText('Registre-se'));
    fireEvent.change(screen.getByPlaceholderText('Seu nome completo'), { target: { value: 'User' } });
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'user@test.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: '123' } });
    fireEvent.change(screen.getByLabelText('Confirmar Senha'), { target: { value: '456' } });

    const form = screen.getByRole('button', { name: 'Criar Conta' }).closest('form')!;
    form.noValidate = true;
    fireEvent.submit(form);
    expect(screen.getByText('As senhas não coincidem.')).toBeInTheDocument();
  });

  it('calls login and navigates when authenticated', async () => {
    mockLogin.mockResolvedValue({ id: 1 });
    render(<Login />);

    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'user@test.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByText('Entrar'));

    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith({ email: 'user@test.com', password: 'secret' }));

    authState.isAuthenticated = true;
    locationState = { state: { from: { pathname: '/dashboard' } } };

    render(<Login />);
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('registers a new user with matching passwords', async () => {
    mockRegister.mockResolvedValue({ id: 2 });
    render(<Login />);

    fireEvent.click(screen.getByText('Registre-se'));
    fireEvent.change(screen.getByPlaceholderText('Seu nome completo'), { target: { value: 'User Test' } });
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'new@test.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'abc123' } });
    fireEvent.change(screen.getByLabelText('Confirmar Senha'), { target: { value: 'abc123' } });

    fireEvent.click(screen.getByRole('button', { name: 'Criar Conta' }));
    await waitFor(() =>
      expect(mockRegister).toHaveBeenCalledWith({
        username: 'User Test',
        email: 'new@test.com',
        password: 'abc123',
      })
    );
  });

  it('shows processing state when loading', () => {
    authState = {
      ...authState,
      loading: true,
    };
    render(<Login />);
    expect(screen.getByText('Processando...')).toBeInTheDocument();
  });
});
