import {
  CashBalance,
  CashTransaction,
  Goal,
  PreferredCurrency,
  Transaction,
} from '../types';

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_CASH: CashBalance[] = [
  { currency: 'PLN', amount: 0 },
  { currency: 'EUR', amount: 0 },
  { currency: 'USD', amount: 0 },
];

export const INITIAL_CASH_TRANSACTIONS: CashTransaction[] = [];

export const INITIAL_GOAL: Goal = {
  retirementYear: 2050,
  annualReturn: 0.07,
  monthlyDeposits: 0,
  amount: 0,
  targetYear: 2050,
  depositIncreasePercentage: 0,
  startDate: new Date().toISOString().split('T')[0],
};

export const STORAGE_KEY = 'investment-tracker-data';

export const CURRENCY_LABELS: Record<PreferredCurrency, string> = {
  PLN: 'PLN (zł)',
  EUR: 'EUR (€)',
  USD: 'USD ($)',
};
