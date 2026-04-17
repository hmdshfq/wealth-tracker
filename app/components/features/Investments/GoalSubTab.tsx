'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChartLoadingSkeleton } from '@/components/ui';
import { useIdleRender } from '@/lib/hooks';
import { InvestmentGoalChart } from '../Goal';
import { staggerContainerVariants, slideFromBottomVariants, transitions } from '@/lib/animations';
import { Transaction, Goal, PreferredCurrency, TimeBasedAnalysisResult } from '@/lib/types';
import {
  generateProjectionData,
  mergeProjectedWithActual,
  calculateCumulativeContributions,
  calculateActualPortfolioValues,
  performTimeBasedAnalysis,
} from '@/lib/projectionCalculations';

function useWindowWidth() {
  const [width, setWidth] = useState<number | undefined>(typeof window !== 'undefined' ? window.innerWidth : undefined);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return width;
}

interface GoalSubTabProps {
  goal: Goal;
  transactions: Transaction[];
  totalNetWorth: number;
  goalProgress: number;
  portfolioValue: number;
  exchangeRates: {
    EUR_PLN: number;
    USD_PLN: number;
  };
  preferredCurrency: PreferredCurrency;
  enableTimeAnalysis: boolean;
  enableScenarioAnalysis: boolean;
  enableWhatIfScenarios: boolean;
  enableBenchmarkComparison: boolean;
}

export const GoalSubTab: React.FC<GoalSubTabProps> = ({
  goal,
  transactions,
  totalNetWorth,
  goalProgress,
  portfolioValue,
  exchangeRates,
  preferredCurrency,
  enableTimeAnalysis,
  enableScenarioAnalysis,
  enableWhatIfScenarios,
  enableBenchmarkComparison,
}) => {
  // Defer chart rendering until browser is idle
  const chartReady = useIdleRender({
    timeout: 3000,
    immediate: true,
  });

  // Get window width for responsive behavior
  const windowWidth = useWindowWidth();
  const isMobile = windowWidth !== undefined && windowWidth < 768;

  // Generate projection data for the chart
  const projectionData = useMemo(() => {
    return generateProjectionData(goal, totalNetWorth);
  }, [goal, totalNetWorth]);

  // Calculate total actual contributions from transactions
  const totalActualContributions = useMemo(() => {
    return calculateCumulativeContributions(transactions, exchangeRates);
  }, [transactions, exchangeRates]);

  // Find earliest transaction date
  const firstTransactionDate = useMemo(() => {
    if (transactions.length === 0) return undefined;
    return transactions.reduce((min, t) => (t.date < min ? t.date : min), transactions[0].date);
  }, [transactions]);

  // Calculate actual portfolio values from transactions for time-based analysis
  const actualPortfolioData = useMemo(() => {
    if (transactions.length === 0) return [];
    return calculateActualPortfolioValues(
      transactions,
      exchangeRates,
      portfolioValue,
      goal.annualReturn
    );
  }, [transactions, exchangeRates, portfolioValue, goal.annualReturn]);

  // Run time-based analysis on actual portfolio data (disabled on mobile and feature flag)
  const timeBasedAnalysisResult = useMemo((): TimeBasedAnalysisResult | undefined => {
    if (!enableTimeAnalysis || isMobile || actualPortfolioData.length === 0) return undefined;
    
    const projectionDataForAnalysis = actualPortfolioData.map((point) => ({
      year: point.year,
      month: point.month,
      date: point.date,
      value: point.portfolioValue,
      goal: goal.amount,
      monthlyContribution: point.contributions,
      cumulativeContributions: point.cumulativeContributions,
      monthlyReturn: 0,
      cumulativeReturns: point.portfolioValue - point.cumulativeContributions,
      principalValue: point.cumulativeContributions,
    }));

    return performTimeBasedAnalysis(projectionDataForAnalysis);
  }, [enableTimeAnalysis, isMobile, actualPortfolioData, goal.amount]);

  // Merge projected data with actual transaction history
  const chartData = useMemo(() => {
    return mergeProjectedWithActual(
      projectionData,
      transactions,
      exchangeRates,
      portfolioValue
    );
  }, [projectionData, transactions, exchangeRates, portfolioValue]);

  return (
    <motion.div
      style={{ display: 'grid', gap: '24px' }}
      variants={staggerContainerVariants}
      initial="initial"
      animate="animate"
    >
      {/* Investment Goal Progress Chart */}
      {chartData.length > 0 && (
        <motion.div
          variants={slideFromBottomVariants}
          transition={transitions.fast}
        >
          {chartReady ? (
            <InvestmentGoalChart
              goal={goal}
              projectionData={chartData}
              currentNetWorth={portfolioValue}
              totalActualContributions={totalActualContributions}
              firstTransactionDate={firstTransactionDate}
              preferredCurrency={preferredCurrency}
              timeBasedAnalysisResult={timeBasedAnalysisResult}
              showTimeBasedAnalysis={!isMobile && enableTimeAnalysis}
              enableScenarioAnalysis={enableScenarioAnalysis}
              enableTimeBasedAnalysis={enableTimeAnalysis}
              enableWhatIfScenarios={enableWhatIfScenarios}
              enableBenchmarkComparison={enableBenchmarkComparison}
            />
          ) : (
            <ChartLoadingSkeleton />
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default GoalSubTab;
