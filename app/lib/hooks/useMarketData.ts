import { useCallback, useEffect, useState } from 'react';
import { ETF_DATA, EXCHANGE_RATES } from '../constants';
import { TickerInfo } from '../types';

export type PriceData = {
  price: number;
  change: number;
  changePercent: number;
  currency: string;
};

export function useMarketData(allTickers: Record<string, TickerInfo>) {
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [pricesLoading, setPricesLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [exchangeRates, setExchangeRates] = useState(EXCHANGE_RATES);

  const fetchPrices = useCallback(async () => {
    setPricesLoading(true);

    try {
      // Check if there are any tickers to fetch
      const tickers = Object.keys(allTickers);
      if (tickers.length === 0) {
        setPrices({});
        return;
      }

      // Fetch ETF prices
      const tickersParam = tickers.join(',');
      const pricesResponse = await fetch(`/api/prices?tickers=${tickersParam}`);

      if (!pricesResponse.ok) {
        throw new Error(`HTTP ${pricesResponse.status}: ${pricesResponse.statusText}`);
      }

      const pricesData = await pricesResponse.json();

      if (pricesData.error) {
        throw new Error(pricesData.error);
      }

      const newPrices: Record<string, PriceData> = {};
      for (const [ticker, info] of Object.entries(pricesData.prices || {})) {
        newPrices[ticker] = info as PriceData;
      }

      setPrices(newPrices);

      // Fetch exchange rates
      const ratesResponse = await fetch('/api/exchange-rates');
      if (ratesResponse.ok) {
        const ratesData = await ratesResponse.json();
        setExchangeRates(ratesData.rates);
      }

      setLastUpdate(new Date());
    } catch (error) {
      // Fall back to base prices from constants
      const fallbackPrices: Record<string, PriceData> = {};
      Object.entries(allTickers || ETF_DATA).forEach(([ticker, data]) => {
        fallbackPrices[ticker] = {
          price: data.basePrice,
          change: 0,
          changePercent: 0,
          currency: data.currency || 'EUR',
        };
      });
      setPrices(fallbackPrices);
    } finally {
      setPricesLoading(false);
    }
  }, [allTickers]);

  useEffect(() => {
    void fetchPrices();
    const interval = setInterval(fetchPrices, 300000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  return {
    prices,
    pricesLoading,
    lastUpdate,
    exchangeRates,
    fetchPrices,
  };
}
