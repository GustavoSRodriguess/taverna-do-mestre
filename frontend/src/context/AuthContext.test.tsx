import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import authService from '../services/authService';

vi.mock('../services/authService', () => ({
  default: {
    isAuthenticated: vi.fn(),
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

const mockService = authService as unknown as {
  isAuthenticated: ReturnType<typeof vi.fn>;
  getCurrentUser: ReturnType<typeof vi.fn>;
  login: ReturnType<typeof vi.fn>;
  register: ReturnType<typeof vi.fn>;
  logout: ReturnType<typeof vi.fn>;
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets error when register fails', async () => {
    mockService.isAuthenticated.mockReturnValue(false);
    mockService.register.mockRejectedValue(new Error('dup'));

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await act(async () => {
      await result.current.register({ username: 'x', email: 'x@y.com', password: '1' }).catch(() => {});
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error ?? '').toContain('Erro ao criar conta');
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('loads current user on mount when authenticated', async () => {
    mockService.isAuthenticated.mockReturnValue(true);
    mockService.getCurrentUser.mockResolvedValue({ id: 1, username: 'Alice', email: 'a@x.com' });

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user?.username).toBe('Alice');
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('logs in and sets user', async () => {
    mockService.isAuthenticated.mockReturnValue(false);
    mockService.login.mockResolvedValue({ id: 2, username: 'Bob', email: 'b@x.com' });

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await act(async () => {
      await result.current.login({ email: 'b@x.com', password: 'pwd' });
    });

    expect(result.current.user?.username).toBe('Bob');
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('sets error when login fails', async () => {
    mockService.isAuthenticated.mockReturnValue(false);
    mockService.login.mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await act(async () => {
      await result.current.login({ email: 'c@x.com', password: 'bad' }).catch(() => {});
    });
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error).toContain('Credenciais inválidas');
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('logs out and clears user', async () => {
    mockService.isAuthenticated.mockReturnValue(false);
    mockService.login.mockResolvedValue({ id: 3, username: 'Carol', email: 'c@x.com' });

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await act(async () => {
      await result.current.login({ email: 'c@x.com', password: 'pwd' });
    });
    expect(result.current.user).not.toBeNull();

    act(() => {
      result.current.logout();
    });

    expect(mockService.logout).toHaveBeenCalledTimes(1);
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
