export interface Holding {
  ticker: string;
  shares: number;
  avgCost: number;
}

export interface HoldingWithDetails extends Holding {
  name: string;
  price: number;
  value: number;
  valuePLN: number;
  cost: number;
  gain: number;
  gainPercent: number;
}

export interface Transaction {
  id: number;
  date: string;
  ticker: string;
  action: 'Buy' | 'Sell';
  shares: number;
  price: number;
  currency: string;
}

export interface CashBalance {
  currency: 'PLN' | 'EUR' | 'USD';
  amount: number;
}

export interface CashTransaction {
  id: number;
  date: string;
  type: 'deposit' | 'withdrawal';
  currency: 'PLN' | 'EUR' | 'USD';
  amount: number;
  note?: string;
}

export interface Goal {
  amount: number;
  targetYear: number;
  retirementYear: number;
  annualReturn: number;
  monthlyDeposits: number;
  depositIncreasePercentage: number;
  startDate: string; // ISO date string (YYYY-MM-DD)
}

export interface InvestmentScenario {
  id: string;
  name: string;
  returnAdjustment: number; // -0.02 to +0.02 (2% adjustment)
  color: string;
  description: string;
  isActive: boolean;
}

export interface ScenarioAnalysisResult {
  baseScenario: ProjectionDataPoint[];
  optimisticScenario: ProjectionDataPoint[];
  pessimisticScenario: ProjectionDataPoint[];
  scenarios: Record<string, ProjectionDataPoint[]>;
}

export interface AllocationItem {
  name: string;
  value: number;
  percent: number;
}

export interface ProjectionDataPoint {
  year: number;
  month: number; // 1-12
  date: string; // "2025-01" format for filtering
  value: number; // Total portfolio value
  goal: number; // Goal amount
  monthlyContribution: number; // Contribution THIS month
  cumulativeContributions: number; // Total contributions to date
  monthlyReturn: number; // Return THIS month
  cumulativeReturns: number; // Total returns to date
  principalValue: number; // Starting value + cumulative contributions
  actualInvestedAmount?: number; // Actual cumulative investment deposits (EUR)
}

export interface ExtendedProjectionDataPoint extends ProjectionDataPoint {
  actualContributions?: number;
  actualValue?: number;
  actualReturns?: number;
  p10?: number; // 10th percentile (Monte Carlo)
  p50?: number; // 50th percentile (median)
  p90?: number; // 90th percentile
}

export interface MonteCarloSimulationResult {
  baseProjection: ProjectionDataPoint[];
  simulations: ProjectionDataPoint[][];
  percentiles: {
    p10: ProjectionDataPoint[];
    p50: ProjectionDataPoint[];
    p90: ProjectionDataPoint[];
  };
}

// Risk Metrics Types
export interface RiskMetrics {
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  volatility: number;
  rollingReturns: Record<string, number>;
  valueAtRisk: number;
  conditionalValueAtRisk: number;
}

export interface RiskAnalysisResult {
  metrics: RiskMetrics;
  riskAdjustedProjections: ProjectionDataPoint[];
  drawdownPeriods: {
    startDate: string;
    endDate: string;
    drawdownPercent: number;
    recoveryDate?: string;
  }[];
}

// Time-Based Analysis Types
export interface SeasonalPattern {
  month: number; // 1-12
  averageReturn: number;
  bestYear: number;
  worstYear: number;
  patternStrength: number; // 0-1 scale
}

export interface YoYComparison {
  year: number;
  startValue: number;
  endValue: number;
  annualReturn: number;
  annualContributions: number;
  annualGrowth: number;
}

export interface TimeBasedAnalysisResult {
  seasonalPatterns: SeasonalPattern[];
  yearOverYearComparisons: YoYComparison[];
  bestMonths: SeasonalPattern[];
  worstMonths: SeasonalPattern[];
  performanceHeatmap: Record<string, number>; // "YYYY-MM" -> return percentage
}

// Behavioral Finance Types
export interface BehavioralBias {
  type: 'overconfidence' | 'lossAversion' | 'herdBehavior' | 'recencyBias' | 'confirmationBias';
  description: string;
  severity: 'low' | 'medium' | 'high';
  recommendation: string;
}

export interface ProgressMilestone {
  percentage: number;
  achieved: boolean;
  date?: string;
  celebrationMessage: string;
  badge?: string;
}

export interface BehavioralAnalysisResult {
  behavioralBiases: BehavioralBias[];
  progressMilestones: ProgressMilestone[];
  motivationalMessages: string[];
  achievementBadges: string[];
}

export type TimeRange = '1m' | '3m' | '6m' | 'ytd' | '1y' | '3y' | '5y' | 'all';

export type ProjectionMetric =
  | 'value'
  | 'contribution'
  | 'grossContribution'
  | 'return'
  | 'cumulativeReturn';

export interface NewTransaction {
  date: string;
  ticker: string;
  action: string;
  shares: string;
  price: string;
  currency: string;
}

export interface NewCash {
  currency: string;
  amount: string;
  type: 'deposit' | 'withdrawal';
  note: string;
}

export interface TickerInfo {
  name: string;
  currency: string;
  basePrice: number; // Used as fallback
}
