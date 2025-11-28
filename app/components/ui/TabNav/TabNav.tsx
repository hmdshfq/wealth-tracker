'use client';

import React, { useCallback, useRef, createContext, useContext, useId } from 'react';
import styles from './TabNav.module.css';

interface TabContextType {
  layoutId: string;
}

const TabContext = createContext<TabContextType | undefined>(undefined);

export const useTabContext = () => useContext(TabContext);

interface TabNavProps {
  children: React.ReactNode;
  /** Accessible label for the tab list */
  ariaLabel?: string;
  className?: string;
}

export const TabNav: React.FC<TabNavProps> = ({ 
  children, 
  ariaLabel = 'Tab navigation',
  className
}) => {
  const navRef = useRef<HTMLDivElement>(null);
  const layoutId = useId();

  // Handle keyboard navigation between tabs
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const tabs = navRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    if (!tabs || tabs.length === 0) return;

    const currentIndex = Array.from(tabs).findIndex(
      (tab) => tab === document.activeElement
    );

    let nextIndex: number | null = null;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
        break;
      case 'ArrowRight':
        e.preventDefault();
        nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIndex = tabs.length - 1;
        break;
    }

    if (nextIndex !== null) {
      tabs[nextIndex].focus();
      tabs[nextIndex].click();
    }
  }, []);

  return (
    <TabContext.Provider value={{ layoutId }}>
      <nav
        ref={navRef}
        role="tablist"
        aria-label={ariaLabel}
        className={`${styles.tabNav} ${className || ''}`}
        onKeyDown={handleKeyDown}
      >
        {children}
      </nav>
    </TabContext.Provider>
  );
};

export default TabNav;
