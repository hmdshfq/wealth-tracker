import { ProjectionDataPoint, TimeRange } from './types';

/**
 * Calculate monthly projection data using compound interest
 * FV = PV(1+r)^n + PMT * [((1+r)^n - 1) / r]
 */
export function calculateMonthlyProjection(
  currentNetWorth: number,
  retirementYear: number,
  annualReturn: number,
  monthlyDeposits: number,
  startYear?: number,
  startMonth?: number,
  retirementGoalAmount?: number,
  depositIncreasePercentage?: number
): ProjectionDataPoint[] {
  const data: ProjectionDataPoint[] = [];
  const currentYear = startYear ?? new Date().getFullYear();
  const currentMonth = startMonth ?? new Date().getMonth() + 1;

  // Convert annual return to monthly
  const monthlyReturn = Math.pow(1 + annualReturn, 1 / 12) - 1;

  let portfolioValue = currentNetWorth;
  let cumulativeContributions = 0;
  let cumulativeReturns = 0;

  for (let year = currentYear; year <= retirementYear; year++) {
    const startMonthValue = year === currentYear ? currentMonth : 1;
    const endMonth = year === retirementYear ? 12 : 12;

    // Calculate monthly deposit for this year based on annual increases
    const yearsElapsed = year - currentYear;
    const increaseRate = depositIncreasePercentage ?? 0;
    const currentYearMonthlyDeposits = monthlyDeposits * Math.pow(1 + increaseRate, yearsElapsed);

    for (let month = startMonthValue; month <= endMonth; month++) {
      // Add monthly contribution (with annual increases applied)
      portfolioValue += currentYearMonthlyDeposits;
      cumulativeContributions += currentYearMonthlyDeposits;

      // Calculate and apply monthly return
      const previousValue = portfolioValue - currentYearMonthlyDeposits;
      const monthlyReturnAmount = previousValue * monthlyReturn;
      portfolioValue += monthlyReturnAmount;
      cumulativeReturns += monthlyReturnAmount;

      // Calculate principal value (starting balance + cumulative contributions)
      const principalValue = currentNetWorth + cumulativeContributions;

      // Use fixed goal amount
      const monthlyGoal = retirementGoalAmount || 0;

      data.push({
        year,
        month,
        date: `${year}-${String(month).padStart(2, '0')}`,
        value: Math.round(portfolioValue),
        goal: Math.round(monthlyGoal),
        monthlyContribution: currentYearMonthlyDeposits,
        cumulativeContributions: Math.round(cumulativeContributions),
        monthlyReturn: Math.round(monthlyReturnAmount),
        cumulativeReturns: Math.round(cumulativeReturns),
        principalValue: Math.round(principalValue),
      });
    }
  }

  return data;
}

/**
 * Filter projection data by time range
 */
export function filterDataByTimeRange(
  data: ProjectionDataPoint[],
  timeRange: TimeRange
): ProjectionDataPoint[] {
  if (timeRange === 'all') return data;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  let startDate: Date;

  switch (timeRange) {
    case '1m':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case '3m':
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      break;
    case '6m':
      startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      break;
    case 'ytd':
      startDate = new Date(currentYear, 0, 1);
      break;
    case '1y':
      startDate = new Date(currentYear - 1, currentMonth - 1, 1);
      break;
    case '3y':
      startDate = new Date(currentYear - 3, currentMonth - 1, 1);
      break;
    case '5y':
      startDate = new Date(currentYear - 5, currentMonth - 1, 1);
      break;
    default:
      return data;
  }

  const startDateStr = `${startDate.getFullYear()}-${String(
    startDate.getMonth() + 1
  ).padStart(2, '0')}`;

  return data.filter((point) => point.date >= startDateStr);
}

/**
 * Group projection data by year for table display
 */
export function groupProjectionByYear(
  data: ProjectionDataPoint[]
): Record<number, ProjectionDataPoint[]> {
  return data.reduce(
    (acc, point) => {
      if (!acc[point.year]) {
        acc[point.year] = [];
      }
      acc[point.year].push(point);
      return acc;
    },
    {} as Record<number, ProjectionDataPoint[]>
  );
}
