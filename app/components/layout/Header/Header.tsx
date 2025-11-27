import React from 'react';
import { Button } from '@/app/components/ui';
import styles from './Header.module.css';

interface HeaderProps {
  onImport: () => void;
  onExport: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  lastUpdate: Date | null;
}

export const Header: React.FC<HeaderProps> = ({
  onImport,
  onExport,
  onRefresh,
  isLoading,
  lastUpdate,
}) => {
  return (
    <header className={styles.header}>
      <div className={styles.titleWrapper}>
        <h1 className={styles.title}>Investment Tracker</h1>
        <p className={styles.subtitle}>ETF Portfolio & Goal Tracker</p>
      </div>
      <div className={styles.actions}>
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
