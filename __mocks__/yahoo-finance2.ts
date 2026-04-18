import { vi } from 'vitest';

export const mockQuote = vi.fn();

class MockYahooFinance {
  quote = mockQuote;
}

export default MockYahooFinance;
