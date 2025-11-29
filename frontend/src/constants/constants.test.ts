import { describe, it, expect } from 'vitest';
import * as encounterData from './encounterData';
import * as gameData from './gameData';

describe('constants', () => {
  it('exposes encounter data', () => {
    expect(encounterData.DIFFICULTY_LEVELS.length).toBeGreaterThan(0);
    expect(encounterData.ENCOUNTER_THEMES[0].label).toBeDefined();
  });

  it('exposes game data lookups', () => {
    expect(gameData.RACES.length).toBeGreaterThan(0);
    expect(gameData.CLASSES.find((c) => c.value === 'wizard')).toBeDefined();
  });
});
