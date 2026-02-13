'use client';

import React from 'react';
import { Card, ProgressBar } from '@/app/components/ui';
import { Goal, PreferredCurrency } from '@/app/lib/types';
import { formatPreferredCurrency } from '@/app/lib/formatters';
import styles from '../Investments/Investments.module.css';

interface GoalProgressCardProps {
  goal: Goal;
  totalNetWorth: number;
  goalProgress: number;
  preferredCurrency: PreferredCurrency;
}

export const GoalProgressCard: React.FC<GoalProgressCardProps> = ({
  goal,
  totalNetWorth,
  goalProgress,
  preferredCurrency,
}) => {
  const remaining = goal.amount - totalNetWorth;
  const formattedNetWorth = formatPreferredCurrency(totalNetWorth, preferredCurrency);
  const formattedGoalAmount = formatPreferredCurrency(goal.amount, preferredCurrency);
  const formattedRemaining = formatPreferredCurrency(remaining, preferredCurrency);

  return (
    <Card variant="gradient">
      <div className={styles.progressHeader}>
        <div>
          <p className={styles.progressLabel}>Current Progress</p>
          <p className={styles.progressPercent}>{goalProgress.toFixed(2)}%</p>
        </div>
        <div className={styles.progressRight}>
          <p className={styles.progressLabel}>Net Worth</p>
          <p className={styles.progressNetWorth}>{formattedNetWorth}</p>
        </div>
      </div>
      <ProgressBar
        progress={goalProgress}
        size="large"
        showLabels
        startLabel={formattedNetWorth}
        middleLabel={`${formattedRemaining} to go`}
        endLabel={formattedGoalAmount}
      />
    </Card>
  );
};
