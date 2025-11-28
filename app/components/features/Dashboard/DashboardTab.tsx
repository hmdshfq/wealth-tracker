'use client';
import React from 'react';
import { StatCard } from '@/app/components/ui';
import { AllocationChart } from './AllocationChart';
import { GoalProgress } from './GoalProgress';
import { LivePrices } from './LivePrices';
import { formatPLN, formatPercent } from '@/app/lib/formatters';
import { Goal, AllocationItem, CashBalance } from '@/app/lib/types';
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
          <LivePrices prices={prices} />
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;
