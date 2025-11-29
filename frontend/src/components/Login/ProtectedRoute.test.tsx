import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProtectedRoute from './ProtectedRoute';

let authState = { isAuthenticated: false, loading: false };

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => authState,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useLocation: () => ({ pathname: '/from' }),
    Navigate: ({ to }: { to: string }) => <div>Redirected:{to}</div>,
    Outlet: () => <div>OutletContent</div>,
  };
});

describe('ProtectedRoute', () => {
  it('shows loading state', () => {
    authState = { isAuthenticated: false, loading: true };
    render(<ProtectedRoute />);
    expect(screen.getByText('Verificando autenticação...')).toBeInTheDocument();
  });

  it('redirects when unauthenticated', () => {
    authState = { isAuthenticated: false, loading: false };
    render(<ProtectedRoute redirectPath="/login" />);
    expect(screen.getByText('Redirected:/login')).toBeInTheDocument();
  });

  it('renders outlet when authenticated', () => {
    authState = { isAuthenticated: true, loading: false };
    render(<ProtectedRoute />);
    expect(screen.getByText('OutletContent')).toBeInTheDocument();
  });
});
