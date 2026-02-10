import { Goal, ProjectionDataPoint, Transaction, MonteCarloSimulationResult, InvestmentScenario, ScenarioAnalysisResult, RiskMetrics, RiskAnalysisResult } from './types';

// Monte Carlo Simulation Parameters
interface MonteCarloParams {
  numSimulations: number;
  volatility: number; // Annual volatility (standard deviation of returns)
  confidenceLevels: number[]; // e.g., [0.1, 0.5, 0.9] for 10th, 50th, 90th percentiles
}

const DEFAULT_MONTE_CARLO_PARAMS: MonteCarloParams = {
  numSimulations: 1000,
  volatility: 0.15, // 15% annual volatility (typical for equities)
  confidenceLevels: [0.1, 0.5, 0.9],
};

/**
 * Generate random returns using geometric Brownian motion
 * This simulates the random walk behavior of stock prices
 */
function generateRandomReturns(
  baseReturn: number,
  volatility: number,
  numPeriods: number
): number[] {
  const returns: number[] = [];
  const dt = 1/12; // Monthly time step
  
  for (let i = 0; i < numPeriods; i++) {
    // Generate random normal variable
    const randomNormal = () => {
      let u = 0, v = 0;
      while(u === 0) u = Math.random(); // Converting [0,1) to (0,1)
      while(v === 0) v = Math.random();
      return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    };
    
    // Geometric Brownian motion formula
    const drift = (baseReturn - 0.5 * volatility * volatility) * dt;
    const diffusion = volatility * Math.sqrt(dt) * randomNormal();
    const monthlyReturn = drift + diffusion;
    
    returns.push(monthlyReturn);
  }
  
  return returns;
}

/**
 * Run Monte Carlo simulation to generate multiple projection paths
 */
export function runMonteCarloSimulation(
  goal: Goal,
  currentNetWorth: number,
  params: Partial<MonteCarloParams> = {}
): {
  baseProjection: ProjectionDataPoint[];
  simulations: ProjectionDataPoint[][];
  percentiles: {
    p10: ProjectionDataPoint[];
    p50: ProjectionDataPoint[];
    p90: ProjectionDataPoint[];
  };
} {
  const mergedParams = { ...DEFAULT_MONTE_CARLO_PARAMS, ...params };
  
  // Generate base projection (deterministic)
  const baseProjection = generateProjectionData(goal, currentNetWorth);
  
  if (baseProjection.length === 0) {
    return {
      baseProjection: [],
      simulations: [],
      percentiles: {
        p10: [],
        p50: [],
        p90: [],
      },
    };
  }
  
  const numSimulations = mergedParams.numSimulations;
  const volatility = mergedParams.volatility;
  const confidenceLevels = mergedParams.confidenceLevels;
  const numPeriods = baseProjection.length;
  
  // Run multiple simulations
  const simulations: ProjectionDataPoint[][] = [];
  
  for (let sim = 0; sim < numSimulations; sim++) {
    const randomReturns = generateRandomReturns(
      goal.annualReturn,
      volatility,
      numPeriods
    );
    
    const simulationData: ProjectionDataPoint[] = [];
    let portfolioValue = currentNetWorth;
    let cumulativeContributions = 0;
    let cumulativeReturns = 0;
    let currentMonthlyDeposit = goal.monthlyDeposits;
    
    for (let i = 0; i < numPeriods; i++) {
      const point = baseProjection[i];
      const date = new Date(point.date);
      
      // Annual deposit increase (at the start of each year after the first)
      if (i > 0 && date.getMonth() === 0 && goal.depositIncreasePercentage > 0) {
        currentMonthlyDeposit *= (1 + goal.depositIncreasePercentage);
      }
      
      // Use random return instead of fixed return
      const monthlyReturn = randomReturns[i];
      const monthlyReturnAmount = portfolioValue * monthlyReturn;
      cumulativeReturns += monthlyReturnAmount;
      
      // Add monthly contribution
      cumulativeContributions += currentMonthlyDeposit;
      
      // Update portfolio value
      portfolioValue += monthlyReturnAmount + currentMonthlyDeposit;
      
      simulationData.push({
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        date: point.date,
        value: Math.round(portfolioValue),
        goal: goal.amount,
        monthlyContribution: Math.round(currentMonthlyDeposit),
        cumulativeContributions: Math.round(cumulativeContributions),
        monthlyReturn: Math.round(monthlyReturnAmount),
        cumulativeReturns: Math.round(cumulativeReturns),
        principalValue: Math.round(cumulativeContributions),
      });
    }
    
    simulations.push(simulationData);
  }
  
  // Calculate percentiles for each time period
  const percentiles: Record<string, ProjectionDataPoint[]> = {};
  
  // Calculate percentiles for each time period
  const p10Data: ProjectionDataPoint[] = [];
  const p50Data: ProjectionDataPoint[] = [];
  const p90Data: ProjectionDataPoint[] = [];
  
  for (let i = 0; i < numPeriods; i++) {
    // Get all values at this time point across simulations
    const valuesAtTime = simulations.map(sim => sim[i].value);
    valuesAtTime.sort((a, b) => a - b);
    
    // Calculate percentile indices
    const p10Index = Math.floor(0.1 * numSimulations);
    const p50Index = Math.floor(0.5 * numSimulations);
    const p90Index = Math.floor(0.9 * numSimulations);
    
    const basePoint = baseProjection[i];
    
    p10Data.push({
      ...basePoint,
      value: valuesAtTime[p10Index],
    });
    
    p50Data.push({
      ...basePoint,
      value: valuesAtTime[p50Index],
    });
    
    p90Data.push({
      ...basePoint,
      value: valuesAtTime[p90Index],
    });
  }
  
  return {
    baseProjection,
    simulations,
    percentiles: {
      p10: p10Data,
      p50: p50Data,
      p90: p90Data,
    },
  };
}

/**
 * Generates projection data points from start date to retirement year
 * based on the goal parameters (monthly deposits, annual return, etc.)
 */
export function generateProjectionData(
  goal: Goal,
  currentNetWorth: number
): ProjectionDataPoint[] {
  if (!goal.startDate || !goal.retirementYear) {
    return [];
  }

  const data: ProjectionDataPoint[] = [];
  const monthlyReturn = goal.annualReturn / 12;
  const startDate = new Date(goal.startDate);
  
  // Calculate total months from start to retirement
  const retirementDate = new Date(goal.retirementYear, 11, 31); // End of retirement year
  const totalMonths = Math.max(
    0,
    (retirementDate.getFullYear() - startDate.getFullYear()) * 12 +
    (retirementDate.getMonth() - startDate.getMonth())
  );

  if (totalMonths === 0) return [];

  let portfolioValue = 0;
  let cumulativeContributions = 0;
  let cumulativeReturns = 0;
  let currentMonthlyDeposit = goal.monthlyDeposits;

  for (let i = 0; i <= totalMonths; i++) {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + i);

    // Annual deposit increase (at the start of each year after the first)
    if (i > 0 && date.getMonth() === 0 && goal.depositIncreasePercentage > 0) {
      currentMonthlyDeposit *= (1 + goal.depositIncreasePercentage);
    }

    // Monthly return on existing portfolio
    const monthlyReturnAmount = portfolioValue * monthlyReturn;
    cumulativeReturns += monthlyReturnAmount;

    // Add monthly contribution
    cumulativeContributions += currentMonthlyDeposit;

    // Update portfolio value
    portfolioValue += monthlyReturnAmount + currentMonthlyDeposit;

    data.push({
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      value: Math.round(portfolioValue),
      goal: goal.amount,
      monthlyContribution: Math.round(currentMonthlyDeposit),
      cumulativeContributions: Math.round(cumulativeContributions),
      monthlyReturn: Math.round(monthlyReturnAmount),
      cumulativeReturns: Math.round(cumulativeReturns),
      principalValue: Math.round(cumulativeContributions),
    });
  }

  return data;
}

/**
 * Calculate actual contributions by month from transaction history
 */
export function calculateActualContributionsByMonth(
  transactions: Transaction[],
  exchangeRates: { EUR_PLN: number; USD_PLN: number }
): Map<string, number> {
  const monthlyContributions = new Map<string, number>();

  // Sort transactions by date
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  sortedTransactions.forEach((tx) => {
    const date = new Date(tx.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    // Convert to PLN based on currency
    let amountPLN = tx.shares * tx.price;
    if (tx.currency === 'EUR') {
      amountPLN *= exchangeRates.EUR_PLN;
    } else if (tx.currency === 'USD') {
      amountPLN *= exchangeRates.USD_PLN;
    }

    const currentAmount = monthlyContributions.get(monthKey) || 0;

    if (tx.action === 'Buy') {
      monthlyContributions.set(monthKey, currentAmount + amountPLN);
    } else if (tx.action === 'Sell') {
      monthlyContributions.set(monthKey, currentAmount - amountPLN);
    }
  });

  return monthlyContributions;
}

/**
 * Calculate cumulative actual contributions over time
 */
export function calculateCumulativeActualContributions(
  transactions: Transaction[],
  exchangeRates: { EUR_PLN: number; USD_PLN: number },
  startDate: string,
  endDate: string
): Map<string, number> {
  const monthlyContributions = calculateActualContributionsByMonth(transactions, exchangeRates);
  const cumulativeContributions = new Map<string, number>();

  const start = new Date(startDate);
  const end = new Date(endDate);
  let cumulative = 0;

  // Iterate through each month from start to end
  const current = new Date(start);
  while (current <= end) {
    const monthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
    
    // Add this month's contributions to cumulative
    const monthAmount = monthlyContributions.get(monthKey) || 0;
    cumulative += monthAmount;
    
    cumulativeContributions.set(monthKey, cumulative);
    
    // Move to next month
    current.setMonth(current.getMonth() + 1);
  }

  return cumulativeContributions;
}

/**
 * Extended projection data point with actual values
 */
export interface ExtendedProjectionDataPoint extends ProjectionDataPoint {
  actualContributions?: number;
  actualValue?: number;
  actualReturns?: number;
}

/**
 * Merge projected data with actual transaction data
 */
export function mergeProjectedWithActual(
  projectedData: ProjectionDataPoint[],
  transactions: Transaction[],
  exchangeRates: { EUR_PLN: number; USD_PLN: number },
  currentNetWorth: number,
  monteCarloResult?: MonteCarloSimulationResult
): ExtendedProjectionDataPoint[] {
  if (projectedData.length === 0) return [];

  const startDate = projectedData[0].date;
  const endDate = projectedData[projectedData.length - 1].date;
  
  // Get cumulative actual contributions by month
  const cumulativeActual = calculateCumulativeActualContributions(
    transactions,
    exchangeRates,
    startDate,
    endDate
  );

  // Get current month key
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Get total actual contributions (latest cumulative value)
  let totalActualContributions = 0;
  cumulativeActual.forEach((value) => {
    totalActualContributions = value; // Last value will be the total
  });

  // Calculate actual returns
  const actualReturns = currentNetWorth - totalActualContributions;

  return projectedData.map((point, index) => {
    const actualContrib = cumulativeActual.get(point.date);
    const isCurrentOrPast = point.date <= currentMonthKey;

    // For current month, show actual portfolio value
    // For past months with contributions, show actual contributions
    // For future months, only show projected values
    
    let actualValue: number | undefined;
    let actualReturnsValue: number | undefined;
    let p10: number | undefined;
    let p50: number | undefined;
    let p90: number | undefined;

    if (point.date === currentMonthKey) {
      // Current month - show actual portfolio value and returns
      actualValue = currentNetWorth;
      actualReturnsValue = actualReturns;
    }

    // Add Monte Carlo percentile data if available
    if (monteCarloResult) {
      p10 = monteCarloResult.percentiles.p10[index]?.value;
      p50 = monteCarloResult.percentiles.p50[index]?.value;
      p90 = monteCarloResult.percentiles.p90[index]?.value;
    }

    return {
      ...point,
      actualContributions: isCurrentOrPast ? actualContrib : undefined,
      actualValue,
      actualReturns: point.date === currentMonthKey ? actualReturnsValue : undefined,
      p10,
      p50,
      p90,
    };
  });
}

/**
 * Calculate total contributions from transactions
 */
export function calculateCumulativeContributions(
  transactions: Transaction[],
  exchangeRates: { EUR_PLN: number; USD_PLN: number }
): number {
  return transactions.reduce((total, tx) => {
    let amountPLN = tx.shares * tx.price;
    if (tx.currency === 'EUR') {
      amountPLN *= exchangeRates.EUR_PLN;
    } else if (tx.currency === 'USD') {
      amountPLN *= exchangeRates.USD_PLN;
    }

    if (tx.action === 'Buy') {
      return total + amountPLN;
    } else if (tx.action === 'Sell') {
      return total - amountPLN;
    }
    return total;
  }, 0);
}

// Default scenarios for analysis
const DEFAULT_SCENARIOS: InvestmentScenario[] = [
  {
    id: 'base',
    name: 'Base Case',
    returnAdjustment: 0,
    color: '#4ECDC4',
    description: 'Your original plan with expected returns',
    isActive: true,
  },
  {
    id: 'optimistic',
    name: 'Optimistic',
    returnAdjustment: 0.02, // +2%
    color: '#10b981',
    description: 'Higher returns scenario (+2% annual return)',
    isActive: true,
  },
  {
    id: 'pessimistic',
    name: 'Pessimistic',
    returnAdjustment: -0.02, // -2%
    color: '#ef4444',
    description: 'Lower returns scenario (-2% annual return)',
    isActive: true,
  },
];

/**
 * Generate projection data for a specific scenario
 */
function generateScenarioProjection(
  goal: Goal,
  currentNetWorth: number,
  scenario: InvestmentScenario
): ProjectionDataPoint[] {
  const adjustedAnnualReturn = goal.annualReturn + scenario.returnAdjustment;
  const adjustedGoal: Goal = {
    ...goal,
    annualReturn: adjustedAnnualReturn,
  };
  
  return generateProjectionData(adjustedGoal, currentNetWorth);
}

/**
 * Run scenario analysis with multiple return scenarios
 */
export function runScenarioAnalysis(
  goal: Goal,
  currentNetWorth: number,
  customScenarios?: InvestmentScenario[]
): ScenarioAnalysisResult {
  const scenarios = customScenarios || DEFAULT_SCENARIOS;
  
  const result: Record<string, ProjectionDataPoint[]> = {};
  
  scenarios.forEach((scenario) => {
    result[scenario.id] = generateScenarioProjection(goal, currentNetWorth, scenario);
  });
  
  return {
    baseScenario: result['base'] || [],
    optimisticScenario: result['optimistic'] || [],
    pessimisticScenario: result['pessimistic'] || [],
    scenarios: result,
  };
}

/**
 * Get default scenarios for scenario analysis
 */
export function getDefaultScenarios(): InvestmentScenario[] {
  return [...DEFAULT_SCENARIOS];
}

// ============================================
// RISK METRICS CALCULATIONS
// ============================================

/**
 * Calculate monthly returns from projection data
 */
function calculateMonthlyReturns(projectionData: ProjectionDataPoint[]): number[] {
  if (projectionData.length <= 1) return [];
  
  const returns: number[] = [];
  
  for (let i = 1; i < projectionData.length; i++) {
    const prevValue = projectionData[i - 1].value;
    const currValue = projectionData[i].value;
    const prevContrib = projectionData[i - 1].cumulativeContributions;
    const currContrib = projectionData[i].cumulativeContributions;
    
    // Calculate return excluding new contributions
    const investmentValue = prevValue - prevContrib;
    const newInvestmentValue = currValue - currContrib;
    
    if (investmentValue > 0) {
      const monthlyReturn = (newInvestmentValue - investmentValue) / investmentValue;
      returns.push(monthlyReturn);
    } else {
      returns.push(0);
    }
  }
  
  return returns;
}

/**
 * Calculate Sharpe Ratio (risk-adjusted return)
 * Sharpe Ratio = (Mean Return - Risk Free Rate) / Standard Deviation of Returns
 */
function calculateSharpeRatio(returns: number[], riskFreeRate: number = 0.02): number {
  if (returns.length === 0) return 0;
  
  const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const excessReturn = meanReturn - (riskFreeRate / 12); // Convert annual to monthly
  
  // Calculate standard deviation
  const squaredDiffs = returns.map(r => Math.pow(r - meanReturn, 2));
  const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  
  return stdDev > 0 ? excessReturn / stdDev : 0;
}

/**
 * Calculate Sortino Ratio (downside risk focus)
 * Sortino Ratio = (Mean Return - Risk Free Rate) / Downside Deviation
 */
function calculateSortinoRatio(returns: number[], riskFreeRate: number = 0.02): number {
  if (returns.length === 0) return 0;
  
  const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const excessReturn = meanReturn - (riskFreeRate / 12);
  
  // Calculate downside deviation (only negative returns)
  const negativeReturns = returns.filter(r => r < 0);
  if (negativeReturns.length === 0) return 0;
  
  const squaredDownsideDiffs = negativeReturns.map(r => Math.pow(r - meanReturn, 2));
  const downsideVariance = squaredDownsideDiffs.reduce((sum, diff) => sum + diff, 0) / returns.length;
  const downsideDeviation = Math.sqrt(downsideVariance);
  
  return downsideDeviation > 0 ? excessReturn / downsideDeviation : 0;
}

/**
 * Calculate Maximum Drawdown
 * Maximum Drawdown = (Peak Value - Trough Value) / Peak Value
 */
function calculateMaxDrawdown(projectionData: ProjectionDataPoint[]): {
  maxDrawdown: number;
  drawdownPeriods: {
    startDate: string;
    endDate: string;
    drawdownPercent: number;
    recoveryDate?: string;
  }[];
} {
  if (projectionData.length === 0) return { maxDrawdown: 0, drawdownPeriods: [] };
  
  let maxDrawdown = 0;
  let peakValue = projectionData[0].value;
  let currentDrawdown = 0;
  let drawdownStartIndex = 0;
  let drawdownStartDate = projectionData[0].date;
  
  const drawdownPeriods: {
    startDate: string;
    endDate: string;
    drawdownPercent: number;
    recoveryDate?: string;
  }[] = [];
  
  for (let i = 1; i < projectionData.length; i++) {
    const currentValue = projectionData[i].value;
    
    // Update peak value
    if (currentValue > peakValue) {
      peakValue = currentValue;
      drawdownStartIndex = i;
      drawdownStartDate = projectionData[i].date;
      currentDrawdown = 0;
    } else {
      // Calculate current drawdown from peak
      currentDrawdown = (peakValue - currentValue) / peakValue;
      
      // Update max drawdown
      if (currentDrawdown > maxDrawdown) {
        maxDrawdown = currentDrawdown;
      }
    }
    
    // Check if drawdown has ended (recovered to peak)
    if (currentDrawdown > 0.01 && currentValue >= peakValue * 0.99) {
      // Drawdown period ended
      drawdownPeriods.push({
        startDate: drawdownStartDate,
        endDate: projectionData[i].date,
        drawdownPercent: currentDrawdown,
        recoveryDate: projectionData[i].date,
      });
      
      // Reset for next potential drawdown
      peakValue = currentValue;
      drawdownStartIndex = i;
      drawdownStartDate = projectionData[i].date;
      currentDrawdown = 0;
    }
  }
  
  // Check if we're still in a drawdown at the end
  if (currentDrawdown > 0.01) {
    drawdownPeriods.push({
      startDate: drawdownStartDate,
      endDate: projectionData[projectionData.length - 1].date,
      drawdownPercent: currentDrawdown,
    });
  }
  
  return { maxDrawdown, drawdownPeriods };
}

/**
 * Calculate rolling returns (1-year, 3-year, 5-year)
 */
function calculateRollingReturns(projectionData: ProjectionDataPoint[]): Record<string, number> {
  const rollingReturns: Record<string, number> = {};
  
  // 1-year rolling returns (12 months)
  for (let i = 12; i < projectionData.length; i++) {
    const startValue = projectionData[i - 12].value;
    const endValue = projectionData[i].value;
    const startContrib = projectionData[i - 12].cumulativeContributions;
    const endContrib = projectionData[i].cumulativeContributions;
    
    const investmentReturn = (endValue - endContrib) - (startValue - startContrib);
    const investmentBase = startValue - startContrib;
    
    if (investmentBase > 0) {
      const annualReturn = investmentReturn / investmentBase;
      rollingReturns[`1y_${projectionData[i].date}`] = annualReturn;
    }
  }
  
  // 3-year rolling returns (36 months)
  for (let i = 36; i < projectionData.length; i++) {
    const startValue = projectionData[i - 36].value;
    const endValue = projectionData[i].value;
    const startContrib = projectionData[i - 36].cumulativeContributions;
    const endContrib = projectionData[i].cumulativeContributions;
    
    const investmentReturn = (endValue - endContrib) - (startValue - startContrib);
    const investmentBase = startValue - startContrib;
    
    if (investmentBase > 0) {
      const threeYearReturn = Math.pow((investmentReturn / investmentBase + 1), 1/3) - 1;
      rollingReturns[`3y_${projectionData[i].date}`] = threeYearReturn;
    }
  }
  
  // 5-year rolling returns (60 months)
  for (let i = 60; i < projectionData.length; i++) {
    const startValue = projectionData[i - 60].value;
    const endValue = projectionData[i].value;
    const startContrib = projectionData[i - 60].cumulativeContributions;
    const endContrib = projectionData[i].cumulativeContributions;
    
    const investmentReturn = (endValue - endContrib) - (startValue - startContrib);
    const investmentBase = startValue - startContrib;
    
    if (investmentBase > 0) {
      const fiveYearReturn = Math.pow((investmentReturn / investmentBase + 1), 1/5) - 1;
      rollingReturns[`5y_${projectionData[i].date}`] = fiveYearReturn;
    }
  }
  
  return rollingReturns;
}

/**
 * Calculate Value at Risk (VaR) at 95% confidence level
 */
function calculateValueAtRisk(projectionData: ProjectionDataPoint[], confidenceLevel: number = 0.95): number {
  if (projectionData.length <= 1) return 0;
  
  const returns = calculateMonthlyReturns(projectionData);
  returns.sort((a, b) => a - b);
  
  const varIndex = Math.floor(returns.length * (1 - confidenceLevel));
  const varReturn = returns[varIndex];
  
  const currentValue = projectionData[projectionData.length - 1].value;
  return currentValue * varReturn;
}

/**
 * Calculate Conditional Value at Risk (CVaR) - average of worst losses beyond VaR
 */
function calculateConditionalValueAtRisk(projectionData: ProjectionDataPoint[], confidenceLevel: number = 0.95): number {
  if (projectionData.length <= 1) return 0;
  
  const returns = calculateMonthlyReturns(projectionData);
  returns.sort((a, b) => a - b);
  
  const varIndex = Math.floor(returns.length * (1 - confidenceLevel));
  const worstReturns = returns.slice(0, varIndex);
  
  if (worstReturns.length === 0) return 0;
  
  const avgWorstReturn = worstReturns.reduce((sum, r) => sum + r, 0) / worstReturns.length;
  const currentValue = projectionData[projectionData.length - 1].value;
  
  return currentValue * avgWorstReturn;
}

/**
 * Calculate overall volatility (standard deviation of returns)
 */
function calculateVolatility(projectionData: ProjectionDataPoint[]): number {
  const returns = calculateMonthlyReturns(projectionData);
  
  if (returns.length === 0) return 0;
  
  const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const squaredDiffs = returns.map(r => Math.pow(r - meanReturn, 2));
  const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / returns.length;
  
  return Math.sqrt(variance);
}

/**
 * Calculate risk-adjusted projections by applying risk metrics
 */
function calculateRiskAdjustedProjections(
  projectionData: ProjectionDataPoint[],
  riskMetrics: RiskMetrics
): ProjectionDataPoint[] {
  return projectionData.map((point, index) => {
    // Apply risk adjustment based on volatility and drawdown
    const riskAdjustmentFactor = 1 - (riskMetrics.volatility * 0.5);
    
    return {
      ...point,
      value: Math.round(point.value * riskAdjustmentFactor),
      monthlyReturn: Math.round(point.monthlyReturn * riskAdjustmentFactor),
      cumulativeReturns: Math.round(point.cumulativeReturns * riskAdjustmentFactor),
    };
  });
}

/**
 * Perform comprehensive risk analysis on projection data
 */
export function calculateRiskMetrics(
  projectionData: ProjectionDataPoint[],
  riskFreeRate: number = 0.02
): RiskAnalysisResult {
  if (projectionData.length === 0) {
    return {
      metrics: {
        sharpeRatio: 0,
        sortinoRatio: 0,
        maxDrawdown: 0,
        volatility: 0,
        rollingReturns: {},
        valueAtRisk: 0,
        conditionalValueAtRisk: 0,
      },
      riskAdjustedProjections: [],
      drawdownPeriods: [],
    };
  }
  
  // Calculate monthly returns
  const monthlyReturns = calculateMonthlyReturns(projectionData);
  
  // Calculate risk metrics
  const sharpeRatio = calculateSharpeRatio(monthlyReturns, riskFreeRate);
  const sortinoRatio = calculateSortinoRatio(monthlyReturns, riskFreeRate);
  const { maxDrawdown, drawdownPeriods } = calculateMaxDrawdown(projectionData);
  const volatility = calculateVolatility(projectionData);
  const rollingReturns = calculateRollingReturns(projectionData);
  const valueAtRisk = calculateValueAtRisk(projectionData);
  const conditionalValueAtRisk = calculateConditionalValueAtRisk(projectionData);
  
  const metrics: RiskMetrics = {
    sharpeRatio,
    sortinoRatio,
    maxDrawdown,
    volatility,
    rollingReturns,
    valueAtRisk,
    conditionalValueAtRisk,
  };
  
  // Calculate risk-adjusted projections
  const riskAdjustedProjections = calculateRiskAdjustedProjections(projectionData, metrics);
  
  return {
    metrics,
    riskAdjustedProjections,
    drawdownPeriods,
  };
}

/**
 * Get risk rating based on metrics
 */
export function getRiskRating(riskMetrics: RiskMetrics): {
  rating: 'Low' | 'Medium' | 'High' | 'Very High';
  description: string;
  color: string;
} {
  const volatilityScore = riskMetrics.volatility * 100; // Convert to percentage
  const drawdownScore = riskMetrics.maxDrawdown * 100;
  const sharpeScore = riskMetrics.sharpeRatio;
  
  // Calculate composite risk score
  const riskScore = (volatilityScore * 0.4) + (drawdownScore * 0.4) + ((5 - Math.min(sharpeScore, 5)) * 20);
  
  if (riskScore < 30) {
    return {
      rating: 'Low',
      description: 'Low risk profile with stable returns and minimal drawdowns',
      color: '#10b981',
    };
  } else if (riskScore < 60) {
    return {
      rating: 'Medium',
      description: 'Moderate risk profile with balanced returns and drawdowns',
      color: '#f59e0b',
    };
  } else if (riskScore < 80) {
    return {
      rating: 'High',
      description: 'High risk profile with significant volatility and potential drawdowns',
      color: '#ef4444',
    };
  } else {
    return {
      rating: 'Very High',
      description: 'Very high risk profile with extreme volatility and large potential drawdowns',
      color: '#dc2626',
    };
  }
}

/**
 * Format risk metrics for display
 */
export function formatRiskMetrics(riskMetrics: RiskMetrics): Record<string, string> {
  return {
    sharpeRatio: riskMetrics.sharpeRatio.toFixed(2),
    sortinoRatio: riskMetrics.sortinoRatio.toFixed(2),
    maxDrawdown: (riskMetrics.maxDrawdown * 100).toFixed(1) + '%',
    volatility: (riskMetrics.volatility * 100).toFixed(1) + '%',
    valueAtRisk: riskMetrics.valueAtRisk.toFixed(0),
    conditionalValueAtRisk: riskMetrics.conditionalValueAtRisk.toFixed(0),
  };
}
