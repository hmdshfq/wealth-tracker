import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from './route';

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

describe('/api/health', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns healthy status when both DB and auth are working', async () => {
    mockedSql.mockResolvedValueOnce([{ 1: 1 }]);
    mockedAuth.mockResolvedValueOnce({ userId: 'user_123' } as Awaited<ReturnType<typeof auth>>);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.db).toBe('ok');
    expect(data.auth).toBe('ok');
    expect(typeof data.latencyMs).toBe('number');
  });

  it('returns unhealthy DB status when database fails', async () => {
    mockedSql.mockRejectedValueOnce(new Error('DB connection failed'));
    mockedAuth.mockResolvedValueOnce({ userId: 'user_123' } as Awaited<ReturnType<typeof auth>>);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(false);
    expect(data.db).toBe('error');
    expect(data.auth).toBe('ok');
  });

  it('returns unauthenticated status when user is not logged in', async () => {
    mockedSql.mockResolvedValueOnce([{ 1: 1 }]);
    mockedAuth.mockResolvedValueOnce({ userId: null } as Awaited<ReturnType<typeof auth>>);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.db).toBe('ok');
    expect(data.auth).toBe('unauthenticated');
  });

  it('returns error status when both services fail', async () => {
    mockedSql.mockRejectedValueOnce(new Error('DB connection failed'));
    mockedAuth.mockRejectedValueOnce(new Error('Auth service error'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(false);
    expect(data.db).toBe('error');
    expect(data.auth).toBe('unauthenticated');
  });

  it('measures latency correctly', async () => {
    let callCount = 0;
    const mockNow = vi.fn().mockImplementation(() => {
      callCount++;
      return callCount === 1 ? 1000 : 1100;
    });
    vi.spyOn(Date, 'now').mockImplementation(mockNow);

    mockedSql.mockResolvedValueOnce([{ 1: 1 }]);
    mockedAuth.mockResolvedValueOnce({ userId: 'user_123' } as Awaited<ReturnType<typeof auth>>);

    const response = await GET();
    const data = await response.json();

    expect(data.latencyMs).toBe(100);
  });
});
