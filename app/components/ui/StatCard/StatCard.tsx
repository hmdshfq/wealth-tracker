import React from 'react';
import styles from './StatCard.module.css';
import { Card } from '../Card';

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  subValueColor?: 'positive' | 'negative' | 'muted';
  footer?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subValue,
  subValueColor = 'muted',
  footer,
}) => {
  return (
    <Card>
      <p className={styles.label}>{label}</p>
      <p className={styles.value}>{value}</p>
      {subValue && (
        <p className={`${styles.subValue} ${styles[subValueColor]}`}>
          {subValue}
        </p>
      )}
      {footer && <div className={styles.footer}>{footer}</div>}
    </Card>
  );
};

export default StatCard;
