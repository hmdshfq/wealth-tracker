import React from 'react';
import { formatPreferredCurrency } from '@/lib/formatters';
import { Goal, PreferredCurrency } from '@/lib/types';
import { HelpTooltip } from '../InvestmentGoalChartHelp';
import { InlineLoader } from '@/components/ui';
import { CHART_COLORS } from './types';
import styles from './ChartHeaderSection.module.css';

interface ChartHeaderSectionProps {
  goal: Goal;
  preferredCurrency: PreferredCurrency;
  currentNetWorth: number;
  totalActualContributions: number;
  colors: typeof CHART_COLORS.dark;
  enableRealTimeUpdates: boolean;
  progressPercent: number;
  wsConnected: boolean;
  workerLoading: boolean;
  workerError: string | null;
  isDataSampled: boolean;
  originalDataPoints: number | null;
  sampledDataPoints: number | null;
  actualReturns: number;
  actualReturnsPercent: number;
  yearsToGoal: {
    baseYears: number;
    confidenceInterval: [number, number];
  };
}

export function ChartHeaderSection({
  goal,
  preferredCurrency,
  currentNetWorth,
  totalActualContributions,
  colors,
  enableRealTimeUpdates,
  progressPercent,
  wsConnected,
  workerLoading,
  workerError,
  isDataSampled,
  originalDataPoints,
  sampledDataPoints,
  actualReturns,
  actualReturnsPercent,
  yearsToGoal,
}: ChartHeaderSectionProps) {
  return (
    <div className={styles.chartHeader}>
      <div className={styles.titleSection}>
        <h3 className={styles.chartTitle}>Investment Goal Progress</h3>
        <div className={styles.progressBadge}>
          <span className={styles.progressValue}>{progressPercent.toFixed(1)}%</span>
          <span className={styles.progressLabel}>
            of {formatPreferredCurrency(goal.amount, preferredCurrency)}
          </span>
        </div>
        {enableRealTimeUpdates && (
          <div className={`${styles.wsStatus} ${wsConnected ? styles.connected : styles.disconnected}`}>
            <span className={styles.wsIndicator} />
            {wsConnected ? 'Live' : 'Offline'}
          </div>
        )}
        {workerLoading && (
          <div className={styles.workerStatus}>
            <InlineLoader label="Processing..." />
          </div>
        )}
        {workerError && (
          <div className={styles.workerError}>
            <span className={styles.errorIcon}>⚠️</span>
            {workerError}
          </div>
        )}
        {isDataSampled && originalDataPoints && sampledDataPoints && (
          <div className={styles.samplingInfo}>
            <span className={styles.samplingIcon}>📊</span>
            {originalDataPoints} points {'->'} {sampledDataPoints} displayed
            <HelpTooltip content="Data sampling applied for performance. Key characteristics preserved.">
              <span className={styles.helpIcon} aria-label="Help">
                ⓘ
              </span>
            </HelpTooltip>
          </div>
        )}
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Actual Value</span>
          <span className={styles.statValue} style={{ color: colors.actualValue }}>
            {formatPreferredCurrency(currentNetWorth, preferredCurrency)}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Actual Contributions</span>
          <span className={styles.statValue} style={{ color: colors.actualContributions }}>
            {formatPreferredCurrency(totalActualContributions, preferredCurrency)}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Actual Returns</span>
          <span
            className={styles.statValue}
            style={{ color: actualReturns >= 0 ? colors.actualReturns : colors.actualContributions }}
          >
            {formatPreferredCurrency(actualReturns, preferredCurrency)} ({actualReturnsPercent >= 0 ? '+' : ''}
            {actualReturnsPercent.toFixed(1)}%)
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Years to Goal</span>
          <span className={styles.statValue} style={{ color: colors.projectedValue }}>
            {yearsToGoal.baseYears} years ({yearsToGoal.confidenceInterval[0]}-
            {yearsToGoal.confidenceInterval[1]})
          </span>
        </div>
      </div>




    </div>
  );
}
