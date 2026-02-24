import React from 'react';
import { formatPreferredCurrency } from '@/lib/formatters';
import { Goal, MonteCarloSimulationResult, PreferredCurrency } from '@/lib/types';
import { HelpTooltip, VolatilityGuide } from '../InvestmentGoalChartHelp';
import { InlineLoader } from '@/components/ui';
import { CHART_COLORS, TIME_RANGES } from './types';
import styles from './ChartHeaderSection.module.css';

interface ChartHeaderSectionProps {
  goal: Goal;
  preferredCurrency: PreferredCurrency;
  currentNetWorth: number;
  totalActualContributions: number;
  colors: typeof CHART_COLORS.dark;
  enableRealTimeUpdates: boolean;
  selectedRange: string;
  showCustomRange: boolean;
  customStartDate: string;
  customEndDate: string;
  setCustomStartDate: React.Dispatch<React.SetStateAction<string>>;
  setCustomEndDate: React.Dispatch<React.SetStateAction<string>>;
  handleRangeChange: (range: string) => void;
  handleCustomRange: () => void;
  handleResetZoom: () => void;
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
  showMonteCarloLocal: boolean;
  setShowMonteCarloLocal: React.Dispatch<React.SetStateAction<boolean>>;
  monteCarloVolatility: number;
  setMonteCarloVolatility: React.Dispatch<React.SetStateAction<number>>;
  monteCarloSimulations: number;
  setMonteCarloSimulations: React.Dispatch<React.SetStateAction<number>>;
  effectiveMonteCarloResult: MonteCarloSimulationResult | null | undefined;
  setActiveHelpOverlay: React.Dispatch<
    React.SetStateAction<'confidence-bands' | 'scenario-analysis' | null>
  >;
}

export function ChartHeaderSection({
  goal,
  preferredCurrency,
  currentNetWorth,
  totalActualContributions,
  colors,
  enableRealTimeUpdates,
  selectedRange,
  showCustomRange,
  customStartDate,
  customEndDate,
  setCustomStartDate,
  setCustomEndDate,
  handleRangeChange,
  handleCustomRange,
  handleResetZoom,
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
  showMonteCarloLocal,
  setShowMonteCarloLocal,
  monteCarloVolatility,
  setMonteCarloVolatility,
  monteCarloSimulations,
  setMonteCarloSimulations,
  effectiveMonteCarloResult,
  setActiveHelpOverlay,
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

      <div className={styles.controlsRow}>
        <div className={styles.timeRangeButtons} role="tablist" aria-label="Time range selection">
          {TIME_RANGES.map((range) => (
            <button
              key={range.value}
              role="tab"
              aria-selected={selectedRange === range.value && !showCustomRange}
              className={`${styles.rangeButton} ${
                selectedRange === range.value && !showCustomRange ? styles.active : ''
              }`}
              onClick={() => handleRangeChange(range.value)}
            >
              {range.label}
            </button>
          ))}
        </div>

        <div className={styles.customRange}>
          <input
            type="month"
            value={customStartDate}
            onChange={(e) => setCustomStartDate(e.target.value)}
            className={styles.dateInput}
            aria-label="Start date"
          />
          <span className={styles.dateSeparator}>to</span>
          <input
            type="month"
            value={customEndDate}
            onChange={(e) => setCustomEndDate(e.target.value)}
            className={styles.dateInput}
            aria-label="End date"
          />
          <button
            onClick={handleCustomRange}
            className={styles.applyButton}
            disabled={!customStartDate || !customEndDate}
          >
            Apply
          </button>
        </div>

        <button onClick={handleResetZoom} className={styles.resetButton}>
          Reset Zoom
        </button>
      </div>

      {effectiveMonteCarloResult && (
        <div className={styles.monteCarloControls}>
          <div className={styles.monteCarloHeader}>
            <h4>Confidence Bands</h4>
            <button
              onClick={() => setActiveHelpOverlay('confidence-bands')}
              className={styles.helpButton}
              aria-label="Learn about confidence bands"
            >
              Help
            </button>
          </div>
          <div className={styles.monteCarloToggle}>
            <label>
              <input
                type="checkbox"
                checked={showMonteCarloLocal}
                onChange={() => setShowMonteCarloLocal(!showMonteCarloLocal)}
              />
              Show Confidence Bands
              <HelpTooltip content="Visualize the range of possible outcomes based on market volatility">
                <span className={styles.helpIcon} aria-label="Help">
                  ⓘ
                </span>
              </HelpTooltip>
            </label>
          </div>

          {showMonteCarloLocal && (
            <div className={styles.monteCarloParams}>
              <div className={styles.paramGroup}>
                <label>
                  Volatility: {Math.round(monteCarloVolatility * 100)}%
                  <HelpTooltip content="Adjust based on your portfolio's risk level (5% for bonds, 15% for balanced, 30% for aggressive growth)">
                    <span className={styles.helpIcon} aria-label="Help">
                      ⓘ
                    </span>
                  </HelpTooltip>
                  <input
                    type="range"
                    min="0.05"
                    max="0.3"
                    step="0.01"
                    value={monteCarloVolatility}
                    onChange={(e) => setMonteCarloVolatility(parseFloat(e.target.value))}
                  />
                  <VolatilityGuide />
                </label>
              </div>

              <div className={styles.paramGroup}>
                <label>
                  Simulations: {monteCarloSimulations}
                  <HelpTooltip content="More simulations provide more accurate percentiles (1,000 recommended for good balance)">
                    <span className={styles.helpIcon} aria-label="Help">
                      ⓘ
                    </span>
                  </HelpTooltip>
                  <input
                    type="range"
                    min="100"
                    max="5000"
                    step="100"
                    value={monteCarloSimulations}
                    onChange={(e) => setMonteCarloSimulations(parseInt(e.target.value, 10))}
                  />
                </label>
              </div>

              <button
                onClick={() => {
                  setMonteCarloVolatility(0.15);
                  setMonteCarloSimulations(1000);
                }}
                className={styles.resetButton}
              >
                Reset
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
