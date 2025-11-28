'use client';

import React from 'react';
import { motion } from 'motion/react';
import { useTabContext } from '../TabNav/TabNav';
import styles from './TabButton.module.css';

interface TabButtonProps {
  children: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
  /** Accessible label for screen readers */
  ariaLabel?: string;
}

export const TabButton: React.FC<TabButtonProps> = ({
  children,
  isActive = false,
  onClick,
  ariaLabel,
}) => {
  const context = useTabContext();
  // Fallback layoutId if context is missing (though it shouldn't be if used inside TabNav)
  const layoutId = context?.layoutId || 'tabs';

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-label={ariaLabel}
      className={`${styles.tabButton} ${isActive ? styles.active : ''}`}
      onClick={onClick}
      tabIndex={isActive ? 0 : -1}
    >
      {isActive && (
        <motion.div
          layoutId={layoutId}
          className={styles.activeBackground}
          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
        />
      )}
      <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
    </button>
  );
};

export default TabButton;
