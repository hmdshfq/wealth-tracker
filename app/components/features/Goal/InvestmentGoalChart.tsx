'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Brush,
  TooltipProps,
  Area,
  ComposedChart,
} from 'recharts';
import { formatPLN } from '@/app/lib/formatters';
import { Goal } from '@/app/lib/types';
import { ExtendedProjectionDataPoint } from '@/app/lib/projectionCalculations';
import styles from './InvestmentGoalChart.module.css';

// Theme-aware color palette using CSS variable values
// These match the app's design system from globals.css
const CHART_COLORS = {
  dark: {
    projectedValue: '#4ECDC4', // Teal for projected
    projectedContributions: '#8b5cf6', // Purple (matches --accent-purple)
    actualValue: '#10b981', // Green (matches --accent-green)
    actualContributions: '#ef4444', // Red (matches --accent-red)
    actualReturns: '#f59e0b', // Yellow (matches --accent-yellow)
    target: '#3b82f6', // Blue (matches --accent-blue)
    grid: 'rgba(148, 163, 184, 0.1)',
    text: '#e2e8f0', // matches --text-secondary
    textMuted: '#94a3b8', // matches --text-muted
    background: '#1e293b',
  },
  light: {
    projectedValue: '#14b8a6', // Teal for projected
    projectedContributions: '#7c3aed', // Purple (matches light --accent-purple)
    actualValue: '#059669', // Green (matches light --accent-green)
    actualContributions: '#dc2626', // Red (matches light --accent-red)
    actualReturns: '#d97706', // Yellow (matches light --accent-yellow)
    target: '#2563eb', // Blue (matches light --accent-blue)
    grid: 'rgba(100, 116, 139, 0.15)',
    text: '#1e293b', // matches light --text-secondary
    textMuted: '#475569', // matches light --text-muted
    background: '#ffffff',
  },
};

interface InvestmentGoalChartProps {
  goal: Goal;
  projectionData: ExtendedProjectionDataPoint[];
  currentNetWorth: number;
  totalActualContributions: number;
  highContrastMode?: boolean;
  enableRealTimeUpdates?: boolean;
  websocketUrl?: string;
  className?: string;
  firstTransactionDate?: string;
}

interface TimeRangeOption {
  label: string;
  value: string;
  months: number | null;
}

const TIME_RANGES: TimeRangeOption[] = [
  { label: '6M', value: '6m', months: 6 },
  { label: '1Y', value: '1y', months: 12 },
  { label: '3Y', value: '3y', months: 36 },
  { label: '5Y', value: '5y', months: 60 },
  { label: '10Y', value: '10y', months: 120 },
  { label: 'All', value: 'all', months: null },
];

// Custom hook to detect theme
function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const checkTheme = () => {
      const htmlElement = document.documentElement;
      const dataTheme = htmlElement.getAttribute('data-theme');
      setTheme(dataTheme === 'light' ? 'light' : 'dark');
    };

    checkTheme();

    // Observe theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          checkTheme();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => observer.disconnect();
  }, []);

  return theme;
}

// Custom Tooltip Component
interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  goalAmount: number;
  totalActualContributions: number;
  currentNetWorth: number;
  colors: typeof CHART_COLORS.dark;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  goalAmount,
  totalActualContributions,
  currentNetWorth,
  colors,
}) => {
  if (!active || !payload || payload.length === 0) return null;

  const getValue = (key: string) => {
    const item = payload.find((p) => p.dataKey === key);
    return item?.value as number | undefined;
  };

  const projectedValue = getValue('value');
  const projectedContributions = getValue('cumulativeContributions');
  const actualContributions = getValue('actualContributions');
  const actualValue = getValue('actualValue');

  const hasActual = actualContributions !== undefined || actualValue !== undefined;
  const progressPercent = projectedValue && goalAmount > 0 
    ? (projectedValue / goalAmount) * 100 
    : 0;

  const projectedReturns = projectedValue && projectedContributions 
    ? projectedValue - projectedContributions 
    : 0;
  const actualReturns = actualValue !== undefined && actualContributions !== undefined
    ? actualValue - actualContributions
    : currentNetWorth - totalActualContributions;

  return (
    <div className={styles.customTooltip} role="tooltip" aria-live="polite">
      <p className={styles.tooltipTitle}>{label}</p>
      
      <div className={styles.tooltipSection}>
        <p className={styles.tooltipSectionTitle}>Projected</p>
        {projectedValue !== undefined && (
          <p style={{ color: colors.projectedValue }}>
            Portfolio: {formatPLN(projectedValue)}{' '}
            <span className={styles.tooltipProgress}>
              ({progressPercent.toFixed(1)}% of target)
            </span>
          </p>
        )}
        {projectedContributions !== undefined && (
          <p style={{ color: colors.projectedContributions }}>
            Contributions: {formatPLN(projectedContributions)}
          </p>
        )}
        {projectedReturns !== 0 && (
          <p className={styles.tooltipReturns}>
            Returns: {formatPLN(projectedReturns)}
          </p>
        )}
      </div>

      {hasActual && (
        <div className={styles.tooltipSection}>
          <p className={styles.tooltipSectionTitle}>Actual</p>
          {actualValue !== undefined && (
            <p style={{ color: colors.actualValue }}>
              Portfolio: {formatPLN(actualValue)}{' '}
              <span className={styles.tooltipProgress}>
                ({((actualValue / goalAmount) * 100).toFixed(1)}% of target)
              </span>
            </p>
          )}
          {actualContributions !== undefined && (
            <p style={{ color: colors.actualContributions }}>
              Contributions: {formatPLN(actualContributions)}
            </p>
          )}
          {actualValue !== undefined && actualContributions !== undefined && (
            <p style={{ color: colors.actualReturns }}>
              Returns: {formatPLN(actualValue - actualContributions)}{' '}
              ({actualContributions > 0 
                ? (((actualValue - actualContributions) / actualContributions) * 100).toFixed(1) 
                : 0}%)
            </p>
          )}
        </div>
      )}

      <div className={styles.tooltipSection}>
        <p style={{ color: colors.target }}>
          Target: {formatPLN(goalAmount)}
        </p>
      </div>
    </div>
  );
};

// Custom Legend Component
interface CustomLegendProps {
  payload: Array<{
    value: string;
    color: string;
    dataKey: string;
    type: 'projected' | 'actual' | 'target';
  }>;
  onToggle: (dataKey: string) => void;
  hiddenLines: Set<string>;
}

const CustomLegend: React.FC<CustomLegendProps> = ({ payload, onToggle, hiddenLines }) => {
  const projectedItems = payload.filter((p) => p.type === 'projected');
  const actualItems = payload.filter((p) => p.type === 'actual');
  const targetItems = payload.filter((p) => p.type === 'target');

  const renderItem = (entry: typeof payload[0], index: number) => (
    <button
      key={`legend-${index}`}
      className={`${styles.legendItem} ${hiddenLines.has(entry.dataKey) ? styles.legendHidden : ''}`}
      onClick={() => onToggle(entry.dataKey)}
      aria-pressed={!hiddenLines.has(entry.dataKey)}
      aria-label={`${entry.value}: ${hiddenLines.has(entry.dataKey) ? 'hidden' : 'visible'}`}
    >
      <span
        className={styles.legendIcon}
        style={{
          backgroundColor: hiddenLines.has(entry.dataKey) ? 'transparent' : entry.color,
          borderColor: entry.color,
          borderStyle: entry.type === 'projected' ? 'dashed' : 'solid',
        }}
      />
      <span className={styles.legendText}>{entry.value}</span>
    </button>
  );

  return (
    <div className={styles.legendContainer}>
      {actualItems.length > 0 && (
        <div className={styles.legendGroup}>
          <span className={styles.legendGroupTitle}>Actual</span>
          <div className={styles.legendItems}>
            {actualItems.map(renderItem)}
          </div>
        </div>
      )}
      {projectedItems.length > 0 && (
        <div className={styles.legendGroup}>
          <span className={styles.legendGroupTitle}>Projected</span>
          <div className={styles.legendItems}>
            {projectedItems.map(renderItem)}
          </div>
        </div>
      )}
      {targetItems.length > 0 && (
        <div className={styles.legendGroup}>
          <div className={styles.legendItems}>
            {targetItems.map(renderItem)}
          </div>
        </div>
      )}
    </div>
  );
};

export const InvestmentGoalChart: React.FC<InvestmentGoalChartProps> = ({
  goal,
  projectionData,
  currentNetWorth,
  totalActualContributions,
  highContrastMode = false,
  enableRealTimeUpdates = false,
  websocketUrl,
  className = '',
  firstTransactionDate,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const colors = CHART_COLORS[theme];

  // State
  const [selectedRange, setSelectedRange] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [showCustomRange, setShowCustomRange] = useState(false);

  // Prefill date inputs when transaction history is available
  useEffect(() => {
    if (firstTransactionDate && !customStartDate) {
      // Format YYYY-MM-DD to YYYY-MM
      setCustomStartDate(firstTransactionDate.substring(0, 7));
      
      // Set end date to current month
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      setCustomEndDate(`${year}-${month}`);
    }
  }, [firstTransactionDate, customStartDate]);

  const [liveNetWorth, setLiveNetWorth] = useState(currentNetWorth);
  const [wsConnected, setWsConnected] = useState(false);
  const [hiddenLines, setHiddenLines] = useState<Set<string>>(new Set());
  const [focusedDataIndex, setFocusedDataIndex] = useState<number | null>(null);
  const [brushRange, setBrushRange] = useState<{ startIndex?: number; endIndex?: number }>({});
  const [announcement, setAnnouncement] = useState('');

  const announceToScreenReader = useCallback((message: string) => {
    setAnnouncement(message);
    setTimeout(() => setAnnouncement(''), 1000);
  }, []);

  // Calculate actual returns
  const actualReturns = useMemo(() => {
    return currentNetWorth - totalActualContributions;
  }, [currentNetWorth, totalActualContributions]);

  // WebSocket connection
  useEffect(() => {
    if (!enableRealTimeUpdates || !websocketUrl) return;

    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      try {
        ws = new WebSocket(websocketUrl);
        ws.onopen = () => {
          setWsConnected(true);
          announceToScreenReader('Real-time updates connected');
        };
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'portfolio_update' && typeof data.netWorth === 'number') {
              setLiveNetWorth(data.netWorth);
            }
          } catch (e) {
            console.error('WebSocket message parse error:', e);
          }
        };
        ws.onclose = () => {
          setWsConnected(false);
          reconnectTimeout = setTimeout(connect, 5000);
        };
        ws.onerror = () => ws?.close();
      } catch (error) {
        reconnectTimeout = setTimeout(connect, 5000);
      }
    };

    connect();
    return () => {
      ws?.close();
      clearTimeout(reconnectTimeout);
    };
  }, [enableRealTimeUpdates, websocketUrl, announceToScreenReader]);

  const actualReturnsPercent = useMemo(() => {
    return totalActualContributions > 0 
      ? (actualReturns / totalActualContributions) * 100 
      : 0;
  }, [actualReturns, totalActualContributions]);

  const progressPercent = useMemo(() => {
    return goal.amount > 0 ? (liveNetWorth / goal.amount) * 100 : 0;
  }, [liveNetWorth, goal.amount]);

  // Filter data based on time range
  const filteredData = useMemo(() => {
    if (!projectionData || projectionData.length === 0) return [];

    let filtered = [...projectionData];

    if (showCustomRange && customStartDate && customEndDate) {
      filtered = filtered.filter((d) => d.date >= customStartDate && d.date <= customEndDate);
    } else if (selectedRange !== 'all') {
      const range = TIME_RANGES.find((r) => r.value === selectedRange);
      if (range?.months) {
        const cutoffIndex = Math.max(0, filtered.length - range.months);
        filtered = filtered.slice(cutoffIndex);
      }
    }

    return filtered.map((d) => ({
      ...d,
      goal: goal.amount,
    }));
  }, [projectionData, selectedRange, customStartDate, customEndDate, showCustomRange, goal.amount]);

  // WebSocket connection
  useEffect(() => {
    if (!enableRealTimeUpdates || !websocketUrl) return;

    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      try {
        ws = new WebSocket(websocketUrl);
        ws.onopen = () => {
          setWsConnected(true);
          announceToScreenReader('Real-time updates connected');
        };
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'portfolio_update' && typeof data.netWorth === 'number') {
              setLiveNetWorth(data.netWorth);
            }
          } catch (e) {
            console.error('WebSocket message parse error:', e);
          }
        };
        ws.onclose = () => {
          setWsConnected(false);
          reconnectTimeout = setTimeout(connect, 5000);
        };
        ws.onerror = () => ws?.close();
      } catch (error) {
        reconnectTimeout = setTimeout(connect, 5000);
      }
    };

    connect();
    return () => {
      ws?.close();
      clearTimeout(reconnectTimeout);
    };
  }, [enableRealTimeUpdates, websocketUrl, announceToScreenReader]);

  const handleLegendToggle = useCallback((dataKey: string) => {
    setHiddenLines((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dataKey)) {
        newSet.delete(dataKey);
      } else {
        newSet.add(dataKey);
      }
      return newSet;
    });
  }, []);


  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!filteredData.length) return;
      const maxIndex = filteredData.length - 1;

      switch (event.key) {
        case 'ArrowRight':
          event.preventDefault();
          setFocusedDataIndex((prev) => {
            const newIndex = prev === null ? 0 : Math.min(prev + 1, maxIndex);
            const point = filteredData[newIndex];
            announceToScreenReader(
              `${point.date}: Portfolio ${formatPLN(point.value)}, ${((point.value / goal.amount) * 100).toFixed(1)}% of target`
            );
            return newIndex;
          });
          break;
        case 'ArrowLeft':
          event.preventDefault();
          setFocusedDataIndex((prev) => {
            const newIndex = prev === null ? maxIndex : Math.max(prev - 1, 0);
            const point = filteredData[newIndex];
            announceToScreenReader(`${point.date}: Portfolio ${formatPLN(point.value)}`);
            return newIndex;
          });
          break;
        case 'Escape':
          setBrushRange({});
          setFocusedDataIndex(null);
          announceToScreenReader('Chart zoom reset');
          break;
      }
    },
    [filteredData, goal.amount, announceToScreenReader]
  );

  const handleResetZoom = () => {
    setBrushRange({});
    announceToScreenReader('Chart zoom reset');
  };

  const handleRangeChange = (range: string) => {
    setSelectedRange(range);
    setShowCustomRange(false);
    setBrushRange({});
  };

  const handleCustomRange = () => {
    if (customStartDate && customEndDate) {
      setShowCustomRange(true);
      setSelectedRange('custom');
      setBrushRange({});
    }
  };

  const formatYAxis = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value.toString();
  };

  const chartSummary = useMemo(() => {
    if (!filteredData.length) return 'No data available';
    const first = filteredData[0];
    const last = filteredData[filteredData.length - 1];
    return `Investment goal chart from ${first.date} to ${last.date}. Current: ${formatPLN(currentNetWorth)} (${progressPercent.toFixed(1)}% of ${formatPLN(goal.amount)} target). Actual contributions: ${formatPLN(totalActualContributions)}. Actual returns: ${formatPLN(actualReturns)} (${actualReturnsPercent.toFixed(1)}%).`;
  }, [filteredData, currentNetWorth, goal.amount, progressPercent, totalActualContributions, actualReturns, actualReturnsPercent]);

  // Legend items with theme colors
  const legendPayload = useMemo(() => [
    { value: 'Portfolio Value', color: colors.actualValue, dataKey: 'actualValue', type: 'actual' as const },
    { value: 'Contributions', color: colors.actualContributions, dataKey: 'actualContributions', type: 'actual' as const },
    { value: 'Projected Value', color: colors.projectedValue, dataKey: 'value', type: 'projected' as const },
    { value: 'Projected Contributions', color: colors.projectedContributions, dataKey: 'cumulativeContributions', type: 'projected' as const },
    { value: 'Target Goal', color: colors.target, dataKey: 'goal', type: 'target' as const },
  ], [colors]);

  return (
    <div
      ref={containerRef}
      className={`${styles.chartContainer} ${className}`}
      role="application"
      aria-label="Investment Goal Progress Chart"
    >
      {/* Screen reader announcements */}
      <div role="status" aria-live="polite" aria-atomic="true" className={styles.srOnly}>
        {announcement}
      </div>
      <div className={styles.srOnly} id="chart-summary">{chartSummary}</div>

      {/* Header */}
      <div className={styles.chartHeader}>
        <div className={styles.titleSection}>
          <h3 className={styles.chartTitle}>Investment Goal Progress</h3>
          <div className={styles.progressBadge}>
            <span className={styles.progressValue}>{progressPercent.toFixed(1)}%</span>
            <span className={styles.progressLabel}>of {formatPLN(goal.amount)}</span>
          </div>
          {enableRealTimeUpdates && (
            <div className={`${styles.wsStatus} ${wsConnected ? styles.connected : styles.disconnected}`}>
              <span className={styles.wsIndicator}></span>
              {wsConnected ? 'Live' : 'Offline'}
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div className={styles.statsRow}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Actual Value</span>
            <span className={styles.statValue} style={{ color: colors.actualValue }}>
              {formatPLN(currentNetWorth)}
            </span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Actual Contributions</span>
            <span className={styles.statValue} style={{ color: colors.actualContributions }}>
              {formatPLN(totalActualContributions)}
            </span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Actual Returns</span>
            <span 
              className={styles.statValue} 
              style={{ color: actualReturns >= 0 ? colors.actualReturns : colors.actualContributions }}
            >
              {formatPLN(actualReturns)} ({actualReturnsPercent >= 0 ? '+' : ''}{actualReturnsPercent.toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* Time Range Controls */}
        <div className={styles.controlsRow}>
          <div className={styles.timeRangeButtons} role="tablist" aria-label="Time range selection">
            {TIME_RANGES.map((range) => (
              <button
                key={range.value}
                role="tab"
                aria-selected={selectedRange === range.value && !showCustomRange}
                className={`${styles.rangeButton} ${selectedRange === range.value && !showCustomRange ? styles.active : ''}`}
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
      </div>

      {/* Legend */}
      <CustomLegend payload={legendPayload} onToggle={handleLegendToggle} hiddenLines={hiddenLines} />

      {/* Chart */}
      <div
        className={styles.chartWrapper}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-describedby="chart-summary"
        role="img"
        aria-label={chartSummary}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />

            <XAxis
              dataKey="date"
              stroke={colors.textMuted}
              tick={{ fill: colors.textMuted, fontSize: 12 }}
              tickLine={{ stroke: colors.textMuted }}
              axisLine={{ stroke: colors.grid }}
              label={{ value: 'Date', position: 'insideBottom', offset: -10, fill: colors.textMuted, fontSize: 12 }}
              interval="preserveStartEnd"
              tickMargin={10}
            />

            <YAxis
              stroke={colors.textMuted}
              tick={{ fill: colors.textMuted, fontSize: 12 }}
              tickLine={{ stroke: colors.textMuted }}
              axisLine={{ stroke: colors.grid }}
              tickFormatter={formatYAxis}
              label={{ value: 'Value (PLN)', angle: -90, position: 'insideLeft', fill: colors.textMuted, fontSize: 12 }}
              width={70}
            />

            <Tooltip
              content={
                <CustomTooltip
                  goalAmount={goal.amount}
                  totalActualContributions={totalActualContributions}
                  currentNetWorth={currentNetWorth}
                  colors={colors}
                />
              }
              cursor={{ stroke: colors.grid, strokeWidth: 1 }}
            />

            {/* Current value reference line */}
            <ReferenceLine
              y={liveNetWorth}
              stroke={colors.actualValue}
              strokeDasharray="4 4"
              strokeWidth={2}
              label={{ value: `Current: ${formatPLN(liveNetWorth)}`, position: 'right', fill: colors.actualValue, fontSize: 11 }}
            />

            {/* Target goal line */}
            {!hiddenLines.has('goal') && (
              <Line
                type="monotone"
                dataKey="goal"
                name="Target Goal"
                stroke={colors.target}
                strokeWidth={2}
                strokeDasharray="8 4"
                dot={false}
                activeDot={false}
                isAnimationActive={typeof window !== 'undefined' ? !window.matchMedia('(prefers-reduced-motion: reduce)').matches : true}
              />
            )}

            {/* Projected contributions (dashed) */}
            {!hiddenLines.has('cumulativeContributions') && (
              <Line
                type="monotone"
                dataKey="cumulativeContributions"
                name="Projected Contributions"
                stroke={colors.projectedContributions}
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
                activeDot={{ r: 4, fill: colors.projectedContributions, stroke: colors.background, strokeWidth: 2 }}
                isAnimationActive={typeof window !== 'undefined' ? !window.matchMedia('(prefers-reduced-motion: reduce)').matches : true}
              />
            )}

            {/* Projected portfolio value (dashed) */}
            {!hiddenLines.has('value') && (
              <Line
                type="monotone"
                dataKey="value"
                name="Projected Value"
                stroke={colors.projectedValue}
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
                activeDot={{ r: 6, fill: colors.projectedValue, stroke: colors.background, strokeWidth: 2 }}
                isAnimationActive={typeof window !== 'undefined' ? !window.matchMedia('(prefers-reduced-motion: reduce)').matches : true}
              />
            )}

            {/* Actual contributions (solid) */}
            {!hiddenLines.has('actualContributions') && (
              <Line
                type="monotone"
                dataKey="actualContributions"
                name="Actual Contributions"
                stroke={colors.actualContributions}
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, fill: colors.actualContributions, stroke: colors.background, strokeWidth: 2 }}
                connectNulls={false}
                isAnimationActive={typeof window !== 'undefined' ? !window.matchMedia('(prefers-reduced-motion: reduce)').matches : true}
              />
            )}

            {/* Actual portfolio value (solid, shows only current point) */}
            {!hiddenLines.has('actualValue') && (
              <Line
                type="monotone"
                dataKey="actualValue"
                name="Actual Value"
                stroke={colors.actualValue}
                strokeWidth={3}
                dot={{ r: 8, fill: colors.actualValue, stroke: colors.background, strokeWidth: 3 }}
                activeDot={{ r: 10, fill: colors.actualValue, stroke: colors.background, strokeWidth: 3 }}
                connectNulls={false}
                isAnimationActive={typeof window !== 'undefined' ? !window.matchMedia('(prefers-reduced-motion: reduce)').matches : true}
              />
            )}

            {/* Brush for zoom */}
            <Brush
              dataKey="date"
              height={30}
              stroke={colors.actualValue}
              fill={colors.background}
              startIndex={brushRange.startIndex}
              endIndex={brushRange.endIndex}
              onChange={(range) => setBrushRange({ startIndex: range.startIndex, endIndex: range.endIndex })}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Data Table */}
      <details className={styles.dataTableDetails}>
        <summary className={styles.dataTableSummary}>View data as table</summary>
        <div className={styles.tableWrapper}>
          <table className={styles.dataTable} aria-label="Investment progress data">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Projected Value</th>
                <th scope="col">Projected Contrib.</th>
                <th scope="col">Actual Contrib.</th>
                <th scope="col">Actual Value</th>
                <th scope="col">Progress</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.slice(-12).map((point, index) => {
                const progress = (point.value / goal.amount) * 100;
                return (
                  <tr key={index}>
                    <td>{point.date}</td>
                    <td>{formatPLN(point.value)}</td>
                    <td>{formatPLN(point.cumulativeContributions)}</td>
                    <td>{point.actualContributions !== undefined ? formatPLN(point.actualContributions) : '-'}</td>
                    <td>{point.actualValue !== undefined ? formatPLN(point.actualValue) : '-'}</td>
                    <td>{progress.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>

      {/* Instructions */}
      <div className={styles.instructions} aria-hidden="true">
        <span>Drag brush below chart to zoom</span>
        <span>Arrow keys to navigate</span>
        <span>Escape to reset</span>
      </div>
    </div>
  );
};

export default InvestmentGoalChart;
