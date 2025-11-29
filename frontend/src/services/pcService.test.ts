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

  describe('helpers and validation', () => {
    it('creates default PC applying racial modifiers and class hp', () => {
      const pc = pcService.createDefaultPC('human', 'fighter', 3);
      expect(pc.attributes.strength).toBe(11); // +1 human
      expect(pc.proficiency_bonus).toBe(2); // level 3 keeps base proficiency
      expect(pc.hp).toBeGreaterThan(0);
      expect(pc.ca).toBe(10 + pcService.calculateModifier(pc.attributes.dexterity));
    });

    it('validates pc data and returns errors', () => {
      const errors = pcService.validatePCData({
        name: '',
        level: 30,
        attributes: { strength: 30 } as any,
        hp: -1,
        current_hp: -5,
        race: '',
        class: '',
      });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors).toContain('Raça é obrigatória');
      expect(errors).toContain('Classe é obrigatória');
    });

    it('applies racial modifiers for different races', () => {
      const elf = pcService.createDefaultPC('elf', 'wizard', 1);
      const dwarf = pcService.createDefaultPC('dwarf', 'cleric', 1);
      const halfOrc = pcService.createDefaultPC('half-orc', 'barbarian', 1);

      expect(elf.attributes.dexterity).toBeGreaterThan(10);
      expect(dwarf.attributes.constitution).toBeGreaterThan(10);
      expect(halfOrc.attributes.strength).toBeGreaterThan(10);
    });

    it('returns correct hit dice per class', () => {
      expect((pcService as any).getClassHitDie('barbarian')).toBe(12);
      expect((pcService as any).getClassHitDie('wizard')).toBe(6);
      expect((pcService as any).getClassHitDie('fighter')).toBe(10);
      expect((pcService as any).getClassHitDie('unknown')).toBe(8);
    });

    it('calculates skill bonus with proficiency and expertise', () => {
      const attrs = { strength: 10, dexterity: 14, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 };
      const bonus = pcService.calculateSkillBonus('dexterity', attrs as any, 2, true, true, 1);
      expect(bonus).toBe(pcService.calculateModifier(14) + 2 + 2 + 1);
    });
  });
});
