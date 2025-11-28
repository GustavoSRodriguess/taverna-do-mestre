import { describe, it, expect, beforeEach, vi } from 'vitest';
import { campaignService } from './campaignService';
import * as apiService from './apiService';

vi.mock('./apiService', () => ({
  fetchFromAPI: vi.fn(),
}));

describe('campaignService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCampaigns', () => {
    it('should fetch all campaigns', async () => {
      const mockCampaigns = [
        { id: 1, name: 'Lost Mines', status: 'active' },
        { id: 2, name: 'Curse of Strahd', status: 'planning' },
      ];

      vi.mocked(apiService.fetchFromAPI).mockResolvedValue({
        campaigns: mockCampaigns,
        count: 2,
      });

      const result = await campaignService.getCampaigns();

      expect(apiService.fetchFromAPI).toHaveBeenCalledWith('/campaigns');
      expect(result.campaigns).toEqual(mockCampaigns);
    });
  });

  describe('getCampaign', () => {
    it('should fetch a single campaign by id', async () => {
      const mockCampaign = {
        id: 1,
        name: 'Lost Mines',
        dm_id: 1,
        status: 'active',
      };

      vi.mocked(apiService.fetchFromAPI).mockResolvedValue(mockCampaign);

      const result = await campaignService.getCampaign(1);

      expect(apiService.fetchFromAPI).toHaveBeenCalledWith('/campaigns/1');
      expect(result).toEqual(mockCampaign);
    });
  });

  describe('createCampaign', () => {
    it('should create a new campaign', async () => {
      const newCampaign = {
        name: 'Waterdeep Dragon Heist',
        description: 'Urban adventure',
        max_players: 5,
        allow_homebrew: true,
      };

      const createdCampaign = {
        id: 3,
        ...newCampaign,
        status: 'planning',
        invite_code: 'ABC12345',
      };

      vi.mocked(apiService.fetchFromAPI).mockResolvedValue(createdCampaign);

      const result = await campaignService.createCampaign(newCampaign);

      expect(apiService.fetchFromAPI).toHaveBeenCalledWith('/campaigns', 'POST', newCampaign);
      expect(result).toEqual(createdCampaign);
    });
  });

  describe('updateCampaign', () => {
    it('should update an existing campaign', async () => {
      const updates = {
        name: 'Lost Mines Updated',
        status: 'active' as const,
      };

      const updatedCampaign = {
        id: 1,
        name: 'Lost Mines Updated',
        status: 'active',
      };

      vi.mocked(apiService.fetchFromAPI).mockResolvedValue(updatedCampaign);

      const result = await campaignService.updateCampaign(1, updates);

      expect(apiService.fetchFromAPI).toHaveBeenCalledWith('/campaigns/1', 'PUT', updates);
      expect(result).toEqual(updatedCampaign);
    });
  });

  describe('deleteCampaign', () => {
    it('should delete a campaign', async () => {
      vi.mocked(apiService.fetchFromAPI).mockResolvedValue(undefined);

      await campaignService.deleteCampaign(1);

      expect(apiService.fetchFromAPI).toHaveBeenCalledWith('/campaigns/1', 'DELETE');
    });
  });

  describe('joinCampaign', () => {
    it('should join a campaign with invite code', async () => {
      const inviteCode = 'ABC12345';
      const response = { message: 'Joined successfully' };

      vi.mocked(apiService.fetchFromAPI).mockResolvedValue(response);

      const result = await campaignService.joinCampaign(inviteCode);

      expect(apiService.fetchFromAPI).toHaveBeenCalledWith(
        '/campaigns/join',
        'POST',
        { invite_code: inviteCode }
      );
      expect(result).toEqual(response);
    });
  });

  describe('validateCampaignData', () => {
    it('should return error for empty name', () => {
      const data = {
        name: '',
        description: 'Test',
        max_players: 4,
        allow_homebrew: true,
      };

      const errors = campaignService.validateCampaignData(data);

      expect(errors).toContain('Nome da campanha é obrigatório');
    });

    it('should return error for name too long', () => {
      const data = {
        name: 'A'.repeat(101),
        description: 'Test',
        max_players: 4,
        allow_homebrew: true,
      };

      const errors = campaignService.validateCampaignData(data);

      expect(errors).toContain('Nome deve ter no máximo 100 caracteres');
    });

    it('should return error for invalid max_players (too low)', () => {
      const data = {
        name: 'Test Campaign',
        description: 'Test',
        max_players: 0,
        allow_homebrew: true,
      };

      const errors = campaignService.validateCampaignData(data);

      expect(errors).toContain('Número de jogadores deve ser entre 1 e 10');
    });

    it('should return error for invalid max_players (too high)', () => {
      const data = {
        name: 'Test Campaign',
        description: 'Test',
        max_players: 11,
        allow_homebrew: true,
      };

      const errors = campaignService.validateCampaignData(data);

      expect(errors).toContain('Número de jogadores deve ser entre 1 e 10');
    });

    it('should return error for description too long', () => {
      const data = {
        name: 'Test Campaign',
        description: 'A'.repeat(501),
        max_players: 4,
        allow_homebrew: true,
      };

      const errors = campaignService.validateCampaignData(data);

      expect(errors).toContain('Descrição deve ter no máximo 500 caracteres');
    });

    it('should return empty array for valid data', () => {
      const data = {
        name: 'Test Campaign',
        description: 'A great adventure',
        max_players: 5,
        allow_homebrew: true,
      };

      const errors = campaignService.validateCampaignData(data);

      expect(errors).toEqual([]);
    });

    it('should accept minimum valid max_players', () => {
      const data = {
        name: 'Solo Campaign',
        description: 'One player',
        max_players: 1,
        allow_homebrew: false,
      };

      const errors = campaignService.validateCampaignData(data);

      expect(errors).toEqual([]);
    });

    it('should accept maximum valid max_players', () => {
      const data = {
        name: 'Large Campaign',
        description: 'Ten players',
        max_players: 10,
        allow_homebrew: false,
      };

      const errors = campaignService.validateCampaignData(data);

      expect(errors).toEqual([]);
    });
  });

  describe('validateInviteCode', () => {
    it('should return error for code too short', () => {
      const error = campaignService.validateInviteCode('ABC123');
      expect(error).toBe('Código deve ter 8 caracteres');
    });

    it('should return error for code too long', () => {
      const error = campaignService.validateInviteCode('ABC123456');
      expect(error).toBe('Código deve ter 8 caracteres');
    });

    it('should clean special characters and validate', () => {
      const error = campaignService.validateInviteCode('ABC-1234');
      expect(error).toBe('Código deve ter 8 caracteres');
    });

    it('should return null for valid code', () => {
      const error = campaignService.validateInviteCode('ABC12345');
      expect(error).toBeNull();
    });

    it('should accept alphanumeric code', () => {
      const error = campaignService.validateInviteCode('AbC123XyZ');
      expect(error).toBe('Código deve ter 8 caracteres'); // Only 8 chars allowed
    });

    it('should clean and validate exactly 8 characters', () => {
      const error = campaignService.validateInviteCode('ABC12345');
      expect(error).toBeNull();
    });
  });
});
