// Cacheable: prices are slow-moving. revalidate feeds the Next.js data cache;
// the Cache-Control header lets the CDN serve stale-while-revalidate so cold
// starts no longer bypass caching entirely.
export const revalidate = 300;

import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';
import type { Quote, QuoteResponseArray } from 'yahoo-finance2/modules/quote';

// Create instance (required in v3)
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

// Simple in-memory cache with TTL
const cache = new Map<string, { data: QuoteResponseArray | Quote; expiry: number }>();
const CACHE_TTL = 300000; // 5 minute cache

// Helper function to sleep/delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Transient errors worth retrying: rate limits, timeouts, dropped sockets, 5xx.
const TRANSIENT_ERROR = /429|too many requests|timeout|timed out|econnreset|etimedout|socket hang|network|\b5\d{2}\b|503|502|504/i;

// Retry with exponential backoff
async function fetchWithRetry(
  tickers: string[], 
  maxRetries = 3, 
  baseDelay = 1000
): Promise<QuoteResponseArray | Quote> {
  let lastError: unknown;
  
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
    } catch (error: unknown) {
      lastError = error;
      
      // Retry on rate limits OR transient network errors (not just 429).
      // ponytail: regex match avoids an exhaustive error-class list; yahoo-finance2
      // surfaces opaque Error messages, so substring matching is the robust path.
      if (error instanceof Error && TRANSIENT_ERROR.test(error.message)) {
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
    }, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' },
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
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
