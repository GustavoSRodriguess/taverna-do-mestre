import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DiceRoller } from './DiceRoller';
import { diceService } from '../../services/diceService';

vi.mock('../../services/diceService', () => ({
  diceService: {
    roll: vi.fn(),
  },
}));

const mockRoll = diceService.roll as unknown as vi.Mock;

describe('DiceRoller', () => {
  beforeEach(() => {
    mockRoll.mockReset();
  });

  it('opens panel, toggles minimize and performs quick roll', async () => {
    mockRoll.mockResolvedValue({
      notation: '1d20',
      rolls: [20],
      modifier: 0,
      total: 20,
      timestamp: new Date().toISOString(),
      label: 'd20',
      sides: 20,
      quantity: 1,
      advantage: false,
      disadvantage: false,
      dropped_rolls: [],
    });

    render(<DiceRoller />);

    fireEvent.click(screen.getByTitle('Abrir Rolador de Dados'));
    fireEvent.click(screen.getByText('Vantagem'));
    await waitFor(() => expect(screen.getByText('Vantagem')).toHaveClass('bg-green-600'));
    fireEvent.click(screen.getByText('d20'));

    await waitFor(() => expect(mockRoll).toHaveBeenCalledWith('1d20', 'd20', true, false));
    await waitFor(() => expect(mockRoll).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByTitle('Minimizar'));
    fireEvent.click(screen.getByTitle('Fechar'));
  });

  it('handles custom roll and clears history', async () => {
    mockRoll.mockResolvedValue({
      notation: '2d6',
      rolls: [3, 4],
      modifier: 0,
      total: 7,
      timestamp: new Date().toISOString(),
      label: undefined,
      sides: 6,
      quantity: 2,
      advantage: false,
      disadvantage: false,
      dropped_rolls: [],
    });

    const { unmount } = render(<DiceRoller />);
    fireEvent.click(screen.getByTitle('Abrir Rolador de Dados'));

    fireEvent.change(screen.getByPlaceholderText('Ex: 2d6+3, 1d20'), { target: { value: '2d6' } });
    fireEvent.click(screen.getByText('Rolar'));

    await waitFor(() => expect(mockRoll).toHaveBeenCalledWith('2d6', undefined, false, false));
    await waitFor(() => expect(mockRoll).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByTitle('Limpar histórico')).toBeInTheDocument());

    fireEvent.click(screen.getByTitle('Limpar histórico'));
    unmount();
  });

  afterEach(() => {
    vi.useRealTimers();
  });
});
