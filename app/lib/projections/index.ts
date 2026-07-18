export {
  generateProjectionData,
  calculateActualContributionsByMonth,
  calculateCumulativeActualContributions,
  mergeProjectedWithActual,
  calculateCumulativeContributions,
  calculateActualPortfolioValues,
} from './baseProjection';
export type { ExtendedProjectionDataPoint, ActualPortfolioDataPoint } from './baseProjection';

export { runScenarioAnalysis } from './scenarioAnalysis';