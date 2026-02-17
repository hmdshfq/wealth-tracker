'use client';
import React from 'react';
import { Card, ProgressBar } from '@/components/ui';
import { formatPLN } from '@/lib/formatters';
import { Goal } from '@/lib/types';
import styles from './Dashboard.module.css';

interface GoalProgressProps {
  goal: Goal;
  currentValue: number;
  progress: number;
}

export const GoalProgress: React.FC<GoalProgressProps> = ({
  goal,
  currentValue,
  progress,
}) => {
  const remaining = goal.amount - currentValue;

  return (
    <Card>
      <div className={styles.goalHeader}>
        <div>
          <p className={styles.goalLabel}>Goal Progress</p>
          <p className={styles.goalTarget}>
            Target: {formatPLN(goal.amount)} by {goal.targetYear}
          </p>
        </div>
        <div className={styles.goalPercent}>
          <p>{progress.toFixed(2)}%</p>
        </div>
      </div>
      <ProgressBar progress={progress} size="medium" />
      <p className={styles.goalRemaining}>{formatPLN(remaining)} remaining</p>
    </Card>
  );
};

export default GoalProgress;
