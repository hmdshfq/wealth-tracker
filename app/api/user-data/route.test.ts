import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PUT } from './route';

// Mock dependencies
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  sql: vi.fn(),
}));

import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';

const mockedAuth = vi.mocked(auth);
const mockedSql = vi.mocked(sql);

describe('/api/user-data', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('GET', () => {
    it('returns user data for authenticated user', async () => {
      const mockData = {
        goal: { targetAmount: 100000, targetDate: '2025-12-31' },
        transactions: [],
        cash: { PLN: 5000 },
      };

      mockedAuth.mockResolvedValueOnce({ userId: 'user_123' } as Awaited<ReturnType<typeof auth>>);
      mockedSql.mockResolvedValueOnce([]); // CREATE TABLE
      mockedSql.mockResolvedValueOnce([{ data: mockData }]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toEqual(mockData);
    });

    it('returns null data when user has no saved data', async () => {
      mockedAuth.mockResolvedValueOnce({ userId: 'user_123' } as Awaited<ReturnType<typeof auth>>);
      mockedSql.mockResolvedValueOnce([]); // CREATE TABLE
      mockedSql.mockResolvedValueOnce([]); // SELECT returns empty

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toBeNull();
    });

    it('returns 401 when user is not authenticated', async () => {
      mockedAuth.mockResolvedValueOnce({ userId: null } as Awaited<ReturnType<typeof auth>>);

      const response = await GET();
      const text = await response.text();

      expect(response.status).toBe(401);
      expect(text).toBe('Unauthorized');
      expect(mockedSql).not.toHaveBeenCalled();
    });

    it('returns 500 when database error occurs', async () => {
      mockedAuth.mockResolvedValueOnce({ userId: 'user_123' } as Awaited<ReturnType<typeof auth>>);
      mockedSql.mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await GET();
      const text = await response.text();

      expect(response.status).toBe(500);
      expect(text).toBe('Failed to load user data');
    });
  });

  describe('PUT', () => {
    it('saves user data successfully', async () => {
      const mockPayload = {
        goal: { targetAmount: 100000, targetDate: '2025-12-31' },
        transactions: [{ id: '1', ticker: 'AAPL', amount: 10 }],
        cash: { PLN: 5000, USD: 1000 },
      };

      mockedAuth.mockResolvedValueOnce({ userId: 'user_123' } as Awaited<ReturnType<typeof auth>>);
      mockedSql.mockResolvedValueOnce([]); // CREATE TABLE
      mockedSql.mockResolvedValueOnce([]); // INSERT/UPDATE

      const request = new Request('http://localhost:3000/api/user-data', {
        method: 'PUT',
        body: JSON.stringify(mockPayload),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(mockedSql).toHaveBeenCalledTimes(2);
    });

    it('returns 401 when user is not authenticated', async () => {
      mockedAuth.mockResolvedValueOnce({ userId: null } as Awaited<ReturnType<typeof auth>>);

      const request = new Request('http://localhost:3000/api/user-data', {
        method: 'PUT',
        body: JSON.stringify({ goal: {} }),
      });

      const response = await PUT(request);
      const text = await response.text();

      expect(response.status).toBe(401);
      expect(text).toBe('Unauthorized');
    });

    it('returns 400 for invalid payload (null)', async () => {
      mockedAuth.mockResolvedValueOnce({ userId: 'user_123' } as Awaited<ReturnType<typeof auth>>);

      const request = new Request('http://localhost:3000/api/user-data', {
        method: 'PUT',
        body: JSON.stringify(null),
      });

      const response = await PUT(request);
      const text = await response.text();

      expect(response.status).toBe(400);
      expect(text).toBe('Invalid payload');
    });

    it('returns 400 for invalid payload (string)', async () => {
      mockedAuth.mockResolvedValueOnce({ userId: 'user_123' } as Awaited<ReturnType<typeof auth>>);

      const request = new Request('http://localhost:3000/api/user-data', {
        method: 'PUT',
        body: JSON.stringify('invalid'),
      });

      const response = await PUT(request);
      const text = await response.text();

      expect(response.status).toBe(400);
      expect(text).toBe('Invalid payload');
    });

    it('returns 400 for invalid payload (number)', async () => {
      mockedAuth.mockResolvedValueOnce({ userId: 'user_123' } as Awaited<ReturnType<typeof auth>>);

      const request = new Request('http://localhost:3000/api/user-data', {
        method: 'PUT',
        body: JSON.stringify(123),
      });

      const response = await PUT(request);
      const text = await response.text();

      expect(response.status).toBe(400);
      expect(text).toBe('Invalid payload');
    });

    it('handles array payload (arrays are objects in JS)', async () => {
      mockedAuth.mockResolvedValueOnce({ userId: 'user_123' } as Awaited<ReturnType<typeof auth>>);
      mockedSql.mockResolvedValueOnce([]);
      mockedSql.mockResolvedValueOnce([]);

      const request = new Request('http://localhost:3000/api/user-data', {
        method: 'PUT',
        body: JSON.stringify([1, 2, 3]),
      });

      const response = await PUT(request);
      const data = await response.json();

      // Arrays are typeof "object" in JavaScript, so they're accepted
      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
    });

    it('returns 500 when database upsert fails', async () => {
      const mockPayload = { goal: {}, transactions: [], cash: {} };

      mockedAuth.mockResolvedValueOnce({ userId: 'user_123' } as Awaited<ReturnType<typeof auth>>);
      mockedSql.mockResolvedValueOnce([]); // CREATE TABLE succeeds
      mockedSql.mockRejectedValueOnce(new Error('Upsert failed'));

      const request = new Request('http://localhost:3000/api/user-data', {
        method: 'PUT',
        body: JSON.stringify(mockPayload),
      });

      const response = await PUT(request);
      const text = await response.text();

      expect(response.status).toBe(500);
      expect(text).toBe('Failed to save user data');
    });

    it('handles complete payload with all optional fields', async () => {
      const mockPayload = {
        goal: { targetAmount: 100000 },
        transactions: [],
        cash: {},
        cashTransactions: [],
        customTickers: [],
        tickerOrder: ['AAPL', 'MSFT'],
      };

      mockedAuth.mockResolvedValueOnce({ userId: 'user_123' } as Awaited<ReturnType<typeof auth>>);
      mockedSql.mockResolvedValueOnce([]);
      mockedSql.mockResolvedValueOnce([]);

      const request = new Request('http://localhost:3000/api/user-data', {
        method: 'PUT',
        body: JSON.stringify(mockPayload),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
    });

    it('handles empty object payload', async () => {
      mockedAuth.mockResolvedValueOnce({ userId: 'user_123' } as Awaited<ReturnType<typeof auth>>);
      mockedSql.mockResolvedValueOnce([]);
      mockedSql.mockResolvedValueOnce([]);

      const request = new Request('http://localhost:3000/api/user-data', {
        method: 'PUT',
        body: JSON.stringify({}),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
    });
  });
});
