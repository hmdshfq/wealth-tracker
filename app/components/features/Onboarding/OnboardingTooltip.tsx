'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './OnboardingTooltip.module.css';

// ============================================================================
// TYPES
// ============================================================================

interface OnboardingTooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  visible?: boolean;
  onDismiss?: () => void;
  dismissKey?: string;
}

// ============================================================================
// LOCAL STORAGE KEY
// ============================================================================

const getDismissedKey = (key: string) => `onboarding-tooltip-dismissed-${key}`;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function OnboardingTooltip({
  content,
  children,
  position = 'top',
  visible = true,
  onDismiss,
  dismissKey,
}: OnboardingTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(false);
  const isMounted = useRef(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Check localStorage and set visibility on mount with timer
  useEffect(() => {
    isMounted.current = true;
    
    if (dismissKey) {
      const dismissed = localStorage.getItem(getDismissedKey(dismissKey));
      setHasDismissed(!!dismissed);
      if (dismissed) return;
    }

    if (visible) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []); // Run once on mount

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    setHasDismissed(true);
    
    if (dismissKey) {
      localStorage.setItem(getDismissedKey(dismissKey), 'true');
    }
    
    onDismiss?.();
  }, [dismissKey, onDismiss]);

  if (hasDismissed) return <>{children}</>;

  return (
    <div ref={tooltipRef} className={styles.container}>
      {children}
      {isVisible && (
        <div className={`${styles.tooltip} ${styles[position]}`}>
          <span className={styles.content}>{content}</span>
          <button className={styles.dismissButton} onClick={handleDismiss}>
            Got it
          </button>
        </div>
      )}
    </div>
  );
}