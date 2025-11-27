import React from 'react';
import styles from './TabButton.module.css';

interface TabButtonProps {
  children: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
}

export const TabButton: React.FC<TabButtonProps> = ({
  children,
  isActive = false,
  onClick,
}) => {
  return (
    <button
      className={`${styles.tabButton} ${isActive ? styles.active : ''}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default TabButton;
