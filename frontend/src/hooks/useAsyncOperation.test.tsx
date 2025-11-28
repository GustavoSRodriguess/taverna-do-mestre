import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAsyncOperation } from './useAsyncOperation';

describe('useAsyncOperation', () => {
  it('initializes with default state', () => {
    const { result } = renderHook(() => useAsyncOperation<number>());
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('handles successful execution', async () => {
    const { result } = renderHook(() => useAsyncOperation<number>());
    const op = vi.fn().mockResolvedValue(42);

    await act(async () => {
      await result.current.execute(op);
    });

    expect(op).toHaveBeenCalled();
    expect(result.current.data).toBe(42);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('captures error message and clears data on failure', async () => {
    const { result } = renderHook(() => useAsyncOperation<number>());
    const error = new Error('Boom');
    const op = vi.fn().mockRejectedValue(error);

    await act(async () => {
      await result.current.execute(op);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('Boom');
    expect(result.current.loading).toBe(false);
  });

  it('prefers backend error message shape', async () => {
    const { result } = renderHook(() => useAsyncOperation<number>());
    const op = vi.fn().mockRejectedValue({ response: { data: { error: 'Bad request' } } });

    await act(async () => {
      await result.current.execute(op);
    });

    expect(result.current.error).toBe('Bad request');
  });

  it('reset clears state', async () => {
    const { result } = renderHook(() => useAsyncOperation<number>());
    const op = vi.fn().mockResolvedValue(1);

    await act(async () => {
      await result.current.execute(op);
    });

    await act(async () => {
      result.current.reset();
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });
});
