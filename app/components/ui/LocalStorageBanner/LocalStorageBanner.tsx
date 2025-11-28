'use client';

import React, { useState, useSyncExternalStore, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import styles from './LocalStorageBanner.module.css';

const STORAGE_KEY = 'localStorageBanner_dismissed';

function useReducedMotion(): boolean {
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

function useDismissedState(): [boolean, () => void] {
  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(STORAGE_KEY) === 'true';
  }, []);

  const subscribe = useCallback((callback: () => void) => {
    window.addEventListener('storage', callback);
    return () => window.removeEventListener('storage', callback);
  }, []);

  const getServerSnapshot = useCallback(() => true, []);

  const isDismissed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const dismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    window.dispatchEvent(new Event('storage'));
  }, []);

  return [isDismissed, dismiss];
}

export const LocalStorageBanner: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const [isDismissed, dismiss] = useDismissedState();
  const [shouldShow, setShouldShow] = useState(true);

  const handleDismiss = () => {
    setShouldShow(false);
  };

  const handleExitComplete = () => {
    dismiss();
  };

  const isVisible = !isDismissed && shouldShow;

  const animationProps = prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.2 },
      }
    : {
        initial: { x: "-50%", y: -100, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        exit: { y: -100, opacity: 0 },
        transition: { type: 'spring' as const, stiffness: 300, damping: 30 },
      };

  return (
    <AnimatePresence onExitComplete={handleExitComplete}>
      {isVisible && (
        <motion.div
          className={styles.banner}
          role="alert"
          aria-live="polite"
          {...animationProps}
        >
          <div className={styles.content}>
            <svg
              className={styles.icon}
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <p className={styles.message}>
              Your data is stored locally in your browser. Export your data regularly to prevent data loss.
            </p>
          </div>
          <button
            type="button"
            className={styles.dismissButton}
            onClick={handleDismiss}
            aria-label="Dismiss notification"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LocalStorageBanner;
