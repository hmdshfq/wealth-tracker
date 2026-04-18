import { describe, it, expect } from 'vitest';
import { calculateHoldingsFromTransactions } from './holdingsCalculations';
import { Transaction } from './types';

describe('calculateHoldingsFromTransactions', () => {
  it('returns empty array for no transactions', () => {
    const result = calculateHoldingsFromTransactions([]);
    expect(result).toEqual([]);
  });

  it('calculates single buy transaction correctly', () => {
    const transactions: Transaction[] = [
      {
        id: 1,
        date: '2024-01-15',
        ticker: 'VWCE',
        action: 'Buy',
        shares: 10,
        price: 100,
        currency: 'EUR',
      },
    ];

    const result = calculateHoldingsFromTransactions(transactions);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      ticker: 'VWCE',
      shares: 10,
      avgCost: 100,
    });
  });

  it('calculates multiple buy transactions for same ticker', () => {
    const transactions: Transaction[] = [
      {
        id: 1,
        date: '2024-01-15',
        ticker: 'VWCE',
        action: 'Buy',
        shares: 10,
        price: 100,
        currency: 'EUR',
      },
      {
        id: 2,
        date: '2024-02-15',
        ticker: 'VWCE',
        action: 'Buy',
        shares: 5,
        price: 110,
        currency: 'EUR',
      },
    ];

    const result = calculateHoldingsFromTransactions(transactions);

    expect(result).toHaveLength(1);
    expect(result[0].ticker).toBe('VWCE');
    expect(result[0].shares).toBe(15);
    // Average cost: (10 * 100 + 5 * 110) / 15 = 103.33
    expect(result[0].avgCost).toBeCloseTo(103.33, 2);
  });

  it('calculates partial sell transaction correctly', () => {
    const transactions: Transaction[] = [
      {
        id: 1,
        date: '2024-01-15',
        ticker: 'VWCE',
        action: 'Buy',
        shares: 10,
        price: 100,
        currency: 'EUR',
      },
      {
        id: 2,
        date: '2024-02-15',
        ticker: 'VWCE',
        action: 'Sell',
        shares: 3,
        price: 120,
        currency: 'EUR',
      },
    ];

    const result = calculateHoldingsFromTransactions(transactions);

    expect(result).toHaveLength(1);
    expect(result[0].ticker).toBe('VWCE');
    expect(result[0].shares).toBe(7);
    // Average cost remains 100 after sell
    expect(result[0].avgCost).toBe(100);
  });

  it('removes holding when all shares are sold', () => {
    const transactions: Transaction[] = [
      {
        id: 1,
        date: '2024-01-15',
        ticker: 'VWCE',
        action: 'Buy',
        shares: 10,
        price: 100,
        currency: 'EUR',
      },
      {
        id: 2,
        date: '2024-02-15',
        ticker: 'VWCE',
        action: 'Sell',
        shares: 10,
        price: 120,
        currency: 'EUR',
      },
    ];

    const result = calculateHoldingsFromTransactions(transactions);

    expect(result).toEqual([]);
  });

  it('handles multiple tickers independently', () => {
    const transactions: Transaction[] = [
      {
        id: 1,
        date: '2024-01-15',
        ticker: 'VWCE',
        action: 'Buy',
        shares: 10,
        price: 100,
        currency: 'EUR',
      },
      {
        id: 2,
        date: '2024-01-16',
        ticker: 'SPY',
        action: 'Buy',
        shares: 5,
        price: 400,
        currency: 'USD',
      },
      {
        id: 3,
        date: '2024-02-15',
        ticker: 'VWCE',
        action: 'Buy',
        shares: 5,
        price: 110,
        currency: 'EUR',
      },
    ];

    const result = calculateHoldingsFromTransactions(transactions);

    expect(result).toHaveLength(2);

    const vwce = result.find((h) => h.ticker === 'VWCE');
    const spy = result.find((h) => h.ticker === 'SPY');

    expect(vwce).toBeDefined();
    expect(vwce!.shares).toBe(15);
    expect(vwce!.avgCost).toBeCloseTo(103.33, 2);

    expect(spy).toBeDefined();
    expect(spy!.shares).toBe(5);
    expect(spy!.avgCost).toBe(400);
  });

  it('processes transactions in chronological order regardless of input order', () => {
    const transactions: Transaction[] = [
      {
        id: 2,
        date: '2024-02-15',
        ticker: 'VWCE',
        action: 'Buy',
        shares: 5,
        price: 110,
        currency: 'EUR',
      },
      {
        id: 1,
        date: '2024-01-15',
        ticker: 'VWCE',
        action: 'Buy',
        shares: 10,
        price: 100,
        currency: 'EUR',
      },
    ];

    const result = calculateHoldingsFromTransactions(transactions);

    expect(result).toHaveLength(1);
    expect(result[0].shares).toBe(15);
    expect(result[0].avgCost).toBeCloseTo(103.33, 2);
  });

  it('handles complex buy and sell sequence', () => {
    const transactions: Transaction[] = [
      {
        id: 1,
        date: '2024-01-01',
        ticker: 'TEST',
        action: 'Buy',
        shares: 100,
        price: 50,
        currency: 'EUR',
      },
      {
        id: 2,
        date: '2024-01-02',
        ticker: 'TEST',
        action: 'Buy',
        shares: 50,
        price: 60,
        currency: 'EUR',
      },
      {
        id: 3,
        date: '2024-01-03',
        ticker: 'TEST',
        action: 'Sell',
        shares: 75,
        price: 70,
        currency: 'EUR',
      },
      {
        id: 4,
        date: '2024-01-04',
        ticker: 'TEST',
        action: 'Buy',
        shares: 25,
        price: 55,
        currency: 'EUR',
      },
    ];

    const result = calculateHoldingsFromTransactions(transactions);

    expect(result).toHaveLength(1);
    expect(result[0].ticker).toBe('TEST');
    // 100 + 50 - 75 + 25 = 100 shares
    expect(result[0].shares).toBe(100);

    // After first two buys: avg cost = (100*50 + 50*60) / 150 = 53.33
    // After selling 75 at avg cost 53.33: remaining cost = (150-75) * 53.33 = 75 * 53.33 = 4000
    // After final buy: total cost = 4000 + 25*55 = 4000 + 1375 = 5375
    // New avg cost = 5375 / 100 = 53.75
    expect(result[0].avgCost).toBeCloseTo(53.75, 2);
  });

  it('handles fractional shares', () => {
    const transactions: Transaction[] = [
      {
        id: 1,
        date: '2024-01-15',
        ticker: 'VWCE',
        action: 'Buy',
        shares: 10.5,
        price: 100,
        currency: 'EUR',
      },
      {
        id: 2,
        date: '2024-02-15',
        ticker: 'VWCE',
        action: 'Sell',
        shares: 3.25,
        price: 120,
        currency: 'EUR',
      },
    ];

    const result = calculateHoldingsFromTransactions(transactions);

    expect(result).toHaveLength(1);
    expect(result[0].shares).toBe(7.25);
    expect(result[0].avgCost).toBe(100);
  });

  it('handles selling without prior buy (edge case)', () => {
    const transactions: Transaction[] = [
      {
        id: 1,
        date: '2024-01-15',
        ticker: 'VWCE',
        action: 'Sell',
        shares: 10,
        price: 100,
        currency: 'EUR',
      },
    ];

    const result = calculateHoldingsFromTransactions(transactions);

    // Should result in negative shares which gets filtered out
    expect(result).toEqual([]);
  });

  it('handles transactions on same date', () => {
    const transactions: Transaction[] = [
      {
        id: 1,
        date: '2024-01-15',
        ticker: 'VWCE',
        action: 'Buy',
        shares: 10,
        price: 100,
        currency: 'EUR',
      },
      {
        id: 2,
        date: '2024-01-15',
        ticker: 'VWCE',
        action: 'Buy',
        shares: 5,
        price: 105,
        currency: 'EUR',
      },
    ];

    const result = calculateHoldingsFromTransactions(transactions);

    expect(result).toHaveLength(1);
    expect(result[0].shares).toBe(15);
    // Average cost: (10 * 100 + 5 * 105) / 15 = 101.67
    expect(result[0].avgCost).toBeCloseTo(101.67, 2);
  });
});
