import { Goal, ProjectionDataPoint, InvestmentScenario, ScenarioAnalysisResult } from '../types';
import { generateProjectionData } from './baseProjection';

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
 * Generate projection data for a specific scenario.
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
 * Run scenario analysis with multiple return scenarios.
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
    baseScenario: result.base || [],
    optimisticScenario: result.optimistic || [],
    pessimisticScenario: result.pessimistic || [],
    scenarios: result,
  };
}

/**
 * Get default scenarios for scenario analysis.
 */
export function getDefaultScenarios(): InvestmentScenario[] {
  return [...DEFAULT_SCENARIOS];
}
