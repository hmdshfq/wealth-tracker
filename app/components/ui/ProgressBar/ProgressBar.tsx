import React from 'react';
import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  progress: number;
  size?: 'small' | 'medium' | 'large';
  showLabels?: boolean;
  startLabel?: string;
  endLabel?: string;
  middleLabel?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  size = 'medium',
  showLabels = false,
  startLabel,
  endLabel,
  middleLabel,
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={styles.container}>
      <div className={`${styles.track} ${styles[size]}`}>
        <div
          className={styles.fill}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      {showLabels && (
        <div className={styles.labels}>
          {startLabel && <span className={styles.startLabel}>{startLabel}</span>}
          {middleLabel && <span className={styles.middleLabel}>{middleLabel}</span>}
          {endLabel && <span className={styles.endLabel}>{endLabel}</span>}
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
