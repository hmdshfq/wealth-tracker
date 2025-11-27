/**
 * Calculate investment goal amount based on:
 * - Current net worth
 * - Retirement year
 * - Expected annual return
 * - Monthly deposits
 * - Annual deposit increase percentage
 *
 * Uses future value of annuity formula with escalating deposits:
 * FV = PV(1+r)^n + PMT * [((1+r)^n - 1) / r] * adjustment for escalation
 */
export function calculateGoalAmount(
  currentNetWorth: number,
  retirementYear: number,
  annualReturn: number,
  monthlyDeposits: number,
  depositIncreasePercentage: number = 0
): number {
  const currentYear = new Date().getFullYear();
  const yearsToRetirement = retirementYear - currentYear;

  if (yearsToRetirement <= 0) {
    return currentNetWorth;
  }

  // Convert annual return to monthly
  const monthlyReturn = Math.pow(1 + annualReturn, 1 / 12) - 1;
  
  let currentBalance = currentNetWorth;

  for (let year = 0; year < yearsToRetirement; year++) {
    const currentYearMonthlyDeposits = monthlyDeposits * Math.pow(1 + depositIncreasePercentage, year);
    
    for (let month = 1; month <= 12; month++) {
      // Balance grows by return (on start balance) + Deposit (at end)
      // Formula: Balance_End = Balance_Start * (1 + r) + Deposit
      currentBalance = currentBalance * (1 + monthlyReturn) + currentYearMonthlyDeposits;
    }
  }

  return Math.round(currentBalance);
}
