'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TabNav, TabButton } from '@/app/components/ui';
import { GoalSubTab } from './GoalSubTab';
import { ChartSubTab } from './ChartSubTab';
import { DepositsSubTab } from './DepositsSubTab';
import { TransactionsSubTab } from './TransactionsSubTab';
import { Transaction, NewTransaction, HoldingWithDetails, Goal, TickerInfo } from '@/app/lib/types';
import { slideFromBottomVariants, staggerContainerVariants, transitions } from '@/app/lib/animations';
import styles from './Investments.module.css';

type InvestmentsSubTab = 'goal' | 'chart' | 'deposits' | 'transactions';

interface InvestmentsTabProps {
  // Transaction data
  transactions: Transaction[];
  prices: Record<string, {
    price: number;
    change: number;
    changePercent: number;
    currency: string;
  }>;
  etfData: Record<string, TickerInfo>;
  newTx: NewTransaction;
  onTxChange: (updates: Partial<NewTransaction>) => void;
  onAddTransaction: () => void;
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: number) => void;
  onAddTicker: (symbol: string, info: TickerInfo) => void;
  customTickers: Record<string, TickerInfo>;
  onEditTicker: (symbol: string, info: TickerInfo) => void;
  onDeleteTicker: (symbol: string) => void;

  // Holdings for ticker search
  holdingsData: HoldingWithDetails[];

  // Goal data
  goal: Goal;
  tempGoal: Goal;
  editingGoal: boolean;
  totalNetWorth: number;
  goalProgress: number;
  portfolioValue: number;
  exchangeRates: {
    EUR_PLN: number;
    USD_PLN: number;
  };
  onEditStart: () => void;
  onEditCancel: () => void;
  onEditSave: () => void;
  onTempGoalChange: (updates: Partial<Goal>) => void;
}

export const InvestmentsTab: React.FC<InvestmentsTabProps> = ({
  // Transactions
  transactions,
  prices,
  etfData,
  newTx,
  onTxChange,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onAddTicker,
  customTickers,
  onEditTicker,
  onDeleteTicker,

  // Holdings
  holdingsData,

  // Goal
  goal,
  tempGoal,
  editingGoal,
  totalNetWorth,
  goalProgress,
  portfolioValue,
  exchangeRates,
  onEditStart,
  onEditCancel,
  onEditSave,
  onTempGoalChange,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<InvestmentsSubTab>('goal');

  return (
    <motion.div 
      className={styles.container}
      variants={staggerContainerVariants}
      initial="initial"
      animate="animate"
    >
      {/* Sub-tab Navigation */}
      <TabNav ariaLabel="Investment sections">
        <TabButton
          isActive={activeSubTab === 'goal'}
          onClick={() => setActiveSubTab('goal')}
          ariaLabel="View investment goal settings"
        >
          Goal
        </TabButton>
        <TabButton
          isActive={activeSubTab === 'chart'}
          onClick={() => setActiveSubTab('chart')}
          ariaLabel="View goal progress chart"
        >
          Chart
        </TabButton>
        <TabButton
          isActive={activeSubTab === 'deposits'}
          onClick={() => setActiveSubTab('deposits')}
          ariaLabel="View monthly deposit tracking"
        >
          Deposits
        </TabButton>
        <TabButton
          isActive={activeSubTab === 'transactions'}
          onClick={() => setActiveSubTab('transactions')}
          ariaLabel="Manage investment transactions"
        >
          Transactions
        </TabButton>
      </TabNav>

      {/* Sub-tab Content */}
      <AnimatePresence mode="wait">
        {/* Goal Sub-tab */}
        {activeSubTab === 'goal' && (
          <motion.div
            key="goal"
            variants={slideFromBottomVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transitions.fast}
            className={styles.tabContent}
          >
            <GoalSubTab
              goal={goal}
              tempGoal={tempGoal}
              editingGoal={editingGoal}
              onEditStart={onEditStart}
              onEditCancel={onEditCancel}
              onEditSave={onEditSave}
              onTempGoalChange={onTempGoalChange}
            />
          </motion.div>
        )}

        {/* Chart Sub-tab */}
        {activeSubTab === 'chart' && (
          <motion.div
            key="chart"
            variants={slideFromBottomVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transitions.fast}
            className={styles.tabContent}
          >
            <ChartSubTab
              goal={goal}
              transactions={transactions}
              totalNetWorth={totalNetWorth}
              goalProgress={goalProgress}
              portfolioValue={portfolioValue}
              exchangeRates={exchangeRates}
            />
          </motion.div>
        )}

        {/* Deposits Sub-tab */}
        {activeSubTab === 'deposits' && (
          <motion.div
            key="deposits"
            variants={slideFromBottomVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transitions.fast}
            className={styles.tabContent}
          >
            <DepositsSubTab
              goal={goal}
              transactions={transactions}
              exchangeRates={exchangeRates}
            />
          </motion.div>
        )}

        {/* Transactions Sub-tab */}
        {activeSubTab === 'transactions' && (
          <motion.div
            key="transactions"
            variants={slideFromBottomVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transitions.fast}
            className={styles.tabContent}
          >
            <TransactionsSubTab
              transactions={transactions}
              prices={prices}
              etfData={etfData}
              newTx={newTx}
              onTxChange={onTxChange}
              onAddTransaction={onAddTransaction}
              onEditTransaction={onEditTransaction}
              onDeleteTransaction={onDeleteTransaction}
              customTickers={customTickers}
              onAddTicker={onAddTicker}
              onEditTicker={onEditTicker}
              onDeleteTicker={onDeleteTicker}
              holdingsData={holdingsData}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default InvestmentsTab;
