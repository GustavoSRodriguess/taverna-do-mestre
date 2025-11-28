import { describe, it, expect, beforeEach, vi } from 'vitest';
import apiService, { fetchFromAPI } from './apiService';

const mockFetch = vi.fn();
const buildResponse = (ok: boolean, status: number, jsonData: any) => ({
  ok,
  status,
  statusText: 'ERR',
  json: vi.fn().mockResolvedValue(jsonData),
}) as unknown as Response;

describe('fetchFromAPI', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    localStorage.clear();
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends auth header when token exists', async () => {
    localStorage.setItem('authToken', 't123');
    mockFetch.mockResolvedValueOnce(buildResponse(true, 200, { data: { ok: true } }));

    const result = await fetchFromAPI('/ping');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/ping'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer t123' }),
      }),
    );
    expect(result).toEqual({ ok: true });
  });

  it('returns .data or .results fallback', async () => {
    mockFetch.mockResolvedValueOnce(buildResponse(true, 200, { data: { a: 1 } }));
    const dataResult = await fetchFromAPI('/data');
    expect(dataResult).toEqual({ a: 1 });

    mockFetch.mockResolvedValueOnce(buildResponse(true, 200, { results: [1, 2] }));
    const results = await fetchFromAPI('/results');
    expect(results).toEqual([1, 2]);
  });

  it('throws with message from API when response not ok', async () => {
    mockFetch.mockResolvedValueOnce(buildResponse(false, 500, { message: 'fail' }));
    await expect(fetchFromAPI('/error')).rejects.toThrow('fail');
  });
});

describe('apiService helpers', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    localStorage.clear();
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('callGenerationEndpoint wraps POST and surfaces data', async () => {
    mockFetch.mockResolvedValueOnce(buildResponse(true, 200, { data: { generated: true } }));

    // @ts-expect-error accessing private for test
    const result = await apiService.callGenerationEndpoint('/npcs/generate', { foo: 'bar' });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/npcs/generate'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ foo: 'bar' }),
      }),
    );
    expect(result).toEqual({ generated: true });
  });

  it('transformToCharacterSheet maps attributes and modifiers', () => {
    const input = {
      name: 'Hero',
      race: 'Elf',
      class: 'Wizard',
      level: 5,
      attributes: { strength: 8, dexterity: 16, constitution: 12, intelligence: 18, wisdom: 10, charisma: 14 },
      abilities: { abilities: ['Spellcasting'], spells: ['Fireball'] },
      equipment: { items: ['Staff'] },
    };

    // @ts-expect-error accessing private for test
    const sheet = apiService.transformToCharacterSheet(input);

    expect(sheet.Nome).toBe('Hero');
    expect(sheet.Raca).toBe('Elf');
    expect(sheet.Classe).toBe('Wizard');
    expect(sheet.Nível).toBe(5);
    expect(sheet.Atributos['Destreza']).toBe(16);
    expect(sheet.Modificadores['Destreza']).toBe(3); // (16-10)/2
    expect(sheet.Habilidades).toEqual(['Spellcasting']);
    expect(sheet.Magias).toEqual(['Fireball']);
    expect(sheet.Equipamento).toEqual(['Staff']);
  });
});
