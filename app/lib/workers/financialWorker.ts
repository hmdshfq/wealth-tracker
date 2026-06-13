// WebWorker for heavy financial calculations
// This runs in a separate thread to avoid blocking the main UI

import { Goal, ProjectionDataPoint, InvestmentScenario, ScenarioAnalysisResult } from '../types';
import { FinancialWorkerMessage, FinancialWorkerResponse, FinancialWorkerRequestPayloadMap } from './financialWorkerTypes';

// Import the calculation functions we need
// Note: In a real implementation, we'd need to bundle these functions
// For now, we'll implement simplified versions directly in the worker

// Simplified projection calculation for the worker
function generateProjectionData(goal: Goal, _currentNetWorth: number): ProjectionDataPoint[] {
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
      case 'scenario-analysis': {
        const payload = message.data as FinancialWorkerRequestPayloadMap['scenario-analysis'];
        response.result = runScenarioAnalysis(payload.goal, payload.currentNetWorth, payload.scenarios);
        break;
      }
      
      case 'projection-data': {
        const payload = message.data as FinancialWorkerRequestPayloadMap['projection-data'];
        response.result = generateProjectionData(payload.goal, payload.currentNetWorth);
        break;
      }
      
      default:
        response.error = `Unknown message type: ${message.type}`;
    }
  } catch (error) {
    response.error = error instanceof Error ? error.message : 'Unknown error';
  }

  self.postMessage(response);
};



export {}; // Make this a module