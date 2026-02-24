import { ExtendedProjectionDataPoint } from '@/lib/projectionCalculations';

export type ChartProjectionPoint = ExtendedProjectionDataPoint &
  Record<string, number | string | undefined>;

export type ChartSeriesType =
  | 'projected'
  | 'actual'
  | 'target'
  | 'monte-carlo'
  | 'scenario';

export interface LegendEntry {
  value: string;
  color: string;
  dataKey: string;
  type: ChartSeriesType;
}

export interface TimeRangeOption {
  label: string;
  value: string;
  months: number | null;
}

export const TIME_RANGES: TimeRangeOption[] = [
  { label: '6M', value: '6m', months: 6 },
  { label: '1Y', value: '1y', months: 12 },
  { label: '3Y', value: '3y', months: 36 },
  { label: '5Y', value: '5y', months: 60 },
  { label: '10Y', value: '10y', months: 120 },
  { label: 'All', value: 'all', months: null },
];

// Theme-aware color palette using CSS variable values.
export const CHART_COLORS = {
  dark: {
    projectedValue: '#4ECDC4',
    projectedContributions: '#8b5cf6',
    actualValue: '#10b981',
    actualContributions: '#ef4444',
    actualReturns: '#f59e0b',
    target: '#3b82f6',
    grid: 'rgba(148, 163, 184, 0.1)',
    text: '#e2e8f0',
    textMuted: '#94a3b8',
    background: '#1e293b',
  },
  light: {
    projectedValue: '#14b8a6',
    projectedContributions: '#7c3aed',
    actualValue: '#059669',
    actualContributions: '#dc2626',
    actualReturns: '#d97706',
    target: '#2563eb',
    grid: 'rgba(100, 116, 139, 0.15)',
    text: '#1e293b',
    textMuted: '#475569',
    background: '#ffffff',
  },
};
