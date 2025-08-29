import { useState, useEffect, useRef, useCallback } from 'react';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useAsyncOperation<T>() {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });
  
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const execute = useCallback(async (asyncFunction: (signal: AbortSignal) => Promise<T>) => {
    // Önceki isteği iptal et
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Yeni abort controller oluştur
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    if (!isMountedRef.current) return;

    setState({ data: null, loading: true, error: null });

    try {
      const result = await asyncFunction(signal);
      
      if (!isMountedRef.current) return;
      
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (error: any) {
      if (!isMountedRef.current) return;
      
      // AbortError'ları görmezden gel
      if (error.name === 'AbortError') return;
      
      const errorMessage = error.message || 'Bir hata oluştu';
      setState({ data: null, loading: false, error: errorMessage });
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}
