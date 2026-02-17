'use client';

import React from 'react';
import { Input, Button } from '@/components/ui';
import { Goal } from '@/lib/types';
import styles from '../Investments/Investments.module.css';

interface GoalSettingsFormProps {
  tempGoal: Goal;
  onTempGoalChange: (updates: Partial<Goal>) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const GoalSettingsForm: React.FC<GoalSettingsFormProps> = ({
  tempGoal,
  onTempGoalChange,
  onSave,
  onCancel,
}) => {
  return (
    <div className={styles.editForm}>
      <Input
        type="month"
        label="Investment Start Date"
        value={tempGoal.startDate ? tempGoal.startDate.substring(0, 7) : ''}
        onChange={(e) => {
          const value = e.target.value;
          onTempGoalChange({ startDate: value ? `${value}-01` : '' });
        }}
        style={{ width: '140px' }}
      />
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
      <Button onClick={onSave}>Calculate & Save</Button>
      <Button variant="secondary" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
};
