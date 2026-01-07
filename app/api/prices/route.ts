import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

// Create instance (required in v3)
const yahooFinance = new YahooFinance();

// Simple in-memory cache with TTL
const cache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL = 300000; // 5 minute cache

// Helper function to sleep/delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry with exponential backoff
async function fetchWithRetry(
  tickers: string[], 
  maxRetries = 3, 
  baseDelay = 1000
): Promise<any> {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Check cache first
      const cacheKey = tickers.sort().join(',');
      const cached = cache.get(cacheKey);
      
      if (cached && cached.expiry > Date.now()) {
        console.log(`Cache hit for: ${cacheKey}`);
        return cached.data;
      }
      
      // Fetch from Yahoo Finance
      const quotes = await yahooFinance.quote(tickers);
      
      // Cache the result
      cache.set(cacheKey, {
        data: quotes,
        expiry: Date.now() + CACHE_TTL
      });
      
      return quotes;
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a rate limit error
      if (error?.message?.includes('429') || error?.message?.includes('Too Many Requests')) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        
        if (attempt < maxRetries - 1) {
          await sleep(delay);
          continue;
        }
      }
      
      // If it's not a rate limit error or we've exhausted retries, throw
      throw error;
    }
  }
  
  throw lastError;
}

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
    const quotes = await fetchWithRetry(tickers);

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
