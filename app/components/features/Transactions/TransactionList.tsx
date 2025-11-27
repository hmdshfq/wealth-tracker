'use client';
import React from 'react';
import { Card, DataTable, Badge, SectionTitle } from '@/app/components/ui';
import { Transaction } from '@/app/lib/types';
import styles from './Transactions.module.css';

interface TransactionListProps {
  transactions: Transaction[];
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
}) => {
  const columns = [
    {
      key: 'date' as const,
      header: 'Date',
    },
    {
      key: 'ticker' as const,
      header: 'Ticker',
      render: (tx: Transaction) => (
        <span className={styles.ticker}>{tx.ticker}</span>
      ),
    },
    {
      key: 'action' as const,
      header: 'Action',
      render: (tx: Transaction) => (
        <Badge variant={tx.action === 'Buy' ? 'success' : 'danger'}>
          {tx.action}
        </Badge>
      ),
    },
    {
      key: 'shares' as const,
      header: 'Shares',
      align: 'right' as const,
    },
    {
      key: 'price' as const,
      header: 'Price',
      align: 'right' as const,
      render: (tx: Transaction) => `€${tx.price.toFixed(2)}`,
    },
    {
      key: 'total' as const,
      header: 'Total',
      align: 'right' as const,
      render: (tx: Transaction) => (
        <span className={styles.total}>
          €{(tx.shares * tx.price).toFixed(2)}
        </span>
      ),
    },
  ];

  return (
    <Card>
      <SectionTitle>Transaction History ({transactions.length})</SectionTitle>
      <DataTable
        columns={columns}
        data={transactions}
        keyExtractor={(tx) => tx.id.toString()}
      />
    </Card>
  );
};

export default TransactionList;
