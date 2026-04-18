import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';

const BASE_URL = 'http://localhost:3000';

describe('/api/ticker-search', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
  });

  it('returns search results for valid query', async () => {
    const mockResponse = {
      quotes: [
        { symbol: 'AAPL', shortname: 'Apple Inc.', exchDisp: 'NASDAQ', typeDisp: 'Equity', isYahooFinance: true },
        { symbol: 'AAP', shortname: 'Advance Auto Parts', exchDisp: 'NYSE', typeDisp: 'Equity', isYahooFinance: true },
      ],
    };

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const request = new NextRequest(`${BASE_URL}/api/ticker-search?query=AAPL`);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results).toHaveLength(2);
    expect(data.results[0]).toEqual({
      symbol: 'AAPL',
      shortname: 'Apple Inc.',
      exchDisp: 'NASDAQ',
      typeDisp: 'Equity',
    });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('query1.finance.yahoo.com/v1/finance/search?q=AAPL')
    );
  });

  it('returns 400 when query parameter is missing', async () => {
    const request = new NextRequest(`${BASE_URL}/api/ticker-search`);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Query parameter is required');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns 400 when query parameter is empty', async () => {
    const request = new NextRequest(`${BASE_URL}/api/ticker-search?query=`);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Query parameter is required');
  });

  it('filters out non-Yahoo Finance results', async () => {
    const mockResponse = {
      quotes: [
        { symbol: 'AAPL', shortname: 'Apple Inc.', exchDisp: 'NASDAQ', typeDisp: 'Equity', isYahooFinance: true },
        { symbol: 'UNKNOWN', shortname: 'Unknown Company', isYahooFinance: false },
      ],
    };

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const request = new NextRequest(`${BASE_URL}/api/ticker-search?query=AAPL`);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results).toHaveLength(1);
    expect(data.results[0].symbol).toBe('AAPL');
  });

  it('uses longname when shortname is not available', async () => {
    const mockResponse = {
      quotes: [
        { symbol: 'TSLA', longname: 'Tesla, Inc.', exchDisp: 'NASDAQ', typeDisp: 'Equity', isYahooFinance: true },
      ],
    };

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const request = new NextRequest(`${BASE_URL}/api/ticker-search?query=TSLA`);
    const response = await GET(request);
    const data = await response.json();

    expect(data.results[0].shortname).toBe('Tesla, Inc.');
  });

  it('falls back to symbol when neither shortname nor longname is available', async () => {
    const mockResponse = {
      quotes: [
        { symbol: 'XYZ', exchDisp: 'NYSE', typeDisp: 'Equity', isYahooFinance: true },
      ],
    };

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const request = new NextRequest(`${BASE_URL}/api/ticker-search?query=XYZ`);
    const response = await GET(request);
    const data = await response.json();

    expect(data.results[0].shortname).toBe('XYZ');
  });

  it('handles Yahoo Finance API error', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 503,
    } as Response);

    const request = new NextRequest(`${BASE_URL}/api/ticker-search?query=AAPL`);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch search results');
  });

  it('handles network errors', async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

    const request = new NextRequest(`${BASE_URL}/api/ticker-search?query=AAPL`);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch search results');
  });

  it('handles empty quotes array', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ quotes: [] }),
    } as Response);

    const request = new NextRequest(`${BASE_URL}/api/ticker-search?query=XYZ123NONEXISTENT`);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results).toEqual([]);
  });

  it('handles missing quotes field', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ error: 'No data' }),
    } as Response);

    const request = new NextRequest(`${BASE_URL}/api/ticker-search?query=AAPL`);
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results).toEqual([]);
  });

  it('encodes query parameter correctly', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ quotes: [] }),
    } as Response);

    const request = new NextRequest(`${BASE_URL}/api/ticker-search?query=Berkshire+Hathaway`);
    await GET(request);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('q=Berkshire%20Hathaway')
    );
  });
});
