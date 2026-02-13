'use client';

import React from 'react';
import { motion } from 'motion/react';
import { MonthlyDepositTracker } from '../Goal';
import { slideFromBottomVariants, transitions } from '@/app/lib/animations';
import { Transaction, Goal, PreferredCurrency } from '@/app/lib/types';

interface DepositsSubTabProps {
  goal: Goal;
  transactions: Transaction[];
  exchangeRates: {
    EUR_PLN: number;
    USD_PLN: number;
  };
  preferredCurrency: PreferredCurrency;
}

export const DepositsSubTab: React.FC<DepositsSubTabProps> = ({
  goal,
  transactions,
  exchangeRates,
  preferredCurrency,
}) => {
  return (
    <motion.div
      variants={slideFromBottomVariants}
      transition={transitions.fast}
    >
      <MonthlyDepositTracker
        goal={goal}
        transactions={transactions}
        exchangeRates={exchangeRates}
        preferredCurrency={preferredCurrency}
      />
    </motion.div>
  );
};
