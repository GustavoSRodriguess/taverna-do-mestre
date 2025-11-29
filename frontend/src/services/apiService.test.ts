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

  it('skips auth header and stringifies body, using statusText fallback on bad json', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'ERR',
      json: vi.fn().mockRejectedValue(new Error('boom')),
    } as unknown as Response);

    await expect(fetchFromAPI('/fail', 'POST', { foo: 'bar' })).rejects.toThrow('Error 500: ERR');
    const callArgs = mockFetch.mock.calls[0]?.[1] as RequestInit;
    expect(callArgs?.headers).not.toHaveProperty('Authorization');
    expect(callArgs?.body).toBe(JSON.stringify({ foo: 'bar' }));
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

  it('callGenerationEndpoint rethrows friendly error', async () => {
    mockFetch.mockResolvedValueOnce(buildResponse(false, 500, { message: 'fail gen' }));

    await expect(
      // @ts-expect-error accessing private for test
      apiService.callGenerationEndpoint('/npcs/generate', { foo: 'bar' })
    ).rejects.toThrow('Erro ao gerar conteúdo');
  });

  it('fetchFromAPI uses response message when not ok', async () => {
    mockFetch.mockResolvedValueOnce(buildResponse(false, 400, { message: 'bad stuff' }));

    await expect(fetchFromAPI('/error')).rejects.toThrow('bad stuff');
  });

  it('getCharacters returns empty array when fetch fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network down'));
    const result = await apiService.getCharacters();
    expect(result).toEqual([]);
  });

  it('generateLoot maps payload and response data', async () => {
    mockFetch.mockResolvedValueOnce(
      buildResponse(true, 200, {
        data: {
          level: 3,
          total_value: 500,
          hoards: [
            {
              value: 123,
              coins: { gold: 10 },
              valuables: [{ name: 'Gem', type: 'Gem', value: 50, rank: 'rare' }],
              items: [{ name: 'Sword', type: 'Weapon', value: 75 }],
            },
          ],
        },
      }),
    );

    const loot = await apiService.generateLoot({ level: '3', quantity: 2, ranks: ['minor'], more_random_coins: true });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/treasures/generate'),
      expect.objectContaining({ method: 'POST' }),
    );
    expect(loot.nivel).toBe(3);
    expect(loot.hoards[0].items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ nome: 'Gem', raridade: 'rare' }),
        expect.objectContaining({ nome: 'Sword', raridade: 'Comum' }),
      ]),
    );
  });

  it('generateNPC transforms manual attributes and abilities', async () => {
    mockFetch.mockResolvedValueOnce(
      buildResponse(true, 200, {
        data: {
          name: 'NPC',
          race: 'Elf',
          class: 'Rogue',
          level: 2,
          hp: 5,
          ca: 13,
          background: 'bg',
          attributes: { strength: 12 },
          abilities: { abilities: ['Hit'], spells: ['Fireball'] },
          equipment: { items: ['Dagger'] },
          description: 'desc',
        },
      }),
    );

    const npc = await apiService.generateNPC({ level: '2', manual: false });
    expect(npc.Nome).toBe('NPC');
    expect(npc.Atributos['Força']).toBe(12);
    expect(npc.Modificadores['Força']).toBe(1);
    expect(npc.Magias).toContain('Fireball');
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
