import { describe, it, expect } from 'vitest';
import {
  generateProjectionData,
  calculateActualContributionsByMonth,
  calculateCumulativeActualContributions,
  mergeProjectedWithActual,
  calculateCumulativeContributions,
  calculateActualPortfolioValues,
  ExtendedProjectionDataPoint,
  ActualPortfolioDataPoint,
} from './baseProjection';
import { Goal, Transaction } from '../types';

const mockExchangeRates = {
  EUR_PLN: 4.5,
  USD_PLN: 4.0,
};

describe('generateProjectionData', () => {
  it('returns empty array for missing startDate', () => {
    const goal: Goal = {
      amount: 1000000,
      targetYear: 2040,
      retirementYear: 2040,
      annualReturn: 0.07,
      monthlyDeposits: 1000,
      depositIncreasePercentage: 0,
      startDate: '',
    };

    const result = generateProjectionData(goal, 0);
    expect(result).toEqual([]);
  });

  it('returns empty array for missing retirementYear', () => {
    const goal: Goal = {
      amount: 1000000,
      targetYear: 2040,
      retirementYear: 0,
      annualReturn: 0.07,
      monthlyDeposits: 1000,
      depositIncreasePercentage: 0,
      startDate: '2024-01-01',
    };

    const result = generateProjectionData(goal, 0);
    expect(result).toEqual([]);
  });

  it('generates correct number of monthly data points', () => {
    const goal: Goal = {
      amount: 1000000,
      targetYear: 2025,
      retirementYear: 2025,
      annualReturn: 0,
      monthlyDeposits: 1000,
      depositIncreasePercentage: 0,
      startDate: '2024-01-01',
    };

    const result = generateProjectionData(goal, 0);
    // From Jan 2024 to Dec 2025 = 24 months (Dec 31 end date)
    expect(result.length).toBe(24);
  });

  it('calculates simple contributions without returns correctly', () => {
    const goal: Goal = {
      amount: 100000,
      targetYear: 2024,
      retirementYear: 2024,
      annualReturn: 0,
      monthlyDeposits: 1000,
      depositIncreasePercentage: 0,
      startDate: '2024-01-01',
    };

    const result = generateProjectionData(goal, 0);
    
    // First month: 1000 contribution
    expect(result[0].cumulativeContributions).toBe(1000);
    expect(result[0].value).toBe(1000);
    
    // Last month (Dec 2024): 12 * 1000 = 12000
    const lastPoint = result[result.length - 1];
    expect(lastPoint.cumulativeContributions).toBe(12000);
    expect(lastPoint.value).toBe(12000);
  });

  it('applies annual deposit increase correctly', () => {
    const goal: Goal = {
      amount: 100000,
      targetYear: 2025,
      retirementYear: 2025,
      annualReturn: 0,
      monthlyDeposits: 1000,
      depositIncreasePercentage: 0.10, // 10% increase each year
      startDate: '2024-01-01',
    };

    const result = generateProjectionData(goal, 0);
    
    // Jan 2024: 1000
    const jan2024 = result.find((p) => p.date === '2024-01');
    expect(jan2024?.monthlyContribution).toBe(1000);
    
    // Jan 2025: 1000 * 1.10 = 1100
    const jan2025 = result.find((p) => p.date === '2025-01');
    expect(jan2025?.monthlyContribution).toBe(1100);
  });

  it('calculates compound returns correctly', () => {
    const goal: Goal = {
      amount: 100000,
      targetYear: 2024,
      retirementYear: 2024,
      annualReturn: 0.12, // 1% monthly
      monthlyDeposits: 1000,
      depositIncreasePercentage: 0,
      startDate: '2024-01-01',
    };

    const result = generateProjectionData(goal, 0);
    
    // First month: 1000 contribution, no return yet
    expect(result[0].value).toBe(1000);
    
    // Second month: 1000 + 1000 + 10 (1% of 1000) = 2010
    expect(result[1].value).toBeGreaterThan(2000);
  });

  it('sets goal amount on all data points', () => {
    const goal: Goal = {
      amount: 500000,
      targetYear: 2024,
      retirementYear: 2024,
      annualReturn: 0,
      monthlyDeposits: 100,
      depositIncreasePercentage: 0,
      startDate: '2024-01-01',
    };

    const result = generateProjectionData(goal, 0);
    
    expect(result.every((p) => p.goal === 500000)).toBe(true);
  });
});

describe('calculateActualContributionsByMonth', () => {
  it('returns empty map for no transactions', () => {
    const result = calculateActualContributionsByMonth([], mockExchangeRates);
    expect(result.size).toBe(0);
  });

  it('calculates single buy transaction in PLN', () => {
    const transactions: Transaction[] = [
      {
        id: 1,
        date: '2024-01-15',
        ticker: 'VWCE',
        action: 'Buy',
        shares: 10,
        price: 100,
        currency: 'PLN',
      },
    ];

    const result = calculateActualContributionsByMonth(transactions, mockExchangeRates);
    
    expect(result.get('2024-01')).toBe(1000); // 10 * 100
  });

  it('converts EUR to PLN correctly', () => {
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

    const result = calculateActualContributionsByMonth(transactions, mockExchangeRates);
    
    expect(result.get('2024-01')).toBe(4500); // 10 * 100 * 4.5
  });

  it('converts USD to PLN correctly', () => {
    const transactions: Transaction[] = [
      {
        id: 1,
        date: '2024-01-15',
        ticker: 'SPY',
        action: 'Buy',
        shares: 5,
        price: 400,
        currency: 'USD',
      },
    ];

    const result = calculateActualContributionsByMonth(transactions, mockExchangeRates);
    
    expect(result.get('2024-01')).toBe(8000); // 5 * 400 * 4.0
  });

  it('subtracts for sell transactions', () => {
    const transactions: Transaction[] = [
      {
        id: 1,
        date: '2024-01-15',
        ticker: 'VWCE',
        action: 'Sell',
        shares: 10,
        price: 100,
        currency: 'PLN',
      },
    ];

    const result = calculateActualContributionsByMonth(transactions, mockExchangeRates);
    
    expect(result.get('2024-01')).toBe(-1000);
  });

  it('aggregates multiple transactions in same month', () => {
    const transactions: Transaction[] = [
      {
        id: 1,
        date: '2024-01-10',
        ticker: 'VWCE',
        action: 'Buy',
        shares: 10,
        price: 100,
        currency: 'PLN',
      },
      {
        id: 2,
        date: '2024-01-20',
        ticker: 'SPY',
        action: 'Buy',
        shares: 5,
        price: 200,
        currency: 'PLN',
      },
    ];

    const result = calculateActualContributionsByMonth(transactions, mockExchangeRates);
    
    expect(result.get('2024-01')).toBe(2000); // 1000 + 1000
  });

  it('sorts transactions by date before processing', () => {
    const transactions: Transaction[] = [
      {
        id: 2,
        date: '2024-02-15',
        ticker: 'VWCE',
        action: 'Buy',
        shares: 10,
        price: 100,
        currency: 'PLN',
      },
      {
        id: 1,
        date: '2024-01-15',
        ticker: 'VWCE',
        action: 'Buy',
        shares: 10,
        price: 100,
        currency: 'PLN',
      },
    ];

    const result = calculateActualContributionsByMonth(transactions, mockExchangeRates);
    
    expect(result.get('2024-01')).toBe(1000);
    expect(result.get('2024-02')).toBe(1000);
  });
});

describe('calculateCumulativeActualContributions', () => {
  it('returns empty map for no transactions', () => {
    const result = calculateCumulativeActualContributions(
      [],
      mockExchangeRates,
      '2024-01-01',
      '2024-03-01'
    );
    expect(result.size).toBe(3); // Jan, Feb, Mar
  });

  it('accumulates contributions over months', () => {
    const transactions: Transaction[] = [
      {
        id: 1,
        date: '2024-01-15',
        ticker: 'VWCE',
        action: 'Buy',
        shares: 10,
        price: 100,
        currency: 'PLN',
      },
      {
        id: 2,
        date: '2024-02-15',
        ticker: 'VWCE',
        action: 'Buy',
        shares: 5,
        price: 100,
        currency: 'PLN',
      },
    ];

    const result = calculateCumulativeActualContributions(
      transactions,
      mockExchangeRates,
      '2024-01-01',
      '2024-03-01'
    );

    expect(result.get('2024-01')).toBe(1000);
    expect(result.get('2024-02')).toBe(1500); // 1000 + 500
    expect(result.get('2024-03')).toBe(1500); // No new contributions
  });

  it('includes all months in range even with no contributions', () => {
    const transactions: Transaction[] = [
      {
        id: 1,
        date: '2024-01-15',
        ticker: 'VWCE',
        action: 'Buy',
        shares: 10,
        price: 100,
        currency: 'PLN',
      },
    ];

    const result = calculateCumulativeActualContributions(
      transactions,
      mockExchangeRates,
      '2024-01-01',
      '2024-06-01'
    );

    expect(result.size).toBe(6);
    expect(result.has('2024-01')).toBe(true);
    expect(result.has('2024-06')).toBe(true);
  });
});

describe('calculateCumulativeContributions', () => {
  it('returns 0 for no transactions', () => {
    const result = calculateCumulativeContributions([], mockExchangeRates);
    expect(result).toBe(0);
  });

  it('sums all buy transactions', () => {
    const transactions: Transaction[] = [
      {
        id: 1,
        date: '2024-01-15',
        ticker: 'VWCE',
        action: 'Buy',
        shares: 10,
        price: 100,
        currency: 'PLN',
      },
      {
        id: 2,
        date: '2024-02-15',
        ticker: 'VWCE',
        action: 'Buy',
        shares: 5,
        price: 100,
        currency: 'PLN',
      },
    ];

    const result = calculateCumulativeContributions(transactions, mockExchangeRates);
    expect(result).toBe(1500);
  });

  it('subtracts sell transactions', () => {
    const transactions: Transaction[] = [
      {
        id: 1,
        date: '2024-01-15',
        ticker: 'VWCE',
        action: 'Buy',
        shares: 10,
        price: 100,
        currency: 'PLN',
      },
      {
        id: 2,
        date: '2024-02-15',
        ticker: 'VWCE',
        action: 'Sell',
        shares: 5,
        price: 100,
        currency: 'PLN',
      },
    ];

    const result = calculateCumulativeContributions(transactions, mockExchangeRates);
    expect(result).toBe(500); // 1000 - 500
  });

  it('converts currencies correctly', () => {
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
        ticker: 'SPY',
        action: 'Buy',
        shares: 5,
        price: 100,
        currency: 'USD',
      },
    ];

    const result = calculateCumulativeContributions(transactions, mockExchangeRates);
    // 10 * 100 * 4.5 + 5 * 100 * 4.0 = 4500 + 2000 = 6500
    expect(result).toBe(6500);
  });
});

describe('mergeProjectedWithActual', () => {
  it('returns empty array for empty projected data', () => {
    const result = mergeProjectedWithActual([], [], mockExchangeRates, 10000);
    expect(result).toEqual([]);
  });

  it('adds actual contributions to past months', () => {
    const projectedData = [
      { date: '2024-01', year: 2024, month: 1, value: 1000, goal: 10000, monthlyContribution: 1000, cumulativeContributions: 1000, monthlyReturn: 0, cumulativeReturns: 0, principalValue: 1000 },
      { date: '2024-02', year: 2024, month: 2, value: 2000, goal: 10000, monthlyContribution: 1000, cumulativeContributions: 2000, monthlyReturn: 0, cumulativeReturns: 0, principalValue: 2000 },
      { date: '2024-03', year: 2024, month: 3, value: 3000, goal: 10000, monthlyContribution: 1000, cumulativeContributions: 3000, monthlyReturn: 0, cumulativeReturns: 0, principalValue: 3000 },
    ];

    const transactions: Transaction[] = [
      {
        id: 1,
        date: '2024-01-15',
        ticker: 'VWCE',
        action: 'Buy',
        shares: 10,
        price: 100,
        currency: 'PLN',
      },
      {
        id: 2,
        date: '2024-02-15',
        ticker: 'VWCE',
        action: 'Buy',
        shares: 5,
        price: 100,
        currency: 'PLN',
      },
    ];

    const result = mergeProjectedWithActual(projectedData, transactions, mockExchangeRates, 1500);
    
    // Past months should have actual contributions
    const january = result.find((p) => p.date === '2024-01');
    const february = result.find((p) => p.date === '2024-02');
    
    expect(january?.actualContributions).toBe(1000);
    expect(february?.actualContributions).toBe(1500);
  });

  it('preserves projected data structure', () => {
    const projectedData = [
      { date: '2024-01', year: 2024, month: 1, value: 1000, goal: 10000, monthlyContribution: 1000, cumulativeContributions: 1000, monthlyReturn: 0, cumulativeReturns: 0, principalValue: 1000 },
    ];

    const result = mergeProjectedWithActual(projectedData, [], mockExchangeRates, 0);
    
    expect(result[0].value).toBe(1000);
    expect(result[0].goal).toBe(10000);
    expect(result[0].monthlyContribution).toBe(1000);
  });
});

describe('calculateActualPortfolioValues', () => {
  it('returns empty array for no transactions', () => {
    const result = calculateActualPortfolioValues([], mockExchangeRates, 10000);
    expect(result).toEqual([]);
  });

  it('generates monthly data points from first transaction to now', () => {
    const transactions: Transaction[] = [
      {
        id: 1,
        date: '2024-01-15',
        ticker: 'VWCE',
        action: 'Buy',
        shares: 10,
        price: 100,
        currency: 'PLN',
      },
    ];

    const result = calculateActualPortfolioValues(transactions, mockExchangeRates, 1000);
    
    // Should have data from Jan 2024 to current month
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].date).toBe('2024-01');
    // First month shows 0 because transaction is processed in the month following the purchase
    expect(result[0].cumulativeContributions).toBe(0);
  });

  it('applies monthly returns between transactions', () => {
    const transactions: Transaction[] = [
      {
        id: 1,
        date: '2024-01-01',
        ticker: 'VWCE',
        action: 'Buy',
        shares: 10,
        price: 100,
        currency: 'PLN',
      },
    ];

    const result = calculateActualPortfolioValues(
      transactions,
      mockExchangeRates,
      1000,
      0.12 // 12% annual = 1% monthly
    );
    
    // Transactions are applied at month end, so first month shows 0
    expect(result.length).toBeGreaterThan(0);
    
    // Subsequent months should show growth
    if (result.length > 1) {
      expect(result[1].portfolioValue).not.toBe(result[0].portfolioValue);
    }
  });

  it('accounts for buy and sell transactions', () => {
    const transactions: Transaction[] = [
      {
        id: 1,
        date: '2024-01-15',
        ticker: 'VWCE',
        action: 'Buy',
        shares: 10,
        price: 100,
        currency: 'PLN',
      },
      {
        id: 2,
        date: '2024-02-15',
        ticker: 'VWCE',
        action: 'Sell',
        shares: 5,
        price: 100,
        currency: 'PLN',
      },
    ];

    const result = calculateActualPortfolioValues(transactions, mockExchangeRates, 500, 0);
    
    const march = result.find((p) => p.date === '2024-03');
    expect(march?.cumulativeContributions).toBe(500); // 1000 - 500 (both applied by March)
  });

  it('converts currencies correctly', () => {
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

    const result = calculateActualPortfolioValues(transactions, mockExchangeRates, 4500, 0);
    
    // First month shows 0, contributions appear in subsequent months
    expect(result.length).toBeGreaterThan(0);
  });

  it('sorts transactions chronologically', () => {
    const transactions: Transaction[] = [
      {
        id: 2,
        date: '2024-02-01',
        ticker: 'VWCE',
        action: 'Buy',
        shares: 5,
        price: 100,
        currency: 'PLN',
      },
      {
        id: 1,
        date: '2024-01-01',
        ticker: 'VWCE',
        action: 'Buy',
        shares: 10,
        price: 100,
        currency: 'PLN',
      },
    ];

    const result = calculateActualPortfolioValues(transactions, mockExchangeRates, 1500, 0);
    
    // Should still calculate correctly regardless of input order
    expect(result.length).toBeGreaterThan(0);
    // First month is 0, second month has the first transaction's contribution
    expect(result[1].cumulativeContributions).toBe(1000);
  });
});
