import React from 'react';
import styles from './Divider.module.css';

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  label?: string;
  spacing?: 'small' | 'medium' | 'large';
  className?: string;
}

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  label,
  spacing = 'medium',
  className,
}) => {
  const classes = [
    styles.divider,
    styles[orientation],
    styles[spacing],
    label && styles.withLabel,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (label && orientation === 'horizontal') {
    return (
      <div className={classes}>
        <div className={styles.line} />
        <span className={styles.label}>{label}</span>
        <div className={styles.line} />
      </div>
    );
  }

  return <div className={classes} />;
};

export default Divider;
