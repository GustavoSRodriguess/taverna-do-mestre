import { describe, it, expect, beforeEach, vi } from 'vitest';
import { pcService } from './pcService';
import * as apiService from './apiService';

// Mock do apiService
vi.mock('./apiService', () => ({
  fetchFromAPI: vi.fn(),
}));

describe('pcService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPCs', () => {
    it('should fetch PCs with default parameters', async () => {
      const mockPCs = [
        { id: 1, name: 'Aragorn', class: 'Ranger', level: 10 },
        { id: 2, name: 'Legolas', class: 'Ranger', level: 9 },
      ];

      vi.mocked(apiService.fetchFromAPI).mockResolvedValue({
        pcs: mockPCs,
        count: 2,
      });

      const result = await pcService.getPCs();

      expect(apiService.fetchFromAPI).toHaveBeenCalledWith('/pcs?limit=20&offset=0');
      expect(result.pcs).toEqual(mockPCs);
      expect(result.count).toBe(2);
    });

    it('should fetch PCs with custom limit and offset', async () => {
      const mockPCs = [{ id: 3, name: 'Gimli', class: 'Fighter', level: 8 }];

      vi.mocked(apiService.fetchFromAPI).mockResolvedValue({
        pcs: mockPCs,
        count: 1,
      });

      await pcService.getPCs(5, 10);

      expect(apiService.fetchFromAPI).toHaveBeenCalledWith('/pcs?limit=5&offset=10');
    });
  });

  describe('getPC', () => {
    it('should fetch a single PC by id', async () => {
      const mockPC = {
        id: 1,
        name: 'Frodo',
        class: 'Rogue',
        level: 5,
        race: 'Hobbit',
      };

      vi.mocked(apiService.fetchFromAPI).mockResolvedValue(mockPC);

      const result = await pcService.getPC(1);

      expect(apiService.fetchFromAPI).toHaveBeenCalledWith('/pcs/1');
      expect(result).toEqual(mockPC);
    });
  });

  describe('createPC', () => {
    it('should create a new PC with processed data', async () => {
      const newPC = {
        name: 'Gandalf',
        class: 'Wizard',
        level: 20,
        race: 'Human',
      };

      const createdPC = { id: 10, ...newPC };

      vi.mocked(apiService.fetchFromAPI).mockResolvedValue(createdPC);

      const result = await pcService.createPC(newPC as any);

      // Should have called API with processed data (with defaults)
      expect(apiService.fetchFromAPI).toHaveBeenCalledWith('/pcs', 'POST', expect.objectContaining({
        name: 'Gandalf',
        class: 'Wizard',
        level: 20,
        race: 'Human',
        proficiency_bonus: 6, // auto-calculated for level 20
      }));
      expect(result).toEqual(createdPC);
    });
  });

  describe('updatePC', () => {
    it('should update an existing PC with processed data', async () => {
      const updates = {
        name: 'Gandalf the White',
        level: 21,
      };

      const updatedPC = {
        id: 10,
        name: 'Gandalf the White',
        class: 'Wizard',
        level: 21,
      };

      vi.mocked(apiService.fetchFromAPI).mockResolvedValue(updatedPC);

      const result = await pcService.updatePC(10, updates as any);

      // Should have called API with processed data
      expect(apiService.fetchFromAPI).toHaveBeenCalledWith('/pcs/10', 'PUT', expect.objectContaining({
        name: 'Gandalf the White',
        level: 21,
        proficiency_bonus: 6, // auto-calculated
        abilities: {},
      }));
      expect(result).toEqual(updatedPC);
    });
  });

  describe('deletePC', () => {
    it('should delete a PC', async () => {
      vi.mocked(apiService.fetchFromAPI).mockResolvedValue(undefined);

      await pcService.deletePC(10);

      expect(apiService.fetchFromAPI).toHaveBeenCalledWith('/pcs/10', 'DELETE');
    });
  });

  describe('calculateProficiencyBonus', () => {
    it('should calculate proficiency bonus for level 1', () => {
      expect(pcService.calculateProficiencyBonus(1)).toBe(2);
    });

    it('should calculate proficiency bonus for level 5', () => {
      expect(pcService.calculateProficiencyBonus(5)).toBe(3);
    });

    it('should calculate proficiency bonus for level 20', () => {
      expect(pcService.calculateProficiencyBonus(20)).toBe(6);
    });
  });

  describe('calculateModifier', () => {
    it('should calculate modifier for attribute 10', () => {
      expect(pcService.calculateModifier(10)).toBe(0);
    });

    it('should calculate modifier for attribute 20', () => {
      expect(pcService.calculateModifier(20)).toBe(5);
    });

    it('should calculate modifier for attribute 8', () => {
      expect(pcService.calculateModifier(8)).toBe(-1);
    });
  });

  describe('formatModifier', () => {
    it('should format positive modifier', () => {
      expect(pcService.formatModifier(3)).toBe('+3');
    });

    it('should format zero modifier', () => {
      expect(pcService.formatModifier(0)).toBe('+0');
    });

    it('should format negative modifier', () => {
      expect(pcService.formatModifier(-2)).toBe('-2');
    });
  });
});
