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
  const currentYear = 2025;
  const yearsToRetirement = retirementYear - currentYear;

  if (yearsToRetirement <= 0) {
    return currentNetWorth;
  }

  // Convert annual return to monthly
  const monthlyReturn = Math.pow(1 + annualReturn, 1 / 12) - 1;
  const monthsToRetirement = yearsToRetirement * 12;

  // Future value of current net worth
  const fvCurrentWorth = currentNetWorth * Math.pow(1 + monthlyReturn, monthsToRetirement);

  // Future value of escalating monthly deposits
  let fvDeposits = 0;
  const annualIncreaseRate = depositIncreasePercentage;

  if (annualIncreaseRate === 0) {
    // Standard annuity formula when no escalation
    fvDeposits = monthlyDeposits *
      (Math.pow(1 + monthlyReturn, monthsToRetirement) - 1) / monthlyReturn;
  } else {
    // Escalating deposits: each year deposits increase by annualIncreaseRate
    for (let year = 0; year < yearsToRetirement; year++) {
      const yearlyDeposits = monthlyDeposits * Math.pow(1 + annualIncreaseRate, year);
      const monthsInYear = 12;
      const monthsRemaining = monthsToRetirement - (year * 12);
      
      // Future value of this year's deposits
      const fvThisYear = yearlyDeposits * monthsInYear *
        (Math.pow(1 + monthlyReturn, monthsRemaining) - 1) / monthlyReturn;
      
      fvDeposits += fvThisYear;
    }
  }

  const totalGoal = fvCurrentWorth + fvDeposits;

  return Math.round(totalGoal);
}
