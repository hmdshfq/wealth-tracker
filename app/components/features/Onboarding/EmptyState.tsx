'use client';

import React from 'react';
import { Button } from '@/components/ui';
import styles from './EmptyState.module.css';

// ============================================================================
// TYPES
// ============================================================================

export type EmptyStateType = 'holdings' | 'transactions' | 'cash' | 'goal';

interface EmptyStateProps {
  type: EmptyStateType;
  onCreateAction?: () => void;
  onImportAction?: () => void;
}

// ============================================================================
// CONTENT CONFIG
// ============================================================================

const EMPTY_STATE_CONTENT: Record<
  EmptyStateType,
  { title: string; description: string; actionLabel: string; importLabel?: string }
> = {
  holdings: {
    title: 'No Holdings Yet',
    description: 'Start building your portfolio by adding your first ETF. Track stocks, bonds, or any investment you own.',
    actionLabel: 'Add First Holding',
  },
  transactions: {
    title: 'No Transactions Yet',
    description: 'Record your first buy or sell transaction to track your investment history and calculate gains.',
    actionLabel: 'Add Transaction',
    importLabel: 'Import from CSV',
  },
  cash: {
    title: 'No Cash Records',
    description: 'Track your available cash across currencies. Record deposits and withdrawals to monitor your liquidity.',
    actionLabel: 'Add Cash Balance',
    importLabel: 'Import from CSV',
  },
  goal: {
    title: 'No Financial Goal',
    description: 'Set a retirement or savings goal to see projections. Calculate how much to invest monthly to reach your target.',
    actionLabel: 'Set Your Goal',
  },
};

// ============================================================================
// ICONS
// ============================================================================

const EmptyStateIcon: React.FC<{ type: EmptyStateType }> = ({ type }) => {
  const icons: Record<EmptyStateType, string> = {
    holdings: '📊',
    transactions: '📜',
    cash: '💰',
    goal: '🎯',
  };

  return <span className={styles.icon}>{icons[type]}</span>;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function EmptyState({ type, onCreateAction, onImportAction }: EmptyStateProps) {
  const content = EMPTY_STATE_CONTENT[type];

  return (
    <div className={styles.container}>
      <EmptyStateIcon type={type} />
      <h3 className={styles.title}>{content.title}</h3>
      <p className={styles.description}>{content.description}</p>
      <div className={styles.actions}>
        <Button variant="primary" onClick={onCreateAction}>
          {content.actionLabel}
        </Button>
        {content.importLabel && onImportAction && (
          <Button variant="secondary" onClick={onImportAction}>
            {content.importLabel}
          </Button>
        )}
      </div>
    </div>
  );
}