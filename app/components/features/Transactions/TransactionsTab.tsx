'use client';
import React from 'react';
import { TransactionForm } from './TransactionForm';
import { TransactionList } from './TransactionList';
import { Transaction, NewTransaction } from '@/app/lib/types';

interface TransactionsTabProps {
  transactions: Transaction[];
  newTx: NewTransaction;
  onTxChange: (updates: Partial<NewTransaction>) => void;
  onAddTransaction: () => void;
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: number) => void;
}

export const TransactionsTab: React.FC<TransactionsTabProps> = ({
  transactions,
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
        onEdit={onEditTransaction}
        onDelete={onDeleteTransaction}
      />
    </div>
  );
};

export default TransactionsTab;
