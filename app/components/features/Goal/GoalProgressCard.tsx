'use client';

import React from 'react';
import { Card, ProgressBar } from '@/app/components/ui';
import { Goal } from '@/app/lib/types';
import { formatPLN } from '@/app/lib/formatters';
import styles from '../Investments/Investments.module.css';

interface GoalProgressCardProps {
  goal: Goal;
  totalNetWorth: number;
  goalProgress: number;
}

export const GoalProgressCard: React.FC<GoalProgressCardProps> = ({
  goal,
  totalNetWorth,
  goalProgress,
}) => {
  const remaining = goal.amount - totalNetWorth;

  return (
    <Card variant="gradient">
      <div className={styles.progressHeader}>
        <div>
          <p className={styles.progressLabel}>Current Progress</p>
          <p className={styles.progressPercent}>{goalProgress.toFixed(2)}%</p>
        </div>
        <div className={styles.progressRight}>
          <p className={styles.progressLabel}>Net Worth</p>
          <p className={styles.progressNetWorth}>{formatPLN(totalNetWorth)}</p>
        </div>
      </div>
      <ProgressBar
        progress={goalProgress}
        size="large"
        showLabels
        startLabel={formatPLN(totalNetWorth)}
        middleLabel={`${formatPLN(remaining)} to go`}
        endLabel={formatPLN(goal.amount)}
      />
    </Card>
  );
};
