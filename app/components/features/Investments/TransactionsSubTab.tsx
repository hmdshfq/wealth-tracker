'use client';

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { TickerSearchCard } from './TickerSearchCard';
import { staggerContainerVariants, slideFromBottomVariants, transitions } from '@/app/lib/animations';
import { TransactionForm } from '../Transactions/TransactionForm';
import { TransactionList } from '../Transactions/TransactionList';
import { Transaction, NewTransaction, HoldingWithDetails, TickerInfo } from '@/app/lib/types';

interface TransactionsSubTabProps {
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
  customTickers: Record<string, TickerInfo>;
  onAddTicker: (symbol: string, info: TickerInfo) => void;
  onEditTicker: (symbol: string, info: TickerInfo) => void;
  onDeleteTicker: (symbol: string) => void;
  holdingsData: HoldingWithDetails[];
}

export const TransactionsSubTab: React.FC<TransactionsSubTabProps> = ({
  transactions,
  prices,
  etfData,
  newTx,
  onTxChange,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  customTickers,
  onAddTicker,
  onEditTicker,
  onDeleteTicker,
  holdingsData,
}) => {
  const allTickers = useMemo(() => {
    return { ...etfData, ...customTickers };
  }, [etfData, customTickers]);

  const heldTickers = useMemo(() => {
    return holdingsData.map((h) => h.ticker);
  }, [holdingsData]);

  return (
    <motion.div
      style={{ display: 'grid', gap: '24px' }}
      variants={staggerContainerVariants}
      initial="initial"
      animate="animate"
    >
      {/* Ticker Search */}
      <motion.div
        variants={slideFromBottomVariants}
        transition={transitions.fast}
      >
        <TickerSearchCard
          onAddTicker={onAddTicker}
          existingTickers={Object.keys(etfData)}
          customTickers={customTickers}
          onEditTicker={onEditTicker}
          onDeleteTicker={onDeleteTicker}
          allTickers={allTickers}
          heldTickers={heldTickers}
        />
      </motion.div>

      {/* Add Transaction Form */}
      <motion.div
        variants={slideFromBottomVariants}
        transition={transitions.fast}
      >
        <TransactionForm
          newTx={newTx}
          onChange={onTxChange}
          onSubmit={onAddTransaction}
          etfData={etfData}
        />
      </motion.div>

      {/* Transaction History */}
      <motion.div
        variants={slideFromBottomVariants}
        transition={transitions.fast}
      >
        <TransactionList
          transactions={transactions}
          prices={prices}
          onEdit={onEditTransaction}
          onDelete={onDeleteTransaction}
        />
      </motion.div>
    </motion.div>
  );
};
