import React from 'react';
import styles from './Metric.module.css';

interface MetricProps {
  label: string;
  value: string;
  subtext?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  valueColor?: 'default' | 'positive' | 'negative' | 'primary' | 'accent';
  className?: string;
}

export const Metric: React.FC<MetricProps> = ({
  label,
  value,
  subtext,
  size = 'medium',
  valueColor = 'default',
  className,
}) => {
  const classes = [styles.metric, styles[size], className]
    .filter(Boolean)
    .join(' ');

  const valueClasses = [styles.value, styles[`value-${valueColor}`]]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <p className={styles.label}>{label}</p>
      <p className={valueClasses}>{value}</p>
      {subtext && <p className={styles.subtext}>{subtext}</p>}
    </div>
  );
};

export default Metric;
