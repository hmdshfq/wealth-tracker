'use client';
import React, { useState } from 'react';
import { DraggableTickerCard } from './DraggableTickerCard';
import { TickerInfo } from '@/lib/types';
import { formatPercent } from '@/lib/formatters';
import styles from './Dashboard.module.css';

interface EditableLiveGridProps {
  prices: Record<string, {
    price: number;
    change: number;
    changePercent: number;
    currency: string;
  }>;
  etfData: Record<string, TickerInfo>;
  tickerOrder: string[];
  onReorder: (newOrder: string[]) => void;
}

export const EditableLiveGrid: React.FC<EditableLiveGridProps> = ({
  prices,
  etfData,
  tickerOrder,
  onReorder,
}) => {
  const [draggedTicker, setDraggedTicker] = useState<string | null>(null);
  const [tempOrder, setTempOrder] = useState<string[]>(tickerOrder);

  const handleDragStart = (ticker: string) => {
    setDraggedTicker(ticker);
  };

  const handleDragOver = (targetTicker: string) => {
    if (!draggedTicker || draggedTicker === targetTicker) return;

    const draggedIdx = tempOrder.indexOf(draggedTicker);
    const targetIdx = tempOrder.indexOf(targetTicker);

    if (draggedIdx === -1 || targetIdx === -1) return;

    const newOrder = [...tempOrder];
    const [draggedItem] = newOrder.splice(draggedIdx, 1);
    newOrder.splice(targetIdx, 0, draggedItem);
    setTempOrder(newOrder);
  };

  const handleDragEnd = () => {
    setDraggedTicker(null);
    onReorder(tempOrder);
  };

  return (
    <div className={styles.pricesGrid}>
      {tempOrder
        .filter((ticker) => etfData[ticker])
        .map((ticker) => {
          const data = etfData[ticker];
          const priceInfo = prices[ticker];
          const hasPrice = priceInfo?.price !== undefined && priceInfo?.price !== null;
          const displayPrice = hasPrice ? `€${priceInfo.price.toFixed(2)}` : 'Not available';
          const changePercent = hasPrice ? priceInfo.changePercent : 0;

          return (
            <DraggableTickerCard
              key={ticker}
              ticker={ticker}
              name={data.name}
              price={displayPrice}
              change={formatPercent(changePercent)}
              changeType={changePercent >= 0 ? 'positive' : 'negative'}
              isDragging={draggedTicker === ticker}
              onDragStart={() => handleDragStart(ticker)}
              onDragOver={() => handleDragOver(ticker)}
              onDragEnd={handleDragEnd}
            />
          );
        })}
    </div>
  );
};

export default EditableLiveGrid;
