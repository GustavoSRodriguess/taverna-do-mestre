import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';

// Mock user for testing
export const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
};

// Mock AuthContext
const MockAuthProvider: React.FC<{ children: React.ReactNode; user?: any }> = ({
  children,
  user = mockUser
}) => {
  const mockAuthContext = {
    user,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    loading: false,
  };

  return (
    <AuthProvider value={mockAuthContext as any}>
      {children}
    </AuthProvider>
  );
};

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  user?: any;
  route?: string;
}

// Custom render with providers
export function renderWithProviders(
  ui: ReactElement,
  {
    user = mockUser,
    route = '/',
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  window.history.pushState({}, 'Test page', route);

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BrowserRouter>
        <MockAuthProvider user={user}>
          {children}
        </MockAuthProvider>
      </BrowserRouter>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

export * from '@testing-library/react';
