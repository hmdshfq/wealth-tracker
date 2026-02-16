'use client';
import React from 'react';
import { Card, ChartLoadingSkeleton, PriceCard } from '@/app/components/ui';
import { TickerInfo } from '@/app/lib/types';
import { formatPercent } from '@/app/lib/formatters';
import styles from './Dashboard.module.css';

interface LivePricesProps {
  prices: Record<string, {
    price: number;
    change: number;
    changePercent: number;
    currency: string;
  }>;
  etfData: Record<string, TickerInfo>;
  isLoading?: boolean;
}

export const LivePrices: React.FC<LivePricesProps> = ({ prices, etfData, isLoading = false }) => {
  if (isLoading) {
    return <ChartLoadingSkeleton variant="cards" />;
  }

  return (
    <Card aria-busy={isLoading}>
      <p className={styles.chartTitle}>Live ETF Prices</p>
      <div className={styles.pricesGrid}>
        {Object.entries(etfData).map(([ticker, data]) => {
          const priceInfo = prices[ticker];
          const hasPrice = priceInfo?.price !== undefined && priceInfo?.price !== null;
          const displayPrice = hasPrice ? `€${priceInfo.price.toFixed(2)}` : 'Not available';
          const changePercent = hasPrice ? priceInfo.changePercent : 0;
          return (
            <PriceCard
              key={ticker}
              ticker={ticker}
              name={data.name}
              price={displayPrice}
              change={formatPercent(changePercent)}
              changeType={changePercent >= 0 ? 'positive' : 'negative'}
            />
          );
        })}
      </div>
    </Card>
  );
};

export default LivePrices;
