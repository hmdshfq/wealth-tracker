import React from 'react';
import styles from './PriceCard.module.css';

interface PriceCardProps {
  ticker: string;
  name: string;
  price: string;
  change: string;
  changeType: 'positive' | 'negative';
  isDragging?: boolean;
  isDragOver?: boolean;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;
}

export const PriceCard: React.FC<PriceCardProps> = ({
  ticker,
  name,
  price,
  change,
  changeType,
  isDragging = false,
  isDragOver = false,
  draggable = false,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}) => {
  return (
    <div
      className={`${styles.card} ${isDragging ? styles.dragging : ''} ${isDragOver ? styles.dragOver : ''}`}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      <p className={styles.ticker}>{ticker}</p>
      <p className={styles.name}>{name}</p>
      <div className={styles.priceRow}>
        <span className={styles.price}>{price}</span>
        {change && (
          <span className={`${styles.change} ${styles[changeType]}`}>
            {change}
          </span>
        )}
      </div>
    </div>
  );
};

export default PriceCard;
