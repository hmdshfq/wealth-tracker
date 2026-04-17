'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button, Modal } from '@/components/ui';
import styles from './OnboardingFlow.module.css';

// ============================================================================
// TYPES
// ============================================================================

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  highlightElement?: string;
  icon: 'portfolio' | 'investments' | 'cash' | 'goal' | 'import' | 'complete';
}

interface OnboardingFlowProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
  onLoadDemo?: () => void;
}

// ============================================================================
// ONBOARDING STEPS
// ============================================================================

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Investment Tracker',
    description: 'Track your ETF portfolio, set financial goals, and monitor your wealth growth over time. Let\'s get you set up in under 2 minutes.',
    actionLabel: 'Get Started',
    icon: 'complete',
  },
  {
    id: 'portfolio',
    title: 'Your Portfolio Overview',
    description: 'The Dashboard shows your total portfolio value, allocation across ETFs, and performance metrics. Add your first investment to see it come to life.',
    actionLabel: 'Add Investments',
    highlightElement: 'tab-investments',
    icon: 'portfolio',
  },
  {
    id: 'investments',
    title: 'Track Your ETFs',
    description: 'Record your ETF purchases and track their current value. We fetch live prices from Yahoo Finance so you always know what your holdings are worth.',
    actionLabel: 'Next',
    highlightElement: 'tab-investments',
    icon: 'investments',
  },
  {
    id: 'cash',
    title: 'Multi-Currency Cash',
    description: 'Track cash across PLN, EUR, and USD. Record deposits and withdrawals to see your total liquidity and funded percentage.',
    actionLabel: 'Next',
    highlightElement: 'tab-cash',
    icon: 'cash',
  },
  {
    id: 'goal',
    title: 'Set Financial Goals',
    description: 'Plan for retirement or any financial target. Set your goal amount, timeline, and monthly contributions to see projections.',
    actionLabel: 'Next',
    highlightElement: 'tab-goal',
    icon: 'goal',
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    description: 'You can export your data to JSON or CSV for backup. Ready to start tracking your wealth? Let\'s go!',
    actionLabel: 'Start Tracking',
    icon: 'complete',
  },
];

// ============================================================================
// ICONS
// ============================================================================

const StepIcon: React.FC<{ icon: OnboardingStep['icon']; className?: string }> = ({ icon, className }) => {
  const icons: Record<string, string> = {
    portfolio: '📊',
    investments: '📈',
    cash: '💰',
    goal: '🎯',
    import: '📥',
    complete: '✅',
  };

  return <span className={className}>{icons[icon] || '•'}</span>;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function OnboardingFlow({
  isOpen,
  onComplete,
  onSkip,
}: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const prevOpenRef = useRef(false);

  // Reset step when modal opens
  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      setCurrentStep(0);
    }
    prevOpenRef.current = isOpen;
  }, [isOpen]);

  const step = ONBOARDING_STEPS[currentStep];

  const handleNext = useCallback(() => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onComplete();
    }
  }, [currentStep, onComplete]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    onSkip();
  }, [onSkip]);

  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;
  const isFirstStep = currentStep === 0;

  return (
    <Modal isOpen={isOpen} onClose={handleSkip} title="" wide>
      <div className={styles.container}>
        {/* Progress Bar */}
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>

        {/* Step Content */}
        <div className={styles.content}>
          <div className={styles.iconWrapper}>
            <StepIcon icon={step.icon} className={styles.icon} />
          </div>

          <h2 className={styles.title}>{step.title}</h2>
          <p className={styles.description}>{step.description}</p>
        </div>

        {/* Navigation */}
        <div className={styles.navigation}>
          {!isFirstStep && (
            <Button variant="secondary" onClick={handlePrevious}>
              Back
            </Button>
          )}

          <div className={styles.spacer} />

          <Button variant="secondary" onClick={handleSkip}>
            Skip
          </Button>

          <Button variant="primary" onClick={handleNext}>
            {step.actionLabel}
          </Button>
        </div>

        {/* Step Indicator */}
        <div className={styles.stepIndicator}>
          {ONBOARDING_STEPS.map((_, index) => (
            <span
              key={index}
              className={`${styles.dot} ${index === currentStep ? styles.dotActive : ''} ${index < currentStep ? styles.dotCompleted : ''}`}
            />
          ))}
        </div>
      </div>
    </Modal>
  );
}

export { ONBOARDING_STEPS };
export type { OnboardingStep };