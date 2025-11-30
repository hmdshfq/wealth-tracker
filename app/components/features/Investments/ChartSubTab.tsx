'use client';

import React, { useMemo } from 'react';
import { ChartLoadingSkeleton } from '@/app/components/ui';
import { useIdleRender } from '@/app/lib/hooks';
import { GoalProgressCard, InvestmentGoalChart } from '../Goal';
import { Transaction, Goal } from '@/app/lib/types';
import {
  generateProjectionData,
  mergeProjectedWithActual,
  calculateCumulativeContributions,
} from '@/app/lib/projectionCalculations';

interface ChartSubTabProps {
  goal: Goal;
  transactions: Transaction[];
  totalNetWorth: number;
  goalProgress: number;
  portfolioValue: number;
  exchangeRates: {
    EUR_PLN: number;
    USD_PLN: number;
  };
}

export const ChartSubTab: React.FC<ChartSubTabProps> = ({
  goal,
  transactions,
  totalNetWorth,
  goalProgress,
  portfolioValue,
  exchangeRates,
}) => {
  // Defer chart rendering until browser is idle
  const chartReady = useIdleRender({
    timeout: 3000,
    immediate: true,
  });

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
    <>
      {/* Progress Card */}
      <GoalProgressCard
        goal={goal}
        totalNetWorth={totalNetWorth}
        goalProgress={goalProgress}
      />

      {/* Investment Goal Progress Chart */}
      {chartData.length > 0 &&
        (chartReady ? (
          <InvestmentGoalChart
            goal={goal}
            projectionData={chartData}
            currentNetWorth={portfolioValue}
            totalActualContributions={totalActualContributions}
            firstTransactionDate={firstTransactionDate}
          />
        ) : (
          <ChartLoadingSkeleton />
        ))}
    </>
  );
};
