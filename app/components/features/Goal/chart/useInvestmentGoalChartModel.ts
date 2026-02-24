import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  convertCurrency,
  formatCurrency,
  formatPreferredCurrency,
} from '@/lib/formatters';
import {
  calculateRequiredContributions,
  calculateYearsToGoal,
} from '@/lib/goalCalculations';
import { useFinancialWorker } from '@/lib/hooks';
import {
  getRecommendedSamplingStrategy,
  sampleProjectionData,
  shouldSampleData,
  smartSampleData,
} from '@/lib/dataSampling';
import {
  generateProjectionData as generateProjectionDataMain,
  performTimeBasedAnalysis as performTimeBasedAnalysisMain,
  runMonteCarloSimulation as runMonteCarloSimulationMain,
  runScenarioAnalysis as runScenarioAnalysisMain,
} from '@/lib/projectionCalculations';
import {
  InvestmentScenario,
  MonteCarloSimulationResult,
  ProjectionDataPoint,
  ScenarioAnalysisResult,
  TimeBasedAnalysisResult,
} from '@/lib/types';
import {
  ChartProjectionPoint,
  LegendEntry,
  TIME_RANGES,
  resolveChartLineStyle,
} from './types';
import {
  InvestmentGoalChartModel,
  UseInvestmentGoalChartModelInput,
} from './modelTypes';

interface SamplingResult {
  isDataSampled: boolean;
  originalDataPoints: number | null;
  sampledDataPoints: number | null;
  data: ChartProjectionPoint[];
}

function useRealtimeNetWorth(
  enabled: boolean,
  websocketUrl: string | undefined,
  currentNetWorth: number,
  announce: (message: string) => void
) {
  const [liveNetWorth, setLiveNetWorth] = useState(currentNetWorth);
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    setLiveNetWorth(currentNetWorth);
  }, [currentNetWorth]);

  useEffect(() => {
    if (!enabled || !websocketUrl) return;

    let ws: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      try {
        ws = new WebSocket(websocketUrl);
        ws.onopen = () => {
          setWsConnected(true);
          announce('Real-time updates connected');
        };
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'portfolio_update' && typeof data.netWorth === 'number') {
              setLiveNetWorth(data.netWorth);
            }
          } catch (error) {
            console.error('WebSocket message parse error:', error);
          }
        };
        ws.onclose = () => {
          setWsConnected(false);
          reconnectTimeout = setTimeout(connect, 5000);
        };
        ws.onerror = () => ws?.close();
      } catch {
        reconnectTimeout = setTimeout(connect, 5000);
      }
    };

    connect();

    return () => {
      ws?.close();
      clearTimeout(reconnectTimeout);
    };
  }, [enabled, websocketUrl, announce]);

  return { liveNetWorth, wsConnected };
}

function useProjectionTransforms({
  projectionData,
  selectedRange,
  customStartDate,
  customEndDate,
  showCustomRange,
  goalAmount,
  showScenarioAnalysisLocal,
  effectiveScenarioAnalysisResult,
  activeScenarios,
  showWhatIf,
  whatIfProjection,
}: {
  projectionData: ProjectionDataPoint[];
  selectedRange: string;
  customStartDate: string;
  customEndDate: string;
  showCustomRange: boolean;
  goalAmount: number;
  showScenarioAnalysisLocal: boolean;
  effectiveScenarioAnalysisResult: ScenarioAnalysisResult | null | undefined;
  activeScenarios: InvestmentScenario[];
  showWhatIf: boolean;
  whatIfProjection: ProjectionDataPoint[] | null;
}): SamplingResult {
  return useMemo(() => {
    if (!projectionData || projectionData.length === 0) {
      return {
        isDataSampled: false,
        originalDataPoints: null,
        sampledDataPoints: null,
        data: [],
      };
    }

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

    const needsSampling = shouldSampleData(filtered, 500);
    let sampledData = filtered;

    if (needsSampling) {
      const strategy = getRecommendedSamplingStrategy(filtered);
      sampledData =
        strategy.method === 'lttb'
          ? sampleProjectionData(filtered, { targetPoints: strategy.targetPoints })
          : smartSampleData(filtered, strategy.targetPoints);
    }

    const result = sampledData.map<ChartProjectionPoint>((d) => ({
      ...d,
      goal: goalAmount,
    }));

    if (showScenarioAnalysisLocal && effectiveScenarioAnalysisResult) {
      result.forEach((point, index) => {
        activeScenarios.forEach((scenario) => {
          if (scenario.isActive && effectiveScenarioAnalysisResult.scenarios[scenario.id]?.[index]) {
            point[scenario.id] = effectiveScenarioAnalysisResult.scenarios[scenario.id][index].value;
          }
        });
      });
    }

    if (showWhatIf && whatIfProjection) {
      result.forEach((point, index) => {
        if (whatIfProjection[index]) {
          point.whatIfValue = whatIfProjection[index].value;
        }
      });
    }

    return {
      isDataSampled: needsSampling,
      originalDataPoints: needsSampling ? filtered.length : null,
      sampledDataPoints: needsSampling ? sampledData.length : null,
      data: result,
    };
  }, [
    projectionData,
    selectedRange,
    customStartDate,
    customEndDate,
    showCustomRange,
    goalAmount,
    showScenarioAnalysisLocal,
    effectiveScenarioAnalysisResult,
    activeScenarios,
    showWhatIf,
    whatIfProjection,
  ]);
}

export function useInvestmentGoalChartModel(
  input: UseInvestmentGoalChartModelInput
): InvestmentGoalChartModel {
  const {
    goal,
    projectionData,
    currentNetWorth,
    totalActualContributions,
    preferredCurrency,
    enableRealTimeUpdates = false,
    websocketUrl,
    firstTransactionDate,
    monteCarloResult,
    showMonteCarlo,
    scenarioAnalysisResult,
    showScenarioAnalysis,
    scenarios,
    showTimeBasedAnalysis,
    showBehavioralAnalysis,
    theme,
    colors,
    monteCarloColors,
  } = input;

  const {
    runMonteCarloSimulation,
    runScenarioAnalysis,
    performTimeBasedAnalysis,
    generateProjectionData,
    isLoading: workerLoading,
    error: workerError,
    withFallback,
  } = useFinancialWorker();

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

  const [hiddenLines, setHiddenLines] = useState<Set<string>>(new Set());
  const [, setFocusedDataIndex] = useState<number | null>(null);
  const [brushRange, setBrushRange] = useState<{ startIndex?: number; endIndex?: number }>({});
  const [announcement, setAnnouncement] = useState('');

  const [showMonteCarloLocal, setShowMonteCarloLocal] = useState(Boolean(showMonteCarlo));
  const [monteCarloVolatility, setMonteCarloVolatility] = useState(0.15);
  const [monteCarloSimulations, setMonteCarloSimulations] = useState(1000);

  const [activeHelpOverlay, setActiveHelpOverlay] = useState<
    'confidence-bands' | 'scenario-analysis' | null
  >(null);
  const [showScenarioAnalysisLocal, setShowScenarioAnalysisLocal] = useState(
    Boolean(showScenarioAnalysis)
  );
  const [showTimeBasedAnalysisLocal, setShowTimeBasedAnalysisLocal] = useState(
    Boolean(showTimeBasedAnalysis)
  );
  const [showBehavioralAnalysisLocal, setShowBehavioralAnalysisLocal] = useState(
    Boolean(showBehavioralAnalysis)
  );
  const [timeBasedAnalysisResultLocal, setTimeBasedAnalysisResultLocal] =
    useState<TimeBasedAnalysisResult | null>(null);

  const defaultScenarios = useMemo<InvestmentScenario[]>(
    () => [
      {
        id: 'base',
        name: 'Base Case',
        returnAdjustment: 0,
        color: '#22d3ee',
        description: 'Your original plan',
        isActive: true,
      },
      {
        id: 'optimistic',
        name: 'Optimistic',
        returnAdjustment: 0.02,
        color: '#22c55e',
        description: '+2% annual return',
        isActive: true,
      },
      {
        id: 'pessimistic',
        name: 'Pessimistic',
        returnAdjustment: -0.02,
        color: '#f43f5e',
        description: '-2% annual return',
        isActive: true,
      },
    ],
    []
  );
  const scenarioDefinitions = useMemo<InvestmentScenario[]>(
    () => (scenarios && scenarios.length > 0 ? scenarios : defaultScenarios),
    [scenarios, defaultScenarios]
  );
  const [activeScenarios, setActiveScenarios] = useState<InvestmentScenario[]>(scenarioDefinitions);
  const [monteCarloResultLocal, setMonteCarloResultLocal] =
    useState<MonteCarloSimulationResult | null>(monteCarloResult || null);
  const [scenarioAnalysisResultLocal, setScenarioAnalysisResultLocal] =
    useState<ScenarioAnalysisResult | null>(scenarioAnalysisResult || null);

  const [showWhatIf, setShowWhatIf] = useState(false);
  const [whatIfParams, setWhatIfParams] = useState({
    annualReturn: goal.annualReturn,
    monthlyDeposits: goal.monthlyDeposits,
    yearsToGoal: 0,
  });
  const [whatIfProjection, setWhatIfProjection] = useState<ProjectionDataPoint[] | null>(null);

  const [benchmarkData, setBenchmarkData] = useState<
    {
      id: string;
      name: string;
      color: string;
      annualReturn: number;
      data: ProjectionDataPoint[];
    }[]
  >([]);

  const announceToScreenReader = useCallback((message: string) => {
    setAnnouncement(message);
    setTimeout(() => setAnnouncement(''), 1000);
  }, []);

  const { liveNetWorth, wsConnected } = useRealtimeNetWorth(
    enableRealTimeUpdates,
    websocketUrl,
    currentNetWorth,
    announceToScreenReader
  );

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

    withFallback(
      () =>
        runMonteCarloSimulation(goal, currentNetWorth, {
          numSimulations: monteCarloSimulations,
          volatility: monteCarloVolatility,
        }),
      () =>
        runMonteCarloSimulationMain(goal, currentNetWorth, {
          numSimulations: monteCarloSimulations,
          volatility: monteCarloVolatility,
        })
    ).then((result) => {
      if (!isCancelled) {
        setMonteCarloResultLocal(result);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [
    goal,
    currentNetWorth,
    monteCarloSimulations,
    monteCarloVolatility,
    withFallback,
    runMonteCarloSimulation,
  ]);

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

  useEffect(() => {
    if (!showWhatIf) {
      setWhatIfProjection(null);
      return;
    }

    const tempGoal = {
      ...goal,
      annualReturn: whatIfParams.annualReturn,
      monthlyDeposits: whatIfParams.monthlyDeposits,
    };

    withFallback(
      () => generateProjectionData(tempGoal, currentNetWorth),
      () => generateProjectionDataMain(tempGoal, currentNetWorth)
    ).then(setWhatIfProjection);
  }, [showWhatIf, whatIfParams, goal, currentNetWorth, withFallback, generateProjectionData]);

  const yearsToGoal = useMemo(() => {
    return calculateYearsToGoal(
      goal.amount,
      currentNetWorth,
      goal.monthlyDeposits,
      goal.annualReturn,
      goal.depositIncreasePercentage
    );
  }, [
    goal.amount,
    currentNetWorth,
    goal.monthlyDeposits,
    goal.annualReturn,
    goal.depositIncreasePercentage,
  ]);

  useEffect(() => {
    if (yearsToGoal.baseYears > 0) {
      setWhatIfParams((prev) => ({ ...prev, yearsToGoal: yearsToGoal.baseYears }));
    }
  }, [yearsToGoal.baseYears]);

  const requiredContributions = useMemo(() => {
    const targets = [5, 10, 15, 20];
    const result: Record<number, ReturnType<typeof calculateRequiredContributions>> = {};

    targets.forEach((years) => {
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

  const actualReturns = useMemo(() => {
    return currentNetWorth - totalActualContributions;
  }, [currentNetWorth, totalActualContributions]);

  const getHeatmapColor = useCallback((returnPercent: number): string => {
    if (returnPercent > 10) return '#10b981';
    if (returnPercent > 5) return '#34d399';
    if (returnPercent > 2) return '#6ee7b7';
    if (returnPercent > 0) return '#a7f3d0';
    if (returnPercent > -2) return '#fecaca';
    if (returnPercent > -5) return '#fca5a5';
    if (returnPercent > -10) return '#f87171';
    return '#ef4444';
  }, []);

  const actualReturnsPercent = useMemo(() => {
    return totalActualContributions > 0
      ? (actualReturns / totalActualContributions) * 100
      : 0;
  }, [actualReturns, totalActualContributions]);

  const progressPercent = useMemo(() => {
    return goal.amount > 0 ? (liveNetWorth / goal.amount) * 100 : 0;
  }, [liveNetWorth, goal.amount]);

  const samplingResult = useProjectionTransforms({
    projectionData,
    selectedRange,
    customStartDate,
    customEndDate,
    showCustomRange,
    goalAmount: goal.amount,
    showScenarioAnalysisLocal,
    effectiveScenarioAnalysisResult,
    activeScenarios,
    showWhatIf,
    whatIfProjection,
  });

  useEffect(() => {
    const sp500Goal = { ...goal, annualReturn: 0.07 };
    const industryGoal = { ...goal, annualReturn: 0.05 };

    Promise.all([
      withFallback(
        () => generateProjectionData(sp500Goal, currentNetWorth),
        () => generateProjectionDataMain(sp500Goal, currentNetWorth)
      ),
      withFallback(
        () => generateProjectionData(industryGoal, currentNetWorth),
        () => generateProjectionDataMain(industryGoal, currentNetWorth)
      ),
    ]).then(([sp500Projection, industryProjection]) => {
      setBenchmarkData([
        {
          id: 'sp500',
          name: 'S&P 500',
          color: '#0ea5e9',
          annualReturn: 0.07,
          data: sp500Projection,
        },
        {
          id: 'industry',
          name: 'Industry Avg',
          color: '#a855f7',
          annualReturn: 0.05,
          data: industryProjection,
        },
      ]);
    });
  }, [goal, currentNetWorth, withFallback, generateProjectionData]);

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

  const filteredDataWithBenchmarks = useMemo(() => {
    if (!samplingResult.data.length || !benchmarkData.length) return samplingResult.data;

    const result = samplingResult.data.map<ChartProjectionPoint>((point) => ({ ...point }));
    benchmarkData.forEach((benchmark) => {
      result.forEach((point, index) => {
        if (benchmark.data[index]) {
          point[benchmark.id] = benchmark.data[index].value;
        }
      });
    });

    return result;
  }, [samplingResult.data, benchmarkData]);

  const convertedGoalAmount = convertCurrency(goal.amount, preferredCurrency);
  const currencyAdjustedData = useMemo(() => {
    if (!filteredDataWithBenchmarks.length) return filteredDataWithBenchmarks;

    return filteredDataWithBenchmarks.map((point) => {
      const convertedPoint: ChartProjectionPoint = { ...point };
      Object.entries(point).forEach(([key, value]) => {
        if (typeof value === 'number') {
          convertedPoint[key as keyof ChartProjectionPoint] = convertCurrency(
            value,
            preferredCurrency
          );
        }
      });
      return convertedPoint;
    });
  }, [filteredDataWithBenchmarks, preferredCurrency]);

  const formatChartValue = useCallback(
    (value: number) => formatCurrency(value, preferredCurrency),
    [preferredCurrency]
  );

  const goalAchievementZones = useMemo(() => {
    const zones: {
      percentage: number;
      value: number;
      date: string | undefined;
      color: string;
    }[] = [];
    const milestonePercentages = [0.25, 0.5, 0.75, 1.0];

    milestonePercentages.forEach((percentage) => {
      const milestoneValue = goal.amount * percentage;
      const milestoneDate = samplingResult.data.find((point) => point.value >= milestoneValue)?.date;

      zones.push({
        percentage,
        value: milestoneValue,
        date: milestoneDate,
        color:
          percentage === 1.0
            ? '#10b981'
            : percentage >= 0.75
              ? '#f59e0b'
              : percentage >= 0.5
                ? '#f59e0b'
                : '#ef4444',
      });
    });

    return zones;
  }, [goal.amount, samplingResult.data]);

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

  const formatYAxis = useCallback(
    (value: number) => {
      const symbol =
        preferredCurrency === 'PLN' ? 'zł' : preferredCurrency === 'EUR' ? '€' : '$';
      const absValue = Math.abs(value);
      const sign = value < 0 ? '-' : '';
      if (absValue >= 1_000_000) {
        return `${sign}${symbol}${(absValue / 1_000_000).toFixed(1)}M`;
      }
      if (absValue >= 1_000) {
        return `${sign}${symbol}${(absValue / 1_000).toFixed(0)}k`;
      }
      return `${sign}${symbol}${absValue.toLocaleString('en-US', {
        maximumFractionDigits: 0,
      })}`;
    },
    [preferredCurrency]
  );

  const chartSummary = useMemo(() => {
    if (!currencyAdjustedData.length) return 'No data available';
    const first = currencyAdjustedData[0];
    const last = currencyAdjustedData[currencyAdjustedData.length - 1];
    return `Investment goal chart from ${first.date} to ${last.date}. Current: ${formatPreferredCurrency(
      currentNetWorth,
      preferredCurrency
    )} (${progressPercent.toFixed(1)}% of ${formatPreferredCurrency(
      goal.amount,
      preferredCurrency
    )} target). Actual contributions: ${formatPreferredCurrency(
      totalActualContributions,
      preferredCurrency
    )}. Actual returns: ${formatPreferredCurrency(actualReturns, preferredCurrency)} (${actualReturnsPercent.toFixed(
      1
    )}%).`;
  }, [
    currencyAdjustedData,
    currentNetWorth,
    goal.amount,
    progressPercent,
    totalActualContributions,
    actualReturns,
    actualReturnsPercent,
    preferredCurrency,
  ]);

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
              `${point.date}: Portfolio ${formatChartValue(point.value)}, ${(
                (point.value / convertedGoalAmount) *
                100
              ).toFixed(1)}% of target`
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
    [currencyAdjustedData, announceToScreenReader, formatChartValue, convertedGoalAmount]
  );

  const handleResetZoom = useCallback(() => {
    setBrushRange({});
    announceToScreenReader('Chart zoom reset');
  }, [announceToScreenReader]);

  const handleRangeChange = useCallback((range: string) => {
    setSelectedRange(range);
    setShowCustomRange(false);
    setBrushRange({});
  }, []);

  const handleCustomRange = useCallback(() => {
    if (customStartDate && customEndDate) {
      setShowCustomRange(true);
      setSelectedRange('custom');
      setBrushRange({});
    }
  }, [customStartDate, customEndDate]);

  const legendPayload = useMemo<LegendEntry[]>(() => {
    const legendEntryFromStyle = ({
      value,
      dataKey,
      type,
      seriesKind,
      colorHint,
      index,
    }: {
      value: string;
      dataKey: string;
      type: LegendEntry['type'];
      seriesKind: Parameters<typeof resolveChartLineStyle>[0]['seriesKind'];
      colorHint?: string;
      index?: number;
    }): LegendEntry => {
      const style = resolveChartLineStyle({
        dataKey,
        seriesKind,
        theme,
        colors,
        monteCarloColors,
        background: colors.background,
        colorHint,
        index,
      });

      return {
        value,
        color: style.stroke,
        dataKey,
        type,
        strokeDasharray: style.strokeDasharray,
        strokeWidth: style.strokeWidth,
        lineStyle: style.lineStyle,
      };
    };

    const scenarioLegendEntries =
      showScenarioAnalysisLocal && effectiveScenarioAnalysisResult
        ? activeScenarios
            .filter((s) => s.isActive && s.id !== 'base')
            .map((scenario, index) =>
              legendEntryFromStyle({
                value: scenario.name,
                dataKey: scenario.id,
                type: 'scenario',
                seriesKind: 'scenario',
                colorHint: scenario.color,
                index,
              })
            )
        : [];

    const whatIfLegendEntries =
      showWhatIf && whatIfProjection
        ? [
            legendEntryFromStyle({
              value: 'What-if Projection',
              dataKey: 'whatIfValue',
              type: 'scenario',
              seriesKind: 'what-if',
            }),
          ]
        : [];

    const benchmarkLegendEntries = benchmarkData.map((benchmark, index) =>
      legendEntryFromStyle({
        value: benchmark.name,
        dataKey: benchmark.id,
        type: 'scenario',
        seriesKind: 'benchmark',
        colorHint: benchmark.color,
        index,
      })
    );

    return [
      legendEntryFromStyle({
        value: 'Portfolio Value',
        dataKey: 'actualValue',
        type: 'actual',
        seriesKind: 'core',
      }),
      legendEntryFromStyle({
        value: 'Contributions',
        dataKey: 'actualContributions',
        type: 'actual',
        seriesKind: 'core',
      }),
      legendEntryFromStyle({
        value: 'Projected Value',
        dataKey: 'value',
        type: 'projected',
        seriesKind: 'core',
      }),
      legendEntryFromStyle({
        value: 'Projected Contributions',
        dataKey: 'cumulativeContributions',
        type: 'projected',
        seriesKind: 'core',
      }),
      legendEntryFromStyle({
        value: 'Target Goal',
        dataKey: 'goal',
        type: 'target',
        seriesKind: 'core',
      }),
      ...(showMonteCarloLocal && effectiveMonteCarloResult
        ? [
            legendEntryFromStyle({
              value: '90% Confidence',
              dataKey: 'p90',
              type: 'monte-carlo',
              seriesKind: 'monte-carlo',
            }),
            legendEntryFromStyle({
              value: 'Median',
              dataKey: 'p50',
              type: 'monte-carlo',
              seriesKind: 'monte-carlo',
            }),
            legendEntryFromStyle({
              value: '10% Confidence',
              dataKey: 'p10',
              type: 'monte-carlo',
              seriesKind: 'monte-carlo',
            }),
          ]
        : []),
      ...scenarioLegendEntries,
      ...whatIfLegendEntries,
      ...benchmarkLegendEntries,
    ];
  }, [
    showScenarioAnalysisLocal,
    effectiveScenarioAnalysisResult,
    activeScenarios,
    showWhatIf,
    whatIfProjection,
    benchmarkData,
    showMonteCarloLocal,
    effectiveMonteCarloResult,
    theme,
    colors,
    monteCarloColors,
  ]);

  return {
    headerModel: {
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
      isDataSampled: samplingResult.isDataSampled,
      originalDataPoints: samplingResult.originalDataPoints,
      sampledDataPoints: samplingResult.sampledDataPoints,
      actualReturns,
      actualReturnsPercent,
      yearsToGoal: {
        baseYears: yearsToGoal.baseYears,
        confidenceInterval: yearsToGoal.confidenceInterval,
      },
      showMonteCarloLocal,
      setShowMonteCarloLocal,
      monteCarloVolatility,
      setMonteCarloVolatility,
      monteCarloSimulations,
      setMonteCarloSimulations,
      effectiveMonteCarloResult,
    },
    canvasModel: {
      legendPayload,
      handleLegendToggle,
      hiddenLines,
      handleKeyDown,
      chartSummary,
      currencyAdjustedData,
      formatYAxis,
      formatChartValue,
      convertedGoalAmount,
      showMonteCarloLocal,
      effectiveMonteCarloResult,
      showScenarioAnalysisLocal,
      effectiveScenarioAnalysisResult,
      activeScenarios,
      showWhatIf,
      whatIfProjection,
      benchmarkData,
      brushRange,
      setBrushRange,
    },
    insightsModel: {
      timeBasedAnalysisResultLocal,
      showTimeBasedAnalysisLocal,
      setShowTimeBasedAnalysisLocal,
      showBehavioralAnalysisLocal,
      setShowBehavioralAnalysisLocal,
      setActiveHelpOverlay,
      getHeatmapColor,
    },
    strategicModel: {
      effectiveScenarioAnalysisResult,
      setActiveHelpOverlay,
      showScenarioAnalysisLocal,
      setShowScenarioAnalysisLocal,
      activeScenarios,
      setActiveScenarios,
      showWhatIf,
      setShowWhatIf,
      whatIfParams,
      setWhatIfParams,
      whatIfProjection,
      goalAchievementZones,
      benchmarkData,
      yearsToGoalBaseYears: yearsToGoal.baseYears,
      requiredContributions,
      activeHelpOverlay,
    },
    a11yModel: {
      announcement,
      chartSummary,
    },
  };
}
