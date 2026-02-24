import {
  Goal,
  ProjectionDataPoint,
  Transaction,
  MonteCarloSimulationResult,
} from '../types';

/**
 * Extended projection data point with actual values.
 */
export interface ExtendedProjectionDataPoint extends ProjectionDataPoint {
  actualContributions?: number;
  actualValue?: number;
  actualReturns?: number;
}

/**
 * Generates projection data points from start date to retirement year
 * based on the goal parameters (monthly deposits, annual return, etc.).
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

  let portfolioValue = currentNetWorth;
  let cumulativeContributions = 0;
  let cumulativeReturns = 0;
  let currentMonthlyDeposit = goal.monthlyDeposits;

  for (let i = 0; i <= totalMonths; i++) {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + i);

    // Annual deposit increase (at the start of each year after the first)
    if (i > 0 && date.getMonth() === 0 && goal.depositIncreasePercentage > 0) {
      currentMonthlyDeposit *= 1 + goal.depositIncreasePercentage;
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
 * Calculate actual contributions by month from transaction history.
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
 * Calculate cumulative actual contributions over time.
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
 * Merge projected data with actual transaction data.
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
 * Calculate total contributions from transactions.
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
    }
    if (tx.action === 'Sell') {
      return total - amountPLN;
    }
    return total;
  }, 0);
}
