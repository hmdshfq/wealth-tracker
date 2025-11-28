import React from 'react';
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
  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-label={ariaLabel}
      className={`${styles.tabButton} ${isActive ? styles.active : ''}`}
      onClick={onClick}
      tabIndex={isActive ? 0 : -1}
    >
      {children}
    </button>
  );
};

export default TabButton;
