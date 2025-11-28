'use client';
import React, { useMemo } from 'react';
import { Card, SectionTitle } from '@/app/components/ui';
import { formatPLN } from '@/app/lib/formatters';
import { Transaction, Goal } from '@/app/lib/types';
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
  status: 'met' | 'unmet' | 'future' | 'empty';
}

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

        // Only count months from start date to current month in totals
        if (!isFuture && !isBeforeStart) {
          totalRequired += requiredForYear;
          totalInvested += invested;
        }

        yearData.push({
          year,
          month,
          required: requiredForYear,
          invested,
          status,
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
        percentageMet: monthsMet + monthsUnmet > 0 
          ? (monthsMet / (monthsMet + monthsUnmet)) * 100 
          : 0,
      },
    };
  }, [goal, transactions, exchangeRates, currentYear, currentMonth]);

  // Show all years until retirement
  const displayYears = yearlyData;

  return (
    <Card>
      <SectionTitle>Monthly Investment Tracker</SectionTitle>

      {/* Summary Stats */}
      <div className={styles.summaryRow} role="region" aria-label="Investment summary">
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Target/Month</span>
          <span className={styles.summaryValue}>{formatPLN(goal.monthlyDeposits)}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Months Met</span>
          <span className={styles.summaryValueGreen}>{summary.monthsMet}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Months Missed</span>
          <span className={styles.summaryValueRed}>{summary.monthsUnmet}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Success Rate</span>
          <span className={summary.percentageMet >= 80 ? styles.summaryValueGreen : styles.summaryValueYellow}>
            {summary.percentageMet.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className={styles.legend} role="region" aria-label="Legend">
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendMet}`} aria-hidden="true" />
          <span>Goal Met</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendUnmet}`} aria-hidden="true" />
          <span>Below Target</span>
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
      <div className={styles.tableWrapper} role="region" aria-label="Monthly investments table" tabIndex={0}>
        <table className={styles.table} role="grid" aria-describedby="investment-table-desc">
          <caption id="investment-table-desc" className={styles.visuallyHidden}>
            Monthly investment tracking table showing required and actual investments for each month.
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
                    <span className={styles.yearRequired}>
                      Req: {formatPLN(requiredForYear)}
                    </span>
                  </th>
                  {yearData.map((monthData) => {
                    const cellId = `cell-${monthData.year}-${monthData.month}`;
                    const isCurrentMonth = monthData.year === currentYear && monthData.month === currentMonth;

                    return (
                      <td
                        key={monthData.month}
                        id={cellId}
                        className={`${styles.cell} ${styles[monthData.status]} ${isCurrentMonth ? styles.currentMonth : ''}`}
                        role="gridcell"
                        aria-label={`${MONTH_FULL_NAMES[monthData.month]} ${monthData.year}: ${
                          monthData.status === 'future'
                            ? 'Future month'
                            : monthData.status === 'empty'
                            ? 'Before investment start date'
                            : `Invested ${formatPLN(monthData.invested)} of ${formatPLN(monthData.required)} required. ${
                                monthData.status === 'met' ? 'Goal met.' : 'Below target.'
                              }`
                        }`}
                        tabIndex={-1}
                      >
                        {monthData.status !== 'future' && monthData.status !== 'empty' && (
                          <div className={styles.cellContent}>
                            <span className={styles.investedAmount}>
                              {formatPLN(monthData.invested)}
                            </span>
                            <span className={styles.requiredAmount}>
                              / {formatPLN(monthData.required)}
                            </span>
                          </div>
                        )}
                        {(monthData.status === 'future' || monthData.status === 'empty') && (
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
      </div>

      {/* Keyboard navigation hint */}
      <p className={styles.keyboardHint}>
        <kbd>Tab</kbd> to focus table, then use arrow keys to navigate
      </p>
    </Card>
  );
};

export default MonthlyDepositTracker;
