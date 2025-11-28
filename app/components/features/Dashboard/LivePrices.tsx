'use client';
import React from 'react';
import { Card, PriceCard } from '@/app/components/ui';
import { TickerInfo } from '@/app/lib/types';
import { formatPercent } from '@/app/lib/formatters';
import styles from './Dashboard.module.css';

interface LivePricesProps {
  prices: Record<string, number>;
  etfData: Record<string, TickerInfo>;
}

export const LivePrices: React.FC<LivePricesProps> = ({ prices, etfData }) => {
  return (
    <Card>
      <p className={styles.chartTitle}>Live ETF Prices</p>
      <div className={styles.pricesGrid}>
        {Object.entries(etfData).map(([ticker, data]) => {
          const price = prices[ticker] || data.basePrice;
          const change = ((price - data.basePrice) / data.basePrice) * 100;
          return (
            <PriceCard
              key={ticker}
              ticker={ticker}
              name={data.name}
              price={`€${price.toFixed(2)}`}
              change={formatPercent(change)}
              changeType={change >= 0 ? 'positive' : 'negative'}
            />
          );
        })}
      </div>
    </Card>
  );
};

export default LivePrices;
