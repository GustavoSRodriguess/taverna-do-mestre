import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHomebrewFilters } from './useHomebrewFilters';

type Item = { name: string; description: string; is_public?: boolean; category?: string };

const items: Item[] = [
  { name: 'Elf', description: 'Graceful', is_public: true, category: 'race' },
  { name: 'Dwarf', description: 'Sturdy miner', is_public: false, category: 'race' },
  { name: 'Fireball', description: 'Explosive spell', is_public: true, category: 'spell' },
];

const config = {
  searchFields: ['name', 'description'] as (keyof Item)[],
  customFilters: {
    category: (item: Item, value: string) => item.category === value,
  },
};

describe('useHomebrewFilters', () => {
  beforeEach(() => {
    // ensure clean state per test
  });

  it('returns all items by default with counts', () => {
    const { result } = renderHook(() => useHomebrewFilters(items, config));
    expect(result.current.filteredItems).toHaveLength(3);
    expect(result.current.totalCount).toBe(3);
    expect(result.current.filteredCount).toBe(3);
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it('filters by search term across configured fields', () => {
    const { result } = renderHook(() => useHomebrewFilters(items, config));

    act(() => result.current.setSearchTerm('fire'));

    expect(result.current.filteredItems).toEqual([items[2]]);
    expect(result.current.filteredCount).toBe(1);
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('filters by visibility (public/private)', () => {
    const { result, rerender } = renderHook(
      ({ visibility }) => useHomebrewFilters(items, config),
      { initialProps: { visibility: 'all' as const } },
    );

    act(() => result.current.setFilterVisibility('public'));
    expect(result.current.filteredItems.map(i => i.name)).toEqual(['Elf', 'Fireball']);

    act(() => result.current.setFilterVisibility('private'));
    expect(result.current.filteredItems.map(i => i.name)).toEqual(['Dwarf']);

    act(() => result.current.setFilterVisibility('all'));
    expect(result.current.filteredItems).toHaveLength(3);

    rerender({ visibility: 'all' });
  });

  it('applies custom filters via setCustomFilterValue', () => {
    const { result } = renderHook(() => useHomebrewFilters(items, config));

    act(() => result.current.setCustomFilterValue('category', 'race'));
    expect(result.current.filteredItems.map(i => i.name)).toEqual(['Elf', 'Dwarf']);
    expect(result.current.hasActiveFilters).toBe(true);

    act(() => result.current.setCustomFilterValue('category', 'spell'));
    expect(result.current.filteredItems.map(i => i.name)).toEqual(['Fireball']);
  });

  it('clearFilters resets search, visibility and custom filters', () => {
    const { result } = renderHook(() => useHomebrewFilters(items, config));

    act(() => {
      result.current.setSearchTerm('elf');
      result.current.setFilterVisibility('private');
      result.current.setCustomFilterValue('category', 'spell');
    });
    expect(result.current.hasActiveFilters).toBe(true);

    act(() => result.current.clearFilters());

    expect(result.current.searchTerm).toBe('');
    expect(result.current.filterVisibility).toBe('all');
    expect(result.current.customFilterValues).toEqual({});
    expect(result.current.filteredItems).toHaveLength(3);
    expect(result.current.hasActiveFilters).toBe(false);
  });
});
