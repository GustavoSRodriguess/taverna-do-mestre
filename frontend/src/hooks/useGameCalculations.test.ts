import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import useGameCalculations from './useGameCalculations';
import { GameAttributes } from '../types/game';

const attrs: GameAttributes = {
  strength: 10,
  dexterity: 16,
  constitution: 14,
  intelligence: 12,
  wisdom: 8,
  charisma: 18,
};

describe('useGameCalculations', () => {
  it('computes proficiency, modifiers, formatted modifiers and saving throws', () => {
    const { result } = renderHook(() => useGameCalculations(attrs, 5));

    expect(result.current.proficiencyBonus).toBe(3); // level 5
    expect(result.current.modifiers.dexterity).toBe(3);
    expect(result.current.formattedModifiers.charisma).toBe('+4');
    expect(result.current.savingThrows.constitution).toBe(2 + 3); // mod + prof
  });

  it('computes skill bonuses using dexterity default mapping', () => {
    const skills = {
      stealth: { proficient: true, expertise: false, bonus: 0 },
      acrobatics: { proficient: true, expertise: true, bonus: 1 },
    };

    const { result } = renderHook(() => useGameCalculations(attrs, 5, skills));

    expect(result.current.skillBonuses.stealth).toBe(3 + 3); // mod + prof
    expect(result.current.skillBonuses.acrobatics).toBe(3 + 3 * 2 + 1); // expertise + bonus
  });

  it('returns spell stats when spellcasting ability is provided', () => {
    const { result } = renderHook(() => useGameCalculations(attrs, 5, {}, 'charisma'));

    expect(result.current.spellStats?.spellSaveDC).toBe(8 + 3 + 4); // base + prof + mod
    expect(result.current.spellStats?.spellAttackBonus).toBe(3 + 4); // prof + mod
  });

  it('returns null spellStats when ability not provided', () => {
    const { result } = renderHook(() => useGameCalculations(attrs, 5));
    expect(result.current.spellStats).toBeNull();
  });
});
