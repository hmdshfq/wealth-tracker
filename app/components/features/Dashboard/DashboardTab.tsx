'use client';
import React from 'react';
import { motion } from 'motion/react';
import { StatCard, ChartLoadingSkeleton } from '@/app/components/ui';
import { useIdleRender } from '@/app/lib/hooks';
import { staggerContainerVariants, fadeVariants, slideFromBottomVariants, transitions } from '@/app/lib/animations';
import { AllocationChart } from './AllocationChart';
import { LivePrices } from './LivePrices';
import { GoalProgressCard } from '../Goal';
import { formatPLN, formatPercent, convertCurrency, formatCurrency } from '@/app/lib/formatters';
import { AllocationItem, CashBalance, TickerInfo, Goal, PreferredCurrency } from '@/app/lib/types';
import styles from './Dashboard.module.css';

interface DashboardTabProps {
  portfolioValue: number;
  totalGain: number;
  totalGainPercent: number;
  totalCashPLN: number;
  cash: CashBalance[];
  totalNetWorth: number;
  allocationData: AllocationItem[];
  prices: Record<string, {
    price: number;
    change: number;
    changePercent: number;
    currency: string;
  }>;
  etfData?: Record<string, TickerInfo>;
  goal?: Goal;
  goalProgress?: number;
  preferredCurrency?: PreferredCurrency;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  portfolioValue,
  totalGain,
  totalGainPercent,
  totalCashPLN,
  cash,
  totalNetWorth,
  allocationData,
  prices,
  etfData = {},
  goal,
  goalProgress,
  preferredCurrency = 'PLN',
}) => {
  // Defer chart rendering until browser is idle
  const chartsReady = useIdleRender({ timeout: 2000 });

  // Convert values to preferred currency
  const displayPortfolioValue = convertCurrency(portfolioValue, preferredCurrency);
  const displayTotalCash = convertCurrency(totalCashPLN, preferredCurrency);
  const displayTotalGain = convertCurrency(totalGain, preferredCurrency);
  const displayNetWorth = convertCurrency(totalNetWorth, preferredCurrency);

  // Format values in preferred currency
  const formatValue = (val: number) => formatCurrency(val, preferredCurrency);

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
    <motion.div 
      className={styles.dashboardContainer}
      variants={staggerContainerVariants}
      initial="initial"
      animate="animate"
    >
      {/* Top Stats Row */}
      <motion.div
        className={styles.statsGrid}
        variants={staggerContainerVariants}
        initial="initial"
        animate="animate"
      >
        <motion.div
          variants={fadeVariants}
          transition={transitions.fast}
        >
          <StatCard
            label="Portfolio Value"
            value={formatValue(displayPortfolioValue)}
            subValue={`${formatValue(displayTotalGain)} (${formatPercent(totalGainPercent)})`}
            subValueColor={totalGain >= 0 ? 'positive' : 'negative'}
          />
        </motion.div>
        <motion.div
          variants={fadeVariants}
          transition={transitions.fast}
        >
          <StatCard
            label="Total Cash"
            value={formatValue(displayTotalCash)}
            footer={cashFooter}
          />
        </motion.div>
        <motion.div
          variants={fadeVariants}
          transition={transitions.fast}
        >
          <StatCard
            label="Net Worth"
            value={formatValue(displayNetWorth)}
            subValue="Portfolio + Cash"
            subValueColor="muted"
          />
        </motion.div>
      </motion.div>

      {/* Goal Progress Card - only show if goal is defined */}
      {goal && goalProgress !== undefined && (
        <motion.div
          variants={fadeVariants}
          transition={transitions.fast}
          style={{ gridColumn: '1 / -1' }} // Span full width
        >
          <GoalProgressCard
            goal={goal}
            totalNetWorth={totalNetWorth}
            goalProgress={goalProgress}
          />
        </motion.div>
      )}



      {/* Main Content: 2-column layout on large screens */}
      <motion.div 
        className={styles.mainContent}
        variants={staggerContainerVariants}
        initial="initial"
        animate="animate"
      >
        {/* Left Column: Allocation */}
        <motion.div 
          className={styles.leftColumn}
          variants={slideFromBottomVariants}
          transition={transitions.fast}
        >
          {chartsReady ? (
            <AllocationChart data={allocationData} />
          ) : (
            <ChartLoadingSkeleton />
          )}
        </motion.div>

        {/* Right Column: Live ETF Prices */}
        <motion.div 
          className={styles.rightColumn}
          variants={slideFromBottomVariants}
          transition={transitions.fast}
        >
          <LivePrices prices={prices} etfData={etfData} />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default DashboardTab;
