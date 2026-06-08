'use client';

import { motion, useReducedMotion } from 'motion/react';
import { Card } from '@/components/ui';
import { fadeVariants, staggerContainerVariants } from '@/lib/animations';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import type { HoldingWithDetails, TickerInfo } from '@/lib/types';

const GRID_CLASSES = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4';

interface TickerSummaryCardsProps {
  holdingsData: HoldingWithDetails[];
  allTickers: Record<string, TickerInfo>;
  isLoading?: boolean;
}

function getCurrency(ticker: string, allTickers: Record<string, TickerInfo>): string {
  return allTickers[ticker]?.currency || 'USD';
}

function formatSafeCurrency(value: number | undefined | null, currency: string): string {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return '—';
  }
  return formatCurrency(value, currency);
}

function formatSafePercent(value: number | undefined | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return '—';
  }
  return formatPercent(value);
}

function percentColorClass(value: number | undefined | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return 'text-gray-500';
  }
  if (value > 0) return 'text-green-500';
  if (value < 0) return 'text-red-500';
  return 'text-gray-400';
}

function HoldingCard({ holding, allTickers }: { holding: HoldingWithDetails; allTickers: Record<string, TickerInfo> }) {
  const currency = getCurrency(holding.ticker, allTickers);

  return (
    <Card>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold uppercase">{holding.ticker}</span>
          <span className={`text-sm font-medium ${percentColorClass(holding.gainPercent)}`}>
            {formatSafePercent(holding.gainPercent)}
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{holding.name}</p>
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>{holding.shares} shares</span>
          <span>Avg {formatSafeCurrency(holding.avgCost, currency)}</span>
          <span>{formatSafeCurrency(holding.gain, currency)}</span>
        </div>
      </div>
    </Card>
  );
}

function SkeletonCards() {
  return (
    <div className={GRID_CLASSES} role="list">
      {[1, 2, 3].map((i) => (
        <Card key={i} role="listitem">
          <div className="animate-pulse space-y-3 p-2">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/3" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          </div>
        </Card>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex justify-center">
      <Card role="status">
        <p className="text-center text-gray-500 dark:text-gray-400 py-8">
          No holdings yet. Add transactions in the Investments tab.
        </p>
      </Card>
    </div>
  );
}

export function TickerSummaryCards({ holdingsData, allTickers, isLoading }: TickerSummaryCardsProps) {
  const prefersReducedMotion = useReducedMotion();

  if (isLoading) {
    return <SkeletonCards />;
  }

  if (!holdingsData || holdingsData.length === 0) {
    return <EmptyState />;
  }

  if (prefersReducedMotion) {
    return (
      <div className={GRID_CLASSES} role="list">
        {holdingsData.map((h) => (
          <div key={h.ticker} role="listitem">
            <HoldingCard holding={h} allTickers={allTickers} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className={GRID_CLASSES}
      role="list"
      variants={staggerContainerVariants}
      initial="initial"
      animate="animate"
    >
      {holdingsData.map((h) => (
        <motion.div key={h.ticker} variants={fadeVariants} role="listitem">
          <HoldingCard holding={h} allTickers={allTickers} />
        </motion.div>
      ))}
    </motion.div>
  );
}
