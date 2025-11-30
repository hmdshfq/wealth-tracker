'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Card, SectionTitle, Button } from '@/app/components/ui';
import { GoalSettingsForm, GoalSettingsDisplay } from '../Goal';
import { slideFromBottomVariants, transitions } from '@/app/lib/animations';
import { Goal } from '@/app/lib/types';

interface GoalSubTabProps {
  goal: Goal;
  tempGoal: Goal;
  editingGoal: boolean;
  onEditStart: () => void;
  onEditCancel: () => void;
  onEditSave: () => void;
  onTempGoalChange: (updates: Partial<Goal>) => void;
}

export const GoalSubTab: React.FC<GoalSubTabProps> = ({
  goal,
  tempGoal,
  editingGoal,
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
          <GoalSettingsDisplay goal={goal} />
        )}
      </Card>
    </motion.div>
  );
};
