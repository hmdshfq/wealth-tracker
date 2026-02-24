export {
  generateProjectionData,
  calculateActualContributionsByMonth,
  calculateCumulativeActualContributions,
  mergeProjectedWithActual,
  calculateCumulativeContributions,
} from './baseProjection';
export type { ExtendedProjectionDataPoint } from './baseProjection';

export { runMonteCarloSimulation } from './monteCarlo';

export { runScenarioAnalysis, getDefaultScenarios } from './scenarioAnalysis';

export { calculateRiskMetrics, getRiskRating, formatRiskMetrics } from './riskMetrics';

export {
  analyzeSeasonalPatterns,
  calculateYearOverYearProgress,
  generatePerformanceHeatmap,
  performTimeBasedAnalysis,
} from './timeAnalysis';
