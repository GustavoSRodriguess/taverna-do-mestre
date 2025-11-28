import { describe, it, expect } from 'vitest';
import {
  calculateModifier,
  formatModifier,
  calculateProficiencyBonus,
  calculateSkillBonus,
  calculateSpellStats,
  validateCharacterName,
  validateLevel,
  validateAttributes,
  validateHP,
  formatCurrency,
  formatDate,
  groupBy,
  sortBy,
  getStatusConfig,
} from './gameUtils';
import { GameAttributes } from '../types/game';

describe('gameUtils', () => {
  describe('calculateModifier', () => {
    it('should calculate modifier correctly for score 10', () => {
      expect(calculateModifier(10)).toBe(0);
    });

    it('should calculate modifier correctly for score 11', () => {
      expect(calculateModifier(11)).toBe(0);
    });

    it('should calculate modifier correctly for score 12', () => {
      expect(calculateModifier(12)).toBe(1);
    });

    it('should calculate modifier correctly for score 8', () => {
      expect(calculateModifier(8)).toBe(-1);
    });

    it('should calculate modifier correctly for score 20', () => {
      expect(calculateModifier(20)).toBe(5);
    });

    it('should calculate modifier correctly for score 1', () => {
      expect(calculateModifier(1)).toBe(-5);
    });
  });

  describe('formatModifier', () => {
    it('should format positive modifier with plus sign', () => {
      expect(formatModifier(3)).toBe('+3');
    });

    it('should format zero modifier with plus sign', () => {
      expect(formatModifier(0)).toBe('+0');
    });

    it('should format negative modifier without plus sign', () => {
      expect(formatModifier(-2)).toBe('-2');
    });
  });

  describe('calculateProficiencyBonus', () => {
    it('should return 2 for level 1', () => {
      expect(calculateProficiencyBonus(1)).toBe(2);
    });

    it('should return 2 for level 4', () => {
      expect(calculateProficiencyBonus(4)).toBe(2);
    });

    it('should return 3 for level 5', () => {
      expect(calculateProficiencyBonus(5)).toBe(3);
    });

    it('should return 4 for level 9', () => {
      expect(calculateProficiencyBonus(9)).toBe(4);
    });

    it('should return 5 for level 13', () => {
      expect(calculateProficiencyBonus(13)).toBe(5);
    });

    it('should return 6 for level 17', () => {
      expect(calculateProficiencyBonus(17)).toBe(6);
    });

    it('should return 6 for level 20', () => {
      expect(calculateProficiencyBonus(20)).toBe(6);
    });
  });

  describe('calculateSkillBonus', () => {
    it('should calculate skill bonus without proficiency', () => {
      const bonus = calculateSkillBonus(14, 2, false);
      expect(bonus).toBe(2); // +2 from modifier only
    });

    it('should calculate skill bonus with proficiency', () => {
      const bonus = calculateSkillBonus(14, 2, true);
      expect(bonus).toBe(4); // +2 modifier + 2 proficiency
    });

    it('should calculate skill bonus with expertise', () => {
      const bonus = calculateSkillBonus(14, 2, true, true);
      expect(bonus).toBe(6); // +2 modifier + 2 proficiency + 2 expertise
    });

    it('should calculate skill bonus with additional modifier', () => {
      const bonus = calculateSkillBonus(14, 2, true, false, 1);
      expect(bonus).toBe(5); // +2 modifier + 2 proficiency + 1 bonus
    });
  });

  describe('calculateSpellStats', () => {
    it('should calculate spell stats correctly', () => {
      const attributes: GameAttributes = {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 16,
        wisdom: 10,
        charisma: 10,
      };

      const stats = calculateSpellStats(attributes, 2, 'intelligence');

      expect(stats.modifier).toBe(3);
      expect(stats.spellAttackBonus).toBe(5); // 3 + 2
      expect(stats.spellSaveDC).toBe(13); // 8 + 3 + 2
    });
  });

  describe('validateCharacterName', () => {
    it('should return error for empty name', () => {
      expect(validateCharacterName('')).toBe('Nome é obrigatório');
    });

    it('should return error for whitespace only name', () => {
      expect(validateCharacterName('   ')).toBe('Nome é obrigatório');
    });

    it('should return error for name too long', () => {
      const longName = 'A'.repeat(101);
      expect(validateCharacterName(longName)).toBe('Nome deve ter no máximo 100 caracteres');
    });

    it('should return null for valid name', () => {
      expect(validateCharacterName('Gandalf')).toBeNull();
    });
  });

  describe('validateLevel', () => {
    it('should return error for level 0', () => {
      expect(validateLevel(0)).toBe('Nível deve estar entre 1 e 20');
    });

    it('should return error for level 21', () => {
      expect(validateLevel(21)).toBe('Nível deve estar entre 1 e 20');
    });

    it('should return null for valid level 1', () => {
      expect(validateLevel(1)).toBeNull();
    });

    it('should return null for valid level 20', () => {
      expect(validateLevel(20)).toBeNull();
    });
  });

  describe('validateAttributes', () => {
    it('should return errors for attributes out of range', () => {
      const attributes: GameAttributes = {
        strength: 0,
        dexterity: 31,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      };

      const errors = validateAttributes(attributes);

      expect(errors).toHaveLength(2);
      expect(errors).toContain('strength deve estar entre 1 e 30');
      expect(errors).toContain('dexterity deve estar entre 1 e 30');
    });

    it('should return empty array for valid attributes', () => {
      const attributes: GameAttributes = {
        strength: 15,
        dexterity: 14,
        constitution: 13,
        intelligence: 12,
        wisdom: 10,
        charisma: 8,
      };

      const errors = validateAttributes(attributes);

      expect(errors).toEqual([]);
    });
  });

  describe('validateHP', () => {
    it('should return error for HP less than 1', () => {
      const errors = validateHP(0);
      expect(errors).toContain('HP deve ser maior que 0');
    });

    it('should return error for negative current HP', () => {
      const errors = validateHP(10, -1);
      expect(errors).toContain('HP atual não pode ser negativo');
    });

    it('should return empty array for valid HP', () => {
      const errors = validateHP(25, 15);
      expect(errors).toEqual([]);
    });
  });

  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      const formatted = formatCurrency(100);
      expect(formatted).toContain('PO');
      expect(formatted).toContain('100');
    });

    it('should format zero correctly', () => {
      const formatted = formatCurrency(0);
      expect(formatted).toContain('PO');
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = '2024-01-15T10:00:00Z';
      const formatted = formatDate(date);
      expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });
  });

  describe('groupBy', () => {
    it('should group items by key', () => {
      const items = [
        { name: 'Sword', type: 'weapon' },
        { name: 'Shield', type: 'armor' },
        { name: 'Bow', type: 'weapon' },
      ];

      const grouped = groupBy(items, (item) => item.type);

      expect(grouped.weapon).toHaveLength(2);
      expect(grouped.armor).toHaveLength(1);
    });
  });

  describe('sortBy', () => {
    it('should sort items by key', () => {
      const items = [
        { name: 'Zorro', level: 5 },
        { name: 'Alice', level: 10 },
        { name: 'Bob', level: 3 },
      ];

      const sorted = sortBy(items, 'level');

      expect(sorted[0].level).toBe(3);
      expect(sorted[1].level).toBe(5);
      expect(sorted[2].level).toBe(10);
    });
  });

  describe('getStatusConfig', () => {
    it('should return correct config for campaign status', () => {
      const config = getStatusConfig('active', 'campaign');
      expect(config.variant).toBe('success');
      expect(config.text).toBe('Ativa');
    });

    it('should return correct config for character status', () => {
      const config = getStatusConfig('dead', 'character');
      expect(config.variant).toBe('danger');
      expect(config.text).toBe('Morto');
    });

    it('should return default config for unknown status', () => {
      const config = getStatusConfig('unknown' as any);
      expect(config.variant).toBe('primary');
    });
  });
});
