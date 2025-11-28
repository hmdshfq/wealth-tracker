'use client';
import React, { useMemo } from 'react';
import { StatCard } from '@/app/components/ui';
import { AllocationChart } from './AllocationChart';
import { GoalProgress } from './GoalProgress';
import { GoalChartMini } from './GoalChartMini';
import { LivePrices } from './LivePrices';
import { formatPLN, formatPercent } from '@/app/lib/formatters';
import { Goal, AllocationItem, CashBalance, Transaction, TickerInfo } from '@/app/lib/types';
import { 
  generateProjectionData, 
  mergeProjectedWithActual,
} from '@/app/lib/projectionCalculations';
import styles from './Dashboard.module.css';

interface DashboardTabProps {
  portfolioValue: number;
  totalGain: number;
  totalGainPercent: number;
  totalCashPLN: number;
  cash: CashBalance[];
  totalNetWorth: number;
  goal: Goal;
  goalProgress: number;
  allocationData: AllocationItem[];
  prices: Record<string, number>;
  etfData?: Record<string, TickerInfo>;
  transactions?: Transaction[];
  exchangeRates?: {
    EUR_PLN: number;
    USD_PLN: number;
  };
  onNavigateToGoal?: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  portfolioValue,
  totalGain,
  totalGainPercent,
  totalCashPLN,
  cash,
  totalNetWorth,
  goal,
  goalProgress,
  allocationData,
  prices,
  etfData = {},
  transactions = [],
  exchangeRates = { EUR_PLN: 4.3, USD_PLN: 4.0 },
  onNavigateToGoal,
}) => {
  const cashFooter = (
    <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#94a3b8' }}>
      {cash.map((c) => (
        <span key={c.currency}>
          {c.currency}: {c.amount.toLocaleString()}
        </span>
      ))}
    </div>
  );

  // Generate projection data for the mini chart
  const projectionData = useMemo(() => {
    return generateProjectionData(goal, totalNetWorth);
  }, [goal, totalNetWorth]);

  // Merge projected data with actual transaction history
  const chartData = useMemo(() => {
    return mergeProjectedWithActual(
      projectionData,
      transactions,
      exchangeRates,
      totalNetWorth
    );
  }, [projectionData, transactions, exchangeRates, totalNetWorth]);

  return (
    <div className={styles.dashboardContainer}>
      {/* Top Stats Row */}
      <div className={styles.statsGrid}>
        <StatCard
          label="Portfolio Value"
          value={formatPLN(portfolioValue)}
          subValue={`${formatPLN(totalGain)} (${formatPercent(totalGainPercent)})`}
          subValueColor={totalGain >= 0 ? 'positive' : 'negative'}
        />
        <StatCard
          label="Total Cash"
          value={formatPLN(totalCashPLN)}
          footer={cashFooter}
        />
        <StatCard
          label="Net Worth"
          value={formatPLN(totalNetWorth)}
          subValue="Portfolio + Cash"
          subValueColor="muted"
        />
      </div>

      {/* Investment Goal Mini Chart */}
      {chartData.length > 0 && (
        <GoalChartMini
          goal={goal}
          projectionData={chartData}
          currentNetWorth={totalNetWorth}
          goalProgress={goalProgress}
          onClick={onNavigateToGoal}
        />
      )}

      {/* Main Content: 2-column layout on large screens */}
      <div className={styles.mainContent}>
        {/* Left Column: Goal Progress + Allocation */}
        <div className={styles.leftColumn}>
          <GoalProgress
            goal={goal}
            currentValue={totalNetWorth}
            progress={goalProgress}
          />
          <AllocationChart data={allocationData} />
        </div>

        {/* Right Column: Live ETF Prices */}
        <div className={styles.rightColumn}>
          <LivePrices prices={prices} etfData={etfData} />
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;
