'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TabNav, TabButton } from '@/app/components/ui';
import { SettingsSubTab } from './SettingsSubTab';
import { GoalSubTab } from './GoalSubTab';
import { TrackerSubTab } from './TrackerSubTab';
import { TransactionsSubTab } from './TransactionsSubTab';
import { Transaction, NewTransaction, HoldingWithDetails, Goal, TickerInfo, PreferredCurrency } from '@/app/lib/types';
import { slideFromBottomVariants, staggerContainerVariants, transitions } from '@/app/lib/animations';
import styles from './Investments.module.css';

type InvestmentsSubTab = 'goal' | 'tracker' | 'transactions' | 'settings';

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
  preferredCurrency: PreferredCurrency;
  onPreferredCurrencyChange: (currency: PreferredCurrency) => void;
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
  preferredCurrency,
  onPreferredCurrencyChange,
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
          ariaLabel="View goal progress chart"
        >
          Goal
        </TabButton>
        <TabButton
          isActive={activeSubTab === 'tracker'}
          onClick={() => setActiveSubTab('tracker')}
          ariaLabel="View monthly deposit tracker"
        >
          Tracker
        </TabButton>
        <TabButton
          isActive={activeSubTab === 'transactions'}
          onClick={() => setActiveSubTab('transactions')}
          ariaLabel="Manage investment transactions"
        >
          Transactions
        </TabButton>
        <TabButton
          isActive={activeSubTab === 'settings'}
          onClick={() => setActiveSubTab('settings')}
          ariaLabel="View investment settings"
        >
          Settings
        </TabButton>
      </TabNav>

      {/* Sub-tab Content */}
      <AnimatePresence mode="wait">
        {/* Chart Sub-tab */}
        {activeSubTab === 'goal' && (
          <motion.div
            key="chart"
            variants={slideFromBottomVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transitions.fast}
            className={styles.tabContent}
          >
            <GoalSubTab
              goal={goal}
              transactions={transactions}
              totalNetWorth={totalNetWorth}
              goalProgress={goalProgress}
              portfolioValue={portfolioValue}
              exchangeRates={exchangeRates}
              preferredCurrency={preferredCurrency}
            />
          </motion.div>
        )}

        {/* Deposits Sub-tab */}
        {activeSubTab === 'tracker' && (
          <motion.div
            key="deposits"
            variants={slideFromBottomVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transitions.fast}
            className={styles.tabContent}
          >
            <TrackerSubTab
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

        {/* Settings Sub-tab (moved last) */}
        {activeSubTab === 'settings' && (
          <motion.div
            key="settings"
            variants={slideFromBottomVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transitions.fast}
            className={styles.tabContent}
          >
            <SettingsSubTab
              goal={goal}
              tempGoal={tempGoal}
              editingGoal={editingGoal}
              preferredCurrency={preferredCurrency}
              onPreferredCurrencyChange={onPreferredCurrencyChange}
              onEditStart={onEditStart}
              onEditCancel={onEditCancel}
              onEditSave={onEditSave}
              onTempGoalChange={onTempGoalChange}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default InvestmentsTab;
