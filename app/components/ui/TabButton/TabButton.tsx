'use client';

import React from 'react';
import { motion } from 'motion/react';
import { useTabContext } from '../TabNav/TabNav';
import styles from './TabButton.module.css';

interface TabButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
  /** Accessible label for screen readers */
  ariaLabel?: string;
  /** ID of the panel this tab controls */
  ariaControls?: string;
}

export const TabButton: React.FC<TabButtonProps> = ({
  children,
  isActive = false,
  onClick,
  ariaLabel,
  ariaControls,
  className,
  ...props
}) => {
  const context = useTabContext();
  // Fallback layoutId if context is missing (though it shouldn't be if used inside TabNav)
  const layoutId = context?.layoutId || 'tabs';

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-label={ariaLabel}
      aria-controls={ariaControls}
      className={`${styles.tabButton} ${isActive ? styles.active : ''} ${className || ''}`}
      onClick={onClick}
      tabIndex={isActive ? 0 : -1}
      {...props}
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
