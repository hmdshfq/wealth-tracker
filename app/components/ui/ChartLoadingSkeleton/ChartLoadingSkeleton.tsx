'use client';

import React from 'react';
import { Card } from '@/components/ui';
import { Skeleton } from '@/components/ui';
import styles from './ChartLoadingSkeleton.module.css';

/**
 * Loading skeleton for charts/cards/lists
 * Displays placeholders while data is being fetched or deferred rendering
 */
interface ChartLoadingSkeletonProps {
  variant?: 'chart' | 'cards' | 'table';
}

export const ChartLoadingSkeleton: React.FC<ChartLoadingSkeletonProps> = ({ variant = 'chart' }) => {
  if (variant === 'cards') {
    return (
      <Card>
        <div className={styles.cardsSkeleton} role="status" aria-label="Loading cards">
          <div className={styles.cardsGrid}>
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={`card-skeleton-${index}`} className={styles.priceCardSkeleton}>
                <Skeleton className={styles.cardTicker} rounded="full" />
                <Skeleton className={styles.cardName} rounded="full" />
                <div className={styles.cardBottomRow}>
                  <Skeleton className={styles.cardPrice} rounded="full" />
                  <Skeleton className={styles.cardChange} rounded="full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (variant === 'table') {
    return (
      <Card>
        <div className={styles.tableSkeleton} role="status" aria-label="Loading rows">
          <div className={styles.tableHeader}>
            <Skeleton className={styles.tableHeaderCell} />
            <Skeleton className={styles.tableHeaderCell} />
            <Skeleton className={styles.tableHeaderCell} />
          </div>
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={`table-row-${index}`} className={styles.tableRow}>
              <Skeleton className={styles.tableCell} />
              <Skeleton className={styles.tableCell} />
              <Skeleton className={styles.tableCellNarrow} />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div
        className={styles.skeleton}
        role="status"
        aria-label="Loading chart data"
      >
        {/* Header with title and controls */}
        <div className={styles.header}>
          <Skeleton className={styles.titleBar} />
          <div className={styles.controls}>
            <Skeleton className={styles.controlButton} />
            <Skeleton className={styles.controlButton} />
            <Skeleton className={styles.controlButton} />
          </div>
        </div>

        {/* Chart visualization area */}
        <div className={styles.chartArea}>
          <Skeleton className={styles.yAxis} />
          <div className={styles.chartLines}>
            <Skeleton className={styles.line} />
            <Skeleton className={styles.line} />
            <Skeleton className={styles.line} />
            <Skeleton className={styles.line} />
          </div>
          <Skeleton className={styles.xAxis} />
        </div>

        {/* Legend */}
        <div className={styles.legend}>
          <Skeleton className={styles.legendItem} />
          <Skeleton className={styles.legendItem} />
          <Skeleton className={styles.legendItem} />
        </div>
      </div>
    </Card>
  );
};
