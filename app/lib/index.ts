export * from './animations';
export * from './constants';
export * from './dataSampling';
export * from './demoData';
export * from './formatters';
export * from './goalCalculations';
export * from './holdingsCalculations';
export * from './hooks';
export * from './pdfExport';
export {
  generateProjectionData,
  calculateActualContributionsByMonth,
  calculateCumulativeActualContributions,
  mergeProjectedWithActual,
  calculateCumulativeContributions,
  calculateActualPortfolioValues,
  runScenarioAnalysis,
  getDefaultScenarios,
  calculateRiskMetrics,
  getRiskRating,
  formatRiskMetrics,
  analyzeSeasonalPatterns,
  calculateYearOverYearProgress,
  generatePerformanceHeatmap,
  performTimeBasedAnalysis,
} from './projectionCalculations';
export type * from './types';
