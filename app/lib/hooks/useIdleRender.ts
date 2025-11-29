'use client';

import { useState, useEffect, useRef } from 'react';
import { useReducedMotion } from './useReducedMotion';

/**
 * Hook to defer component rendering until browser is idle
 * Uses requestIdleCallback if available, falls back to setTimeout(0)
 * Respects prefers-reduced-motion by rendering immediately
 */
export interface UseIdleRenderOptions {
  /** Fallback timeout in milliseconds (default: 2000ms) */
  timeout?: number;
  /** Skip deferral and render immediately (default: false) */
  immediate?: boolean;
}

export function useIdleRender(options: UseIdleRenderOptions = {}): boolean {
  const { timeout = 2000, immediate = false } = options;
  const prefersReducedMotion = useReducedMotion();
  const [isReady, setIsReady] = useState(immediate || prefersReducedMotion);

  useEffect(() => {
    // Already ready, no need to defer
    if (isReady) {
      return;
    }

    // Feature detection for requestIdleCallback
    const supportsIdle = typeof window !== 'undefined' && 'requestIdleCallback' in window;

    let handle: number;

    if (supportsIdle) {
      // Use requestIdleCallback with timeout
      handle = window.requestIdleCallback(
        () => setIsReady(true),
        { timeout }
      );
      return () => window.cancelIdleCallback(handle);
    } else {
      // Fallback: use setTimeout to defer to next event loop
      handle = window.setTimeout(() => setIsReady(true), 0);
      return () => window.clearTimeout(handle);
    }
  }, [isReady]);

  return isReady;
}
