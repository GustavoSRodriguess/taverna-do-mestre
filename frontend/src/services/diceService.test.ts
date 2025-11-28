import { describe, it, expect, beforeEach, vi } from 'vitest';
import { diceService } from './diceService';
import * as apiService from './apiService';
import { DiceRollRequest } from '../types/dice';

vi.mock('./apiService', () => ({
  fetchFromAPI: vi.fn(),
}));

describe('diceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('roll calls API with full payload and returns response', async () => {
    const notation = '2d6+3';
    const payload: DiceRollRequest = {
      notation,
      label: 'Attack',
      advantage: true,
      disadvantage: false,
    };
    const mockResponse = { notation, total: 10 };

    vi.mocked(apiService.fetchFromAPI).mockResolvedValue(mockResponse);

    const result = await diceService.roll(notation, payload.label, payload.advantage, payload.disadvantage);

    expect(apiService.fetchFromAPI).toHaveBeenCalledWith('/dice/roll', 'POST', payload);
    expect(result).toEqual(mockResponse);
  });

  it('roll omits optional flags when not provided', async () => {
    const notation = '1d20';
    const mockResponse = { notation, total: 15 };
    vi.mocked(apiService.fetchFromAPI).mockResolvedValue(mockResponse);

    const result = await diceService.roll(notation);

    expect(apiService.fetchFromAPI).toHaveBeenCalledWith(
      '/dice/roll',
      'POST',
      { notation, label: undefined, advantage: undefined, disadvantage: undefined }
    );
    expect(result).toEqual(mockResponse);
  });

  it('rollMultiple sends batch request', async () => {
    const requests: DiceRollRequest[] = [
      { notation: '1d8', label: 'Damage' },
      { notation: '1d20', advantage: true },
    ];
    const mockResponse = [
      { notation: '1d8', total: 5 },
      { notation: '1d20', total: 18 },
    ];

    vi.mocked(apiService.fetchFromAPI).mockResolvedValue(mockResponse);

    const result = await diceService.rollMultiple(requests);

    expect(apiService.fetchFromAPI).toHaveBeenCalledWith('/dice/roll-multiple', 'POST', requests);
    expect(result).toEqual(mockResponse);
  });
});
