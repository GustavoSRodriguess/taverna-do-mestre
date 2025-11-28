import { describe, it, expect, beforeEach, vi } from 'vitest';
import { homebrewService, HomebrewRace, HomebrewClass, HomebrewBackground } from './homebrewService';
import * as apiService from './apiService';

vi.mock('./apiService', () => ({
  fetchFromAPI: vi.fn(),
}));

describe('homebrewService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('races', () => {
    it('fetches races with defaults', async () => {
      const mockResponse = { races: [], count: 0, limit: 50, offset: 0 };
      vi.mocked(apiService.fetchFromAPI).mockResolvedValue(mockResponse);

      const result = await homebrewService.getRaces();

      expect(apiService.fetchFromAPI).toHaveBeenCalledWith('/homebrew/races?limit=50&offset=0');
      expect(result).toBe(mockResponse);
    });

    it('creates, updates and deletes a race', async () => {
      const raceInput: Omit<HomebrewRace, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'owner_username'> = {
        name: 'Elf',
        description: 'Graceful',
        speed: 30,
        size: 'Medium',
        languages: ['Common'],
        traits: [],
        abilities: { dexterity: 2 },
        proficiencies: { skills: ['Perception'], weapons: [], armor: [], tools: [] },
        is_public: true,
      };
      const updated = { ...raceInput, name: 'High Elf' };

      vi.mocked(apiService.fetchFromAPI).mockResolvedValueOnce(raceInput);
      await homebrewService.createRace(raceInput);
      expect(apiService.fetchFromAPI).toHaveBeenCalledWith('/homebrew/races', 'POST', raceInput);

      vi.mocked(apiService.fetchFromAPI).mockResolvedValueOnce(updated);
      await homebrewService.updateRace(1, { name: 'High Elf' });
      expect(apiService.fetchFromAPI).toHaveBeenCalledWith('/homebrew/races/1', 'PUT', { name: 'High Elf' });

      vi.mocked(apiService.fetchFromAPI).mockResolvedValueOnce(undefined);
      await homebrewService.deleteRace(2);
      expect(apiService.fetchFromAPI).toHaveBeenCalledWith('/homebrew/races/2', 'DELETE');
    });

    it('validates race basics', () => {
      const errors = homebrewService.validateRace({ speed: -5 });
      expect(errors).toContain('Nome é obrigatório');
      expect(errors).toContain('Descrição é obrigatória');
      expect(errors).toContain('Tamanho é obrigatório');
      expect(errors).toContain('Velocidade deve ser positiva');
    });

    it('creates empty race with defaults', () => {
      const empty = homebrewService.createEmptyRace();
      expect(empty).toMatchObject({
        name: '',
        description: '',
        speed: 30,
        size: 'Medium',
        traits: [],
        languages: [],
        is_public: false,
      });
    });
  });

  describe('classes', () => {
    it('fetches classes with custom pagination', async () => {
      const mockResponse = { classes: [], count: 0, limit: 10, offset: 5 };
      vi.mocked(apiService.fetchFromAPI).mockResolvedValue(mockResponse);

      await homebrewService.getClasses(10, 5);

      expect(apiService.fetchFromAPI).toHaveBeenCalledWith('/homebrew/classes?limit=10&offset=5');
    });

    it('creates, updates and deletes a class', async () => {
      const classInput: Omit<HomebrewClass, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'owner_username'> = {
        name: 'Wizard',
        description: 'Magic user',
        hit_die: 6,
        primary_ability: 'intelligence',
        saving_throws: ['intelligence', 'wisdom'],
        armor_proficiency: [],
        weapon_proficiency: ['dagger'],
        tool_proficiency: [],
        skill_choices: { count: 2, options: ['Arcana'] },
        features: {},
        spellcasting: null,
        is_public: false,
      };

      vi.mocked(apiService.fetchFromAPI).mockResolvedValueOnce(classInput);
      await homebrewService.createClass(classInput);
      expect(apiService.fetchFromAPI).toHaveBeenCalledWith('/homebrew/classes', 'POST', classInput);

      vi.mocked(apiService.fetchFromAPI).mockResolvedValueOnce({ ...classInput, description: 'New desc' });
      await homebrewService.updateClass(3, { description: 'New desc' });
      expect(apiService.fetchFromAPI).toHaveBeenCalledWith('/homebrew/classes/3', 'PUT', { description: 'New desc' });

      vi.mocked(apiService.fetchFromAPI).mockResolvedValueOnce(undefined);
      await homebrewService.deleteClass(4);
      expect(apiService.fetchFromAPI).toHaveBeenCalledWith('/homebrew/classes/4', 'DELETE');
    });

    it('validates class rules', () => {
      const errors = homebrewService.validateClass({
        hit_die: 4,
        saving_throws: ['strength'],
      });

      expect(errors).toContain('Nome é obrigatório');
      expect(errors).toContain('Descrição é obrigatória');
      expect(errors).toContain('Habilidade primária é obrigatória');
      expect(errors).toContain('Dado de vida deve ser 6, 8, 10 ou 12');
      expect(errors).toContain('Deve ter exatamente 2 testes de resistência');
    });

    it('creates empty class with defaults', () => {
      const empty = homebrewService.createEmptyClass();
      expect(empty).toMatchObject({
        name: '',
        description: '',
        hit_die: 8,
        primary_ability: 'strength',
        saving_throws: [],
        is_public: false,
        spellcasting: null,
      });
    });
  });

  describe('backgrounds', () => {
    it('fetches backgrounds with defaults', async () => {
      const mockResponse = { backgrounds: [], count: 0, limit: 50, offset: 0 };
      vi.mocked(apiService.fetchFromAPI).mockResolvedValue(mockResponse);

      await homebrewService.getBackgrounds();

      expect(apiService.fetchFromAPI).toHaveBeenCalledWith('/homebrew/backgrounds?limit=50&offset=0');
    });

    it('creates, updates and deletes a background', async () => {
      const backgroundInput: Omit<HomebrewBackground, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'owner_username'> = {
        name: 'Scholar',
        description: 'Academically trained',
        skill_proficiencies: ['History'],
        tool_proficiencies: [],
        languages: 2,
        equipment: [],
        feature: { name: 'Library Access', description: 'You can access libraries' },
        suggested_traits: { personality: [], ideals: [], bonds: [], flaws: [] },
        is_public: true,
      };

      vi.mocked(apiService.fetchFromAPI).mockResolvedValueOnce(backgroundInput);
      await homebrewService.createBackground(backgroundInput);
      expect(apiService.fetchFromAPI).toHaveBeenCalledWith('/homebrew/backgrounds', 'POST', backgroundInput);

      vi.mocked(apiService.fetchFromAPI).mockResolvedValueOnce({ ...backgroundInput, name: 'Historian' });
      await homebrewService.updateBackground(9, { name: 'Historian' });
      expect(apiService.fetchFromAPI).toHaveBeenCalledWith('/homebrew/backgrounds/9', 'PUT', { name: 'Historian' });

      vi.mocked(apiService.fetchFromAPI).mockResolvedValueOnce(undefined);
      await homebrewService.deleteBackground(10);
      expect(apiService.fetchFromAPI).toHaveBeenCalledWith('/homebrew/backgrounds/10', 'DELETE');
    });

    it('validates background basics', () => {
      const errors = homebrewService.validateBackground({});
      expect(errors).toContain('Nome é obrigatório');
      expect(errors).toContain('Descrição é obrigatória');
    });

    it('creates empty background with defaults', () => {
      const empty = homebrewService.createEmptyBackground();
      expect(empty).toMatchObject({
        name: '',
        description: '',
        skill_proficiencies: [],
        tool_proficiencies: [],
        languages: 0,
        equipment: [],
        feature: { name: '', description: '' },
        is_public: false,
      });
    });
  });
});
