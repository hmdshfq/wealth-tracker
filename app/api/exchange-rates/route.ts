import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

// Create instance (required in v3)
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

// Base pair always needed (PLN base)
const BASE_PAIRS = ['EURPLN=X', 'USDPLN=X'];

// All supported currency pairs to USD (for additional conversions)
const ALL_PAIRS: Record<string, string> = {
  GBP: 'GBPUSD=X',
  JPY: 'JPYUSD=X',
  CHF: 'CHFUSD=X',
  CAD: 'CADUSD=X',
  AUD: 'AUDUSD=X',
  CNY: 'CNYUSD=X',
  INR: 'INRUSD=X',
  KRW: 'KRWUSD=X',
  SGD: 'SGDUSD=X',
  HKD: 'HKDUSD=X',
  NZD: 'NZDUSD=X',
  SEK: 'SEKUSD=X',
  NOK: 'NOKUSD=X',
  DKK: 'DKKUSD=X',
  MXN: 'MXNUSD=X',
  BRL: 'BRLUSD=X',
  CZK: 'CZKUSD=X',
  HUF: 'HUFUSD=X',
  TRY: 'TRYUSD=X',
  ZAR: 'ZARUSD=X',
};

// Fallback rates in case API fails
const FALLBACK_RATES = {
  EUR_PLN: 4.31,
  USD_PLN: 4.05,
};

/** Get the Yahoo Finance symbol for converting from PLN to target currency */
function getPLNSymbol(targetCurrency: string): string {
  if (targetCurrency === 'PLN') return 'EURPLN=X'; // base
  if (targetCurrency === 'EUR') return 'EURPLN=X';
  if (targetCurrency === 'USD') return 'USDPLN=X';
  // For other currencies, we need to go through USD
  // e.g., PLN -> USD -> GBP
  return `${targetCurrency}USD=X`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const target = searchParams.get('target');
    const base = searchParams.get('base') || 'PLN';

    // Determine which pairs to fetch
    const pairsToFetch = [...BASE_PAIRS];

    // If a specific target currency is requested, add its pair
    if (target && target !== 'PLN' && target !== 'EUR' && target !== 'USD') {
      const symbol = ALL_PAIRS[target];
      if (symbol) {
        pairsToFetch.push(symbol);
      }
    }

    // Fetch quotes
    const quotes = await yahooFinance.quote(pairsToFetch);
    const quotesArray = Array.isArray(quotes) ? quotes : [quotes];

    // Build rates object
    const rates: Record<string, number> = { ...FALLBACK_RATES };

    for (const quote of quotesArray) {
      if (quote?.symbol === 'EURPLN=X' && quote.regularMarketPrice) {
        rates.EUR_PLN = quote.regularMarketPrice;
      }
      if (quote?.symbol === 'USDPLN=X' && quote.regularMarketPrice) {
        rates.USD_PLN = quote.regularMarketPrice;
      }
      // Handle additional currencies (USD based)
      // Yahoo gives us "USD per foreign currency" (e.g., CNYUSD=X = 0.137 means 1 CNY = 0.137 USD)
      // We need to store the INVERSE: "foreign currency per USD" for direct multiplication
      if (quote?.regularMarketPrice && quote.symbol?.includes('USD=X')) {
        const currency = quote.symbol.replace('USD=X', '');
        if (currency && !currency.includes('PLN') && quote.regularMarketPrice !== 0) {
          rates[`${currency}_USD`] = 1 / quote.regularMarketPrice;
        }
      }
    }

    // Calculate cross rates for all requested currencies from PLN
    // Now that usdRate is "target per USD" (inverted from Yahoo), we use direct rates properly
    if (target && target !== 'PLN' && target !== 'EUR' && target !== 'USD') {
      const usdRate = rates[`${target}_USD`];
      if (usdRate && rates.USD_PLN) {
        // PLN -> USD -> target: (PLN/USD) * (target/USD) = target/PLN * target per USD
        // Since USD_PLN = PLN per USD, and USD_USD = 1, and usdRate = CNY per USD
        // We want: how many target per PLN = (USD per PLN) * (target per USD)
        // USD per PLN = 1 / USD_PLN = 1 / 3.5878
        // target per PLN = (target per USD) / USD_PLN
        rates[`${target}_PLN`] = usdRate / rates.USD_PLN;
      }
    }

    return NextResponse.json({
      rates,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Exchange rates fetch error:', error);
    // Return fallback rates on error
    return NextResponse.json({
      rates: FALLBACK_RATES,
      timestamp: new Date().toISOString(),
      fallback: true,
    });
  }
}