import React from 'react';
import { TabNav, TabButton } from '@/app/components/ui';
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
  return (
    <TabNav 
      ariaLabel="Main navigation" 
      className={styles.container}
    >
      {TABS.map((tab) => (
        <TabButton
          key={tab.name}
          isActive={activeTab === tab.name}
          onClick={() => onTabChange(tab.name)}
          ariaLabel={tab.label}
        >
          {tab.name}
        </TabButton>
      ))}
    </TabNav>
  );
};

export default Navigation;
