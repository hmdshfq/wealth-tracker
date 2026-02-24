import { Goal, ProjectionDataPoint } from '../types';
import { generateProjectionData } from './baseProjection';

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
 * Generate random returns using geometric Brownian motion.
 */
function generateRandomReturns(
  baseReturn: number,
  volatility: number,
  numPeriods: number
): number[] {
  const returns: number[] = [];
  const dt = 1 / 12; // Monthly time step

  for (let i = 0; i < numPeriods; i++) {
    // Generate random normal variable
    const randomNormal = () => {
      let u = 0;
      let v = 0;
      while (u === 0) u = Math.random();
      while (v === 0) v = Math.random();
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
 * Run Monte Carlo simulation to generate multiple projection paths.
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
    const randomReturns = generateRandomReturns(goal.annualReturn, volatility, numPeriods);

    const simulationData: ProjectionDataPoint[] = [];
    let portfolioValue = 0;
    let cumulativeContributions = 0;
    let cumulativeReturns = 0;
    let currentMonthlyDeposit = goal.monthlyDeposits;

    for (let i = 0; i < numPeriods; i++) {
      const point = baseProjection[i];
      const date = new Date(point.date);

      // Annual deposit increase (at the start of each year after the first)
      if (i > 0 && date.getMonth() === 0 && goal.depositIncreasePercentage > 0) {
        currentMonthlyDeposit *= 1 + goal.depositIncreasePercentage;
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
    const valuesAtTime = simulations.map((sim) => sim[i].value);
    valuesAtTime.sort((a, b) => a - b);

    // Calculate percentile indices
    const p10Index = Math.floor(confidenceLevels[0] * numSimulations);
    const p50Index = Math.floor(confidenceLevels[1] * numSimulations);
    const p90Index = Math.floor(confidenceLevels[2] * numSimulations);

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

  percentiles.p10 = p10Data;
  percentiles.p50 = p50Data;
  percentiles.p90 = p90Data;

  return {
    baseProjection,
    simulations,
    percentiles: {
      p10: percentiles.p10,
      p50: percentiles.p50,
      p90: percentiles.p90,
    },
  };
}
