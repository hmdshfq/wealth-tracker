export interface Holding {
  ticker: string;
  shares: number;
  avgCost: number;
}

export interface HoldingWithDetails extends Holding {
  name: string;
  price: number;
  value: number;
  valuePLN: number;
  cost: number;
  gain: number;
  gainPercent: number;
}

export interface Transaction {
  id: number;
  date: string;
  ticker: string;
  action: 'Buy' | 'Sell';
  shares: number;
  price: number;
  currency: string;
}

export interface CashBalance {
  currency: 'PLN' | 'EUR' | 'USD';
  amount: number;
}

export interface CashTransaction {
  id: number;
  date: string;
  type: 'deposit' | 'withdrawal';
  currency: 'PLN' | 'EUR' | 'USD';
  amount: number;
  note?: string;
}

export interface Goal {
  amount: number;
  targetYear: number;
}

export interface AllocationItem {
  name: string;
  value: number;
  percent: number;
}

export interface ProjectionDataPoint {
  year: number;
  value: number;
  goal: number;
}

export interface NewTransaction {
  date: string;
  ticker: string;
  action: string;
  shares: string;
  price: string;
  currency: string;
}

export interface NewCash {
  currency: string;
  amount: string;
  type: 'deposit' | 'withdrawal';
  note: string;
}
