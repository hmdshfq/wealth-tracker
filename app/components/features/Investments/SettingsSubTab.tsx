'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Card, SectionTitle, Button, Select, ToggleSwitch } from '@/components/ui';
import { GoalSettingsForm, GoalSettingsDisplay } from '../Goal';
import { slideFromBottomVariants, transitions } from '@/lib/animations';
import { Goal, PreferredCurrency } from '@/lib/types';

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
  enableTimeAnalysis: boolean;
  enableScenarioAnalysis: boolean;
  enableWhatIfScenarios: boolean;
  enableBenchmarkComparison: boolean;
  onGoalFeaturesChange: (feature: 'timeAnalysis' | 'scenarioAnalysis' | 'whatIfScenarios' | 'benchmarkComparison', enabled: boolean) => void;
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
  enableTimeAnalysis,
  enableScenarioAnalysis,
  enableWhatIfScenarios,
  enableBenchmarkComparison,
  onGoalFeaturesChange,
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

      <div style={{ height: '24px' }} />

      {/* Advanced Calculations Card */}
      <Card>
        <SectionTitle>Advanced Calculations</SectionTitle>
        <p style={{ color: '#64748b', marginBottom: '20px', fontSize: '14px' }}>
          Enable or disable intensive calculation features in the Goal tab. Disabling these features improves performance on slower devices.
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <ToggleSwitch
            checked={enableTimeAnalysis}
            onChange={(enabled: boolean) => onGoalFeaturesChange('timeAnalysis', enabled)}
            label="Time-Based Analysis"
            description="Analyze seasonal patterns and year-over-year performance"
          />
          
          <ToggleSwitch
            checked={enableScenarioAnalysis}
            onChange={(enabled: boolean) => onGoalFeaturesChange('scenarioAnalysis', enabled)}
            label="Scenario Analysis"
            description="Compare different return scenarios to understand potential outcomes"
          />

          <ToggleSwitch
            checked={enableWhatIfScenarios}
            onChange={(enabled: boolean) => onGoalFeaturesChange('whatIfScenarios', enabled)}
            label="What-if Scenarios"
            description="Adjust return rate and contributions to see projected outcomes"
          />

          <ToggleSwitch
            checked={enableBenchmarkComparison}
            onChange={(enabled: boolean) => onGoalFeaturesChange('benchmarkComparison', enabled)}
            label="Benchmark Performance Comparison"
            description="Compare your plan against S&P 500 and industry average returns"
          />
        </div>
      </Card>
    </motion.div>
  );
};

export default SettingsSubTab;
