'use client';

import React from 'react';
import { Goal, PreferredCurrency } from '@/lib/types';
import { formatPreferredCurrency } from '@/lib/formatters';
import styles from '../Investments/Investments.module.css';

interface GoalSettingsDisplayProps {
  goal: Goal;
  preferredCurrency: PreferredCurrency;
}

const formatDisplayDate = (dateStr: string) => {
  if (!dateStr) return 'Not set';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

export const GoalSettingsDisplay: React.FC<GoalSettingsDisplayProps> = ({
  goal,
  preferredCurrency,
}) => {
  return (
    <div className={styles.statsGrid}>
      <div>
        <p className={styles.statLabel}>Target Amount</p>
        <p className={styles.statValueBlue}>{formatPreferredCurrency(goal.amount, preferredCurrency)}</p>
      </div>
      <div>
        <p className={styles.statLabel}>Start Date</p>
        <p className={styles.statValueWhite}>{formatDisplayDate(goal.startDate)}</p>
      </div>
      <div>
        <p className={styles.statLabel}>Retirement Year</p>
        <p className={styles.statValueWhite}>{goal.retirementYear}</p>
      </div>
      <div>
        <p className={styles.statLabel}>Annual Return</p>
        <p className={styles.statValueGreen}>{(goal.annualReturn * 100).toFixed(1)}%</p>
      </div>
      <div>
        <p className={styles.statLabel}>Monthly Deposits</p>
        <p className={styles.statValueYellow}>{formatPreferredCurrency(goal.monthlyDeposits, preferredCurrency)}</p>
      </div>
      <div>
        <p className={styles.statLabel}>Annual Deposit Increase</p>
        <p className={styles.statValueWhite}>{(goal.depositIncreasePercentage * 100).toFixed(1)}%</p>
      </div>
    </div>
  );
};
