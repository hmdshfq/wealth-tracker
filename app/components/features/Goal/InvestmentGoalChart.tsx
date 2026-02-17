'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo, useId } from 'react';
import { PanelTopClose, PanelTopOpen } from 'lucide-react';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Brush,
  Area,
  ComposedChart,
} from 'recharts';
import { convertCurrency, formatPreferredCurrency, formatCurrency } from '@/lib/formatters';
import { Goal, InvestmentScenario, ScenarioAnalysisResult, ProjectionDataPoint, TimeBasedAnalysisResult, BehavioralAnalysisResult, PreferredCurrency } from '@/lib/types';
import { ExtendedProjectionDataPoint, generateProjectionData as generateProjectionDataMain, performTimeBasedAnalysis as performTimeBasedAnalysisMain } from '@/lib/projectionCalculations';
import { MonteCarloSimulationResult } from '@/lib/types';
import { calculateYearsToGoal, calculateRequiredContributions, performBehavioralAnalysis } from '@/lib/goalCalculations';
import { runMonteCarloSimulation as runMonteCarloSimulationMain } from '@/lib/projectionCalculations';
import { runScenarioAnalysis as runScenarioAnalysisMain } from '@/lib/projectionCalculations';
import { useFinancialWorker } from '@/lib/hooks';
import { 
  sampleProjectionData,
  smartSampleData,
  shouldSampleData,
  getRecommendedSamplingStrategy 
} from '@/lib/dataSampling';
import { 
  HelpTooltip,
  ConfidenceBandsHelp,
  MonteCarloLegendHelp,
  VolatilityGuide,
  ScenarioAnalysisHelp
} from './InvestmentGoalChartHelp';
import { InlineLoader } from '@/components/ui';
import styles from './InvestmentGoalChart.module.css';

type ChartProjectionPoint = ExtendedProjectionDataPoint & Record<string, number | string | undefined>;

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
  preferredCurrency: PreferredCurrency;
  highContrastMode?: boolean;
  enableRealTimeUpdates?: boolean;
  websocketUrl?: string;
  className?: string;
  firstTransactionDate?: string;
  monteCarloResult?: MonteCarloSimulationResult;
  showMonteCarlo?: boolean;
  scenarioAnalysisResult?: ScenarioAnalysisResult;
  showScenarioAnalysis?: boolean;
  scenarios?: InvestmentScenario[];
  timeBasedAnalysisResult?: TimeBasedAnalysisResult;
  showTimeBasedAnalysis?: boolean;
  behavioralAnalysisResult?: BehavioralAnalysisResult;
  showBehavioralAnalysis?: boolean;
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

type ChartSeriesType = 'projected' | 'actual' | 'target' | 'monte-carlo' | 'scenario';

interface LegendEntry {
  value: string;
  color: string;
  dataKey: string;
  type: ChartSeriesType;
}

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
interface TooltipPayloadItem {
  dataKey?: string;
  value?: number;
  name?: string;
  stroke?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  goalAmount: number;
  totalActualContributions: number;
  currentNetWorth: number;
  colors: typeof CHART_COLORS.dark;
  legendEntries: LegendEntry[];
  formatValue: (value: number) => string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  goalAmount,
  totalActualContributions,
  currentNetWorth,
  colors,
  legendEntries,
  formatValue,
}) => {
  if (!active || !payload || payload.length === 0) return null;

  const legendLookup = new Map(legendEntries.map((entry) => [entry.dataKey, entry]));

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

  const payloadByType = payload.reduce<Record<ChartSeriesType, TooltipPayloadItem[]>>((acc, entry) => {
    const key = entry.dataKey ?? entry.name ?? '';
    const legendEntry = legendLookup.get(key);
    const type = legendEntry?.type ?? 'projected';
    if (!acc[type]) acc[type] = [];
    acc[type].push(entry);
    return acc;
  }, {} as Record<ChartSeriesType, TooltipPayloadItem[]>);

  const renderEntries = (entries: TooltipPayloadItem[]) =>
    entries
      .map((entry, index) => ({ entry, index }))
      .filter(({ entry }) => entry.value !== undefined)
      .map(({ entry, index }) => {
        const key = entry.dataKey ?? entry.name ?? 'value';
        const legendEntry = legendLookup.get(entry.dataKey ?? '');
        const displayName = legendEntry?.value ?? entry.name ?? key;
        const color = entry.stroke ?? legendEntry?.color ?? colors.text;
        return (
          <p key={`${displayName}-${key}-${index}`} style={{ color }}>
            {displayName}: {formatValue(entry.value!)}
          </p>
        );
      });

  const monteCarloEntries = payloadByType['monte-carlo'] || [];
  const scenarioEntries = payloadByType['scenario'] || [];
  const targetEntries = payloadByType['target'] || [];
  const hasTarget = targetEntries.length > 0;

  return (
    <div className={styles.customTooltip} role="tooltip" aria-live="polite">
      <p className={styles.tooltipTitle}>{label}</p>
      
      <div className={styles.tooltipSection}>
        <p className={styles.tooltipSectionTitle}>Projected</p>
        {projectedValue !== undefined && (
          <p style={{ color: colors.projectedValue }}>
            Portfolio: {formatValue(projectedValue)}{' '}
            <span className={styles.tooltipProgress}>
              ({progressPercent.toFixed(1)}% of target)
            </span>
          </p>
        )}
        {projectedContributions !== undefined && (
          <p style={{ color: colors.projectedContributions }}>
            Contributions: {formatValue(projectedContributions)}
          </p>
        )}
        {projectedReturns !== 0 && (
          <p className={styles.tooltipReturns}>
            Returns: {formatValue(projectedReturns)}
          </p>
        )}
      </div>

      {hasActual && (
        <div className={styles.tooltipSection}>
          <p className={styles.tooltipSectionTitle}>Actual</p>
          {actualValue !== undefined && (
            <p style={{ color: colors.actualValue }}>
              Portfolio: {formatValue(actualValue)}{' '}
              <span className={styles.tooltipProgress}>
                ({((actualValue / goalAmount) * 100).toFixed(1)}% of target)
              </span>
            </p>
          )}
          {actualContributions !== undefined && (
            <p style={{ color: colors.actualContributions }}>
              Contributions: {formatValue(actualContributions)}
            </p>
          )}
          {actualValue !== undefined && actualContributions !== undefined && (
            <p style={{ color: colors.actualReturns }}>
              Returns: {formatValue(actualValue - actualContributions)}{' '}
              ({actualContributions > 0 
                ? (((actualValue - actualContributions) / actualContributions) * 100).toFixed(1) 
                : 0}%)
            </p>
          )}
        </div>
      )}

      {monteCarloEntries.length > 0 && (
        <div className={styles.tooltipSection}>
          <p className={styles.tooltipSectionTitle}>Confidence Bands</p>
          {renderEntries(monteCarloEntries)}
        </div>
      )}

      {scenarioEntries.length > 0 && (
        <div className={styles.tooltipSection}>
          <p className={styles.tooltipSectionTitle}>Scenarios & Benchmarks</p>
          {renderEntries(scenarioEntries)}
        </div>
      )}

      {hasTarget && (
        <div className={styles.tooltipSection}>
          <p className={styles.tooltipSectionTitle}>Target</p>
          {renderEntries(targetEntries)}
        </div>
      )}
    </div>
  );
};

// Custom Legend Component
interface CustomLegendProps {
  payload: LegendEntry[];
  onToggle: (dataKey: string) => void;
  hiddenLines: Set<string>;
}

const CustomLegend: React.FC<CustomLegendProps> = ({ payload, onToggle, hiddenLines }) => {
  const projectedItems = payload.filter((p) => p.type === 'projected');
  const actualItems = payload.filter((p) => p.type === 'actual');
  const targetItems = payload.filter((p) => p.type === 'target');
  const monteCarloItems = payload.filter((p) => p.type === 'monte-carlo');
  const scenarioItems = payload.filter((p) => p.type === 'scenario');

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

      {monteCarloItems.length > 0 && (
        <div className={styles.legendGroup}>
          <div className={styles.legendGroupHeader}>
            <span className={styles.legendGroupTitle}>Confidence Bands</span>
            <MonteCarloLegendHelp />
          </div>
          <div className={styles.legendItems}>
            {monteCarloItems.map(renderItem)}
          </div>
        </div>
      )}

      {scenarioItems.length > 0 && (
        <div className={styles.legendGroup}>
          <div className={styles.legendGroupHeader}>
            <span className={styles.legendGroupTitle}>Scenarios</span>
          </div>
          <div className={styles.legendItems}>
            {scenarioItems.map(renderItem)}
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
  preferredCurrency = 'PLN',
  highContrastMode = false,
  enableRealTimeUpdates = false,
  websocketUrl,
  className = '',
  firstTransactionDate,
  monteCarloResult,
  showMonteCarlo,
  scenarioAnalysisResult,
  showScenarioAnalysis,
  scenarios,
  timeBasedAnalysisResult,
  showTimeBasedAnalysis,
  behavioralAnalysisResult,
  showBehavioralAnalysis,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const colors = CHART_COLORS[theme];
  const gradientId = useId();
  const monteCarloColors = useMemo(() => ({
    p90: theme === 'dark' ? '#60a5fa' : '#2563eb',
    p50: theme === 'dark' ? '#f59e0b' : '#d97706',
    p10: theme === 'dark' ? '#f87171' : '#dc2626',
  }), [theme]);
  
  // WebWorker hook for heavy computations
  const {
    runMonteCarloSimulation,
    runScenarioAnalysis,
    performTimeBasedAnalysis,
    generateProjectionData,
    isLoading: workerLoading,
    error: workerError,
    withFallback,
  } = useFinancialWorker();
  


  // State
  const [selectedRange, setSelectedRange] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    if (!firstTransactionDate) return '';
    return firstTransactionDate.substring(0, 7);
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });
  const [showCustomRange, setShowCustomRange] = useState(false);

  const [liveNetWorth, setLiveNetWorth] = useState(currentNetWorth);
  const [wsConnected, setWsConnected] = useState(false);
  const [hiddenLines, setHiddenLines] = useState<Set<string>>(new Set());
  const [focusedDataIndex, setFocusedDataIndex] = useState<number | null>(null);
  const [brushRange, setBrushRange] = useState<{ startIndex?: number; endIndex?: number }>({});
  const [announcement, setAnnouncement] = useState('');
  const [showMonteCarloLocal, setShowMonteCarloLocal] = useState(Boolean(showMonteCarlo));
  const [monteCarloVolatility, setMonteCarloVolatility] = useState(0.15);
  const [monteCarloSimulations, setMonteCarloSimulations] = useState(1000);
  const [activeHelpOverlay, setActiveHelpOverlay] = useState<'confidence-bands' | 'scenario-analysis' | null>(null);
  const [showScenarioAnalysisLocal, setShowScenarioAnalysisLocal] = useState(Boolean(showScenarioAnalysis));
  const [showTimeBasedAnalysisLocal, setShowTimeBasedAnalysisLocal] = useState(Boolean(showTimeBasedAnalysis));
  const [showBehavioralAnalysisLocal, setShowBehavioralAnalysisLocal] = useState(Boolean(showBehavioralAnalysis));
  const [timeBasedAnalysisResultLocal, setTimeBasedAnalysisResultLocal] = useState<TimeBasedAnalysisResult | null>(null);
  const defaultScenarios = useMemo<InvestmentScenario[]>(() => [
    { id: 'base', name: 'Base Case', returnAdjustment: 0, color: '#4ECDC4', description: 'Your original plan', isActive: true },
    { id: 'optimistic', name: 'Optimistic', returnAdjustment: 0.02, color: '#10b981', description: '+2% annual return', isActive: true },
    { id: 'pessimistic', name: 'Pessimistic', returnAdjustment: -0.02, color: '#ef4444', description: '-2% annual return', isActive: true },
  ], []);
  const scenarioDefinitions = useMemo<InvestmentScenario[]>(() => scenarios && scenarios.length > 0 ? scenarios : defaultScenarios, [scenarios, defaultScenarios]);
  const [activeScenarios, setActiveScenarios] = useState<InvestmentScenario[]>(scenarioDefinitions);
  const [monteCarloResultLocal, setMonteCarloResultLocal] = useState<MonteCarloSimulationResult | null>(monteCarloResult || null);
  const [scenarioAnalysisResultLocal, setScenarioAnalysisResultLocal] = useState<ScenarioAnalysisResult | null>(scenarioAnalysisResult || null);

  // What-if Scenario State
  const [showWhatIf, setShowWhatIf] = useState(false);
  const [whatIfParams, setWhatIfParams] = useState({
    annualReturn: goal.annualReturn,
    monthlyDeposits: goal.monthlyDeposits,
    yearsToGoal: 0, // Will be updated after yearsToGoal calculation
  });

  // State for what-if projection
  const [whatIfProjection, setWhatIfProjection] = useState<ProjectionDataPoint[] | null>(null);

  useEffect(() => {
    setActiveScenarios(scenarioDefinitions);
  }, [scenarioDefinitions]);

  useEffect(() => {
    if (monteCarloResult) {
      setMonteCarloResultLocal(monteCarloResult);
    }
  }, [monteCarloResult]);

  useEffect(() => {
    if (scenarioAnalysisResult) {
      setScenarioAnalysisResultLocal(scenarioAnalysisResult);
    }
  }, [scenarioAnalysisResult]);

  useEffect(() => {
    let isCancelled = false;

    // Keep confidence bands in sync with slider values.
    withFallback(
      () => runMonteCarloSimulation(goal, currentNetWorth, { numSimulations: monteCarloSimulations, volatility: monteCarloVolatility }),
      () => runMonteCarloSimulationMain(goal, currentNetWorth, { numSimulations: monteCarloSimulations, volatility: monteCarloVolatility })
    ).then((result) => {
      if (!isCancelled) {
        setMonteCarloResultLocal(result);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [goal, currentNetWorth, monteCarloSimulations, monteCarloVolatility, withFallback, runMonteCarloSimulation]);

  useEffect(() => {
    let isCancelled = false;

    withFallback(
      () => runScenarioAnalysis(goal, currentNetWorth, scenarioDefinitions),
      () => runScenarioAnalysisMain(goal, currentNetWorth, scenarioDefinitions)
    ).then((result) => {
      if (!isCancelled) {
        setScenarioAnalysisResultLocal(result);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [goal, currentNetWorth, scenarioDefinitions, withFallback, runScenarioAnalysis]);

  const effectiveMonteCarloResult = monteCarloResultLocal || monteCarloResult;
  const effectiveScenarioAnalysisResult = scenarioAnalysisResultLocal || scenarioAnalysisResult;
  
  // Generate what-if projection when parameters change
  useEffect(() => {
    if (!showWhatIf) {
      setWhatIfProjection(null);
      return;
    }
    
    // Create a temporary goal with what-if parameters
    const tempGoal = {
      ...goal,
      annualReturn: whatIfParams.annualReturn,
      monthlyDeposits: whatIfParams.monthlyDeposits,
    };
    
    // Use WebWorker with fallback to main thread
    withFallback(
      () => generateProjectionData(tempGoal, currentNetWorth),
      () => generateProjectionDataMain(tempGoal, currentNetWorth)
    ).then(setWhatIfProjection);
  }, [showWhatIf, whatIfParams, goal, currentNetWorth, withFallback, generateProjectionData]);

  // Calculate years to goal
  const yearsToGoal = useMemo(() => {
    return calculateYearsToGoal(
      goal.amount,
      currentNetWorth,
      goal.monthlyDeposits,
      goal.annualReturn,
      goal.depositIncreasePercentage
    );
  }, [goal.amount, currentNetWorth, goal.monthlyDeposits, goal.annualReturn, goal.depositIncreasePercentage]);

  // Update what-if params with calculated years to goal
  useEffect(() => {
    if (yearsToGoal.baseYears > 0) {
      setWhatIfParams(prev => ({ ...prev, yearsToGoal: yearsToGoal.baseYears }));
    }
  }, [yearsToGoal.baseYears]);

  // Calculate required contributions for different target years
  const requiredContributions = useMemo(() => {
    const targets = [5, 10, 15, 20];
    const result: Record<number, ReturnType<typeof calculateRequiredContributions>> = {};
    
    targets.forEach(years => {
      result[years] = calculateRequiredContributions(
        goal.amount,
        currentNetWorth,
        years,
        goal.annualReturn,
        goal.depositIncreasePercentage
      );
    });
    
    return result;
  }, [goal.amount, currentNetWorth, goal.annualReturn, goal.depositIncreasePercentage]);

  const announceToScreenReader = useCallback((message: string) => {
    setAnnouncement(message);
    setTimeout(() => setAnnouncement(''), 1000);
  }, []);

  // Calculate actual returns
  const actualReturns = useMemo(() => {
    return currentNetWorth - totalActualContributions;
  }, [currentNetWorth, totalActualContributions]);

  // Helper function for heatmap colors
  const getHeatmapColor = useCallback((returnPercent: number): string => {
    if (returnPercent > 10) return '#10b981'; // Strong positive
    if (returnPercent > 5) return '#34d399';
    if (returnPercent > 2) return '#6ee7b7';
    if (returnPercent > 0) return '#a7f3d0';
    if (returnPercent > -2) return '#fecaca';
    if (returnPercent > -5) return '#fca5a5';
    if (returnPercent > -10) return '#f87171';
    return '#ef4444'; // Strong negative
  }, []);
  


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

  // State for data sampling info
  const [isDataSampled, setIsDataSampled] = useState(false);
  const [originalDataPoints, setOriginalDataPoints] = useState<number | null>(null);
  const [sampledDataPoints, setSampledDataPoints] = useState<number | null>(null);
  
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

    // Apply data sampling if needed for performance
    const needsSampling = shouldSampleData(filtered, 500);
    let sampledData = filtered;
    
    if (needsSampling) {
      // Use smart sampling to preserve key characteristics
      sampledData = smartSampleData(filtered, 300);
      setIsDataSampled(true);
      setOriginalDataPoints(filtered.length);
      setSampledDataPoints(sampledData.length);
    } else {
      setIsDataSampled(false);
      setOriginalDataPoints(null);
      setSampledDataPoints(null);
    }

    // Add scenario data to each point
    const result = sampledData.map<ChartProjectionPoint>((d) => ({
      ...d,
      goal: goal.amount,
    }));

    // Add scenario values if scenario analysis is enabled
    if (showScenarioAnalysisLocal && effectiveScenarioAnalysisResult) {
      result.forEach((point, index) => {
        activeScenarios.forEach((scenario) => {
          if (scenario.isActive && effectiveScenarioAnalysisResult.scenarios[scenario.id]?.[index]) {
            point[scenario.id] = effectiveScenarioAnalysisResult.scenarios[scenario.id][index].value;
          }
        });
      });
    }

    // Add what-if values if what-if scenario is enabled
    if (showWhatIf && whatIfProjection) {
      result.forEach((point, index) => {
          if (whatIfProjection[index]) {
            point.whatIfValue = whatIfProjection[index].value;
          }
      });
    }

    return result;
  }, [projectionData, selectedRange, customStartDate, customEndDate, showCustomRange, goal.amount, showScenarioAnalysisLocal, effectiveScenarioAnalysisResult, activeScenarios, showWhatIf, whatIfProjection]);

  // State for benchmark data
  const [benchmarkData, setBenchmarkData] = useState<{
    id: string;
    name: string;
    color: string;
    annualReturn: number;
    data: ProjectionDataPoint[];
  }[]>([]);
  
  // Benchmark Comparisons - generate benchmark projections
  useEffect(() => {
    interface Benchmark {
      id: string;
      name: string;
      color: string;
      annualReturn: number;
      data: ProjectionDataPoint[];
    }
    
    const benchmarks: Benchmark[] = [];
    
    // S&P 500 benchmark (historical average return ~7%)
    const sp500Goal = { ...goal, annualReturn: 0.07 };
    
    // Industry average benchmark (conservative ~5%)
    const industryGoal = { ...goal, annualReturn: 0.05 };
    
    // Use WebWorker with fallback for both projections
    Promise.all([
      withFallback(
        () => generateProjectionData(sp500Goal, currentNetWorth),
        () => generateProjectionDataMain(sp500Goal, currentNetWorth)
      ),
      withFallback(
        () => generateProjectionData(industryGoal, currentNetWorth),
        () => generateProjectionDataMain(industryGoal, currentNetWorth)
      )
    ]).then(([sp500Projection, industryProjection]) => {
      benchmarks.push(
        { id: 'sp500', name: 'S&P 500', color: '#3b82f6', annualReturn: 0.07, data: sp500Projection },
        { id: 'industry', name: 'Industry Avg', color: '#8b5cf6', annualReturn: 0.05, data: industryProjection }
      );
      setBenchmarkData(benchmarks);
    });
  }, [goal, currentNetWorth, withFallback, generateProjectionData]);

  // Time-Based Analysis - use WebWorker
  useEffect(() => {
    if (projectionData && projectionData.length > 0 && showTimeBasedAnalysisLocal) {
      withFallback(
        () => performTimeBasedAnalysis(projectionData),
        () => performTimeBasedAnalysisMain(projectionData)
      ).then(setTimeBasedAnalysisResultLocal);
    } else {
      setTimeBasedAnalysisResultLocal(null);
    }
  }, [projectionData, showTimeBasedAnalysisLocal, withFallback, performTimeBasedAnalysis]);

  // Add benchmark data to filtered data after it's created
  const filteredDataWithBenchmarks = useMemo(() => {
    if (!filteredData.length || !benchmarkData.length) return filteredData;
    
    const result = filteredData.map<ChartProjectionPoint>((point) => ({ ...point }));
    benchmarkData.forEach((benchmark) => {
      result.forEach((point, index) => {
        if (benchmark.data[index]) {
          point[benchmark.id] = benchmark.data[index].value;
        }
      });
    });
    
    return result;
  }, [filteredData, benchmarkData]);

  const convertedGoalAmount = convertCurrency(goal.amount, preferredCurrency);
  const currencyAdjustedData = useMemo(() => {
    if (!filteredDataWithBenchmarks.length) return filteredDataWithBenchmarks;

    return filteredDataWithBenchmarks.map((point) => {
      const convertedPoint: ChartProjectionPoint = { ...point };
      Object.entries(point).forEach(([key, value]) => {
        if (typeof value === 'number') {
          convertedPoint[key as keyof ChartProjectionPoint] = convertCurrency(value, preferredCurrency);
        }
      });
      return convertedPoint;
    });
  }, [filteredDataWithBenchmarks, preferredCurrency]);

  const formatChartValue = (value: number) => formatCurrency(value, preferredCurrency);


  


  // Goal Achievement Zones - calculate progress milestones
  const goalAchievementZones = useMemo(() => {
    interface Zone {
      percentage: number;
      value: number;
      date: string | undefined;
      color: string;
    }
    
    const zones: Zone[] = [];
    const milestonePercentages = [0.25, 0.5, 0.75, 1.0];
    
    milestonePercentages.forEach(percentage => {
      const milestoneValue = goal.amount * percentage;
      const milestoneDate = filteredData.find(point => point.value >= milestoneValue)?.date;
      
      zones.push({
        percentage,
        value: milestoneValue,
        date: milestoneDate,
        color: percentage === 1.0 ? '#10b981' : percentage >= 0.75 ? '#f59e0b' : percentage >= 0.5 ? '#f59e0b' : '#ef4444'
      });
    });
    
    return zones;
  }, [goal.amount, filteredData]);

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
    if (!currencyAdjustedData.length) return;
    const maxIndex = currencyAdjustedData.length - 1;

      switch (event.key) {
        case 'ArrowRight':
          event.preventDefault();
          setFocusedDataIndex((prev) => {
            const newIndex = prev === null ? 0 : Math.min(prev + 1, maxIndex);
            const point = currencyAdjustedData[newIndex];
            announceToScreenReader(
              `${point.date}: Portfolio ${formatChartValue(point.value)}, ${((point.value / convertedGoalAmount) * 100).toFixed(1)}% of target`
            );
            return newIndex;
          });
          break;
        case 'ArrowLeft':
          event.preventDefault();
          setFocusedDataIndex((prev) => {
            const newIndex = prev === null ? maxIndex : Math.max(prev - 1, 0);
            const point = currencyAdjustedData[newIndex];
            announceToScreenReader(`${point.date}: Portfolio ${formatChartValue(point.value)}`);
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
    const symbol = preferredCurrency === 'PLN' ? 'zł' : preferredCurrency === 'EUR' ? '€' : '$';
    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    if (absValue >= 1_000_000) {
      return `${sign}${symbol}${(absValue / 1_000_000).toFixed(1)}M`;
    }
    if (absValue >= 1_000) {
      return `${sign}${symbol}${(absValue / 1_000).toFixed(0)}k`;
    }
    return `${sign}${symbol}${absValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };

  const chartSummary = useMemo(() => {
    if (!currencyAdjustedData.length) return 'No data available';
    const first = currencyAdjustedData[0];
    const last = currencyAdjustedData[currencyAdjustedData.length - 1];
    return `Investment goal chart from ${first.date} to ${last.date}. Current: ${formatPreferredCurrency(currentNetWorth, preferredCurrency)} (${progressPercent.toFixed(1)}% of ${formatPreferredCurrency(goal.amount, preferredCurrency)} target). Actual contributions: ${formatPreferredCurrency(totalActualContributions, preferredCurrency)}. Actual returns: ${formatPreferredCurrency(actualReturns, preferredCurrency)} (${actualReturnsPercent.toFixed(1)}%).`;
  }, [currencyAdjustedData, currentNetWorth, goal.amount, progressPercent, totalActualContributions, actualReturns, actualReturnsPercent, preferredCurrency]);

  // Legend items with theme colors
  const legendPayload = useMemo<LegendEntry[]>(() => [
    { value: 'Portfolio Value', color: colors.actualValue, dataKey: 'actualValue', type: 'actual' as const },
    { value: 'Contributions', color: colors.actualContributions, dataKey: 'actualContributions', type: 'actual' as const },
    { value: 'Projected Value', color: colors.projectedValue, dataKey: 'value', type: 'projected' as const },
    { value: 'Projected Contributions', color: colors.projectedContributions, dataKey: 'cumulativeContributions', type: 'projected' as const },
    { value: 'Target Goal', color: colors.target, dataKey: 'goal', type: 'target' as const },
    ...(showMonteCarloLocal && effectiveMonteCarloResult ? [
      { value: '90% Confidence', color: monteCarloColors.p90, dataKey: 'p90', type: 'monte-carlo' as const },
      { value: 'Median', color: monteCarloColors.p50, dataKey: 'p50', type: 'monte-carlo' as const },
      { value: '10% Confidence', color: monteCarloColors.p10, dataKey: 'p10', type: 'monte-carlo' as const },
    ] : []),
    ...(showScenarioAnalysisLocal && effectiveScenarioAnalysisResult ? activeScenarios
      .filter(s => s.isActive && s.id !== 'base')
      .map(scenario => ({
        value: scenario.name,
        color: scenario.color,
        dataKey: scenario.id,
        type: 'scenario' as const
      })) : []),
    ...(showWhatIf && whatIfProjection ? [
      { value: 'What-if Projection', color: '#f59e0b', dataKey: 'whatIfValue', type: 'scenario' as const }
    ] : []),
    ...benchmarkData.map(benchmark => ({
      value: benchmark.name,
      color: benchmark.color,
      dataKey: benchmark.id,
      type: 'scenario' as const
    })),
  ], [colors, showMonteCarloLocal, effectiveMonteCarloResult, showScenarioAnalysisLocal, effectiveScenarioAnalysisResult, activeScenarios, showWhatIf, whatIfProjection, benchmarkData, monteCarloColors]);

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
            <span className={styles.progressLabel}>of {formatPreferredCurrency(goal.amount, preferredCurrency)}</span>
          </div>
          {enableRealTimeUpdates && (
            <div className={`${styles.wsStatus} ${wsConnected ? styles.connected : styles.disconnected}`}>
              <span className={styles.wsIndicator}></span>
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
              {originalDataPoints} points → {sampledDataPoints} displayed
              <HelpTooltip content="Data sampling applied for performance. Key characteristics preserved.">
                <span className={styles.helpIcon} aria-label="Help">ⓘ</span>
              </HelpTooltip>
            </div>
          )}

        </div>

        {/* Stats Row */}
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
              {formatPreferredCurrency(actualReturns, preferredCurrency)} ({actualReturnsPercent >= 0 ? '+' : ''}{actualReturnsPercent.toFixed(1)}%)
            </span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Years to Goal</span>
            <span className={styles.statValue} style={{ color: colors.projectedValue }}>
              {yearsToGoal.baseYears} years ({yearsToGoal.confidenceInterval[0]}-{yearsToGoal.confidenceInterval[1]})
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

        {/* Monte Carlo Controls */}
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
                  <span className={styles.helpIcon} aria-label="Help">ⓘ</span>
                </HelpTooltip>
              </label>
            </div>

            {showMonteCarloLocal && (
              <div className={styles.monteCarloParams}>
                <div className={styles.paramGroup}>
                  <label>
                    Volatility: {Math.round(monteCarloVolatility * 100)}%
                    <HelpTooltip content="Adjust based on your portfolio's risk level (5% for bonds, 15% for balanced, 30% for aggressive growth)">
                      <span className={styles.helpIcon} aria-label="Help">ⓘ</span>
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
                      <span className={styles.helpIcon} aria-label="Help">ⓘ</span>
                    </HelpTooltip>
                    <input
                      type="range"
                      min="100"
                      max="5000"
                      step="100"
                      value={monteCarloSimulations}
                      onChange={(e) => setMonteCarloSimulations(parseInt(e.target.value))}
                    />
                  </label>
                </div>

                <button
                  onClick={() => {
                    // Reset to defaults
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

      {/* Time-Based Analysis Controls */}
      {(timeBasedAnalysisResultLocal || timeBasedAnalysisResult) && (
        <div className={styles.timeBasedAnalysisControls}>
          <div className={styles.timeBasedAnalysisHeader}>
            <h4>Time-Based Analysis</h4>
            <button
              onClick={() => setActiveHelpOverlay('scenario-analysis')}
              className={styles.helpButton}
              aria-label="Learn about time-based analysis"
            >
              ⓘ Help
            </button>
          </div>
          <div className={styles.timeBasedAnalysisToggle}>
            <label>
              <input
                type="checkbox"
                checked={showTimeBasedAnalysisLocal}
                onChange={() => setShowTimeBasedAnalysisLocal(!showTimeBasedAnalysisLocal)}
              />
              Show Time-Based Analysis
              <HelpTooltip content="Analyze seasonal patterns and year-over-year performance trends">
                <span className={styles.helpIcon} aria-label="Help">ⓘ</span>
              </HelpTooltip>
            </label>
          </div>

          {showTimeBasedAnalysisLocal && (
            <div className={styles.timeBasedAnalysisContent}>
              {/* Seasonal Patterns */}
              <div className={styles.seasonalPatterns}>
                <h5>Seasonal Patterns</h5>
                <div className={styles.patternsGrid}>
                  {(timeBasedAnalysisResultLocal?.seasonalPatterns || timeBasedAnalysisResult?.seasonalPatterns || []).map((pattern) => (
                    <div key={`pattern-${pattern.month}`} className={styles.patternItem}>
                      <div className={styles.patternHeader}>
                        <span className={styles.patternMonth}>{new Date(0, pattern.month - 1).toLocaleString('default', { month: 'short' })}</span>
                        <span 
                          className={styles.patternReturn}
                          style={{ color: pattern.averageReturn >= 0 ? '#10b981' : '#ef4444' }}
                        >
                          {(pattern.averageReturn * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className={styles.patternStrength}>
                        <div 
                          className={styles.patternStrengthBar}
                          style={{ width: `${pattern.patternStrength * 100}%` }}
                        />
                        <span>Strength: {Math.round(pattern.patternStrength * 100)}%</span>
                      </div>
                      <div className={styles.patternDetails}>
                        <span>Best: {pattern.bestYear}</span>
                        <span>Worst: {pattern.worstYear}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Best and Worst Months */}
              <div className={styles.bestWorstMonths}>
                <div className={styles.bestMonths}>
                  <h5>Best Months</h5>
                  {(timeBasedAnalysisResultLocal?.bestMonths || timeBasedAnalysisResult?.bestMonths || []).map((month) => (
                    <div key={`best-${month.month}`} className={styles.monthItem}>
                      <span className={styles.monthName}>{new Date(0, month.month - 1).toLocaleString('default', { month: 'long' })}</span>
                      <span className={styles.monthValue} style={{ color: '#10b981' }}>
                        +{(month.averageReturn * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>

                <div className={styles.worstMonths}>
                  <h5>Worst Months</h5>
                  {(timeBasedAnalysisResultLocal?.worstMonths || timeBasedAnalysisResult?.worstMonths || []).map((month) => (
                    <div key={`worst-${month.month}`} className={styles.monthItem}>
                      <span className={styles.monthName}>{new Date(0, month.month - 1).toLocaleString('default', { month: 'long' })}</span>
                      <span className={styles.monthValue} style={{ color: '#ef4444' }}>
                        {(month.averageReturn * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Year-over-Year Comparison */}
              <div className={styles.yoyComparison}>
                <h5>Year-over-Year Performance</h5>
                <table className={styles.yoyTable}>
                  <thead>
                    <tr>
                      <th>Year</th>
                      <th>Start Value</th>
                      <th>End Value</th>
                      <th>Annual Return</th>
                      <th>Annual Growth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(timeBasedAnalysisResultLocal?.yearOverYearComparisons || timeBasedAnalysisResult?.yearOverYearComparisons || []).map((yoy) => (
                      <tr key={`yoy-${yoy.year}`}>
                        <td>{yoy.year}</td>
                        <td>{formatPreferredCurrency(yoy.startValue, preferredCurrency)}</td>
                        <td>{formatPreferredCurrency(yoy.endValue, preferredCurrency)}</td>
                        <td style={{ color: yoy.annualReturn >= 0 ? '#10b981' : '#ef4444' }}>
                          {(yoy.annualReturn * 100).toFixed(1)}%
                        </td>
                        <td style={{ color: yoy.annualGrowth >= 0 ? '#10b981' : '#ef4444' }}>
                          {formatPreferredCurrency(yoy.annualGrowth, preferredCurrency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Performance Heatmap */}
              <div className={styles.performanceHeatmap}>
                <h5>Performance Heatmap</h5>
                <div className={styles.heatmapLegend}>
                  <span>Low Performance</span>
                  <div className={styles.heatmapGradient} />
                  <span>High Performance</span>
                </div>
                <div className={styles.heatmapGrid}>
                  {Object.entries(timeBasedAnalysisResultLocal?.performanceHeatmap || timeBasedAnalysisResult?.performanceHeatmap || {}).map(([monthKey, returnPercent]) => (
                    <div 
                      key={`heatmap-${monthKey}`}
                      className={styles.heatmapCell}
                      style={{ 
                        backgroundColor: getHeatmapColor(returnPercent),
                        color: Math.abs(returnPercent) > 5 ? '#ffffff' : '#1e293b'
                      }}
                      title={`${monthKey}: ${returnPercent.toFixed(1)}%`}
                    >
                      {returnPercent.toFixed(1)}%
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Behavioral Analysis Controls */}
      {behavioralAnalysisResult && (
        <div className={styles.behavioralAnalysisControls}>
          <div className={styles.behavioralAnalysisHeader}>
            <h4>Behavioral Finance Analysis</h4>
            <button
              onClick={() => setActiveHelpOverlay('scenario-analysis')}
              className={styles.helpButton}
              aria-label="Learn about behavioral finance analysis"
            >
              ⓘ Help
            </button>
          </div>
          <div className={styles.behavioralAnalysisToggle}>
            <label>
              <input
                type="checkbox"
                checked={showBehavioralAnalysisLocal}
                onChange={() => setShowBehavioralAnalysisLocal(!showBehavioralAnalysisLocal)}
              />
              Show Behavioral Analysis
              <HelpTooltip content="Identify behavioral biases and get motivational insights">
                <span className={styles.helpIcon} aria-label="Help">ⓘ</span>
              </HelpTooltip>
            </label>
          </div>

          {showBehavioralAnalysisLocal && (
            <div className={styles.behavioralAnalysisContent}>
              {/* Progress Milestones */}
              <div className={styles.progressMilestones}>
                <h5>Progress Milestones</h5>
                <div className={styles.milestonesGrid}>
                  {behavioralAnalysisResult.progressMilestones.map((milestone) => (
                    <div key={`milestone-${milestone.percentage}`} className={styles.milestoneItem}>
                      <div className={styles.milestoneHeader}>
                        <span className={styles.milestonePercentage}>{Math.round(milestone.percentage * 100)}%</span>
                        {milestone.achieved ? (
                          <span className={styles.milestoneStatus} style={{ color: '#10b981' }}>✓ Achieved</span>
                        ) : (
                          <span className={styles.milestoneStatus} style={{ color: '#f59e0b' }}>🔜 Coming Soon</span>
                        )}
                      </div>
                      <div className={styles.milestoneCelebration}>
                        <span className={styles.milestoneBadge}>{milestone.badge}</span>
                        <p className={styles.milestoneMessage}>{milestone.celebrationMessage}</p>
                      </div>
                      {milestone.date && (
                        <div className={styles.milestoneDate}>
                          Projected: {new Date(milestone.date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Behavioral Biases */}
              <div className={styles.behavioralBiases}>
                <h5>Behavioral Biases</h5>
                {behavioralAnalysisResult.behavioralBiases.length > 0 ? (
                  <div className={styles.biasesList}>
                    {behavioralAnalysisResult.behavioralBiases.map((bias) => (
                      <div key={`bias-${bias.type}`} className={styles.biasItem}>
                        <div className={styles.biasHeader}>
                          <span className={styles.biasType}>{bias.type}</span>
                          <span 
                            className={styles.biasSeverity}
                            style={{ 
                              color: bias.severity === 'high' ? '#ef4444' : bias.severity === 'medium' ? '#f59e0b' : '#10b981'
                            }}
                          >
                            {bias.severity}
                          </span>
                        </div>
                        <p className={styles.biasDescription}>{bias.description}</p>
                        <p className={styles.biasRecommendation}><strong>Recommendation:</strong> {bias.recommendation}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.noBiases}>No significant behavioral biases detected. Your investment approach appears balanced!</p>
                )}
              </div>

              {/* Motivational Messages */}
              <div className={styles.motivationalMessages}>
                <h5>Motivational Insights</h5>
                <div className={styles.messagesList}>
                  {behavioralAnalysisResult.motivationalMessages.map((message, index) => (
                    <div key={`message-${index}`} className={styles.messageItem}>
                      <span className={styles.messageIcon}>💡</span>
                      <span className={styles.messageText}>{message}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Achievement Badges */}
              <div className={styles.achievementBadges}>
                <h5>Your Achievements</h5>
                {behavioralAnalysisResult.achievementBadges.length > 0 ? (
                  <div className={styles.badgesList}>
                    {behavioralAnalysisResult.achievementBadges.map((badge, index) => (
                      <div key={`badge-${index}`} className={styles.badgeItem}>
                        <span className={styles.badgeIcon}>{badge}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                    <p className={styles.noBadges}>Keep up the great work! You&rsquo;ll earn badges as you progress toward your goals.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

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
          <ComposedChart data={currencyAdjustedData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
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
              label={{ value: `Value (${preferredCurrency})`, angle: -90, position: 'insideLeft', fill: colors.textMuted, fontSize: 12 }}
              width={70}
            />

            <Tooltip
              content={
                <CustomTooltip
                  goalAmount={convertedGoalAmount}
                  totalActualContributions={totalActualContributions}
                  currentNetWorth={currentNetWorth}
                  colors={colors}
                  legendEntries={legendPayload}
                  formatValue={formatChartValue}
                />
              }
              cursor={{ stroke: colors.grid, strokeWidth: 1 }}
            />

            {/* Current value reference line */}
            <ReferenceLine
              stroke={colors.actualValue}
              strokeDasharray="4 4"
              strokeWidth={2}
              y={convertCurrency(liveNetWorth, preferredCurrency)}
              label={{ value: `Current: ${formatPreferredCurrency(liveNetWorth, preferredCurrency)}`, position: 'right', fill: colors.actualValue, fontSize: 11 }}
            />

            {/* Goal Achievement Zone Reference Lines */}
            {goalAchievementZones.map((zone) => (
              <ReferenceLine
                key={`zone-${zone.percentage}`}
                y={convertCurrency(zone.value, preferredCurrency)}
                stroke={zone.color}
                strokeDasharray="2 4"
                strokeWidth={1}
                label={{
                  value: `${Math.round(zone.percentage * 100)}% Milestone`,
                  position: 'right',
                  fill: zone.color,
                  fontSize: 10
                }}
                ifOverflow="extendDomain"
              />
            ))}

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

            {/* Monte Carlo Confidence Bands with Gradient */}
            {showMonteCarloLocal && effectiveMonteCarloResult && (
              <>
                {(() => {
                  const showP90 = !hiddenLines.has('p90');
                  const showP50 = !hiddenLines.has('p50');
                  const showP10 = !hiddenLines.has('p10');

                  return (
                    <>
                {/* Custom Gradient Definitions with unique IDs */}
                <defs>
                  <linearGradient id={`confidenceGradient-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colors.projectedValue} stopOpacity={0.3}/>
                    <stop offset="50%" stopColor={colors.projectedValue} stopOpacity={0.15}/>
                    <stop offset="100%" stopColor={colors.projectedValue} stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id={`confidenceGradientDark-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colors.projectedValue} stopOpacity={0.4}/>
                    <stop offset="50%" stopColor={colors.projectedValue} stopOpacity={0.2}/>
                    <stop offset="100%" stopColor={colors.projectedValue} stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                
                {/* 90th-10th percentile band with gradient (main confidence area) */}
                {showP90 && showP10 && (
                  <>
                    <Area
                      type="monotone"
                      dataKey="p90"
                      stroke="none"
                      fill={`url(#confidenceGradient${theme === 'dark' ? 'Dark' : ''}-${gradientId})`}
                      activeDot={false}
                      isAnimationActive={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="p10"
                      stroke="none"
                      fill={colors.background}
                      fillOpacity={1}
                      activeDot={false}
                      isAnimationActive={false}
                    />
                  </>
                )}
                
                {/* 50th percentile (median) line */}
                {showP90 && (
                  <Line
                    type="monotone"
                    dataKey="p90"
                    name="90% Confidence"
                    stroke={monteCarloColors.p90}
                    strokeWidth={1}
                    strokeOpacity={0.65}
                    strokeDasharray="3 3"
                    dot={false}
                    activeDot={false}
                    isAnimationActive={typeof window !== 'undefined' ? !window.matchMedia('(prefers-reduced-motion: reduce)').matches : true}
                  />
                )}
                {showP50 && (
                  <Line
                    type="monotone"
                    dataKey="p50"
                    name="Median Projection"
                    stroke={monteCarloColors.p50}
                    strokeWidth={1}
                    strokeDasharray="2 2"
                    dot={false}
                    activeDot={false}
                    isAnimationActive={typeof window !== 'undefined' ? !window.matchMedia('(prefers-reduced-motion: reduce)').matches : true}
                  />
                )}
                {showP10 && (
                  <Line
                    type="monotone"
                    dataKey="p10"
                    name="10% Confidence"
                    stroke={monteCarloColors.p10}
                    strokeWidth={1}
                    strokeOpacity={0.65}
                    strokeDasharray="3 3"
                    dot={false}
                    activeDot={false}
                    isAnimationActive={typeof window !== 'undefined' ? !window.matchMedia('(prefers-reduced-motion: reduce)').matches : true}
                  />
                )}
                    </>
                  );
                })()}
              </>
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

            {/* Scenario Analysis Lines */}
            {showScenarioAnalysisLocal && effectiveScenarioAnalysisResult && activeScenarios
              .filter(s => s.isActive && s.id !== 'base' && !hiddenLines.has(s.id))
              .map((scenario) => {
                const scenarioData = effectiveScenarioAnalysisResult.scenarios[scenario.id];
                return (
                  <Line
                    key={scenario.id}
                    type="monotone"
                    dataKey={scenario.id}
                    name={scenario.name}
                    stroke={scenario.color}
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                    activeDot={{ r: 6, fill: scenario.color, stroke: colors.background, strokeWidth: 2 }}
                    isAnimationActive={typeof window !== 'undefined' ? !window.matchMedia('(prefers-reduced-motion: reduce)').matches : true}
                  />
                );
              })}

            {/* What-if Scenario Line */}
            {showWhatIf && whatIfProjection && (
              <Line
                type="monotone"
                dataKey="whatIfValue"
                name="What-if Projection"
                stroke="#f59e0b"
                strokeWidth={3}
                strokeDasharray="6 3"
                dot={false}
                activeDot={{ r: 8, fill: '#f59e0b', stroke: colors.background, strokeWidth: 3 }}
                isAnimationActive={typeof window !== 'undefined' ? !window.matchMedia('(prefers-reduced-motion: reduce)').matches : true}
              />
            )}

            {/* Benchmark Comparison Lines */}
            {benchmarkData.filter((benchmark) => !hiddenLines.has(benchmark.id)).map((benchmark) => (
              <Line
                key={benchmark.id}
                type="monotone"
                dataKey={benchmark.id}
                name={benchmark.name}
                stroke={benchmark.color}
                strokeWidth={2}
                strokeDasharray="3 3"
                dot={false}
                activeDot={{ r: 6, fill: benchmark.color, stroke: colors.background, strokeWidth: 2 }}
                isAnimationActive={typeof window !== 'undefined' ? !window.matchMedia('(prefers-reduced-motion: reduce)').matches : true}
              />
            ))}

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
              {currencyAdjustedData.slice(-12).map((point, index) => {
                const progress = (point.value / convertedGoalAmount) * 100;
                return (
                  <tr key={index}>
                    <td>{point.date}</td>
                    <td>{formatChartValue(point.value)}</td>
                    <td>{formatChartValue(point.cumulativeContributions)}</td>
                    <td>{point.actualContributions !== undefined ? formatChartValue(point.actualContributions) : '-'}</td>
                    <td>{point.actualValue !== undefined ? formatChartValue(point.actualValue) : '-'}</td>
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

    {/* Scenario Analysis Controls */}
    {effectiveScenarioAnalysisResult && (
      <div className={styles.scenarioAnalysisControls}>
        <div className={styles.scenarioAnalysisHeader}>
          <h4>Scenario Analysis</h4>
          <button
            onClick={() => setActiveHelpOverlay('scenario-analysis')}
            className={styles.helpButton}
            aria-label="Learn about scenario analysis"
          >
            ⓘ Help
          </button>
        </div>
        <div className={styles.scenarioAnalysisToggle}>
          <label>
            <input
              type="checkbox"
              checked={showScenarioAnalysisLocal}
              onChange={() => setShowScenarioAnalysisLocal(!showScenarioAnalysisLocal)}
            />
            Show Scenario Analysis
            <HelpTooltip content="Compare different return scenarios to understand potential outcomes">
              <span className={styles.helpIcon} aria-label="Help">ⓘ</span>
            </HelpTooltip>
          </label>
        </div>

        {showScenarioAnalysisLocal && (
          <div className={styles.scenarioControls}>
            <div className={styles.scenarioLegend}>
              {activeScenarios.map((scenario) => (
                <div key={scenario.id} className={styles.scenarioItem}>
                  <label>
                    <input
                      type="checkbox"
                      checked={scenario.isActive}
                      onChange={() => {
                        setActiveScenarios(prev => 
                          prev.map(s => 
                            s.id === scenario.id ? { ...s, isActive: !s.isActive } : s
                          )
                        );
                      }}
                    />
                    <span className={styles.scenarioColor} style={{ backgroundColor: scenario.color }} />
                    <span className={styles.scenarioName}>{scenario.name}</span>
                    <HelpTooltip content={scenario.description}>
                      <span className={styles.helpIcon} aria-label="Help">ⓘ</span>
                    </HelpTooltip>
                  </label>
                </div>
              ))}
            </div>

            <div className={styles.scenarioComparison}>
              <h5>Scenario Comparison</h5>
              <table className={styles.scenarioTable}>
                <thead>
                  <tr>
                    <th>Scenario</th>
                    <th>Final Value</th>
                    <th>Difference</th>
                    <th>Success Probability</th>
                  </tr>
                </thead>
                <tbody>
                  {activeScenarios.filter(s => s.isActive).map((scenario) => {
                    const scenarioData = effectiveScenarioAnalysisResult.scenarios[scenario.id];
                    const finalValue = scenarioData?.[scenarioData.length - 1]?.value || 0;
                    const baseFinalValue = effectiveScenarioAnalysisResult.baseScenario[effectiveScenarioAnalysisResult.baseScenario.length - 1]?.value || 0;
                    const difference = finalValue - baseFinalValue;
                    const differencePercent = baseFinalValue > 0 ? (difference / baseFinalValue) * 100 : 0;
                    const successProbability = finalValue >= goal.amount ? 100 : Math.min(100, (finalValue / goal.amount) * 100);

                    return (
                      <tr key={scenario.id}>
                        <td>
                          <span className={styles.scenarioColor} style={{ backgroundColor: scenario.color }} />
                          {scenario.name}
                        </td>
                        <td>{formatPreferredCurrency(finalValue, preferredCurrency)}</td>
                        <td style={{ color: difference >= 0 ? colors.actualReturns : colors.actualContributions }}>
                          {formatPreferredCurrency(difference, preferredCurrency)} ({difference >= 0 ? '+' : ''}{differencePercent.toFixed(1)}%)
                        </td>
                        <td>
                          <div className={styles.successMeter}>
                            <div 
                              className={styles.successMeterFill}
                              style={{ 
                                width: `${successProbability}%`,
                                backgroundColor: successProbability >= 75 ? '#10b981' : successProbability >= 50 ? '#f59e0b' : '#ef4444'
                              }}
                            />
                            <span>{successProbability.toFixed(0)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    )}

    {/* What-if Scenario Controls */}
    <div className={styles.whatIfControls}>
      <div className={styles.whatIfHeader}>
        <h4>What-if Scenarios</h4>
        <button
          onClick={() => setShowWhatIf(!showWhatIf)}
          className={styles.helpButton}
          aria-label={showWhatIf ? "Hide what-if scenarios" : "Show what-if scenarios"}
        >
          {showWhatIf ? (
            <>
              <PanelTopClose size={14} aria-hidden="true" />
              <span>Hide</span>
            </>
          ) : (
            <>
              <PanelTopOpen size={14} aria-hidden="true" />
              <span>Show</span>
            </>
          )}
        </button>
      </div>
      
      {showWhatIf && (
        <div className={styles.whatIfSliders}>
          <div className={styles.whatIfSlider}>
            <label>
              Annual Return: {Math.round(whatIfParams.annualReturn * 100)}%
              <input
                type="range"
                min="0.01"
                max="0.2"
                step="0.01"
                value={whatIfParams.annualReturn}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  setWhatIfParams(prev => ({ ...prev, annualReturn: value }));
                }}
                aria-label="Adjust annual return rate"
              />
            </label>
            <span className={styles.sliderValue}>{Math.round(whatIfParams.annualReturn * 100)}%</span>
          </div>

          <div className={styles.whatIfSlider}>
            <label>
              Monthly Contributions: {formatPreferredCurrency(whatIfParams.monthlyDeposits, preferredCurrency)}
              <input
                type="range"
                min="100"
                max="10000"
                step="100"
                value={whatIfParams.monthlyDeposits}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setWhatIfParams(prev => ({ ...prev, monthlyDeposits: value }));
                }}
                aria-label="Adjust monthly contributions"
              />
            </label>
            <span className={styles.sliderValue}>{formatPreferredCurrency(whatIfParams.monthlyDeposits, preferredCurrency)}</span>
          </div>

          <div className={styles.whatIfResults}>
            <h5>Projected Results</h5>
            {whatIfProjection && whatIfProjection.length > 0 && (
              <div className={styles.whatIfMetrics}>
                <p>Final Value: {formatPreferredCurrency(whatIfProjection[whatIfProjection.length - 1].value, preferredCurrency)}</p>
                <p>Goal Progress: {Math.min(100, (whatIfProjection[whatIfProjection.length - 1].value / goal.amount) * 100).toFixed(1)}%</p>
                <p>Difference from Base: {formatPreferredCurrency(whatIfProjection[whatIfProjection.length - 1].value - projectionData[projectionData.length - 1].value, preferredCurrency)}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>

    {/* Goal Achievement Zones Summary */}
    <div className={styles.goalAchievementZones}>
      <h4>Goal Progress Milestones</h4>
      <div className={styles.zonesGrid}>
        {goalAchievementZones.map((zone) => (
          <div key={`zone-summary-${zone.percentage}`} className={styles.zoneItem}>
            <div className={styles.zoneHeader}>
              <span className={styles.zoneMilestone}>{Math.round(zone.percentage * 100)}% Milestone</span>
              <span className={styles.zoneValue}>{formatPreferredCurrency(zone.value, preferredCurrency)}</span>

            </div>
            <div className={styles.zoneProgress}>
              <div className={styles.zoneProgressBar} style={{ width: `${zone.percentage * 100}%`, backgroundColor: zone.color }} />
            </div>
            <div className={styles.zoneDetails}>
              {zone.date ? (
                <span className={styles.zoneDate}>Projected: {new Date(zone.date).toLocaleDateString()}</span>
              ) : (
                <span className={styles.zoneDate}>Not yet reached</span>
              )}
              <span className={styles.zoneStatus}>
                {zone.percentage === 1.0 ? '🎯 Goal Achieved!' : 
                 zone.percentage >= 0.75 ? '🚀 Almost There!' : 
                 zone.percentage >= 0.5 ? '📈 Making Progress' : '💪 Keep Going!'}
              </span>
            </div>
          </div>
        ))}
      </div>

    </div>

    {/* Benchmark Comparison Summary */}
    <div className={styles.benchmarkComparison}>
      <h4>Benchmark Performance Comparison</h4>
      <div className={styles.benchmarkGrid}>
        {benchmarkData.map((benchmark) => {
          const finalValue = benchmark.data[benchmark.data.length - 1]?.value || 0;
          const baseFinalValue = projectionData[projectionData.length - 1]?.value || 0;
          const difference = finalValue - baseFinalValue;
          const differencePercent = baseFinalValue > 0 ? (difference / baseFinalValue) * 100 : 0;
          
          return (
            <div key={benchmark.id} className={styles.benchmarkItem}>
              <div className={styles.benchmarkHeader}>
                <span className={styles.benchmarkName} style={{ color: benchmark.color }}>
                  {benchmark.name} ({Math.round(benchmark.annualReturn * 100)}% return)
                </span>
                <span className={styles.benchmarkValue}>{formatPreferredCurrency(finalValue, preferredCurrency)}</span>
              </div>
              <div className={styles.benchmarkProgress}>
                <div 
                  className={styles.benchmarkProgressBar}
                  style={{ 
                    width: `${Math.min(100, (finalValue / goal.amount) * 100)}%`, 
                    backgroundColor: benchmark.color
                  }}
                />
              </div>
              <div className={styles.benchmarkDetails}>
                <span className={styles.benchmarkDifference} style={{ color: difference >= 0 ? '#10b981' : '#ef4444' }}>
                  {difference >= 0 ? '+' : ''}{differencePercent.toFixed(1)}% vs Your Plan
                </span>
                <span className={styles.benchmarkStatus}>
                  {finalValue >= goal.amount ? '🎯 Goal Achieved' : '📊 On Track'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>

    {/* Contribution Optimization Section */}
    <div className={styles.contributionOptimization}>
      <h4>Contribution Optimization</h4>
      <div className={styles.optimizationGrid}>
        <div className={styles.optimizationItem}>
          <h5>Current Plan</h5>
          <p>Monthly: {formatPreferredCurrency(goal.monthlyDeposits, preferredCurrency)}</p>
          <p>Years to Goal: {yearsToGoal.baseYears}</p>
        </div>
        
        {[5, 10, 15, 20].map((years) => {
          const req = requiredContributions[years];
          if (!req) return null;
          
          return (
            <div key={years} className={styles.optimizationItem}>
              <h5>Reach goal in {years} years</h5>
              <p>Required: {formatPreferredCurrency(req.requiredMonthly, preferredCurrency)}/month</p>
              {req.currentShortfall > 0 ? (
                <p className={styles.shortfall}>Increase by: {formatPreferredCurrency(req.recommendedIncrease, preferredCurrency)}/month</p>
              ) : (
                <p className={styles.surplus}>You&rsquo;re on track!</p>
              )}
            </div>
          );
        })}
      </div>
    </div>

    {/* Help Overlay */}
    {activeHelpOverlay === 'confidence-bands' && (
      <ConfidenceBandsHelp onClose={() => setActiveHelpOverlay(null)} />
    )}
    {activeHelpOverlay === 'scenario-analysis' && (
      <ScenarioAnalysisHelp onClose={() => setActiveHelpOverlay(null)} />
    )}
    </div>
  );
};

export default InvestmentGoalChart;
