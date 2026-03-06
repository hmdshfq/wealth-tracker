'use client';
import React from 'react';
import { Card, ChartLoadingSkeleton, PriceCard } from '@/components/ui';
import { TickerInfo } from '@/lib/types';
import { formatPercent } from '@/lib/formatters';
import { EditableLiveGrid } from './EditableLiveGrid';
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
  isEditing?: boolean;
  tickerOrder?: string[];
  onToggleEdit?: () => void;
  onReorderTickers?: (newOrder: string[]) => void;
}

export const LivePrices: React.FC<LivePricesProps> = ({
  prices,
  etfData,
  isLoading = false,
  isEditing = false,
  tickerOrder = Object.keys(etfData),
  onToggleEdit,
  onReorderTickers,
}) => {
  if (isLoading) {
    return <ChartLoadingSkeleton variant="cards" />;
  }

  return (
    <Card aria-busy={isLoading}>
      <div className={styles.livePricesHeader}>
        <p className={styles.chartTitle}>Live ETF Prices</p>
        {onToggleEdit && (
          <button
            className={styles.editButton}
            onClick={onToggleEdit}
            aria-label={isEditing ? 'Done editing' : 'Edit prices'}
          >
            {isEditing ? 'Done' : 'Edit'}
          </button>
        )}
      </div>

      {isEditing && onReorderTickers ? (
        <EditableLiveGrid
          prices={prices}
          etfData={etfData}
          tickerOrder={tickerOrder}
          onReorder={onReorderTickers}
        />
      ) : (
        <div className={styles.pricesGrid}>
          {tickerOrder
            .filter((ticker) => etfData[ticker])
            .map((ticker) => {
              const data = etfData[ticker];
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
      )}
    </Card>
  );
};

export default LivePrices;
