import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DiceNotification } from './DiceNotification';
import { DiceRoll } from '../../types/dice';

const baseRoll: DiceRoll = {
  notation: '1d20',
  rolls: [20],
  modifier: 0,
  total: 20,
  timestamp: new Date(),
  label: 'd20',
  isCritical: false,
  isFumble: false,
  advantage: false,
  disadvantage: false,
  droppedRolls: [],
};

describe('DiceNotification', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders critical roll with badges and autocloses', async () => {
    const onClose = vi.fn();
    render(<DiceNotification roll={{ ...baseRoll, isCritical: true, total: 20 }} onClose={onClose} autoClose={100} />);

    expect(screen.getByText('CRÍTICO!')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();

    await vi.runAllTimersAsync();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows advantage/disadvantage badges and allows manual close', () => {
    const onClose = vi.fn();
    render(
      <DiceNotification
        roll={{ ...baseRoll, advantage: true, disadvantage: true, isFumble: true, rolls: [1], total: 1 }}
        onClose={onClose}
        autoClose={0}
      />,
    );

    expect(screen.getByText('VANTAGEM')).toBeInTheDocument();
    expect(screen.getByText('DESVANTAGEM')).toBeInTheDocument();
    expect(screen.getByText('FALHA CRÍTICA')).toBeInTheDocument();

    fireEvent.click(screen.getByTitle('Fechar'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
