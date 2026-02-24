import { ProjectionDataPoint, SeasonalPattern, YoYComparison, TimeBasedAnalysisResult } from '../types';

/**
 * Analyze seasonal patterns in projection data.
 */
export function analyzeSeasonalPatterns(projectionData: ProjectionDataPoint[]): SeasonalPattern[] {
  if (projectionData.length === 0) return [];

  // Group data by month across all years
  const monthlyData: Record<number, { returns: number[]; years: number[] }> = {};

  // Initialize all months
  for (let month = 1; month <= 12; month++) {
    monthlyData[month] = { returns: [], years: [] };
  }

  // Calculate monthly returns (excluding contributions)
  for (let i = 1; i < projectionData.length; i++) {
    const prevPoint = projectionData[i - 1];
    const currPoint = projectionData[i];

    if (prevPoint.month !== currPoint.month) continue; // Same month, different year

    const investmentValue = prevPoint.value - prevPoint.cumulativeContributions;
    const newInvestmentValue = currPoint.value - currPoint.cumulativeContributions;

    if (investmentValue > 0) {
      const monthlyReturn = (newInvestmentValue - investmentValue) / investmentValue;
      monthlyData[currPoint.month].returns.push(monthlyReturn);
      monthlyData[currPoint.month].years.push(currPoint.year);
    }
  }

  // Calculate patterns for each month
  const patterns: SeasonalPattern[] = [];

  for (let month = 1; month <= 12; month++) {
    const data = monthlyData[month];

    if (data.returns.length === 0) continue;

    // Calculate average return
    const averageReturn = data.returns.reduce((sum, r) => sum + r, 0) / data.returns.length;

    // Find best and worst years
    let bestYear = data.years[0];
    let worstYear = data.years[0];
    let bestReturn = data.returns[0];
    let worstReturn = data.returns[0];

    data.returns.forEach((returnVal, index) => {
      if (returnVal > bestReturn) {
        bestReturn = returnVal;
        bestYear = data.years[index];
      }
      if (returnVal < worstReturn) {
        worstReturn = returnVal;
        worstYear = data.years[index];
      }
    });

    // Calculate pattern strength (consistency across years)
    const patternStrength = calculatePatternStrength(data.returns);

    patterns.push({
      month,
      averageReturn,
      bestYear,
      worstYear,
      patternStrength,
    });
  }

  return patterns.sort((a, b) => b.averageReturn - a.averageReturn);
}

/**
 * Calculate pattern strength based on consistency of returns.
 */
function calculatePatternStrength(returns: number[]): number {
  if (returns.length <= 1) return 0;

  const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);

  // Higher strength when returns are consistently positive/negative and low variance
  const consistency =
    returns.filter((r) => (r > 0 && meanReturn > 0) || (r < 0 && meanReturn < 0)).length /
    returns.length;
  const volatilityFactor = 1 - Math.min(1, stdDev * 10); // Normalize stdDev

  return Math.min(1, consistency * 0.7 + volatilityFactor * 0.3);
}

/**
 * Calculate year-over-year comparisons.
 */
export function calculateYearOverYearProgress(projectionData: ProjectionDataPoint[]): YoYComparison[] {
  if (projectionData.length === 0) return [];

  const comparisons: YoYComparison[] = [];
  const years = new Set(projectionData.map((point) => point.year));

  years.forEach((year) => {
    const yearData = projectionData.filter((point) => point.year === year);

    if (yearData.length === 0) return;

    const startPoint = yearData[0];
    const endPoint = yearData[yearData.length - 1];

    const startValue = startPoint.value;
    const endValue = endPoint.value;
    const annualContributions = endPoint.cumulativeContributions - startPoint.cumulativeContributions;

    // Calculate annual return (excluding new contributions)
    const investmentStartValue = startValue - startPoint.cumulativeContributions;
    const investmentEndValue = endValue - endPoint.cumulativeContributions;

    const annualReturn =
      investmentStartValue > 0 ? (investmentEndValue - investmentStartValue) / investmentStartValue : 0;

    const annualGrowth = endValue - startValue;

    comparisons.push({
      year,
      startValue,
      endValue,
      annualReturn,
      annualContributions,
      annualGrowth,
    });
  });

  return comparisons.sort((a, b) => a.year - b.year);
}

/**
 * Generate performance heatmap for visualization.
 */
export function generatePerformanceHeatmap(projectionData: ProjectionDataPoint[]): Record<string, number> {
  const heatmap: Record<string, number> = {};

  for (let i = 1; i < projectionData.length; i++) {
    const prevPoint = projectionData[i - 1];
    const currPoint = projectionData[i];

    const investmentValue = prevPoint.value - prevPoint.cumulativeContributions;
    const newInvestmentValue = currPoint.value - currPoint.cumulativeContributions;

    if (investmentValue > 0) {
      const monthlyReturn = (newInvestmentValue - investmentValue) / investmentValue;
      const monthKey = `${currPoint.year}-${String(currPoint.month).padStart(2, '0')}`;
      heatmap[monthKey] = monthlyReturn * 100; // Convert to percentage
    }
  }

  return heatmap;
}

/**
 * Perform comprehensive time-based analysis.
 */
export function performTimeBasedAnalysis(projectionData: ProjectionDataPoint[]): TimeBasedAnalysisResult {
  if (projectionData.length === 0) {
    return {
      seasonalPatterns: [],
      yearOverYearComparisons: [],
      bestMonths: [],
      worstMonths: [],
      performanceHeatmap: {},
    };
  }

  const seasonalPatterns = analyzeSeasonalPatterns(projectionData);
  const yearOverYearComparisons = calculateYearOverYearProgress(projectionData);
  const performanceHeatmap = generatePerformanceHeatmap(projectionData);

  // Identify best and worst months
  const bestMonths = [...seasonalPatterns].sort((a, b) => b.averageReturn - a.averageReturn).slice(0, 3);

  const worstMonths = [...seasonalPatterns].sort((a, b) => a.averageReturn - b.averageReturn).slice(0, 3);

  return {
    seasonalPatterns,
    yearOverYearComparisons,
    bestMonths,
    worstMonths,
    performanceHeatmap,
  };
}
