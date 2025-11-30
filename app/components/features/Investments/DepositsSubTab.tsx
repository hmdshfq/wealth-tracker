'use client';

import React from 'react';
import { motion } from 'motion/react';
import { MonthlyDepositTracker } from '../Goal';
import { slideFromBottomVariants, transitions } from '@/app/lib/animations';
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
    <motion.div
      variants={slideFromBottomVariants}
      transition={transitions.normal}
    >
      <MonthlyDepositTracker
        goal={goal}
        transactions={transactions}
        exchangeRates={exchangeRates}
      />
    </motion.div>
  );
};
