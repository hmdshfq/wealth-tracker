'use client';
import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { StatCard, ChartLoadingSkeleton } from '@/app/components/ui';
import { useIdleRender } from '@/app/lib/hooks';
import { staggerContainerVariants, fadeVariants, slideFromBottomVariants, transitions } from '@/app/lib/animations';
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
  prices: Record<string, {
  price: number;
  change: number;
  changePercent: number;
  currency: string;
}>;
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
  // Defer chart rendering until browser is idle
  const chartsReady = useIdleRender({ timeout: 2000 });

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
          transition={transitions.normal}
        >
          <StatCard
            label="Portfolio Value"
            value={formatPLN(portfolioValue)}
            subValue={`${formatPLN(totalGain)} (${formatPercent(totalGainPercent)})`}
            subValueColor={totalGain >= 0 ? 'positive' : 'negative'}
          />
        </motion.div>
        <motion.div
          variants={fadeVariants}
          transition={transitions.normal}
        >
          <StatCard
            label="Total Cash"
            value={formatPLN(totalCashPLN)}
            footer={cashFooter}
          />
        </motion.div>
        <motion.div
          variants={fadeVariants}
          transition={transitions.normal}
        >
          <StatCard
            label="Net Worth"
            value={formatPLN(totalNetWorth)}
            subValue="Portfolio + Cash"
            subValueColor="muted"
          />
        </motion.div>
      </motion.div>

      {/* Investment Goal Mini Chart */}
      {chartData.length > 0 && (
        <motion.div
          variants={slideFromBottomVariants}
          transition={transitions.normal}
        >
          {chartsReady ? (
            <GoalChartMini
              goal={goal}
              projectionData={chartData}
              currentNetWorth={totalNetWorth}
              goalProgress={goalProgress}
              onClick={onNavigateToGoal}
            />
          ) : (
            <ChartLoadingSkeleton />
          )}
        </motion.div>
      )}

      {/* Main Content: 2-column layout on large screens */}
      <motion.div 
        className={styles.mainContent}
        variants={staggerContainerVariants}
        initial="initial"
        animate="animate"
      >
        {/* Left Column: Goal Progress + Allocation */}
        <motion.div 
          className={styles.leftColumn}
          variants={slideFromBottomVariants}
          transition={transitions.normal}
        >
          <GoalProgress
            goal={goal}
            currentValue={totalNetWorth}
            progress={goalProgress}
          />
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
          transition={transitions.normal}
        >
          <LivePrices prices={prices} etfData={etfData} />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default DashboardTab;
