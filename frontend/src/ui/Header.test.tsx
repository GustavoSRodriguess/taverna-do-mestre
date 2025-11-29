import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import Header from './Header';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = vi.fn();
const mockLogout = vi.fn();

let authState = {
  user: null as { username: string } | null,
  isAuthenticated: false,
  logout: mockLogout,
};

vi.mock('../context/AuthContext', () => ({
  useAuth: () => authState,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderHeader = () =>
  render(
    <MemoryRouter>
      <Header
        logo="Logo"
        menuItems={[
          { label: 'Inicio', href: '/' },
          { label: 'Contato', href: '/contato' },
        ]}
      />
    </MemoryRouter>
  );

describe('Header', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockLogout.mockReset();
    authState = { user: null, isAuthenticated: false, logout: mockLogout };
  });

  it('renders login link when not authenticated', () => {
    renderHeader();
    expect(screen.getByText('Login / Registro')).toBeInTheDocument();
    expect(screen.queryByText('Sair')).not.toBeInTheDocument();
  });

  it('shows user dropdown and performs logout', () => {
    authState = {
      user: { username: 'Alice Mage' },
      isAuthenticated: true,
      logout: mockLogout,
    };

    renderHeader();

    const avatarButton = screen.getByText('Alice');
    fireEvent.click(avatarButton);
    fireEvent.click(screen.getByText('Sair'));

    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('toggles mobile menu and shows menu items', () => {
    renderHeader();

    const toggle = screen.getByRole('button');
    fireEvent.click(toggle);

    const navigations = screen.getAllByRole('navigation');
    const mobileNav = navigations[navigations.length - 1];
    expect(within(mobileNav).getByText('Inicio')).toBeInTheDocument();
    expect(within(mobileNav).getByText('Contato')).toBeInTheDocument();
  });
});
