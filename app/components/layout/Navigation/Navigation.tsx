import React, { useCallback, useRef } from 'react';
import styles from './Navigation.module.css';

export type TabName = 'dashboard' | 'investments' | 'cash';

interface NavigationProps {
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
}

const TABS: { name: TabName; label: string }[] = [
  { name: 'dashboard', label: 'View portfolio dashboard' },
  { name: 'investments', label: 'Manage investments and goals' },
  { name: 'cash', label: 'Manage cash balances' },
];

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  const navRef = useRef<HTMLElement>(null);

  // Handle keyboard navigation between tabs
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const currentIndex = TABS.findIndex((tab) => tab.name === activeTab);
      let nextIndex: number | null = null;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          nextIndex = currentIndex > 0 ? currentIndex - 1 : TABS.length - 1;
          break;
        case 'ArrowRight':
          e.preventDefault();
          nextIndex = currentIndex < TABS.length - 1 ? currentIndex + 1 : 0;
          break;
        case 'Home':
          e.preventDefault();
          nextIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          nextIndex = TABS.length - 1;
          break;
      }

      if (nextIndex !== null) {
        onTabChange(TABS[nextIndex].name);
        // Focus the new tab
        const buttons = navRef.current?.querySelectorAll('button');
        buttons?.[nextIndex]?.focus();
      }
    },
    [activeTab, onTabChange]
  );

  return (
    <nav
      ref={navRef}
      role="tablist"
      aria-label="Main navigation"
      className={styles.nav}
      onKeyDown={handleKeyDown}
    >
      {TABS.map((tab) => (
        <button
          key={tab.name}
          role="tab"
          aria-selected={activeTab === tab.name}
          aria-label={tab.label}
          tabIndex={activeTab === tab.name ? 0 : -1}
          onClick={() => onTabChange(tab.name)}
          className={`${styles.tab} ${activeTab === tab.name ? styles.active : ''}`}
        >
          {tab.name}
        </button>
      ))}
    </nav>
  );
};

export default Navigation;
