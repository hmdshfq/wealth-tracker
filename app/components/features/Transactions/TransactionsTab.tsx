'use client';
import React from 'react';
import { Card, DataTable, SectionTitle } from '@/app/components/ui';
import { formatPLN, formatEUR, formatPercent } from '@/app/lib/formatters';
import { TransactionForm } from './TransactionForm';
import { TransactionList } from './TransactionList';
import { Transaction, NewTransaction, HoldingWithDetails, TickerInfo } from '@/app/lib/types';
import styles from './Transactions.module.css';

interface TransactionsTabProps {
  transactions: Transaction[];
  prices: Record<string, number>;
  newTx: NewTransaction;
  holdingsData: HoldingWithDetails[];
  portfolioValue: number;
  totalGain: number;
  totalGainPercent: number;
  onTxChange: (updates: Partial<NewTransaction>) => void;
  onAddTransaction: () => void;
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: number) => void;
  etfData: Record<string, TickerInfo>;
}

export const TransactionsTab: React.FC<TransactionsTabProps> = ({
  transactions,
  prices,
  newTx,
  holdingsData,
  portfolioValue,
  totalGain,
  totalGainPercent,
  onTxChange,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  etfData,
}) => {
  const holdingsColumns = [
    {
      key: 'ticker' as const,
      header: 'Ticker',
      render: (h: HoldingWithDetails) => (
        <span className={styles.ticker}>{h.ticker}</span>
      ),
    },
    {
      key: 'name' as const,
      header: 'Name',
      render: (h: HoldingWithDetails) => (
        <span className={styles.name}>{h.name}</span>
      ),
    },
    {
      key: 'shares' as const,
      header: 'Shares',
      align: 'right' as const,
      render: (h: HoldingWithDetails) => h.shares.toFixed(2),
    },
    {
      key: 'avgCost' as const,
      header: 'Avg Cost',
      align: 'right' as const,
      render: (h: HoldingWithDetails) => `€${h.avgCost.toFixed(2)}`,
    },
    {
      key: 'price' as const,
      header: 'Price',
      align: 'right' as const,
      render: (h: HoldingWithDetails) => `€${h.price.toFixed(2)}`,
    },
    {
      key: 'value' as const,
      header: 'Value (EUR)',
      align: 'right' as const,
      render: (h: HoldingWithDetails) => (
        <span className={styles.valueCell}>{formatEUR(h.value)}</span>
      ),
    },
    {
      key: 'valuePLN' as const,
      header: 'Value (PLN)',
      align: 'right' as const,
      render: (h: HoldingWithDetails) => (
        <span className={styles.valueCell}>{formatPLN(h.valuePLN)}</span>
      ),
    },
    {
      key: 'gain' as const,
      header: 'Gain',
      align: 'right' as const,
      render: (h: HoldingWithDetails) => (
        <span className={h.gain >= 0 ? styles.positive : styles.negative}>
          {formatEUR(h.gain)} ({formatPercent(h.gainPercent)})
        </span>
      ),
    },
  ];

  const holdingsFooter = (
    <tr className={styles.footerRow}>
      <td colSpan={5} className={styles.footerLabel}>
        Total
      </td>
      <td className={styles.footerValue}>
        {formatEUR(holdingsData.reduce((sum, h) => sum + h.value, 0))}
      </td>
      <td className={styles.footerValue}>{formatPLN(portfolioValue)}</td>
      <td
        className={`${styles.footerValue} ${
          totalGain >= 0 ? styles.positive : styles.negative
        }`}
      >
        {formatPLN(totalGain)} ({formatPercent(totalGainPercent)})
      </td>
    </tr>
  );

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      {/* Holdings Section */}
      <Card>
        <SectionTitle>Holdings</SectionTitle>
        <DataTable
          columns={holdingsColumns}
          data={holdingsData}
          keyExtractor={(h) => h.ticker}
          footer={holdingsFooter}
        />
      </Card>

      {/* Add Transaction Form */}
      <TransactionForm
        newTx={newTx}
        onChange={onTxChange}
        onSubmit={onAddTransaction}
        etfData={etfData}
      />

      {/* Transaction History */}
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
