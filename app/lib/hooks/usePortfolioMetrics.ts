import { useMemo } from 'react';
import {
  AllocationItem,
  CashBalance,
  Goal,
  HoldingWithDetails,
  TickerInfo,
} from '../types';
import { PriceData } from './useMarketData';

export function usePortfolioMetrics(
  holdings: { ticker: string; shares: number; avgCost: number }[],
  prices: Record<string, PriceData>,
  exchangeRates: { EUR_PLN: number; USD_PLN: number },
  allTickers: Record<string, TickerInfo>,
  cash: CashBalance[],
  goal: Goal
) {
  const portfolioValue = useMemo(() => {
    let totalEUR = 0;
    holdings.forEach((h) => {
      const price = prices[h.ticker]?.price || allTickers[h.ticker]?.basePrice || 0;
      totalEUR += h.shares * price;
    });
    return totalEUR * exchangeRates.EUR_PLN;
  }, [holdings, prices, exchangeRates, allTickers]);

  const totalCost = useMemo(() => {
    let costEUR = 0;
    holdings.forEach((h) => {
      costEUR += h.shares * h.avgCost;
    });
    return costEUR * exchangeRates.EUR_PLN;
  }, [holdings, exchangeRates]);

  const totalCashPLN = useMemo(() => {
    return cash.reduce((sum, c) => {
      if (c.currency === 'PLN') return sum + c.amount;
      if (c.currency === 'EUR') return sum + c.amount * exchangeRates.EUR_PLN;
      if (c.currency === 'USD') return sum + c.amount * exchangeRates.USD_PLN;
      return sum;
    }, 0);
  }, [cash, exchangeRates]);

  const totalNetWorth = portfolioValue + totalCashPLN;
  const totalGain = portfolioValue - totalCost;
  const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
  const goalProgress = goal.amount > 0 ? (totalNetWorth / goal.amount) * 100 : 0;

  const holdingsData: HoldingWithDetails[] = useMemo(() => {
    return holdings.map((h) => {
      const price = prices[h.ticker]?.price || allTickers[h.ticker]?.basePrice || 0;
      const value = h.shares * price;
      const cost = h.shares * h.avgCost;
      const gain = value - cost;
      const gainPercent = cost > 0 ? (gain / cost) * 100 : 0;
      return {
        ...h,
        name: allTickers[h.ticker]?.name || h.ticker,
        price,
        value,
        valuePLN: value * exchangeRates.EUR_PLN,
        cost,
        gain,
        gainPercent,
      };
    });
  }, [holdings, prices, exchangeRates, allTickers]);

  const allocationData: AllocationItem[] = useMemo(() => {
    const total = holdingsData.reduce((sum, h) => sum + h.value, 0);
    return holdingsData.map((h) => ({
      name: h.ticker,
      value: h.value,
      percent: total > 0 ? (h.value / total) * 100 : 0,
    }));
  }, [holdingsData]);

  return {
    portfolioValue,
    totalCost,
    totalCashPLN,
    totalNetWorth,
    totalGain,
    totalGainPercent,
    goalProgress,
    holdingsData,
    allocationData,
  };
}
