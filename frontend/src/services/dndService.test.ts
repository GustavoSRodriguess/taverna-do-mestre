import { describe, it, expect, beforeEach, vi } from 'vitest';
import dndService, {
  formatChallengeRating,
  getAbilityModifier,
  formatModifier,
  getProficiencyBonusByCR,
  getCRColor,
  getSpellLevelColor,
  formatSpellLevel,
} from './dndService';
import * as apiService from './apiService';

vi.mock('./apiService', () => ({
  fetchFromAPI: vi.fn(),
}));

const mockFetch = vi.mocked(apiService.fetchFromAPI);

describe('dndService endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds query for spells with filters', async () => {
    mockFetch.mockResolvedValueOnce({ results: [] });
    await dndService.getSpells({ limit: 10, offset: 5, search: 'fire', level: 3, school: 'evocation', class: 'wizard' });
    expect(mockFetch).toHaveBeenCalledWith('/dnd/spells?limit=10&offset=5&search=fire&level=3&school=evocation&class=wizard');
  });

  it('builds query for monsters with cr and type', async () => {
    mockFetch.mockResolvedValueOnce({ results: [] });
    await dndService.getMonsters({ challenge_rating: 5, type: 'dragon' });
    expect(mockFetch).toHaveBeenCalledWith('/dnd/monsters?challenge_rating=5&type=dragon');
  });

  it('wraps array responses into default pagination', async () => {
    mockFetch.mockResolvedValueOnce([{ index: 'elf' }]);
    const result = await dndService.getRaces();
    expect(result).toEqual({ results: [{ index: 'elf' }], limit: 50, offset: 0 });
  });
});

describe('dndService helpers', () => {
  it('formats challenge rating fractions', () => {
    expect(formatChallengeRating(0.125)).toBe('1/8');
    expect(formatChallengeRating(0.25)).toBe('1/4');
    expect(formatChallengeRating(0.5)).toBe('1/2');
    expect(formatChallengeRating(2)).toBe('2');
  });

  it('calculates ability modifier and formats', () => {
    expect(getAbilityModifier(18)).toBe(4);
    expect(getAbilityModifier(9)).toBe(-1);
    expect(formatModifier(3)).toBe('+3');
    expect(formatModifier(-2)).toBe('-2');
  });

  it('returns proficiency bonus by CR ranges', () => {
    expect(getProficiencyBonusByCR(1)).toBe(2);
    expect(getProficiencyBonusByCR(6)).toBe(3);
    expect(getProficiencyBonusByCR(10)).toBe(4);
    expect(getProficiencyBonusByCR(14)).toBe(5);
    expect(getProficiencyBonusByCR(20)).toBe(6);
  });

  it('maps CR to color buckets', () => {
    expect(getCRColor(1)).toBe('text-green-600');
    expect(getCRColor(4)).toBe('text-yellow-600');
    expect(getCRColor(8)).toBe('text-orange-600');
    expect(getCRColor(12)).toBe('text-red-600');
    expect(getCRColor(18)).toBe('text-purple-600');
  });

  it('maps spell levels to colors', () => {
    expect(getSpellLevelColor(0)).toBe('text-gray-600');
    expect(getSpellLevelColor(3)).toBe('text-yellow-600');
    expect(getSpellLevelColor(9)).toBe('text-gray-800');
    expect(getSpellLevelColor(99)).toBe('text-gray-600');
  });

  it('formats spell level labels', () => {
    expect(formatSpellLevel(0)).toBe('Cantrip');
    expect(formatSpellLevel(5)).toBe('5º Nível');
  });
});
