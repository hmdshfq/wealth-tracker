'use client';

import React from 'react';
import { MonthlyDepositTracker } from '../Goal';
import { Transaction, Goal } from '@/app/lib/types';

interface DepositsSubTabProps {
  goal: Goal;
  transactions: Transaction[];
  exchangeRates: {
    EUR_PLN: number;
    USD_PLN: number;
  };
}

export const DepositsSubTab: React.FC<DepositsSubTabProps> = ({
  goal,
  transactions,
  exchangeRates,
}) => {
  return (
    <MonthlyDepositTracker
      goal={goal}
      transactions={transactions}
      exchangeRates={exchangeRates}
    />
  );
};
