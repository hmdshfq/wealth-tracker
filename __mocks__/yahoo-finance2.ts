import { vi } from 'vitest';

export const mockQuote = vi.fn();

class MockYahooFinance {
  quote = mockQuote;
}

// Consumed by vitest's vi.mock('yahoo-finance2') loader — it substitutes this
// default export for the package's default at runtime (route.ts does
// `new YahooFinance(...)`). That consumption is invisible to static import
// analysis, which is why react-doctor flags it. Keep the export.
// react-doctor-disable-next-line deslop/unused-export
export default MockYahooFinance;
