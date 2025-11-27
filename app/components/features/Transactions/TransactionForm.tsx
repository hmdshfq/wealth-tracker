'use client';
import React from 'react';
import { Card, Input, Select, Button, SectionTitle } from '@/app/components/ui';
import { ETF_DATA } from '@/app/lib/constants';
import { NewTransaction } from '@/app/lib/types';
import styles from './Transactions.module.css';

interface TransactionFormProps {
  newTx: NewTransaction;
  onChange: (updates: Partial<NewTransaction>) => void;
  onSubmit: () => void;
}

const tickerOptions = Object.keys(ETF_DATA).map((t) => ({
  value: t,
  label: t,
}));

const actionOptions = [
  { value: 'Buy', label: 'Buy' },
  { value: 'Sell', label: 'Sell' },
];

export const TransactionForm: React.FC<TransactionFormProps> = ({
  newTx,
  onChange,
  onSubmit,
}) => {
  return (
    <Card>
      <SectionTitle>Add Transaction</SectionTitle>
      <div className={styles.formRow}>
        <Input
          type="date"
          label="Date"
          value={newTx.date}
          onChange={(e) => onChange({ date: e.target.value })}
        />
        <Select
          label="Ticker"
          options={tickerOptions}
          value={newTx.ticker}
          onChange={(e) => onChange({ ticker: e.target.value })}
          wrapperStyle={{ minWidth: '120px' }}
        />
        <Select
          label="Action"
          options={actionOptions}
          value={newTx.action}
          onChange={(e) => onChange({ action: e.target.value })}
        />
        <Input
          type="number"
          step="0.01"
          placeholder="0"
          label="Shares"
          value={newTx.shares}
          onChange={(e) => onChange({ shares: e.target.value })}
          style={{ width: '80px' }}
        />
        <Input
          type="number"
          step="0.01"
          placeholder="0.00"
          label="Price (EUR)"
          value={newTx.price}
          onChange={(e) => onChange({ price: e.target.value })}
          style={{ width: '100px' }}
        />
        <Button onClick={onSubmit}>+ Add</Button>
      </div>
    </Card>
  );
};

export default TransactionForm;
