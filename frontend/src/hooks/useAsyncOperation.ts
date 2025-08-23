import { useState, useCallback } from 'react';

interface UseAsyncOperationResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (operation: () => Promise<T>) => Promise<T | null>;
  reset: () => void;
}

export const useAsyncOperation = <T = any>(): UseAsyncOperationResult<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (operation: () => Promise<T>): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await operation();
      setData(result);
      return result;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || err?.message || 'Erro inesperado';
      setError(errorMessage);
      setData(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
};