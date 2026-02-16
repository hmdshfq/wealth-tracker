'use client';

import React from 'react';
import { Skeleton } from '@/app/components/ui/Skeleton';
import styles from './AppShellSkeleton.module.css';

export const AppShellSkeleton: React.FC = () => {
  return (
    <div className={styles.container} role="status" aria-live="polite" aria-label="Loading application">
      <header className={styles.header}>
        <div className={styles.titleWrap}>
          <Skeleton className={styles.title} rounded="full" />
          <Skeleton className={styles.subtitle} rounded="full" />
        </div>
        <div className={styles.actions}>
          <Skeleton className={styles.actionButton} rounded="full" />
          <Skeleton className={styles.actionButton} rounded="full" />
          <Skeleton className={styles.actionButton} rounded="full" />
        </div>
      </header>

      <div className={styles.nav}>
        <Skeleton className={styles.navItem} rounded="full" />
        <Skeleton className={styles.navItem} rounded="full" />
        <Skeleton className={styles.navItem} rounded="full" />
      </div>

      <main className={styles.main}>
        <section className={styles.statsGrid}>
          <Skeleton className={styles.statCard} rounded="lg" />
          <Skeleton className={styles.statCard} rounded="lg" />
          <Skeleton className={styles.statCard} rounded="lg" />
        </section>
        <section className={styles.contentGrid}>
          <Skeleton className={styles.contentCardTall} rounded="lg" />
          <Skeleton className={styles.contentCard} rounded="lg" />
        </section>
      </main>
    </div>
  );
};

export default AppShellSkeleton;
