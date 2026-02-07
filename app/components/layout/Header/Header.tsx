'use client';
import React, { useMemo, useState } from 'react';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import { Button, IconButton } from '@/app/components/ui';
import { useTheme } from '@/app/context/ThemeContext';
import styles from './Header.module.css';

interface HeaderProps {
  onImport: () => void;
  onExport: () => void;
  onRefresh: () => void;
  onSyncCloud?: () => void;
  onRetrySync?: () => void;
  onToggleLocalOnly?: () => void;
  isLoading: boolean;
  lastUpdate: Date | null;
  cloudSaveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  isLocalOnly?: boolean;
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
  onSyncCloud,
  onRetrySync,
  onToggleLocalOnly,
  isLoading,
  lastUpdate,
  cloudSaveStatus = 'idle',
  isLocalOnly = false,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const wrapAction = (handler?: () => void) => () => {
    handler?.();
    setIsMenuOpen(false);
  };

  const actionsContent = useMemo(
    () => (
      <>
        <IconButton
          icon={theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          variant="ghost"
          size="medium"
          onClick={wrapAction(toggleTheme)}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className={styles.actionIcon}
        />
        <Button variant="secondary" size="small" onClick={wrapAction(onImport)} className={styles.actionButton}>
          ↓ Import
        </Button>
        <Button variant="secondary" size="small" onClick={wrapAction(onExport)} className={styles.actionButton}>
          ↑ Export
        </Button>
        <Button
          variant="primary"
          size="small"
          onClick={wrapAction(onRefresh)}
          disabled={isLoading}
          className={styles.actionButton}
        >
          {isLoading ? '⟳ Loading...' : '↻ Refresh Prices'}
        </Button>
        <SignedOut>
          <SignInButton>
            <Button variant="secondary" size="small" className={styles.actionButton} onClick={wrapAction()}>
              Sign In
            </Button>
          </SignInButton>
          <SignUpButton>
            <Button variant="primary" size="small" className={styles.actionButton} onClick={wrapAction()}>
              Create Account
            </Button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          <Button
            variant="secondary"
            size="small"
            onClick={wrapAction(onSyncCloud)}
            disabled={!onSyncCloud}
            className={styles.actionButton}
          >
            Sync Now
          </Button>
          {cloudSaveStatus === 'error' && (
            <Button
              variant="red"
              size="small"
              onClick={wrapAction(onRetrySync)}
              disabled={!onRetrySync}
              className={styles.actionButton}
            >
              Retry Sync
            </Button>
          )}
          <Button
            variant={isLocalOnly ? 'blue' : 'secondary'}
            size="small"
            onClick={wrapAction(onToggleLocalOnly)}
            disabled={!onToggleLocalOnly}
            className={styles.actionButton}
          >
            {isLocalOnly ? 'Local Only' : 'Use Cloud'}
          </Button>
          <div className={styles.userButton}>
            <UserButton afterSignOutUrl="/" />
          </div>
        </SignedIn>
      </>
    ),
    [
      cloudSaveStatus,
      isLoading,
      isLocalOnly,
      onExport,
      onImport,
      onRefresh,
      onRetrySync,
      onSyncCloud,
      onToggleLocalOnly,
      theme,
      toggleTheme,
    ]
  );

  return (
    <header className={styles.header}>
      <div className={styles.titleWrapper}>
        <h1 className={styles.title}>Wealth Tracker</h1>
        <p className={styles.subtitle}>ETF Portfolio, Cash, & Goal Tracker</p>
      </div>
      <div className={styles.actions}>
        <div className={styles.actionsDesktop}>
          {actionsContent}
        </div>
        <div className={styles.actionsMobile}>
          <Button
            variant="secondary"
            size="small"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className={styles.menuButton}
            aria-expanded={isMenuOpen}
            aria-controls="header-menu"
          >
            ☰ Menu
          </Button>
          {isMenuOpen && (
            <div id="header-menu" className={styles.menuPanel} role="menu">
              {actionsContent}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
