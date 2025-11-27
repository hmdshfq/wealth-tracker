'use client';
import React from 'react';
import { Card, Input, Button, ProgressBar, SectionTitle } from '@/app/components/ui';
import { formatPLN } from '@/app/lib/formatters';
import { Goal, ProjectionDataPoint } from '@/app/lib/types';
import styles from './Goal.module.css';

interface GoalTabProps {
  goal: Goal;
  tempGoal: Goal;
  editingGoal: boolean;
  totalNetWorth: number;
  goalProgress: number;
  projectionData: ProjectionDataPoint[];
  onEditStart: () => void;
  onEditCancel: () => void;
  onEditSave: () => void;
  onTempGoalChange: (updates: Partial<Goal>) => void;
}

export const GoalTab: React.FC<GoalTabProps> = ({
  goal,
  tempGoal,
  editingGoal,
  totalNetWorth,
  goalProgress,
  projectionData,
  onEditStart,
  onEditCancel,
  onEditSave,
  onTempGoalChange,
}) => {
  const remaining = goal.amount - totalNetWorth;
  const yearsRemaining = goal.targetYear - 2025;

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      {/* Goal Settings */}
      <Card>
        <SectionTitle
          action={
            !editingGoal && (
              <Button variant="secondary" size="small" onClick={onEditStart}>
                Edit Goal
              </Button>
            )
          }
        >
          Investment Goal
        </SectionTitle>

        {editingGoal ? (
          <div className={styles.editForm}>
            <Input
              type="number"
              label="Retirement Year"
              value={tempGoal.retirementYear ?? 2050}
              onChange={(e) =>
                onTempGoalChange({ retirementYear: parseInt(e.target.value) || 2050 })
              }
              style={{ width: '100px' }}
            />
            <Input
              type="number"
              label="Annual Return (%)"
              value={((tempGoal.annualReturn ?? 0.05) * 100).toFixed(1)}
              onChange={(e) =>
                onTempGoalChange({ annualReturn: (parseFloat(e.target.value) || 0) / 100 })
              }
              step="0.1"
              style={{ width: '100px' }}
            />
            <Input
              type="number"
              label="Monthly Deposits (PLN)"
              value={tempGoal.monthlyDeposits ?? 0}
              onChange={(e) =>
                onTempGoalChange({ monthlyDeposits: parseInt(e.target.value) || 0 })
              }
              style={{ width: '140px' }}
            />
            <Input
              type="number"
              label="Annual Deposit Increase (%)"
              value={(tempGoal.depositIncreasePercentage ?? 0) * 100}
              onChange={(e) =>
                onTempGoalChange({ depositIncreasePercentage: (parseFloat(e.target.value) || 0) / 100 })
              }
              step="0.1"
              style={{ width: '100px' }}
            />
            <Button onClick={onEditSave}>Calculate & Save</Button>
            <Button variant="secondary" onClick={onEditCancel}>
              Cancel
            </Button>
          </div>
        ) : (
          <div className={styles.statsGrid}>
            <div>
              <p className={styles.statLabel}>Target Amount</p>
              <p className={styles.statValueBlue}>{formatPLN(goal.amount)}</p>
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
              <p className={styles.statValueYellow}>{formatPLN(goal.monthlyDeposits)}</p>
            </div>
            <div>
              <p className={styles.statLabel}>Annual Deposit Increase</p>
              <p className={styles.statValueWhite}>{(goal.depositIncreasePercentage * 100).toFixed(1)}%</p>
            </div>
          </div>
        )}
      </Card>

      {/* Progress Card */}
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
    </div>
  );
};

export default GoalTab;
