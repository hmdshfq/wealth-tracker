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
  const initializedRef = useRef(false);

  useEffect(() => {
    // Skip if already ready or already set up
    if (isReady || initializedRef.current) {
      return;
    }

    initializedRef.current = true;

    // If we should render immediately (due to accessibility), set up async
    if (immediate || prefersReducedMotion) {
      // Use microtask to avoid synchronous setState in effect
      Promise.resolve().then(() => setIsReady(true));
      return;
    }

    // Feature detection for requestIdleCallback
    const supportsIdle = typeof window !== 'undefined' && 'requestIdleCallback' in window;

    if (supportsIdle) {
      // Use requestIdleCallback with timeout
      const idleId = window.requestIdleCallback(
        () => setIsReady(true),
        { timeout }
      );
      return () => {
        window.cancelIdleCallback(idleId);
      };
    } else {
      // Fallback for Safari and unsupported browsers
      const timeoutId = setTimeout(() => setIsReady(true), 0);
      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [immediate, prefersReducedMotion, timeout, isReady]);

  return isReady;
}
