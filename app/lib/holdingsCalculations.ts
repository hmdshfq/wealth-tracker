import { Transaction, Holding } from './types';

/**
 * Calculate holdings from transaction history
 * Ensures holdings are always consistent with transactions
 */
export function calculateHoldingsFromTransactions(transactions: Transaction[]): Holding[] {
  const holdingsMap = new Map<string, { shares: number; totalCost: number }>();

  // Sort by date to process chronologically
  const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));

  sorted.forEach((tx) => {
    const existing = holdingsMap.get(tx.ticker) || { shares: 0, totalCost: 0 };

    if (tx.action === 'Buy') {
      existing.shares += tx.shares;
      existing.totalCost += tx.shares * tx.price;
    } else if (tx.action === 'Sell') {
      const avgCost = existing.shares > 0 ? existing.totalCost / existing.shares : 0;
      existing.shares -= tx.shares;
      existing.totalCost -= tx.shares * avgCost;
    }

    holdingsMap.set(tx.ticker, existing);
  });

  // Convert to Holding[] and remove zero positions
  return Array.from(holdingsMap.entries())
    .filter(([_, data]) => data.shares > 0)
    .map(([ticker, data]) => ({
      ticker,
      shares: data.shares,
      avgCost: data.shares > 0 ? data.totalCost / data.shares : 0,
    }));
}
