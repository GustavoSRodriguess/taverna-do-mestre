import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { DiceProvider, useDice } from './DiceContext';
import { diceService } from '../services/diceService';

vi.mock('../services/diceService', () => ({
  diceService: {
    roll: vi.fn(),
  },
}));

vi.mock('../components/Dice/DiceNotification', () => ({
  DiceNotification: ({ roll, onClose }: { roll: any; onClose: () => void }) => (
    <div data-testid="dice-notification">
      <span>{roll.total}</span>
      <button onClick={onClose}>fechar</button>
    </div>
  ),
}));

const mockRoll = diceService.roll as unknown as vi.Mock;

const TestComponent = () => {
  const { roll, lastRoll } = useDice();

  return (
    <div>
      <button onClick={() => roll('1d20', 'critico')}>rolar</button>
      {lastRoll && <span data-testid="last-total">{lastRoll.total}</span>}
    </div>
  );
};

describe('DiceContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rolls dice and stores last result with critical detection', async () => {
    mockRoll.mockResolvedValue({
      notation: '1d20',
      rolls: [20],
      modifier: 0,
      total: 20,
      timestamp: new Date().toISOString(),
      label: 'critico',
      sides: 20,
      quantity: 1,
      advantage: false,
      disadvantage: false,
      dropped_rolls: [],
    });

    render(
      <DiceProvider>
        <TestComponent />
      </DiceProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('rolar'));
    });

    await waitFor(() => expect(screen.getByTestId('last-total')).toHaveTextContent('20'));
    expect(mockRoll).toHaveBeenCalledWith('1d20', 'critico', undefined, undefined);
  });

  it('shows and hides notification', async () => {
    mockRoll.mockResolvedValue({
      notation: '1d6',
      rolls: [1],
      modifier: 0,
      total: 1,
      timestamp: new Date().toISOString(),
      label: 'falha',
      sides: 6,
      quantity: 1,
      advantage: false,
      disadvantage: false,
      dropped_rolls: [],
    });

    render(
      <DiceProvider>
        <TestComponent />
      </DiceProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('rolar'));
    });

    expect(screen.getByTestId('dice-notification')).toBeInTheDocument();
    fireEvent.click(screen.getByText('fechar'));
    await waitFor(() => expect(screen.queryByTestId('dice-notification')).not.toBeInTheDocument());
  });
});
