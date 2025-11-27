import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

// Create instance (required in v3)
const yahooFinance = new YahooFinance();

// Fallback rates in case API fails
const FALLBACK_RATES = {
  EUR_PLN: 4.31,
  USD_PLN: 4.05,
  EUR_USD: 1.06,
};

export async function GET() {
  try {
    const pairs = ['EURPLN=X', 'USDPLN=X', 'EURUSD=X'];
    const quotes = await yahooFinance.quote(pairs);

    const quotesArray = Array.isArray(quotes) ? quotes : [quotes];

    const rates: Record<string, number> = { ...FALLBACK_RATES };

    for (const quote of quotesArray) {
      if (quote?.symbol === 'EURPLN=X' && quote.regularMarketPrice) {
        rates.EUR_PLN = quote.regularMarketPrice;
      }
      if (quote?.symbol === 'USDPLN=X' && quote.regularMarketPrice) {
        rates.USD_PLN = quote.regularMarketPrice;
      }
      if (quote?.symbol === 'EURUSD=X' && quote.regularMarketPrice) {
        rates.EUR_USD = quote.regularMarketPrice;
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
