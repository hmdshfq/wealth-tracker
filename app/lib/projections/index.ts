export {
  generateProjectionData,
  calculateActualContributionsByMonth,
  calculateCumulativeActualContributions,
  mergeProjectedWithActual,
  calculateCumulativeContributions,
  calculateActualPortfolioValues,
} from './baseProjection';
export type { ExtendedProjectionDataPoint, ActualPortfolioDataPoint } from './baseProjection';

export { runScenarioAnalysis, getDefaultScenarios } from './scenarioAnalysis';

export { calculateRiskMetrics, getRiskRating, formatRiskMetrics } from './riskMetrics';

export {
  analyzeSeasonalPatterns,
  calculateYearOverYearProgress,
  generatePerformanceHeatmap,
  performTimeBasedAnalysis,
} from './timeAnalysis';
