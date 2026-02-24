import React from 'react';
import { MonteCarloLegendHelp } from '../InvestmentGoalChartHelp';
import { LegendEntry } from './types';
import styles from './CustomLegend.module.css';

interface CustomLegendProps {
  payload: LegendEntry[];
  onToggle: (dataKey: string) => void;
  hiddenLines: Set<string>;
}

export const CustomLegend: React.FC<CustomLegendProps> = ({ payload, onToggle, hiddenLines }) => {
  const projectedItems = payload.filter((p) => p.type === 'projected');
  const actualItems = payload.filter((p) => p.type === 'actual');
  const targetItems = payload.filter((p) => p.type === 'target');
  const monteCarloItems = payload.filter((p) => p.type === 'monte-carlo');
  const scenarioItems = payload.filter((p) => p.type === 'scenario');

  const renderItem = (entry: LegendEntry, index: number) => (
    <button
      key={`legend-${index}`}
      className={`${styles.legendItem} ${hiddenLines.has(entry.dataKey) ? styles.legendHidden : ''}`}
      onClick={() => onToggle(entry.dataKey)}
      aria-pressed={!hiddenLines.has(entry.dataKey)}
      aria-label={`${entry.value}: ${hiddenLines.has(entry.dataKey) ? 'hidden' : 'visible'}`}
    >
      <span
        className={styles.legendIcon}
      >
        <svg viewBox="0 0 32 12" width="32" height="12" aria-hidden="true">
          <line
            x1="1"
            y1="6"
            x2="31"
            y2="6"
            stroke={entry.color}
            strokeWidth={entry.strokeWidth ?? 2}
            strokeDasharray={entry.strokeDasharray}
            strokeLinecap="round"
            opacity={hiddenLines.has(entry.dataKey) ? 0.45 : 1}
          />
        </svg>
      </span>
      <span className={styles.legendText}>{entry.value}</span>
    </button>
  );

  return (
    <div className={styles.legendContainer}>
      {actualItems.length > 0 && (
        <div className={styles.legendGroup}>
          <span className={styles.legendGroupTitle}>Actual</span>
          <div className={styles.legendItems}>{actualItems.map(renderItem)}</div>
        </div>
      )}
      {projectedItems.length > 0 && (
        <div className={styles.legendGroup}>
          <span className={styles.legendGroupTitle}>Projected</span>
          <div className={styles.legendItems}>{projectedItems.map(renderItem)}</div>
        </div>
      )}
      {targetItems.length > 0 && (
        <div className={styles.legendGroup}>
          <div className={styles.legendItems}>{targetItems.map(renderItem)}</div>
        </div>
      )}

      {monteCarloItems.length > 0 && (
        <div className={styles.legendGroup}>
          <div className={styles.legendGroupHeader}>
            <span className={styles.legendGroupTitle}>Confidence Bands</span>
            <MonteCarloLegendHelp />
          </div>
          <div className={styles.legendItems}>{monteCarloItems.map(renderItem)}</div>
        </div>
      )}

      {scenarioItems.length > 0 && (
        <div className={styles.legendGroup}>
          <div className={styles.legendGroupHeader}>
            <span className={styles.legendGroupTitle}>Scenarios</span>
          </div>
          <div className={styles.legendItems}>{scenarioItems.map(renderItem)}</div>
        </div>
      )}
    </div>
  );
};
