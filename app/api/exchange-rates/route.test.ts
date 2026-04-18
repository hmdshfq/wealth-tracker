import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';
import { mockQuote } from '@/__mocks__/yahoo-finance2';

vi.mock('yahoo-finance2');

const BASE_URL = 'http://localhost:3000';

describe('/api/exchange-rates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQuote.mockReset();
  });

  it('returns base rates with fallback values', async () => {
    const mockQuotes = [
      { symbol: 'EURPLN=X', regularMarketPrice: 4.31 },
      { symbol: 'USDPLN=X', regularMarketPrice: 4.05 },
    ];
    mockQuote.mockResolvedValueOnce(mockQuotes);

    const request = new NextRequest(`${BASE_URL}/api/exchange-rates`);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.rates).toHaveProperty('EUR_PLN');
    expect(data.rates).toHaveProperty('USD_PLN');
    expect(data.timestamp).toBeDefined();
    expect(data.fallback).toBeUndefined();
  });

  it('includes target currency rate when specified', async () => {
    const mockQuotes = [
      { symbol: 'EURPLN=X', regularMarketPrice: 4.31 },
      { symbol: 'USDPLN=X', regularMarketPrice: 4.05 },
      { symbol: 'GBPUSD=X', regularMarketPrice: 1.25 }, // 1 GBP = 1.25 USD
    ];
    mockQuote.mockResolvedValueOnce(mockQuotes);

    const request = new NextRequest(`${BASE_URL}/api/exchange-rates?target=GBP`);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.rates).toHaveProperty('EUR_PLN');
    expect(data.rates).toHaveProperty('USD_PLN');
    expect(data.rates).toHaveProperty('GBP_USD');
    expect(data.rates).toHaveProperty('GBP_PLN');
    // GBP_USD should be inverse of the Yahoo rate: 1 / 1.25 = 0.8
    expect(data.rates.GBP_USD).toBeCloseTo(0.8, 2);
  });

  it('does not add extra pairs for PLN target', async () => {
    const mockQuotes = [
      { symbol: 'EURPLN=X', regularMarketPrice: 4.31 },
      { symbol: 'USDPLN=X', regularMarketPrice: 4.05 },
    ];
    mockQuote.mockResolvedValueOnce(mockQuotes);

    const request = new NextRequest(`${BASE_URL}/api/exchange-rates?target=PLN`);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockQuote).toHaveBeenCalledWith(['EURPLN=X', 'USDPLN=X']);
    expect(data.rates.EUR_PLN).toBe(4.31);
  });

  it('does not add extra pairs for EUR target', async () => {
    const mockQuotes = [
      { symbol: 'EURPLN=X', regularMarketPrice: 4.31 },
      { symbol: 'USDPLN=X', regularMarketPrice: 4.05 },
    ];
    mockQuote.mockResolvedValueOnce(mockQuotes);

    const request = new NextRequest(`${BASE_URL}/api/exchange-rates?target=EUR`);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockQuote).toHaveBeenCalledWith(['EURPLN=X', 'USDPLN=X']);
  });

  it('does not add extra pairs for USD target', async () => {
    const mockQuotes = [
      { symbol: 'EURPLN=X', regularMarketPrice: 4.31 },
      { symbol: 'USDPLN=X', regularMarketPrice: 4.05 },
    ];
    mockQuote.mockResolvedValueOnce(mockQuotes);

    const request = new NextRequest(`${BASE_URL}/api/exchange-rates?target=USD`);
    const response = await GET(request);

    expect(mockQuote).toHaveBeenCalledWith(['EURPLN=X', 'USDPLN=X']);
  });

  it('handles unsupported target currency gracefully', async () => {
    const mockQuotes = [
      { symbol: 'EURPLN=X', regularMarketPrice: 4.31 },
      { symbol: 'USDPLN=X', regularMarketPrice: 4.05 },
    ];
    mockQuote.mockResolvedValueOnce(mockQuotes);

    const request = new NextRequest(`${BASE_URL}/api/exchange-rates?target=XXX`);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.rates.EUR_PLN).toBe(4.31);
    expect(data.rates.XXX_USD).toBeUndefined();
  });

  it('returns 200 with fallback rates when Yahoo Finance API fails', async () => {
    mockQuote.mockRejectedValueOnce(new Error('API error'));

    const request = new NextRequest(`${BASE_URL}/api/exchange-rates`);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.fallback).toBe(true);
    expect(data.rates.EUR_PLN).toBe(4.31);
    expect(data.rates.USD_PLN).toBe(4.05);
  });

  it('handles single quote response (non-array)', async () => {
    const mockQuotes = { symbol: 'EURPLN=X', regularMarketPrice: 4.31 };
    mockQuote.mockResolvedValueOnce(mockQuotes);

    const request = new NextRequest(`${BASE_URL}/api/exchange-rates`);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.rates.EUR_PLN).toBe(4.31);
  });

  it('updates rates when valid quotes are returned', async () => {
    const mockQuotes = [
      { symbol: 'EURPLN=X', regularMarketPrice: 4.50 },
      { symbol: 'USDPLN=X', regularMarketPrice: 4.10 },
    ];
    mockQuote.mockResolvedValueOnce(mockQuotes);

    const request = new NextRequest(`${BASE_URL}/api/exchange-rates`);
    const response = await GET(request);
    const data = await response.json();

    expect(data.rates.EUR_PLN).toBe(4.50);
    expect(data.rates.USD_PLN).toBe(4.10);
  });

  it('keeps fallback rates when API returns zero prices', async () => {
    const mockQuotes = [
      { symbol: 'EURPLN=X', regularMarketPrice: 0 },
      { symbol: 'USDPLN=X', regularMarketPrice: 0 },
    ];
    mockQuote.mockResolvedValueOnce(mockQuotes);

    const request = new NextRequest(`${BASE_URL}/api/exchange-rates`);
    const response = await GET(request);
    const data = await response.json();

    expect(data.rates.EUR_PLN).toBe(4.31);
    expect(data.rates.USD_PLN).toBe(4.05);
  });

  it('keeps fallback rates when API returns null prices', async () => {
    const mockQuotes = [
      { symbol: 'EURPLN=X', regularMarketPrice: null },
      { symbol: 'USDPLN=X', regularMarketPrice: null },
    ];
    mockQuote.mockResolvedValueOnce(mockQuotes);

    const request = new NextRequest(`${BASE_URL}/api/exchange-rates`);
    const response = await GET(request);
    const data = await response.json();

    expect(data.rates.EUR_PLN).toBe(4.31);
    expect(data.rates.USD_PLN).toBe(4.05);
  });
});
