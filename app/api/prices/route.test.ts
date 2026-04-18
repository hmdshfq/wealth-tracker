import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';
import { mockQuote } from '@/__mocks__/yahoo-finance2';

vi.mock('yahoo-finance2');

const BASE_URL = 'http://localhost:3000';

describe('/api/prices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQuote.mockReset();
  });

  it('returns prices for requested tickers', async () => {
    const mockQuotes = [
      { symbol: 'AAPL', regularMarketPrice: 175.5, regularMarketChange: 2.5, regularMarketChangePercent: 1.45, currency: 'USD' },
      { symbol: 'MSFT', regularMarketPrice: 380.25, regularMarketChange: -1.25, regularMarketChangePercent: -0.33, currency: 'USD' },
    ];
    mockQuote.mockResolvedValueOnce(mockQuotes);

    const request = new NextRequest(`${BASE_URL}/api/prices?tickers=AAPL,MSFT`);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.prices).toHaveProperty('AAPL');
    expect(data.prices).toHaveProperty('MSFT');
    expect(data.prices.AAPL).toEqual({ 
      price: 175.5, 
      change: 2.5, 
      changePercent: 1.45,
      currency: 'USD' 
    });
    expect(data.prices.MSFT).toEqual({ 
      price: 380.25, 
      change: -1.25, 
      changePercent: -0.33,
      currency: 'USD' 
    });
    expect(data.timestamp).toBeDefined();
    expect(data.fallback).toBeUndefined();
  });

  it('returns error when tickers parameter is missing', async () => {
    const request = new NextRequest(`${BASE_URL}/api/prices`);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.error).toBe('No tickers provided');
    expect(data.prices).toEqual({});
  });

  it('returns error when tickers parameter is empty', async () => {
    const request = new NextRequest(`${BASE_URL}/api/prices?tickers=`);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.error).toBe('No tickers provided');
    expect(data.prices).toEqual({});
  });

  it('handles single ticker correctly', async () => {
    const mockQuotes = { symbol: 'TSLA', regularMarketPrice: 250.75, regularMarketChange: 5.0, regularMarketChangePercent: 2.03, currency: 'USD' };
    mockQuote.mockResolvedValueOnce(mockQuotes);

    const request = new NextRequest(`${BASE_URL}/api/prices?tickers=TSLA`);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.prices).toHaveProperty('TSLA');
    expect(data.prices.TSLA).toEqual({ 
      price: 250.75, 
      change: 5.0,
      changePercent: 2.03,
      currency: 'USD' 
    });
  });

  it('returns fallback response when Yahoo Finance throws an error', async () => {
    mockQuote.mockRejectedValueOnce(new Error('API limit exceeded'));

    const request = new NextRequest(`${BASE_URL}/api/prices?tickers=AAPL`);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.error).toBe('Failed to fetch prices');
    expect(data.fallback).toBe(true);
    expect(data.prices).toEqual({});
    expect(data.timestamp).toBeDefined();
  });

  it('includes quotes with zero price (defaults to 0)', async () => {
    const mockQuotes = [
      { symbol: 'AAPL', regularMarketPrice: 175.5, regularMarketChange: 2.5, regularMarketChangePercent: 1.45, currency: 'USD' },
      { symbol: 'NULL', regularMarketPrice: 0, currency: 'USD' },
    ];
    mockQuote.mockResolvedValueOnce(mockQuotes);

    const request = new NextRequest(`${BASE_URL}/api/prices?tickers=AAPL,NULL`);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.prices).toHaveProperty('AAPL');
    expect(data.prices).toHaveProperty('NULL');
    expect(data.prices.NULL.price).toBe(0);
    expect(data.prices.NULL.change).toBe(0);
    expect(data.prices.NULL.changePercent).toBe(0);
  });

  it('handles missing quote fields with defaults', async () => {
    const mockQuotes = [
      { symbol: 'TEST', regularMarketPrice: 100 },
    ];
    mockQuote.mockResolvedValueOnce(mockQuotes);

    const request = new NextRequest(`${BASE_URL}/api/prices?tickers=TEST`);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.prices.TEST).toEqual({ 
      price: 100, 
      change: 0, 
      changePercent: 0,
      currency: 'EUR' 
    });
  });

  it('handles special .WA ticker suffix for Warsaw Stock Exchange', async () => {
    const mockQuotes = [{ symbol: 'PKO.WA', regularMarketPrice: 45.5, currency: 'PLN' }];
    mockQuote.mockResolvedValueOnce(mockQuotes);

    const request = new NextRequest(`${BASE_URL}/api/prices?tickers=PKO.WA`);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.prices['PKO.WA']).toEqual({ 
      price: 45.5, 
      change: 0,
      changePercent: 0,
      currency: 'PLN' 
    });
  });

  it('uses cache on subsequent requests', async () => {
    const mockQuotes = [{ symbol: 'AAPL', regularMarketPrice: 175.5, currency: 'USD' }];
    mockQuote.mockResolvedValueOnce(mockQuotes);

    // First request
    const request1 = new NextRequest(`${BASE_URL}/api/prices?tickers=AAPL`);
    await GET(request1);

    // Second request should use cache (mock not called again)
    const request2 = new NextRequest(`${BASE_URL}/api/prices?tickers=AAPL`);
    await GET(request2);

    expect(mockQuote).toHaveBeenCalledTimes(1);
  });

  it('decodes URL-encoded tickers', async () => {
    const mockQuotes = [{ symbol: 'BRK.B', regularMarketPrice: 350.0, currency: 'USD' }];
    mockQuote.mockResolvedValueOnce(mockQuotes);

    const request = new NextRequest(`${BASE_URL}/api/prices?tickers=BRK.B`);
    const response = await GET(request);

    expect(mockQuote).toHaveBeenCalledWith(['BRK.B']);
    expect(response.status).toBe(200);
  });
});
