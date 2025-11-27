'use client';
import React from 'react';
import { Button, IconButton } from '@/app/components/ui';
import { useTheme } from '@/app/context/ThemeContext';
import styles from './Header.module.css';

interface HeaderProps {
  onImport: () => void;
  onExport: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  lastUpdate: Date | null;
}

const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

export const Header: React.FC<HeaderProps> = ({
  onImport,
  onExport,
  onRefresh,
  isLoading,
  lastUpdate,
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className={styles.header}>
      <div className={styles.titleWrapper}>
        <h1 className={styles.title}>Wealth Tracker</h1>
        <p className={styles.subtitle}>ETF Portfolio, Cash, & Goal Tracker</p>
      </div>
      <div className={styles.actions}>
        <IconButton
          icon={theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          variant="ghost"
          size="medium"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        />
        <Button variant="secondary" size="small" onClick={onImport}>
          ↓ Import
        </Button>
        <Button variant="secondary" size="small" onClick={onExport}>
          ↑ Export
        </Button>
        <Button
          variant="primary"
          size="small"
          onClick={onRefresh}
          disabled={isLoading}
        >
          {isLoading ? '⟳ Loading...' : '↻ Refresh Prices'}
        </Button>
        {lastUpdate && (
          <span className={styles.lastUpdate}>
            Updated: {lastUpdate.toLocaleTimeString()}
          </span>
        )}
      </div>
    </header>
  );
};

export default Header;
