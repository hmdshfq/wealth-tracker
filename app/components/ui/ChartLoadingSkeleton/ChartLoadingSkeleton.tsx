'use client';

import React from 'react';
import { Card } from '@/app/components/ui';
import styles from './ChartLoadingSkeleton.module.css';

/**
 * Loading skeleton for charts
 * Displays a placeholder while chart data is being fetched or deferred rendering
 */
export const ChartLoadingSkeleton: React.FC = () => {
  return (
    <Card>
      <div
        className={styles.skeleton}
        role="status"
        aria-label="Loading chart data"
      >
        {/* Header with title and controls */}
        <div className={styles.header}>
          <div className={styles.titleBar} />
          <div className={styles.controls}>
            <div className={styles.controlButton} />
            <div className={styles.controlButton} />
            <div className={styles.controlButton} />
          </div>
        </div>

        {/* Chart visualization area */}
        <div className={styles.chartArea}>
          <div className={styles.yAxis} />
          <div className={styles.chartLines}>
            <div className={styles.line} style={{ top: '20%' }} />
            <div className={styles.line} style={{ top: '40%' }} />
            <div className={styles.line} style={{ top: '60%' }} />
            <div className={styles.line} style={{ top: '80%' }} />
          </div>
          <div className={styles.xAxis} />
        </div>

        {/* Legend */}
        <div className={styles.legend}>
          <div className={styles.legendItem} />
          <div className={styles.legendItem} />
          <div className={styles.legendItem} />
        </div>
      </div>
    </Card>
  );
};
