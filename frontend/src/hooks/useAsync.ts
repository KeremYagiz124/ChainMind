import { useState, useEffect, useCallback } from 'react';

interface AsyncState<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
}

/**
 * Hook for managing async operations
 */
export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate: boolean = true
): AsyncState<T> & { execute: () => Promise<void> } {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    loading: immediate,
  });

  const execute = useCallback(async () => {
    setState({ data: null, error: null, loading: true });

    try {
      const data = await asyncFunction();
      setState({ data, error: null, loading: false });
    } catch (error) {
      setState({ data: null, error: error as Error, loading: false });
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { ...state, execute };
}
