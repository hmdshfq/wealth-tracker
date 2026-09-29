'use client';
import React from 'react';
import { Card, Input, Select, Button, SectionTitle } from '@/components/ui';
import { TickerCombobox } from './TickerCombobox';
import { NewTransaction, TickerInfo } from '@/lib/types';
import styles from './Transactions.module.css';

interface TransactionFormProps {
  newTx: NewTransaction;
  onChange: (updates: Partial<NewTransaction>) => void;
  onSubmit: () => void;
  etfData: Record<string, TickerInfo>;
  onAddTicker: (symbol: string, info: TickerInfo) => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  newTx,
  onChange,
  onSubmit,
  etfData,
  onAddTicker,
}) => {
  const actionOptions = [
    { value: 'Buy', label: 'Buy' },
    { value: 'Sell', label: 'Sell' },
  ];

  return (
    <Card>
      <SectionTitle>Add Transaction</SectionTitle>
      <div className={styles.formRow}>
        <Input
          type="date"
          label="Date"
          value={newTx.date}
          onChange={(e) => onChange({ date: e.target.value })}
          wrapperStyle={{ minWidth: '150px', flex: '1 1 160px' }}
        />
        <TickerCombobox
          label="Ticker"
          value={newTx.ticker}
          onChange={(ticker) => onChange({ ticker })}
          onRegister={onAddTicker}
          allTickers={etfData}
          wrapperStyle={{ minWidth: '140px', flex: '1 1 160px' }}
        />
        <Select
          label="Action"
          options={actionOptions}
          value={newTx.action}
          onChange={(e) => onChange({ action: e.target.value })}
          wrapperStyle={{ minWidth: '120px', flex: '1 1 140px' }}
        />
        <Input
          type="number"
          step="0.01"
          placeholder="0"
          label="Shares"
          value={newTx.shares}
          onChange={(e) => onChange({ shares: e.target.value })}
          wrapperStyle={{ minWidth: '120px', flex: '1 1 140px' }}
        />
        <Input
          type="number"
          step="0.01"
          placeholder="0.00"
          label="Price (EUR)"
          value={newTx.price}
          onChange={(e) => onChange({ price: e.target.value })}
          wrapperStyle={{ minWidth: '140px', flex: '1 1 160px' }}
        />
        <Button onClick={onSubmit} className={styles.addButton}>+ Add</Button>
      </div>
    </Card>
  );
};

export default TransactionForm;
