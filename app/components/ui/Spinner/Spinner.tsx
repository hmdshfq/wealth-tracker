import React from 'react';
import styles from './Spinner.module.css';

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'white';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'medium',
  color = 'primary',
  className,
}) => {
  const classes = [styles.spinner, styles[size], styles[color], className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <div className={styles.ring} />
    </div>
  );
};

export default Spinner;
