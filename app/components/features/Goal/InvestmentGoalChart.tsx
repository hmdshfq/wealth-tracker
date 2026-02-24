'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo, useId } from 'react';
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
  VolatilityGuide,
} from './InvestmentGoalChartHelp';
import { InlineLoader } from '@/components/ui';
import styles from './InvestmentGoalChart.module.css';
import { CHART_COLORS, ChartProjectionPoint, LegendEntry, TIME_RANGES } from './chart/types';
import { useTheme } from './chart/useTheme';
import { AnalysisInsightsSection } from './chart/AnalysisInsightsSection';
import { StrategicPanelsSection } from './chart/StrategicPanelsSection';
import { ChartCanvasSection } from './chart/ChartCanvasSection';

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

      <AnalysisInsightsSection
        timeBasedAnalysisResult={timeBasedAnalysisResult}
        timeBasedAnalysisResultLocal={timeBasedAnalysisResultLocal}
        showTimeBasedAnalysisLocal={showTimeBasedAnalysisLocal}
        setShowTimeBasedAnalysisLocal={setShowTimeBasedAnalysisLocal}
        behavioralAnalysisResult={behavioralAnalysisResult}
        showBehavioralAnalysisLocal={showBehavioralAnalysisLocal}
        setShowBehavioralAnalysisLocal={setShowBehavioralAnalysisLocal}
        setActiveHelpOverlay={setActiveHelpOverlay}
        preferredCurrency={preferredCurrency}
        getHeatmapColor={getHeatmapColor}
      />

      <ChartCanvasSection
        legendPayload={legendPayload}
        handleLegendToggle={handleLegendToggle}
        hiddenLines={hiddenLines}
        handleKeyDown={handleKeyDown}
        chartSummary={chartSummary}
        currencyAdjustedData={currencyAdjustedData}
        colors={colors}
        formatYAxis={formatYAxis}
        preferredCurrency={preferredCurrency}
        convertedGoalAmount={convertedGoalAmount}
        formatChartValue={formatChartValue}
        goal={goal}
        currentNetWorth={currentNetWorth}
        showMonteCarloLocal={showMonteCarloLocal}
        effectiveMonteCarloResult={effectiveMonteCarloResult}
        gradientId={gradientId}
        theme={theme}
        monteCarloColors={monteCarloColors}
        showScenarioAnalysisLocal={showScenarioAnalysisLocal}
        effectiveScenarioAnalysisResult={effectiveScenarioAnalysisResult}
        activeScenarios={activeScenarios}
        showWhatIf={showWhatIf}
        whatIfProjection={whatIfProjection}
        benchmarkData={benchmarkData}
        brushRange={brushRange}
        setBrushRange={setBrushRange}
      />

    <StrategicPanelsSection
      effectiveScenarioAnalysisResult={effectiveScenarioAnalysisResult}
      setActiveHelpOverlay={setActiveHelpOverlay}
      showScenarioAnalysisLocal={showScenarioAnalysisLocal}
      setShowScenarioAnalysisLocal={setShowScenarioAnalysisLocal}
      activeScenarios={activeScenarios}
      setActiveScenarios={setActiveScenarios}
      goal={goal}
      preferredCurrency={preferredCurrency}
      colors={colors}
      showWhatIf={showWhatIf}
      setShowWhatIf={setShowWhatIf}
      whatIfParams={whatIfParams}
      setWhatIfParams={setWhatIfParams}
      whatIfProjection={whatIfProjection}
      projectionData={projectionData}
      goalAchievementZones={goalAchievementZones}
      benchmarkData={benchmarkData}
      yearsToGoalBaseYears={yearsToGoal.baseYears}
      requiredContributions={requiredContributions}
      activeHelpOverlay={activeHelpOverlay}
    />
    </div>
  );
};

export default InvestmentGoalChart;
