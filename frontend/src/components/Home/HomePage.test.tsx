import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HomePage from './index';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = vi.fn();
let authState = { isAuthenticated: false };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => authState,
}));

const renderHome = () =>
  render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>
  );

describe('HomePage', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    authState = { isAuthenticated: false };
  });

  it('shows unauthenticated CTA and routes to login', () => {
    renderHome();

    fireEvent.click(screen.getByText('Começar'));
    expect(mockNavigate).toHaveBeenCalledWith('/login');
    expect(screen.getByText('O Que Você Pode Fazer?')).toBeInTheDocument();
  });

  it('uses authenticated CTAs and routes correctly', () => {
    authState = { isAuthenticated: true };

    renderHome();

    fireEvent.click(screen.getByText('Minhas Campanhas'));
    fireEvent.click(screen.getByText('Ir para Gerador'));

    expect(mockNavigate).toHaveBeenCalledWith('/campaigns');
    expect(mockNavigate).toHaveBeenCalledWith('/generator');
  });

  it('renders testimonials', () => {
    renderHome();
    expect(
      screen.getByText(/mudou completamente minhas sessões de RPG/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Poder reutilizar meus personagens/i)).toBeInTheDocument();
  });
});
