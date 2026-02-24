import { ProjectionDataPoint, RiskMetrics, RiskAnalysisResult } from '../types';

/**
 * Calculate monthly returns from projection data.
 */
function calculateMonthlyReturns(projectionData: ProjectionDataPoint[]): number[] {
  if (projectionData.length <= 1) return [];

  const returns: number[] = [];

  for (let i = 1; i < projectionData.length; i++) {
    const prevValue = projectionData[i - 1].value;
    const currValue = projectionData[i].value;
    const prevContrib = projectionData[i - 1].cumulativeContributions;
    const currContrib = projectionData[i].cumulativeContributions;

    // Calculate return excluding new contributions
    const investmentValue = prevValue - prevContrib;
    const newInvestmentValue = currValue - currContrib;

    if (investmentValue > 0) {
      const monthlyReturn = (newInvestmentValue - investmentValue) / investmentValue;
      returns.push(monthlyReturn);
    } else {
      returns.push(0);
    }
  }

  return returns;
}

/**
 * Calculate Sharpe Ratio (risk-adjusted return).
 */
function calculateSharpeRatio(returns: number[], riskFreeRate: number = 0.02): number {
  if (returns.length === 0) return 0;

  const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const excessReturn = meanReturn - riskFreeRate / 12; // Convert annual to monthly

  // Calculate standard deviation
  const squaredDiffs = returns.map((r) => Math.pow(r - meanReturn, 2));
  const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / returns.length;
  const stdDev = Math.sqrt(variance);

  return stdDev > 0 ? excessReturn / stdDev : 0;
}

/**
 * Calculate Sortino Ratio (downside risk focus).
 */
function calculateSortinoRatio(returns: number[], riskFreeRate: number = 0.02): number {
  if (returns.length === 0) return 0;

  const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const excessReturn = meanReturn - riskFreeRate / 12;

  // Calculate downside deviation (only negative returns)
  const negativeReturns = returns.filter((r) => r < 0);
  if (negativeReturns.length === 0) return 0;

  const squaredDownsideDiffs = negativeReturns.map((r) => Math.pow(r - meanReturn, 2));
  const downsideVariance =
    squaredDownsideDiffs.reduce((sum, diff) => sum + diff, 0) / returns.length;
  const downsideDeviation = Math.sqrt(downsideVariance);

  return downsideDeviation > 0 ? excessReturn / downsideDeviation : 0;
}

/**
 * Calculate Maximum Drawdown.
 */
function calculateMaxDrawdown(projectionData: ProjectionDataPoint[]): {
  maxDrawdown: number;
  drawdownPeriods: {
    startDate: string;
    endDate: string;
    drawdownPercent: number;
    recoveryDate?: string;
  }[];
} {
  if (projectionData.length === 0) return { maxDrawdown: 0, drawdownPeriods: [] };

  let maxDrawdown = 0;
  let peakValue = projectionData[0].value;
  let currentDrawdown = 0;
  let drawdownStartDate = projectionData[0].date;

  const drawdownPeriods: {
    startDate: string;
    endDate: string;
    drawdownPercent: number;
    recoveryDate?: string;
  }[] = [];

  for (let i = 1; i < projectionData.length; i++) {
    const currentValue = projectionData[i].value;

    // Update peak value
    if (currentValue > peakValue) {
      peakValue = currentValue;
      drawdownStartDate = projectionData[i].date;
      currentDrawdown = 0;
    } else {
      // Calculate current drawdown from peak
      currentDrawdown = (peakValue - currentValue) / peakValue;

      // Update max drawdown
      if (currentDrawdown > maxDrawdown) {
        maxDrawdown = currentDrawdown;
      }
    }

    // Check if drawdown has ended (recovered to peak)
    if (currentDrawdown > 0.01 && currentValue >= peakValue * 0.99) {
      // Drawdown period ended
      drawdownPeriods.push({
        startDate: drawdownStartDate,
        endDate: projectionData[i].date,
        drawdownPercent: currentDrawdown,
        recoveryDate: projectionData[i].date,
      });

      // Reset for next potential drawdown
      peakValue = currentValue;
      drawdownStartDate = projectionData[i].date;
      currentDrawdown = 0;
    }
  }

  // Check if we're still in a drawdown at the end
  if (currentDrawdown > 0.01) {
    drawdownPeriods.push({
      startDate: drawdownStartDate,
      endDate: projectionData[projectionData.length - 1].date,
      drawdownPercent: currentDrawdown,
    });
  }

  return { maxDrawdown, drawdownPeriods };
}

/**
 * Calculate rolling returns (1-year, 3-year, 5-year).
 */
function calculateRollingReturns(projectionData: ProjectionDataPoint[]): Record<string, number> {
  const rollingReturns: Record<string, number> = {};

  // 1-year rolling returns (12 months)
  for (let i = 12; i < projectionData.length; i++) {
    const startValue = projectionData[i - 12].value;
    const endValue = projectionData[i].value;
    const startContrib = projectionData[i - 12].cumulativeContributions;
    const endContrib = projectionData[i].cumulativeContributions;

    const investmentReturn = endValue - endContrib - (startValue - startContrib);
    const investmentBase = startValue - startContrib;

    if (investmentBase > 0) {
      const annualReturn = investmentReturn / investmentBase;
      rollingReturns[`1y_${projectionData[i].date}`] = annualReturn;
    }
  }

  // 3-year rolling returns (36 months)
  for (let i = 36; i < projectionData.length; i++) {
    const startValue = projectionData[i - 36].value;
    const endValue = projectionData[i].value;
    const startContrib = projectionData[i - 36].cumulativeContributions;
    const endContrib = projectionData[i].cumulativeContributions;

    const investmentReturn = endValue - endContrib - (startValue - startContrib);
    const investmentBase = startValue - startContrib;

    if (investmentBase > 0) {
      const threeYearReturn = Math.pow(investmentReturn / investmentBase + 1, 1 / 3) - 1;
      rollingReturns[`3y_${projectionData[i].date}`] = threeYearReturn;
    }
  }

  // 5-year rolling returns (60 months)
  for (let i = 60; i < projectionData.length; i++) {
    const startValue = projectionData[i - 60].value;
    const endValue = projectionData[i].value;
    const startContrib = projectionData[i - 60].cumulativeContributions;
    const endContrib = projectionData[i].cumulativeContributions;

    const investmentReturn = endValue - endContrib - (startValue - startContrib);
    const investmentBase = startValue - startContrib;

    if (investmentBase > 0) {
      const fiveYearReturn = Math.pow(investmentReturn / investmentBase + 1, 1 / 5) - 1;
      rollingReturns[`5y_${projectionData[i].date}`] = fiveYearReturn;
    }
  }

  return rollingReturns;
}

/**
 * Calculate Value at Risk (VaR) at confidence level.
 */
function calculateValueAtRisk(
  projectionData: ProjectionDataPoint[],
  confidenceLevel: number = 0.95
): number {
  if (projectionData.length <= 1) return 0;

  const returns = calculateMonthlyReturns(projectionData);
  returns.sort((a, b) => a - b);

  const varIndex = Math.floor(returns.length * (1 - confidenceLevel));
  const varReturn = returns[varIndex];

  const currentValue = projectionData[projectionData.length - 1].value;
  return currentValue * varReturn;
}

/**
 * Calculate Conditional Value at Risk (CVaR).
 */
function calculateConditionalValueAtRisk(
  projectionData: ProjectionDataPoint[],
  confidenceLevel: number = 0.95
): number {
  if (projectionData.length <= 1) return 0;

  const returns = calculateMonthlyReturns(projectionData);
  returns.sort((a, b) => a - b);

  const varIndex = Math.floor(returns.length * (1 - confidenceLevel));
  const worstReturns = returns.slice(0, varIndex);

  if (worstReturns.length === 0) return 0;

  const avgWorstReturn = worstReturns.reduce((sum, r) => sum + r, 0) / worstReturns.length;
  const currentValue = projectionData[projectionData.length - 1].value;

  return currentValue * avgWorstReturn;
}

/**
 * Calculate overall volatility (standard deviation of returns).
 */
function calculateVolatility(projectionData: ProjectionDataPoint[]): number {
  const returns = calculateMonthlyReturns(projectionData);

  if (returns.length === 0) return 0;

  const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const squaredDiffs = returns.map((r) => Math.pow(r - meanReturn, 2));
  const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / returns.length;

  return Math.sqrt(variance);
}

/**
 * Calculate risk-adjusted projections by applying risk metrics.
 */
function calculateRiskAdjustedProjections(
  projectionData: ProjectionDataPoint[],
  riskMetrics: RiskMetrics
): ProjectionDataPoint[] {
  return projectionData.map((point) => {
    // Apply risk adjustment based on volatility and drawdown
    const riskAdjustmentFactor = 1 - riskMetrics.volatility * 0.5;

    return {
      ...point,
      value: Math.round(point.value * riskAdjustmentFactor),
      monthlyReturn: Math.round(point.monthlyReturn * riskAdjustmentFactor),
      cumulativeReturns: Math.round(point.cumulativeReturns * riskAdjustmentFactor),
    };
  });
}

/**
 * Perform comprehensive risk analysis on projection data.
 */
export function calculateRiskMetrics(
  projectionData: ProjectionDataPoint[],
  riskFreeRate: number = 0.02
): RiskAnalysisResult {
  if (projectionData.length === 0) {
    return {
      metrics: {
        sharpeRatio: 0,
        sortinoRatio: 0,
        maxDrawdown: 0,
        volatility: 0,
        rollingReturns: {},
        valueAtRisk: 0,
        conditionalValueAtRisk: 0,
      },
      riskAdjustedProjections: [],
      drawdownPeriods: [],
    };
  }

  // Calculate monthly returns
  const monthlyReturns = calculateMonthlyReturns(projectionData);

  // Calculate risk metrics
  const sharpeRatio = calculateSharpeRatio(monthlyReturns, riskFreeRate);
  const sortinoRatio = calculateSortinoRatio(monthlyReturns, riskFreeRate);
  const { maxDrawdown, drawdownPeriods } = calculateMaxDrawdown(projectionData);
  const volatility = calculateVolatility(projectionData);
  const rollingReturns = calculateRollingReturns(projectionData);
  const valueAtRisk = calculateValueAtRisk(projectionData);
  const conditionalValueAtRisk = calculateConditionalValueAtRisk(projectionData);

  const metrics: RiskMetrics = {
    sharpeRatio,
    sortinoRatio,
    maxDrawdown,
    volatility,
    rollingReturns,
    valueAtRisk,
    conditionalValueAtRisk,
  };

  // Calculate risk-adjusted projections
  const riskAdjustedProjections = calculateRiskAdjustedProjections(projectionData, metrics);

  return {
    metrics,
    riskAdjustedProjections,
    drawdownPeriods,
  };
}

/**
 * Get risk rating based on metrics.
 */
export function getRiskRating(riskMetrics: RiskMetrics): {
  rating: 'Low' | 'Medium' | 'High' | 'Very High';
  description: string;
  color: string;
} {
  const volatilityScore = riskMetrics.volatility * 100; // Convert to percentage
  const drawdownScore = riskMetrics.maxDrawdown * 100;
  const sharpeScore = riskMetrics.sharpeRatio;

  // Calculate composite risk score
  const riskScore =
    volatilityScore * 0.4 + drawdownScore * 0.4 + (5 - Math.min(sharpeScore, 5)) * 20;

  if (riskScore < 30) {
    return {
      rating: 'Low',
      description: 'Low risk profile with stable returns and minimal drawdowns',
      color: '#10b981',
    };
  }
  if (riskScore < 60) {
    return {
      rating: 'Medium',
      description: 'Moderate risk profile with balanced returns and drawdowns',
      color: '#f59e0b',
    };
  }
  if (riskScore < 80) {
    return {
      rating: 'High',
      description: 'High risk profile with significant volatility and potential drawdowns',
      color: '#ef4444',
    };
  }
  return {
    rating: 'Very High',
    description: 'Very high risk profile with extreme volatility and large potential drawdowns',
    color: '#dc2626',
  };
}

/**
 * Format risk metrics for display.
 */
export function formatRiskMetrics(riskMetrics: RiskMetrics): Record<string, string> {
  return {
    sharpeRatio: riskMetrics.sharpeRatio.toFixed(2),
    sortinoRatio: riskMetrics.sortinoRatio.toFixed(2),
    maxDrawdown: `${(riskMetrics.maxDrawdown * 100).toFixed(1)}%`,
    volatility: `${(riskMetrics.volatility * 100).toFixed(1)}%`,
    valueAtRisk: riskMetrics.valueAtRisk.toFixed(0),
    conditionalValueAtRisk: riskMetrics.conditionalValueAtRisk.toFixed(0),
  };
}
