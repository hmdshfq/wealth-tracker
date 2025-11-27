'use client';
import React from 'react';
import { TransactionForm } from './TransactionForm';
import { TransactionList } from './TransactionList';
import { Transaction, NewTransaction } from '@/app/lib/types';

interface TransactionsTabProps {
  transactions: Transaction[];
  prices: Record<string, number>;
  newTx: NewTransaction;
  onTxChange: (updates: Partial<NewTransaction>) => void;
  onAddTransaction: () => void;
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: number) => void;
}

export const TransactionsTab: React.FC<TransactionsTabProps> = ({
  transactions,
  prices,
  newTx,
  onTxChange,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <TransactionForm
        newTx={newTx}
        onChange={onTxChange}
        onSubmit={onAddTransaction}
      />
      <TransactionList
        transactions={transactions}
        prices={prices}
        onEdit={onEditTransaction}
        onDelete={onDeleteTransaction}
      />
    </div>
  );
};

export default TransactionsTab;
