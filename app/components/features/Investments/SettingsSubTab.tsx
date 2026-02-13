'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Card, SectionTitle, Button, Select } from '@/app/components/ui';
import { GoalSettingsForm, GoalSettingsDisplay } from '../Goal';
import { slideFromBottomVariants, transitions } from '@/app/lib/animations';
import { Goal, PreferredCurrency } from '@/app/lib/types';

interface SettingsSubTabProps {
  goal: Goal;
  tempGoal: Goal;
  editingGoal: boolean;
  preferredCurrency: PreferredCurrency;
  onPreferredCurrencyChange: (currency: PreferredCurrency) => void;
  onEditStart: () => void;
  onEditCancel: () => void;
  onEditSave: () => void;
  onTempGoalChange: (updates: Partial<Goal>) => void;
}

export const SettingsSubTab: React.FC<SettingsSubTabProps> = ({
  goal,
  tempGoal,
  editingGoal,
  preferredCurrency,
  onPreferredCurrencyChange,
  onEditStart,
  onEditCancel,
  onEditSave,
  onTempGoalChange,
}) => {
  return (
    <motion.div
      variants={slideFromBottomVariants}
      transition={transitions.fast}
    >
      {/* Currency Preference Card */}
      <Card>
        <SectionTitle>Display Currency</SectionTitle>
        <p style={{ color: '#64748b', marginBottom: '16px', fontSize: '14px' }}>
          Select your preferred currency for displaying portfolio values.
        </p>
        <Select
          value={preferredCurrency}
          onChange={(e) => onPreferredCurrencyChange(e.target.value as PreferredCurrency)}
          options={[
            { value: 'PLN', label: 'PLN (zł) - Polish Złoty' },
            { value: 'EUR', label: 'EUR (€) - Euro' },
            { value: 'USD', label: 'USD ($) - US Dollars' },
          ]}
        />
      </Card>

      <div style={{ height: '24px' }} />

      {/* Investment Goal Card */}
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
          <GoalSettingsForm
            tempGoal={tempGoal}
            onTempGoalChange={onTempGoalChange}
            onSave={onEditSave}
            onCancel={onEditCancel}
          />
        ) : (
          <GoalSettingsDisplay goal={goal} preferredCurrency={preferredCurrency} />
        )}
      </Card>
    </motion.div>
  );
};

export default SettingsSubTab;
