import React from 'react';
import {
  BehavioralAnalysisResult,
  Goal,
  InvestmentScenario,
  MonteCarloSimulationResult,
  PreferredCurrency,
  ProjectionDataPoint,
  ScenarioAnalysisResult,
  TimeBasedAnalysisResult,
} from '@/lib/types';
import { ExtendedProjectionDataPoint } from '@/lib/projectionCalculations';
import { CHART_COLORS, ChartProjectionPoint, LegendEntry } from './types';

export interface InvestmentGoalChartProps {
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

export interface UseInvestmentGoalChartModelInput extends InvestmentGoalChartProps {
  theme: 'dark' | 'light';
  colors: typeof CHART_COLORS.dark;
  gradientId: string;
  monteCarloColors: {
    p90: string;
    p50: string;
    p10: string;
  };
}

export interface HeaderModel {
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
}

export interface CanvasModel {
  legendPayload: LegendEntry[];
  handleLegendToggle: (dataKey: string) => void;
  hiddenLines: Set<string>;
  handleKeyDown: (event: React.KeyboardEvent) => void;
  chartSummary: string;
  currencyAdjustedData: ChartProjectionPoint[];
  formatYAxis: (value: number) => string;
  formatChartValue: (value: number) => string;
  convertedGoalAmount: number;
  showMonteCarloLocal: boolean;
  effectiveMonteCarloResult: MonteCarloSimulationResult | null | undefined;
  showScenarioAnalysisLocal: boolean;
  effectiveScenarioAnalysisResult: ScenarioAnalysisResult | null | undefined;
  activeScenarios: InvestmentScenario[];
  showWhatIf: boolean;
  whatIfProjection: ProjectionDataPoint[] | null;
  benchmarkData: {
    id: string;
    name: string;
    color: string;
    annualReturn: number;
    data: ProjectionDataPoint[];
  }[];
  brushRange: { startIndex?: number; endIndex?: number };
  setBrushRange: React.Dispatch<
    React.SetStateAction<{ startIndex?: number | undefined; endIndex?: number | undefined }>
  >;
}

export interface InsightsModel {
  timeBasedAnalysisResultLocal: TimeBasedAnalysisResult | null;
  showTimeBasedAnalysisLocal: boolean;
  setShowTimeBasedAnalysisLocal: React.Dispatch<React.SetStateAction<boolean>>;
  showBehavioralAnalysisLocal: boolean;
  setShowBehavioralAnalysisLocal: React.Dispatch<React.SetStateAction<boolean>>;
  setActiveHelpOverlay: React.Dispatch<
    React.SetStateAction<'confidence-bands' | 'scenario-analysis' | null>
  >;
  getHeatmapColor: (returnPercent: number) => string;
}

export interface StrategicModel {
  effectiveScenarioAnalysisResult: ScenarioAnalysisResult | null | undefined;
  setActiveHelpOverlay: React.Dispatch<
    React.SetStateAction<'confidence-bands' | 'scenario-analysis' | null>
  >;
  showScenarioAnalysisLocal: boolean;
  setShowScenarioAnalysisLocal: React.Dispatch<React.SetStateAction<boolean>>;
  activeScenarios: InvestmentScenario[];
  setActiveScenarios: React.Dispatch<React.SetStateAction<InvestmentScenario[]>>;
  showWhatIf: boolean;
  setShowWhatIf: React.Dispatch<React.SetStateAction<boolean>>;
  whatIfParams: {
    annualReturn: number;
    monthlyDeposits: number;
    yearsToGoal: number;
  };
  setWhatIfParams: React.Dispatch<
    React.SetStateAction<{
      annualReturn: number;
      monthlyDeposits: number;
      yearsToGoal: number;
    }>
  >;
  whatIfProjection: ProjectionDataPoint[] | null;
  goalAchievementZones: {
    percentage: number;
    value: number;
    date: string | undefined;
    color: string;
  }[];
  benchmarkData: {
    id: string;
    name: string;
    color: string;
    annualReturn: number;
    data: ProjectionDataPoint[];
  }[];
  yearsToGoalBaseYears: number;
  requiredContributions: Record<
    number,
    {
      requiredMonthly: number;
      currentShortfall: number;
      recommendedIncrease: number;
    }
  >;
  activeHelpOverlay: 'confidence-bands' | 'scenario-analysis' | null;
}

export interface A11yModel {
  announcement: string;
  chartSummary: string;
}

export interface InvestmentGoalChartModel {
  headerModel: HeaderModel;
  canvasModel: CanvasModel;
  insightsModel: InsightsModel;
  strategicModel: StrategicModel;
  a11yModel: A11yModel;
}
