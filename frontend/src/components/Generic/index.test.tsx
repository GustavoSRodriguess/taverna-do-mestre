import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  AttributeDisplay,
  CombatStats,
  HPBar,
  LevelBadge,
  StatusBadge,
  CharacterCardSkeleton,
  CampaignCardSkeleton,
} from './index';
import { getStatusConfig } from '../../utils/gameUtils';

const sampleAttributes = {
  strength: 10,
  dexterity: 12,
  constitution: 14,
  intelligence: 8,
  wisdom: 13,
  charisma: 9,
};

describe('Generic components', () => {
  it('renders StatusBadge with correct text', () => {
    const { text } = getStatusConfig('active', 'campaign');
    render(<StatusBadge status="active" type="campaign" className="custom" />);
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it('renders AttributeDisplay editable and triggers change', () => {
    const onAttributeChange = vi.fn();
    render(
      <AttributeDisplay
        attributes={sampleAttributes}
        layout="inline"
        editable
        onAttributeChange={onAttributeChange}
      />
    );

    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[0], { target: { value: '15' } });
    expect(onAttributeChange).toHaveBeenCalledWith('strength', 15);
    expect(screen.getByText('+0')).toBeInTheDocument();
    fireEvent.change(inputs[1], { target: { value: '30' } });
  });

  it('renders HPBar with temporary hp and percentages', () => {
    render(<HPBar current={8} max={10} temporary={2} />);
    expect(screen.getByText('8 (+2)/10 HP')).toBeInTheDocument();
    expect(screen.getByText(/80%/)).toBeInTheDocument();
  });

  it('renders LevelBadge with color by level', () => {
    render(<LevelBadge level={12} />);
    const badge = screen.getByText('Nível 12');
    expect(badge.className).toContain('text-purple-400');
  });

  it('renders CombatStats with hp, ca and proficiency', () => {
    render(<CombatStats hp={12} currentHp={10} ca={15} proficiencyBonus={3} temporaryHp={2} />);
    expect(screen.getByText(/12\/12/)).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('+3')).toBeInTheDocument();
  });

  it('renders skeleton placeholders', () => {
    const { container } = render(
      <>
        <CharacterCardSkeleton />
        <CampaignCardSkeleton />
      </>
    );

    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });
});
