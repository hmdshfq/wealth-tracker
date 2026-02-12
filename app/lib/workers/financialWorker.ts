// WebWorker for heavy financial calculations
// This runs in a separate thread to avoid blocking the main UI

import { Goal, ProjectionDataPoint, MonteCarloSimulationResult, InvestmentScenario, ScenarioAnalysisResult, TimeBasedAnalysisResult, SeasonalPattern, YoYComparison } from '../types';
import { FinancialWorkerMessage, FinancialWorkerResponse } from './financialWorkerTypes';

// Import the calculation functions we need
// Note: In a real implementation, we'd need to bundle these functions
// For now, we'll implement simplified versions directly in the worker

// Simplified projection calculation for the worker
function generateProjectionData(goal: Goal, currentNetWorth: number): ProjectionDataPoint[] {
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

// Simplified Monte Carlo simulation
function runMonteCarloSimulation(
  goal: Goal,
  currentNetWorth: number,
  params: { numSimulations: number; volatility: number }
): MonteCarloSimulationResult {
  const baseProjection = generateProjectionData(goal, currentNetWorth);
  
  if (baseProjection.length === 0) {
    return {
      baseProjection: [],
      percentiles: { p10: [], p50: [], p90: [] },
      simulations: []
    };
  }

  const numSimulations = Math.min(params.numSimulations, 2000); // Limit for performance
  const volatility = params.volatility;
  const numPeriods = baseProjection.length;
  const simulations: ProjectionDataPoint[][] = [];

  // Generate random returns using geometric Brownian motion
  function generateRandomReturns(baseReturn: number, volatility: number, numPeriods: number): number[] {
    const returns: number[] = [];
    const dt = 1/12; // Monthly time step
    
    for (let i = 0; i < numPeriods; i++) {
      // Generate random normal variable (Box-Muller transform)
      let u = 0, v = 0;
      while(u === 0) u = Math.random();
      while(v === 0) v = Math.random();
      const randomNormal = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
      
      // Geometric Brownian motion formula
      const drift = (baseReturn - 0.5 * volatility * volatility) * dt;
      const diffusion = volatility * Math.sqrt(dt) * randomNormal;
      const monthlyReturn = drift + diffusion;
      
      returns.push(monthlyReturn);
    }
    
    return returns;
  }

  // Run simulations
  for (let sim = 0; sim < numSimulations; sim++) {
    const randomReturns = generateRandomReturns(goal.annualReturn, volatility, numPeriods);
    
    const simulationData: ProjectionDataPoint[] = [];
    let portfolioValue = currentNetWorth;
    let cumulativeContributions = 0;
    let currentMonthlyDeposit = goal.monthlyDeposits;
    
    for (let i = 0; i < numPeriods; i++) {
      const point = baseProjection[i];
      
      // Annual deposit increase
      if (i > 0 && new Date(point.date).getMonth() === 0 && goal.depositIncreasePercentage > 0) {
        currentMonthlyDeposit *= (1 + goal.depositIncreasePercentage);
      }
      
      // Use random return
      const monthlyReturn = randomReturns[i];
      const monthlyReturnAmount = portfolioValue * monthlyReturn;
      cumulativeContributions += currentMonthlyDeposit;
      
      portfolioValue += monthlyReturnAmount + currentMonthlyDeposit;
      
      simulationData.push({
        ...point,
        value: Math.round(portfolioValue),
        cumulativeContributions: Math.round(cumulativeContributions),
        monthlyReturn: Math.round(monthlyReturnAmount),
      });
    }
    
    simulations.push(simulationData);
  }

  // Calculate percentiles
  const p10Data: ProjectionDataPoint[] = [];
  const p50Data: ProjectionDataPoint[] = [];
  const p90Data: ProjectionDataPoint[] = [];
  
  for (let i = 0; i < numPeriods; i++) {
    const valuesAtTime = simulations.map(sim => sim[i].value);
    valuesAtTime.sort((a, b) => a - b);
    
    const p10Index = Math.floor(0.1 * numSimulations);
    const p50Index = Math.floor(0.5 * numSimulations);
    const p90Index = Math.floor(0.9 * numSimulations);
    
    const basePoint = baseProjection[i];
    
    p10Data.push({ ...basePoint, value: valuesAtTime[p10Index] });
    p50Data.push({ ...basePoint, value: valuesAtTime[p50Index] });
    p90Data.push({ ...basePoint, value: valuesAtTime[p90Index] });
  }
  
  return {
    baseProjection,
    percentiles: { p10: p10Data, p50: p50Data, p90: p90Data },
    simulations
  };
}

// Simplified scenario analysis
function runScenarioAnalysis(
  goal: Goal,
  currentNetWorth: number,
  scenarios: InvestmentScenario[]
): ScenarioAnalysisResult {
  const result: Record<string, ProjectionDataPoint[]> = {};
  
  scenarios.forEach((scenario) => {
    const adjustedGoal = { ...goal, annualReturn: goal.annualReturn + scenario.returnAdjustment };
    result[scenario.id] = generateProjectionData(adjustedGoal, currentNetWorth);
  });
  
  return {
    baseScenario: result['base'] || [],
    optimisticScenario: result['optimistic'] || [],
    pessimisticScenario: result['pessimistic'] || [],
    scenarios: result,
  };
}

// Simplified time-based analysis
function performTimeBasedAnalysis(projectionData: ProjectionDataPoint[]): TimeBasedAnalysisResult {
  if (projectionData.length === 0) {
    return {
      seasonalPatterns: [],
      yearOverYearComparisons: [],
      bestMonths: [],
      worstMonths: [],
      performanceHeatmap: {},
    };
  }
  
  // Simplified seasonal patterns
  const seasonalPatterns: SeasonalPattern[] = [];
  for (let month = 1; month <= 12; month++) {
    const monthData = projectionData.filter(p => p.month === month);
    if (monthData.length > 0) {
      const startValue = monthData[0].value - monthData[0].cumulativeContributions;
      const endValue = monthData[monthData.length - 1].value - monthData[monthData.length - 1].cumulativeContributions;
      const averageReturn = startValue > 0 ? (endValue - startValue) / startValue : 0;
      
      seasonalPatterns.push({
        month,
        averageReturn,
        bestYear: monthData[monthData.length - 1].year,
        worstYear: monthData[0].year,
        patternStrength: 0.5, // Simplified
      });
    }
  }
  
  // Simplified year-over-year comparisons
  const years = new Set(projectionData.map(p => p.year));
  const yearOverYearComparisons: YoYComparison[] = [];
  
  years.forEach(year => {
    const yearData = projectionData.filter(p => p.year === year);
    if (yearData.length > 0) {
      const startPoint = yearData[0];
      const endPoint = yearData[yearData.length - 1];
      
      const startValue = startPoint.value;
      const endValue = endPoint.value;
      const annualContributions = endPoint.cumulativeContributions - startPoint.cumulativeContributions;
      
      const investmentStartValue = startValue - startPoint.cumulativeContributions;
      const investmentEndValue = endValue - endPoint.cumulativeContributions;
      const annualReturn = investmentStartValue > 0
        ? (investmentEndValue - investmentStartValue) / investmentStartValue
        : 0;
      const annualGrowth = endValue - startValue;
      
      yearOverYearComparisons.push({
        year,
        startValue,
        endValue,
        annualReturn,
        annualContributions,
        annualGrowth,
      });
    }
  });
  
  // Simplified heatmap
  const performanceHeatmap: Record<string, number> = {};
  for (let i = 1; i < projectionData.length; i++) {
    const prevPoint = projectionData[i - 1];
    const currPoint = projectionData[i];
    
    const investmentValue = prevPoint.value - prevPoint.cumulativeContributions;
    const newInvestmentValue = currPoint.value - currPoint.cumulativeContributions;
    
    if (investmentValue > 0) {
      const monthlyReturn = (newInvestmentValue - investmentValue) / investmentValue;
      const monthKey = `${currPoint.year}-${String(currPoint.month).padStart(2, '0')}`;
      performanceHeatmap[monthKey] = monthlyReturn * 100;
    }
  }
  
  // Best and worst months
  const bestMonths = [...seasonalPatterns]
    .sort((a, b) => b.averageReturn - a.averageReturn)
    .slice(0, 3);
  
  const worstMonths = [...seasonalPatterns]
    .sort((a, b) => a.averageReturn - b.averageReturn)
    .slice(0, 3);
  
  return {
    seasonalPatterns,
    yearOverYearComparisons,
    bestMonths,
    worstMonths,
    performanceHeatmap,
  };
}

// Worker message handler
self.onmessage = function(e: MessageEvent<FinancialWorkerMessage>) {
  const message = e.data;
  const response: FinancialWorkerResponse = {
    type: message.type,
    id: message.id,
    error: undefined,
  };

  try {
    switch (message.type) {
      case 'monte-carlo':
        response.result = runMonteCarloSimulation(message.data.goal, message.data.currentNetWorth, message.data.params);
        break;
      
      case 'scenario-analysis':
        response.result = runScenarioAnalysis(message.data.goal, message.data.currentNetWorth, message.data.scenarios);
        break;
      
      case 'time-based-analysis':
        response.result = performTimeBasedAnalysis(message.data.projectionData);
        break;
      
      case 'projection-data':
        response.result = generateProjectionData(message.data.goal, message.data.currentNetWorth);
        break;
      
      default:
        response.error = `Unknown message type: ${message.type}`;
    }
  } catch (error) {
    response.error = error instanceof Error ? error.message : 'Unknown error';
  }

  self.postMessage(response);
};

// Helper function for formatting
function formatPLN(amount: number): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export {}; // Make this a module
