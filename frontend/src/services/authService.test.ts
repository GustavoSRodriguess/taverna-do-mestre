import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as authService from './authService';

const mockFetch = vi.fn();

const buildResponse = (ok: boolean, status: number, jsonData: any) => ({
  ok,
  status,
  json: vi.fn().mockResolvedValue(jsonData),
}) as unknown as Response;

describe('authService', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    localStorage.clear();
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('login stores token and returns user on success', async () => {
    const credentials = { email: 'a@b.com', password: 'secret' };
    const user = { id: 1, username: 'tester', email: credentials.email };
    mockFetch.mockResolvedValueOnce(buildResponse(true, 200, { token: 'abc', user }));

    const result = await authService.login(credentials);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/users/login'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      }),
    );
    expect(localStorage.getItem('authToken')).toBe('abc');
    expect(result).toEqual(user);
  });

  it('login throws on http error and does not persist token', async () => {
    mockFetch.mockResolvedValueOnce(buildResponse(false, 401, {}));

    await expect(authService.login({ email: 'x@y.com', password: 'bad' })).rejects.toThrow('Erro na API: 401');
    expect(localStorage.getItem('authToken')).toBeNull();
  });

  it('register stores token and returns user', async () => {
    const data = { username: 'new', email: 'new@x.com', password: 'pwd' };
    const user = { id: 2, username: data.username, email: data.email };
    mockFetch.mockResolvedValueOnce(buildResponse(true, 201, { token: 'xyz', user }));

    const result = await authService.register(data);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/users/register'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    );
    expect(localStorage.getItem('authToken')).toBe('xyz');
    expect(result).toEqual(user);
  });

  it('logout clears token', () => {
    localStorage.setItem('authToken', 'token');
    authService.logout();
    expect(localStorage.getItem('authToken')).toBeNull();
  });

  it('isAuthenticated reflects token presence', () => {
    expect(authService.isAuthenticated()).toBe(false);
    localStorage.setItem('authToken', 'token');
    expect(authService.isAuthenticated()).toBe(true);
  });

  it('getAuthToken returns token value', () => {
    expect(authService.getAuthToken()).toBeNull();
    localStorage.setItem('authToken', 'token');
    expect(authService.getAuthToken()).toBe('token');
  });

  it('getCurrentUser returns null when no token', async () => {
    const result = await authService.getCurrentUser();
    expect(result).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('getCurrentUser removes token on 401', async () => {
    localStorage.setItem('authToken', 'token');
    mockFetch.mockResolvedValueOnce(buildResponse(false, 401, {}));

    const result = await authService.getCurrentUser();

    expect(result).toBeNull();
    expect(localStorage.getItem('authToken')).toBeNull();
  });

  it('getCurrentUser returns user on success', async () => {
    localStorage.setItem('authToken', 'token');
    const user = { id: 3, username: 'me', email: 'me@x.com' };
    mockFetch.mockResolvedValueOnce(buildResponse(true, 200, user));

    const result = await authService.getCurrentUser();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/users/me'),
      expect.objectContaining({
        headers: { Authorization: 'Bearer token' },
      }),
    );
    expect(result).toEqual(user);
    expect(localStorage.getItem('authToken')).toBe('token');
  });
});
