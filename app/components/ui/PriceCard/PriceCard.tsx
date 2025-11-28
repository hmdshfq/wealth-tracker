import React from 'react';
import styles from './PriceCard.module.css';

interface PriceCardProps {
  ticker: string;
  name: string;
  price: string;
  change: string;
  changeType: 'positive' | 'negative';
}

export const PriceCard: React.FC<PriceCardProps> = ({
  ticker,
  name,
  price,
  change,
  changeType,
}) => {
  return (
    <div className={styles.card}>
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
