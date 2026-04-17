import { useCallback, useEffect, useState } from 'react';
import { ETF_DATA, EXCHANGE_RATES } from '../constants';
import { PreferredCurrency, TickerInfo } from '../types';
import { setExchangeRates as updateGlobalRates } from '../formatters';

export type PriceData = {
  price: number;
  change: number;
  changePercent: number;
  currency: string;
};

// Currencies that need additional API calls beyond base pairs
const NEEDS_EXTRA_RATE: Record<string, boolean> = {
  GBP: true,
  JPY: true,
  CHF: true,
  CAD: true,
  AUD: true,
  CNY: true,
  INR: true,
  KRW: true,
  SGD: true,
  HKD: true,
  NZD: true,
  SEK: true,
  NOK: true,
  DKK: true,
  MXN: true,
  BRL: true,
  CZK: true,
  HUF: true,
  TRY: true,
  ZAR: true,
};

export function useMarketData(
  allTickers: Record<string, TickerInfo>,
  preferredCurrency?: PreferredCurrency
) {
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [pricesLoading, setPricesLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [exchangeRates, setExchangeRates] = useState(EXCHANGE_RATES);
  const [fetchedCurrencies, setFetchedCurrencies] = useState<Set<string>>(new Set(['PLN', 'EUR', 'USD']));

  // Fetch additional exchange rate for the preferred currency if needed
  const fetchExtraRate = useCallback(async (currency: string) => {
    if (!NEEDS_EXTRA_RATE[currency]) return;

    try {
      const response = await fetch(`/api/exchange-rates?target=${currency}`);
      if (response.ok) {
        const data = await response.json();
        setExchangeRates((prev) => ({ ...prev, ...data.rates }));
        // Also update global rates for currency conversion
        updateGlobalRates(data.rates);
        setFetchedCurrencies((prev) => new Set([...prev, currency]));
      }
    } catch (error) {
      console.error('Failed to fetch extra exchange rate:', error);
    }
  }, []);

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
        updateGlobalRates(ratesData.rates);
        setFetchedCurrencies(new Set(['PLN', 'EUR', 'USD']));
      }

      setLastUpdate(new Date());
    } catch {
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

  // Fetch extra rate when preferredCurrency changes (lazy)
  useEffect(() => {
    if (preferredCurrency && NEEDS_EXTRA_RATE[preferredCurrency]) {
      if (!fetchedCurrencies.has(preferredCurrency)) {
        fetchExtraRate(preferredCurrency);
      }
    }
  }, [preferredCurrency, fetchExtraRate, fetchedCurrencies]);

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