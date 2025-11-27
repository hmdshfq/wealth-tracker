'use client';
import React from 'react';
import { Card, Input, Select, Button, SectionTitle } from '@/app/components/ui';
import { EXCHANGE_RATES } from '@/app/lib/constants';
import { formatPLN, formatCurrency } from '@/app/lib/formatters';
import { CashBalance, NewCash } from '@/app/lib/types';
import styles from './Cash.module.css';

interface CashTabProps {
  cash: CashBalance[];
  totalCashPLN: number;
  newCash: NewCash;
  onCashChange: (updates: Partial<NewCash>) => void;
  onAddCash: () => void;
}

const currencyOptions = [
  { value: 'PLN', label: 'PLN' },
  { value: 'EUR', label: 'EUR' },
  { value: 'USD', label: 'USD' },
];

export const CashTab: React.FC<CashTabProps> = ({
  cash,
  totalCashPLN,
  newCash,
  onCashChange,
  onAddCash,
}) => {
  const getCashInPLN = (c: CashBalance): number => {
    if (c.currency === 'PLN') return c.amount;
    if (c.currency === 'EUR') return c.amount * EXCHANGE_RATES.EUR_PLN;
    if (c.currency === 'USD') return c.amount * EXCHANGE_RATES.USD_PLN;
    return c.amount;
  };

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      {/* Add Cash */}
      <Card>
        <SectionTitle>Add Cash</SectionTitle>
        <div className={styles.formRow}>
          <Select
            label="Currency"
            options={currencyOptions}
            value={newCash.currency}
            onChange={(e) => onCashChange({ currency: e.target.value })}
          />
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            label="Amount"
            value={newCash.amount}
            onChange={(e) => onCashChange({ amount: e.target.value })}
            style={{ width: '150px' }}
          />
          <Button variant="blue" onClick={onAddCash}>
            + Add Cash
          </Button>
        </div>
      </Card>

      {/* Cash Balances */}
      <Card>
        <SectionTitle>Cash Balances</SectionTitle>
        <div className={styles.balancesGrid}>
          {cash.map((c) => {
            const inPLN = getCashInPLN(c);
            return (
              <div key={c.currency} className={styles.balanceCard}>
                <p className={styles.currencyLabel}>{c.currency}</p>
                <p className={styles.amount}>
                  {formatCurrency(c.amount, c.currency)}
                </p>
                {c.currency !== 'PLN' && (
                  <p className={styles.conversion}>≈ {formatPLN(inPLN)}</p>
                )}
              </div>
            );
          })}
        </div>
        <div className={styles.totalCard}>
          <p className={styles.totalLabel}>Total Cash (in PLN)</p>
          <p className={styles.totalValue}>{formatPLN(totalCashPLN)}</p>
        </div>
      </Card>

      {/* Exchange Rates */}
      <Card>
        <SectionTitle>Exchange Rates</SectionTitle>
        <div className={styles.rates}>
          <div>
            <span className={styles.rateLabel}>EUR/PLN: </span>
            <span className={styles.rateValue}>{EXCHANGE_RATES.EUR_PLN}</span>
          </div>
          <div>
            <span className={styles.rateLabel}>USD/PLN: </span>
            <span className={styles.rateValue}>{EXCHANGE_RATES.USD_PLN}</span>
          </div>
          <div>
            <span className={styles.rateLabel}>EUR/USD: </span>
            <span className={styles.rateValue}>{EXCHANGE_RATES.EUR_USD}</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CashTab;
