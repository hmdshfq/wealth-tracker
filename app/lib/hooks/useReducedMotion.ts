'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * Hook to detect user's reduced motion preference
 * Uses useSyncExternalStore for React 19 compatibility
 */
export function useReducedMotion(): boolean {
  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const subscribe = useCallback((callback: () => void) => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    mediaQuery.addEventListener('change', callback);
    return () => mediaQuery.removeEventListener('change', callback);
  }, []);

  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
