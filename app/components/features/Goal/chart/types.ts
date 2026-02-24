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
  strokeDasharray?: string;
  strokeWidth?: number;
  lineStyle?: 'solid' | 'dashed' | 'dotted' | 'mixed';
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
    projectedValue: '#22d3ee',
    projectedContributions: '#eab308',
    actualValue: '#22c55e',
    actualContributions: '#f97316',
    actualReturns: '#a78bfa',
    target: '#60a5fa',
    grid: 'rgba(148, 163, 184, 0.1)',
    text: '#e2e8f0',
    textMuted: '#94a3b8',
    background: '#1e293b',
  },
  light: {
    projectedValue: '#0e7490',
    projectedContributions: '#a16207',
    actualValue: '#15803d',
    actualContributions: '#c2410c',
    actualReturns: '#7c3aed',
    target: '#1d4ed8',
    grid: 'rgba(100, 116, 139, 0.15)',
    text: '#1e293b',
    textMuted: '#475569',
    background: '#ffffff',
  },
};

export interface LineDotStyle {
  r: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface ChartLineStyle {
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
  strokeOpacity?: number;
  dot?: false | LineDotStyle;
  activeDot?: false | LineDotStyle;
  lineStyle: 'solid' | 'dashed' | 'dotted' | 'mixed';
}

interface ResolveChartLineStyleInput {
  dataKey: string;
  seriesKind: 'core' | 'monte-carlo' | 'scenario' | 'benchmark' | 'what-if';
  theme: 'dark' | 'light';
  colors: typeof CHART_COLORS.dark;
  monteCarloColors: {
    p90: string;
    p50: string;
    p10: string;
  };
  background: string;
  colorHint?: string;
  index?: number;
}

const SCENARIO_STROKE_PATTERNS = ['8 2', '5 3', '2 4', '10 3 2 3'] as const;
const BENCHMARK_STROKE_PATTERNS = ['14 4', '9 3 2 3', '4 6'] as const;

const SCENARIO_FALLBACK_COLORS = {
  dark: ['#f43f5e', '#84cc16', '#f59e0b', '#c084fc'],
  light: ['#be123c', '#3f6212', '#b45309', '#7e22ce'],
} as const;

const BENCHMARK_FALLBACK_COLORS = {
  dark: ['#0ea5e9', '#a855f7', '#14b8a6'],
  light: ['#0369a1', '#7e22ce', '#0f766e'],
} as const;

function dotStyle(radius: number, fill: string, background: string, strokeWidth = 2): LineDotStyle {
  return {
    r: radius,
    fill,
    stroke: background,
    strokeWidth,
  };
}

export function resolveChartLineStyle({
  dataKey,
  seriesKind,
  theme,
  colors,
  monteCarloColors,
  background,
  colorHint,
  index = 0,
}: ResolveChartLineStyleInput): ChartLineStyle {
  if (seriesKind === 'core') {
    if (dataKey === 'goal') {
      return {
        stroke: colors.target,
        strokeWidth: 3,
        strokeDasharray: '10 4',
        lineStyle: 'dashed',
        dot: false,
        activeDot: false,
      };
    }

    if (dataKey === 'value') {
      return {
        stroke: colors.projectedValue,
        strokeWidth: 3,
        lineStyle: 'solid',
        dot: false,
        activeDot: dotStyle(6, colors.projectedValue, background, 2),
      };
    }

    if (dataKey === 'cumulativeContributions') {
      return {
        stroke: colors.projectedContributions,
        strokeWidth: 2.5,
        strokeDasharray: '6 3',
        lineStyle: 'dashed',
        dot: false,
        activeDot: dotStyle(5, colors.projectedContributions, background, 2),
      };
    }

    if (dataKey === 'actualContributions') {
      return {
        stroke: colors.actualContributions,
        strokeWidth: 3,
        strokeDasharray: '2 2',
        lineStyle: 'dotted',
        dot: false,
        activeDot: dotStyle(6, colors.actualContributions, background, 2),
      };
    }

    if (dataKey === 'actualValue') {
      return {
        stroke: colors.actualValue,
        strokeWidth: 3.5,
        lineStyle: 'solid',
        dot: dotStyle(8, colors.actualValue, background, 3),
        activeDot: dotStyle(10, colors.actualValue, background, 3),
      };
    }
  }

  if (seriesKind === 'monte-carlo') {
    if (dataKey === 'p90') {
      return {
        stroke: monteCarloColors.p90,
        strokeWidth: 2,
        strokeDasharray: '12 4',
        strokeOpacity: 0.9,
        lineStyle: 'dashed',
        dot: false,
        activeDot: false,
      };
    }

    if (dataKey === 'p50') {
      return {
        stroke: monteCarloColors.p50,
        strokeWidth: 2.5,
        strokeDasharray: '4 2',
        lineStyle: 'mixed',
        dot: false,
        activeDot: false,
      };
    }

    if (dataKey === 'p10') {
      return {
        stroke: monteCarloColors.p10,
        strokeWidth: 2,
        strokeDasharray: '1 3',
        strokeOpacity: 0.9,
        lineStyle: 'dotted',
        dot: false,
        activeDot: false,
      };
    }
  }

  if (seriesKind === 'scenario') {
    const scenarioColor =
      colorHint ??
      SCENARIO_FALLBACK_COLORS[theme][index % SCENARIO_FALLBACK_COLORS[theme].length];
    const dashPattern = SCENARIO_STROKE_PATTERNS[index % SCENARIO_STROKE_PATTERNS.length];

    return {
      stroke: scenarioColor,
      strokeWidth: 2.5,
      strokeDasharray: dashPattern,
      lineStyle: 'dashed',
      dot: false,
      activeDot: dotStyle(6, scenarioColor, background, 2),
    };
  }

  if (seriesKind === 'benchmark') {
    const benchmarkColor =
      colorHint ??
      BENCHMARK_FALLBACK_COLORS[theme][index % BENCHMARK_FALLBACK_COLORS[theme].length];
    const dashPattern = BENCHMARK_STROKE_PATTERNS[index % BENCHMARK_STROKE_PATTERNS.length];

    return {
      stroke: benchmarkColor,
      strokeWidth: 2.5,
      strokeDasharray: dashPattern,
      lineStyle: 'mixed',
      dot: false,
      activeDot: dotStyle(6, benchmarkColor, background, 2),
    };
  }

  const whatIfColor = colorHint ?? (theme === 'dark' ? '#fb923c' : '#c2410c');
  return {
    stroke: whatIfColor,
    strokeWidth: 3,
    strokeDasharray: '6 3',
    lineStyle: 'dashed',
    dot: false,
    activeDot: dotStyle(8, whatIfColor, background, 3),
  };
}
