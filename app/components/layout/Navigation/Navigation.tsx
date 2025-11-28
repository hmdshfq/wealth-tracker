import React from 'react';
import styles from './Navigation.module.css';

export type TabName = 'dashboard' | 'investments' | 'cash' | 'goal';

interface NavigationProps {
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
}

const TABS: TabName[] = ['dashboard', 'investments', 'cash', 'goal'];

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <nav className={styles.nav}>
      {TABS.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`${styles.tab} ${activeTab === tab ? styles.active : ''}`}
        >
          {tab}
        </button>
      ))}
    </nav>
  );
};

export default Navigation;
