'use client';
import React from 'react';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
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
              value={tempGoal.retirementYear}
              onChange={(e) =>
                onTempGoalChange({ retirementYear: parseInt(e.target.value) || 2050 })
              }
              style={{ width: '100px' }}
            />
            <Input
              type="number"
              label="Annual Return (%)"
              value={(tempGoal.annualReturn * 100).toFixed(1)}
              onChange={(e) =>
                onTempGoalChange({ annualReturn: (parseFloat(e.target.value) || 0) / 100 })
              }
              step="0.1"
              style={{ width: '100px' }}
            />
            <Input
              type="number"
              label="Monthly Deposits (PLN)"
              value={tempGoal.monthlyDeposits}
              onChange={(e) =>
                onTempGoalChange({ monthlyDeposits: parseInt(e.target.value) || 0 })
              }
              style={{ width: '140px' }}
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

      {/* Projection Chart */}
      <Card>
        <SectionTitle subtitle={`Assuming ${(goal.annualReturn * 100).toFixed(1)}% annual return and ${formatPLN(goal.monthlyDeposits)} monthly contributions`}>
          Projection to Goal
        </SectionTitle>
        <div style={{ height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={projectionData}>
              <defs>
                <linearGradient id="colorProjection" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="year"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                interval={4}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                width={50}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatPLN(value),
                  name === 'value' ? 'Projected' : 'Goal',
                ]}
                contentStyle={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#colorProjection)"
                name="Projected Value"
              />
              <Line
                type="monotone"
                dataKey="goal"
                stroke="#3b82f6"
                strokeDasharray="8 4"
                strokeWidth={2}
                dot={false}
                name="Goal"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};

export default GoalTab;
