'use client';
import React, { useState, useMemo } from 'react';
import { Card, DataTable, SectionTitle, TabNav, TabButton, Input, Button, ProgressBar } from '@/app/components/ui';
import { formatPLN, formatEUR, formatPercent } from '@/app/lib/formatters';
import { TransactionForm } from '../Transactions/TransactionForm';
import { TransactionList } from '../Transactions/TransactionList';
import { MonthlyDepositTracker } from '../Goal/MonthlyDepositTracker';
import { InvestmentGoalChart } from '../Goal/InvestmentGoalChart';
import { Transaction, NewTransaction, HoldingWithDetails, Goal } from '@/app/lib/types';
import { 
  generateProjectionData, 
  mergeProjectedWithActual,
  calculateCumulativeContributions 
} from '@/app/lib/projectionCalculations';
import styles from './Investments.module.css';

type InvestmentsSubTab = 'goal' | 'transactions';

interface InvestmentsTabProps {
  // Holdings & Portfolio data
  holdingsData: HoldingWithDetails[];
  portfolioValue: number;
  totalGain: number;
  totalGainPercent: number;
  
  // Transaction data
  transactions: Transaction[];
  prices: Record<string, number>;
  newTx: NewTransaction;
  onTxChange: (updates: Partial<NewTransaction>) => void;
  onAddTransaction: () => void;
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: number) => void;
  
  // Goal data
  goal: Goal;
  tempGoal: Goal;
  editingGoal: boolean;
  totalNetWorth: number;
  goalProgress: number;
  exchangeRates: {
    EUR_PLN: number;
    USD_PLN: number;
  };
  onEditStart: () => void;
  onEditCancel: () => void;
  onEditSave: () => void;
  onTempGoalChange: (updates: Partial<Goal>) => void;
}

export const InvestmentsTab: React.FC<InvestmentsTabProps> = ({
  // Holdings & Portfolio
  holdingsData,
  portfolioValue,
  totalGain,
  totalGainPercent,
  
  // Transactions
  transactions,
  prices,
  newTx,
  onTxChange,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  
  // Goal
  goal,
  tempGoal,
  editingGoal,
  totalNetWorth,
  goalProgress,
  exchangeRates,
  onEditStart,
  onEditCancel,
  onEditSave,
  onTempGoalChange,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<InvestmentsSubTab>('goal');
  
  const remaining = goal.amount - totalNetWorth;

  // Generate projection data for the chart
  const projectionData = useMemo(() => {
    return generateProjectionData(goal, totalNetWorth);
  }, [goal, totalNetWorth]);

  // Calculate total actual contributions from transactions
  const totalActualContributions = useMemo(() => {
    return calculateCumulativeContributions(transactions, exchangeRates);
  }, [transactions, exchangeRates]);

  // Merge projected data with actual transaction history
  const chartData = useMemo(() => {
    return mergeProjectedWithActual(
      projectionData,
      transactions,
      exchangeRates,
      totalNetWorth
    );
  }, [projectionData, transactions, exchangeRates, totalNetWorth]);

  // Format date for display
  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return 'Not set';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const holdingsColumns = [
    {
      key: 'ticker' as const,
      header: 'Ticker',
      render: (h: HoldingWithDetails) => (
        <span className={styles.ticker}>{h.ticker}</span>
      ),
    },
    {
      key: 'name' as const,
      header: 'Name',
      render: (h: HoldingWithDetails) => (
        <span className={styles.name}>{h.name}</span>
      ),
    },
    {
      key: 'shares' as const,
      header: 'Shares',
      align: 'right' as const,
      render: (h: HoldingWithDetails) => h.shares.toFixed(2),
    },
    {
      key: 'avgCost' as const,
      header: 'Avg Cost',
      align: 'right' as const,
      render: (h: HoldingWithDetails) => `€${h.avgCost.toFixed(2)}`,
    },
    {
      key: 'price' as const,
      header: 'Price',
      align: 'right' as const,
      render: (h: HoldingWithDetails) => `€${h.price.toFixed(2)}`,
    },
    {
      key: 'value' as const,
      header: 'Value (EUR)',
      align: 'right' as const,
      render: (h: HoldingWithDetails) => (
        <span className={styles.valueCell}>{formatEUR(h.value)}</span>
      ),
    },
    {
      key: 'valuePLN' as const,
      header: 'Value (PLN)',
      align: 'right' as const,
      render: (h: HoldingWithDetails) => (
        <span className={styles.valueCell}>{formatPLN(h.valuePLN)}</span>
      ),
    },
    {
      key: 'gain' as const,
      header: 'Gain',
      align: 'right' as const,
      render: (h: HoldingWithDetails) => (
        <span className={h.gain >= 0 ? styles.positive : styles.negative}>
          {formatEUR(h.gain)} ({formatPercent(h.gainPercent)})
        </span>
      ),
    },
  ];

  const holdingsFooter = (
    <tr className={styles.footerRow}>
      <td colSpan={5} className={styles.footerLabel}>
        Total
      </td>
      <td className={styles.footerValue}>
        {formatEUR(holdingsData.reduce((sum, h) => sum + h.value, 0))}
      </td>
      <td className={styles.footerValue}>{formatPLN(portfolioValue)}</td>
      <td
        className={`${styles.footerValue} ${
          totalGain >= 0 ? styles.positive : styles.negative
        }`}
      >
        {formatPLN(totalGain)} ({formatPercent(totalGainPercent)})
      </td>
    </tr>
  );

  return (
    <div className={styles.container}>
      {/* Sub-tab Navigation */}
      <TabNav ariaLabel="Investment sections">
        <TabButton
          isActive={activeSubTab === 'goal'}
          onClick={() => setActiveSubTab('goal')}
          ariaLabel="View investment goal and progress"
        >
          Goal
        </TabButton>
        <TabButton
          isActive={activeSubTab === 'transactions'}
          onClick={() => setActiveSubTab('transactions')}
          ariaLabel="Manage investment transactions"
        >
          Transactions
        </TabButton>
      </TabNav>

      {/* Goal Sub-tab Content */}
      {activeSubTab === 'goal' && (
        <div className={styles.tabContent}>
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
                  <p className={styles.statLabel}>Start Date</p>
                  <p className={styles.statValueWhite}>{formatDisplayDate(goal.startDate)}</p>
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
                <div>
                  <p className={styles.statLabel}>Annual Deposit Increase</p>
                  <p className={styles.statValueWhite}>{(goal.depositIncreasePercentage * 100).toFixed(1)}%</p>
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

          {/* Investment Goal Progress Chart */}
          {chartData.length > 0 && (
            <InvestmentGoalChart
              goal={goal}
              projectionData={chartData}
              currentNetWorth={totalNetWorth}
              totalActualContributions={totalActualContributions}
            />
          )}

          {/* Holdings Section */}
          <Card>
            <SectionTitle>Holdings</SectionTitle>
            <DataTable
              columns={holdingsColumns}
              data={holdingsData}
              keyExtractor={(h) => h.ticker}
              footer={holdingsFooter}
            />
          </Card>

          {/* Monthly Investment Tracker */}
          <MonthlyDepositTracker
            goal={goal}
            transactions={transactions}
            exchangeRates={exchangeRates}
          />
        </div>
      )}

      {/* Transactions Sub-tab Content */}
      {activeSubTab === 'transactions' && (
        <div className={styles.tabContent}>
          {/* Add Transaction Form */}
          <TransactionForm
            newTx={newTx}
            onChange={onTxChange}
            onSubmit={onAddTransaction}
          />

          {/* Transaction History */}
          <TransactionList
            transactions={transactions}
            prices={prices}
            onEdit={onEditTransaction}
            onDelete={onDeleteTransaction}
          />
        </div>
      )}
    </div>
  );
};

export default InvestmentsTab;
