import { Goal, ProjectionDataPoint, Transaction, MonteCarloSimulationResult, InvestmentScenario, ScenarioAnalysisResult } from './types';

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
