import React from 'react';
import styles from './TabNav.module.css';

interface TabNavProps {
  children: React.ReactNode;
}

export const TabNav: React.FC<TabNavProps> = ({ children }) => {
  return <nav className={styles.tabNav}>{children}</nav>;
};

export default TabNav;
