import { useCallback, useEffect, useRef, useState } from 'react';
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

const POLL_INTERVAL = 300000; // 5 minutes

export function useMarketData(
  allTickers: Record<string, TickerInfo>,
  preferredCurrency?: PreferredCurrency
) {
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [pricesLoading, setPricesLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [exchangeRates, setExchangeRates] = useState(EXCHANGE_RATES);
  const [fetchedCurrencies, setFetchedCurrencies] = useState<Set<string>>(new Set(['PLN', 'EUR', 'USD']));

  // Keep the latest tickers in a ref so fetchPrices can stay stable across renders
  // even when the parent passes a new object identity for the same ticker set.
  const allTickersRef = useRef(allTickers);
  useEffect(() => {
    allTickersRef.current = allTickers;
  }, [allTickers]);

  // Stable key: only changes when the actual ticker SET changes (adds/removes).
  // A new object identity with the same keys produces the same string, so the
  // fetchPrices callback (and the polling effect) don't churn on unrelated
  // parent re-renders — this was causing a refetch storm before.
  const tickerKey = Object.keys(allTickers).sort().join(',');

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

    const tickers = Object.keys(allTickersRef.current);
    if (tickers.length === 0) {
      // Still refresh rates in parallel-ish; rates are cheap and cacheable.
      setPrices({});
      setLastUpdate(new Date());
      setPricesLoading(false);
      return;
    }

    const tickerParam = tickers.join(',');
    const currentTickers = allTickersRef.current;

    // Fetch prices and rates in parallel — they're independent requests to
    // independent endpoints. Sequential awaiting doubled perceived latency.
    const [pricesResult, ratesResult] = await Promise.allSettled([
      // POST so prefetch/crawlers can't trigger upstream Yahoo calls.
      fetch(`/api/prices?tickers=${tickerParam}`, { method: 'POST' }).then((r) => r.json()),
      fetch('/api/exchange-rates').then((r) => r.json()),
    ]);

    if (pricesResult.status === 'fulfilled' && !pricesResult.value.error) {
      const newPrices: Record<string, PriceData> = {};
      for (const [ticker, info] of Object.entries(pricesResult.value.prices || {})) {
        newPrices[ticker] = info as PriceData;
      }
      setPrices(newPrices);
    } else {
      // Fall back to base prices from constants
      const fallbackPrices: Record<string, PriceData> = {};
      Object.entries(currentTickers || ETF_DATA).forEach(([ticker, data]) => {
        fallbackPrices[ticker] = {
          price: data.basePrice,
          change: 0,
          changePercent: 0,
          currency: data.currency || 'EUR',
        };
      });
      setPrices(fallbackPrices);
    }

    if (ratesResult.status === 'fulfilled') {
      updateGlobalRates(ratesResult.value.rates);
      setFetchedCurrencies(new Set(['PLN', 'EUR', 'USD']));
    }

    setLastUpdate(new Date());
    setPricesLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- tickerKey intentionally drives fetchPrices recreation so the polling effect restarts (cleanup+refetch) when the ticker SET changes, while the body reads the ref for current values.
  }, [tickerKey]);

  // Fetch extra rate when preferredCurrency changes (lazy)
  useEffect(() => {
    if (preferredCurrency && NEEDS_EXTRA_RATE[preferredCurrency]) {
      if (!fetchedCurrencies.has(preferredCurrency)) {
        fetchExtraRate(preferredCurrency);
      }
    }
  }, [preferredCurrency, fetchExtraRate, fetchedCurrencies]);

  // Poll, but pause when the tab is hidden so hidden tabs don't burn Yahoo
  // quota and serverless compute on a 5-minute timer no one is watching.
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (interval) return;
      void fetchPrices();
      interval = setInterval(fetchPrices, POLL_INTERVAL);
    };

    const stop = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    };

    if (!document.hidden) start();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      stop();
    };
  }, [fetchPrices]);

  return {
    prices,
    pricesLoading,
    lastUpdate,
    exchangeRates,
    fetchPrices,
  };
}