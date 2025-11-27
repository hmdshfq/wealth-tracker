import React from 'react';
import styles from './LegendItem.module.css';

interface LegendItemProps {
  color: string;
  label: string;
  value?: string;
  className?: string;
}

export const LegendItem: React.FC<LegendItemProps> = ({
  color,
  label,
  value,
  className,
}) => {
  const classes = [styles.item, className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <div className={styles.indicator} style={{ background: color }} />
      <span className={styles.label}>{label}</span>
      {value && <span className={styles.value}>{value}</span>}
    </div>
  );
};

export default LegendItem;
