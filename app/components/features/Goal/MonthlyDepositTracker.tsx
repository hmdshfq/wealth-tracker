'use client';
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, SectionTitle, TabNav, TabButton } from '@/app/components/ui';
import { formatPLN } from '@/app/lib/formatters';
import { Transaction, Goal } from '@/app/lib/types';
import { slideFromBottomVariants, fadeVariants, transitions } from '@/app/lib/animations';
import styles from './MonthlyDepositTracker.module.css';

interface MonthlyDepositTrackerProps {
  goal: Goal;
  transactions: Transaction[];
  exchangeRates: {
    EUR_PLN: number;
    USD_PLN: number;
  };
}

interface MonthData {
  year: number;
  month: number;
  required: number;
  invested: number;
  cumulativeInvested: number;
  cumulativeRequired: number;
  status: 'met' | 'unmet' | 'future' | 'empty';
  cumulativeStatus: 'met' | 'unmet' | 'future' | 'empty';
}

type ViewMode = 'monthly' | 'cumulative';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_FULL_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const MonthlyDepositTracker: React.FC<MonthlyDepositTrackerProps> = ({
  goal,
  transactions,
  exchangeRates,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-indexed

  // Calculate all monthly data
  const { yearlyData, summary } = useMemo(() => {
    // Use goal's start date
    const startDate = goal.startDate ? new Date(goal.startDate) : new Date();
    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth();
    
    const buyTransactions = transactions.filter((tx) => tx.action === 'Buy');
    
    const data: MonthData[][] = [];
    let totalRequired = 0;
    let totalInvested = 0;
    let monthsMet = 0;
    let monthsUnmet = 0;
    let cumulativeMonthsMet = 0;
    let cumulativeMonthsUnmet = 0;

    // Running cumulative totals
    let runningCumulativeInvested = 0;
    let runningCumulativeRequired = 0;

    // Group investments by year-month (only Buy transactions count as investments)
    const investmentsByMonth: Record<string, number> = {};
    buyTransactions.forEach((tx) => {
      const date = new Date(tx.date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      
      // Calculate total investment value in PLN
      const totalValue = tx.shares * tx.price;
      let amountPLN = totalValue;
      
      // Convert to PLN based on transaction currency
      if (tx.currency === 'EUR') {
        amountPLN = totalValue * exchangeRates.EUR_PLN;
      } else if (tx.currency === 'USD') {
        amountPLN = totalValue * exchangeRates.USD_PLN;
      }
      
      investmentsByMonth[key] = (investmentsByMonth[key] || 0) + amountPLN;
    });

    // Build data for each year from start date to retirement year
    for (let year = startYear; year <= goal.retirementYear; year++) {
      const yearData: MonthData[] = [];
      
      // Calculate years offset from the start year for deposit increase calculation
      const yearOffset = year - startYear;

      // Calculate required investment for this year (with annual increase)
      const requiredForYear = goal.monthlyDeposits * Math.pow(1 + goal.depositIncreasePercentage, yearOffset);

      for (let month = 0; month < 12; month++) {
        const key = `${year}-${month}`;
        const invested = investmentsByMonth[key] || 0;
        const isFuture = year > currentYear || (year === currentYear && month > currentMonth);
        
        // Check if this month is before the start date
        const isBeforeStart = year < startYear || (year === startYear && month < startMonth);

        // Monthly status
        let status: MonthData['status'] = 'empty';
        if (isBeforeStart) {
          status = 'empty';
        } else if (isFuture) {
          status = 'future';
        } else if (invested >= requiredForYear) {
          status = 'met';
          monthsMet++;
        } else {
          status = 'unmet';
          monthsUnmet++;
        }

        // Update cumulative totals (only for months from start date)
        if (!isBeforeStart && !isFuture) {
          runningCumulativeInvested += invested;
          runningCumulativeRequired += requiredForYear;
          totalRequired += requiredForYear;
          totalInvested += invested;
        }

        // Cumulative status
        let cumulativeStatus: MonthData['status'] = 'empty';
        if (isBeforeStart) {
          cumulativeStatus = 'empty';
        } else if (isFuture) {
          cumulativeStatus = 'future';
        } else if (runningCumulativeInvested >= runningCumulativeRequired) {
          cumulativeStatus = 'met';
          cumulativeMonthsMet++;
        } else {
          cumulativeStatus = 'unmet';
          cumulativeMonthsUnmet++;
        }

        yearData.push({
          year,
          month,
          required: requiredForYear,
          invested,
          cumulativeInvested: runningCumulativeInvested,
          cumulativeRequired: runningCumulativeRequired,
          status,
          cumulativeStatus,
        });
      }

      data.push(yearData);
    }

    return {
      yearlyData: data,
      summary: {
        totalRequired,
        totalInvested,
        monthsMet,
        monthsUnmet,
        cumulativeMonthsMet,
        cumulativeMonthsUnmet,
        percentageMet: monthsMet + monthsUnmet > 0 
          ? (monthsMet / (monthsMet + monthsUnmet)) * 100 
          : 0,
        cumulativePercentageMet: cumulativeMonthsMet + cumulativeMonthsUnmet > 0
          ? (cumulativeMonthsMet / (cumulativeMonthsMet + cumulativeMonthsUnmet)) * 100
          : 0,
      },
    };
  }, [goal, transactions, exchangeRates, currentYear, currentMonth]);

  // Show all years until retirement
  const displayYears = yearlyData;

  // Get current summary stats based on view mode
  const currentMonthsMet = viewMode === 'monthly' ? summary.monthsMet : summary.cumulativeMonthsMet;
  const currentMonthsUnmet = viewMode === 'monthly' ? summary.monthsUnmet : summary.cumulativeMonthsUnmet;
  const currentPercentage = viewMode === 'monthly' ? summary.percentageMet : summary.cumulativePercentageMet;

  return (
    <Card>
      <SectionTitle>Monthly Investment Tracker</SectionTitle>

      {/* View Mode Tabs */}
      <TabNav ariaLabel="Tracker view mode" className={styles.tabNav}>
        <TabButton
          isActive={viewMode === 'monthly'}
          onClick={() => setViewMode('monthly')}
          ariaLabel="Switch to monthly view"
          ariaControls="monthly-panel"
          id="monthly-tab"
        >
          Monthly
        </TabButton>
        <TabButton
          isActive={viewMode === 'cumulative'}
          onClick={() => setViewMode('cumulative')}
          ariaLabel="Switch to cumulative view"
          ariaControls="cumulative-panel"
          id="cumulative-tab"
        >
          Cumulative
        </TabButton>
      </TabNav>

      {/* Summary Stats */}
      <motion.div 
        className={styles.summaryRow} 
        role="region" 
        aria-label="Investment summary"
        variants={fadeVariants}
        transition={transitions.normal}
        key={`summary-${viewMode}`}
      >
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>
            {viewMode === 'monthly' ? 'Target/Month' : 'Total Invested'}
          </span>
          <span className={styles.summaryValue}>
            {viewMode === 'monthly' 
              ? formatPLN(goal.monthlyDeposits) 
              : formatPLN(summary.totalInvested)
            }
          </span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>
            {viewMode === 'monthly' ? 'Months Met' : 'Months On Track'}
          </span>
          <span className={styles.summaryValueGreen}>{currentMonthsMet}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>
            {viewMode === 'monthly' ? 'Months Missed' : 'Months Behind'}
          </span>
          <span className={styles.summaryValueRed}>{currentMonthsUnmet}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Success Rate</span>
          <span className={currentPercentage >= 80 ? styles.summaryValueGreen : styles.summaryValueYellow}>
            {currentPercentage.toFixed(0)}%
          </span>
        </div>
      </motion.div>

      {/* Legend */}
      <div className={styles.legend} role="region" aria-label="Legend">
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendMet}`} aria-hidden="true" />
          <span>{viewMode === 'monthly' ? 'Goal Met' : 'On Track'}</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendUnmet}`} aria-hidden="true" />
          <span>{viewMode === 'monthly' ? 'Below Target' : 'Behind'}</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendFuture}`} aria-hidden="true" />
          <span>Future</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendEmpty}`} aria-hidden="true" />
          <span>Before Start</span>
        </div>
      </div>

      {/* Table */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={viewMode}
          className={styles.tableWrapper} 
          role="tabpanel" 
          id={`${viewMode}-panel`}
          aria-labelledby={`${viewMode}-tab`}
          tabIndex={0}
          variants={slideFromBottomVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={transitions.fast}
        >
        <table className={styles.table} role="grid" aria-describedby="investment-table-desc">
          <caption id="investment-table-desc" className={styles.visuallyHidden}>
            {viewMode === 'monthly' 
              ? 'Monthly investment tracking table showing required and actual investments for each month.'
              : 'Cumulative investment tracking table showing running totals of investments vs requirements.'
            }
            Green cells indicate the goal was met, red cells indicate below target.
          </caption>
          <thead>
            <tr>
              <th scope="col" className={styles.yearHeader}>
                <span className={styles.yearHeaderText}>Year</span>
                <span className={styles.yearHeaderSubtext}>Years to Go</span>
              </th>
              {MONTHS.map((month, idx) => (
                <th key={month} scope="col" className={styles.monthHeader}>
                  <abbr title={MONTH_FULL_NAMES[idx]}>{month}</abbr>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayYears.map((yearData, yearIdx) => {
              const year = yearData[0].year;
              const yearsToGo = goal.retirementYear - year;
              const requiredForYear = goal.monthlyDeposits * Math.pow(1 + goal.depositIncreasePercentage, yearIdx);

              return (
                <tr key={year}>
                  <th scope="row" className={styles.yearCell}>
                    <span className={styles.yearValue}>{year}</span>
                    <span className={styles.yearsToGo}>{yearsToGo}y</span>
                    {viewMode === 'monthly' && (
                      <span className={styles.yearRequired}>
                        Req: {formatPLN(requiredForYear)}
                      </span>
                    )}
                  </th>
                  {yearData.map((monthData) => {
                    const cellId = `cell-${viewMode}-${monthData.year}-${monthData.month}`;
                    const isCurrentMonth = monthData.year === currentYear && monthData.month === currentMonth;
                    
                    // Use appropriate status based on view mode
                    const cellStatus = viewMode === 'monthly' ? monthData.status : monthData.cumulativeStatus;
                    const isActiveCell = cellStatus !== 'future' && cellStatus !== 'empty';

                    return (
                      <td
                        key={monthData.month}
                        id={cellId}
                        className={`${styles.cell} ${styles[cellStatus]} ${isCurrentMonth ? styles.currentMonth : ''}`}
                        role="gridcell"
                        aria-label={`${MONTH_FULL_NAMES[monthData.month]} ${monthData.year}: ${
                          cellStatus === 'future'
                            ? 'Future month'
                            : cellStatus === 'empty'
                            ? 'Before investment start date'
                            : viewMode === 'monthly'
                            ? `Invested ${formatPLN(monthData.invested)} of ${formatPLN(monthData.required)} required. ${
                                cellStatus === 'met' ? 'Goal met.' : 'Below target.'
                              }`
                            : `Cumulative invested ${formatPLN(monthData.cumulativeInvested)} of ${formatPLN(monthData.cumulativeRequired)} required. ${
                                cellStatus === 'met' ? 'On track.' : 'Behind.'
                              }`
                        }`}
                        tabIndex={-1}
                      >
                        {isActiveCell && viewMode === 'monthly' && (
                          <div className={styles.cellContent}>
                            <span className={styles.investedAmount}>
                              {formatPLN(monthData.invested)}
                            </span>
                            <span className={styles.requiredAmount}>
                              / {formatPLN(monthData.required)}
                            </span>
                          </div>
                        )}
                        {isActiveCell && viewMode === 'cumulative' && (
                          <div className={styles.cellContent}>
                            <span className={styles.investedAmount}>
                              {formatPLN(monthData.cumulativeInvested)}
                            </span>
                            <span className={styles.requiredAmount}>
                              / {formatPLN(monthData.cumulativeRequired)}
                            </span>
                          </div>
                        )}
                        {!isActiveCell && (
                          <span className={styles.futureText}>—</span>
                        )}
                        {isCurrentMonth && (
                          <span className={styles.currentIndicator} aria-label="Current month">
                            ●
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        </motion.div>
      </AnimatePresence>

      {/* Keyboard navigation hint */}
      <p className={styles.keyboardHint}>
        <kbd>Tab</kbd> to focus table, then use arrow keys to navigate
      </p>
    </Card>
  );
};

export default MonthlyDepositTracker;
