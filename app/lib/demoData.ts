import { CashBalance, CashTransaction, Goal, TickerInfo, Transaction } from './types';

export const DEMO_TRANSACTIONS: Transaction[] = [
  {
    id: 1700000000001,
    date: '2024-03-15',
    ticker: 'SPY',
    action: 'Buy',
    shares: 8,
    price: 420,
    currency: 'EUR',
  },
  {
    id: 1700000000002,
    date: '2024-06-10',
    ticker: 'VEA',
    action: 'Buy',
    shares: 30,
    price: 48,
    currency: 'EUR',
  },
  {
    id: 1700000000003,
    date: '2024-10-05',
    ticker: 'EEM',
    action: 'Buy',
    shares: 25,
    price: 39,
    currency: 'EUR',
  },
];

export const DEMO_CASH: CashBalance[] = [
  { currency: 'PLN', amount: 12000 },
  { currency: 'EUR', amount: 2500 },
  { currency: 'USD', amount: 1500 },
];

export const DEMO_CASH_TRANSACTIONS: CashTransaction[] = [
  {
    id: 1700000000101,
    date: '2024-02-01',
    type: 'deposit',
    currency: 'PLN',
    amount: 8000,
    note: 'Initial savings',
  },
  {
    id: 1700000000102,
    date: '2024-05-01',
    type: 'deposit',
    currency: 'EUR',
    amount: 2000,
    note: 'Bonus deposit',
  },
  {
    id: 1700000000103,
    date: '2024-09-01',
    type: 'deposit',
    currency: 'USD',
    amount: 1500,
    note: 'Side income',
  },
];

export const DEMO_GOAL: Goal = {
  retirementYear: 2050,
  annualReturn: 0.07,
  monthlyDeposits: 1500,
  amount: 750000,
  targetYear: 2050,
  depositIncreasePercentage: 0.02,
  startDate: '2024-01-01',
};

export const DEMO_CUSTOM_TICKERS: Record<string, TickerInfo> = {
  SPY: { name: 'SPDR S&P 500 ETF Trust', currency: 'EUR', basePrice: 445 },
  VEA: { name: 'Vanguard FTSE Developed Markets ETF', currency: 'EUR', basePrice: 51 },
  EEM: { name: 'iShares MSCI Emerging Markets ETF', currency: 'EUR', basePrice: 41 },
};
