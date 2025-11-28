import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

// Create instance (required in v3)
const yahooFinance = new YahooFinance();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tickersParam = searchParams.get('tickers');

  if (!tickersParam) {
    return NextResponse.json({ 
      error: 'No tickers provided', 
      prices: {},
      timestamp: new Date().toISOString() 
    }, { status: 200 });
  }

  const tickers = tickersParam.split(',').filter(t => t.trim());
  
  if (tickers.length === 0) {
    return NextResponse.json({ 
      error: 'No valid tickers provided', 
      prices: {},
      timestamp: new Date().toISOString() 
    }, { status: 200 });
  }

  try {
    const quotes = await yahooFinance.quote(tickers);

    // Handle both single and multiple ticker responses
    const quotesArray = Array.isArray(quotes) ? quotes : [quotes];

    const prices: Record<string, { 
      price: number; 
      change: number; 
      changePercent: number;
      currency: string;
    }> = {};

    for (const quote of quotesArray) {
      if (quote && quote.symbol) {
        prices[quote.symbol] = {
          price: quote.regularMarketPrice ?? 0,
          change: quote.regularMarketChange ?? 0,
          changePercent: quote.regularMarketChangePercent ?? 0,
          currency: quote.currency ?? 'EUR',
        };
      }
    }

    return NextResponse.json({
      prices,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Yahoo Finance error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch prices',
        prices: {},
        timestamp: new Date().toISOString(),
        fallback: true 
      },
      { status: 200 }
    );
  }
}
