/**
 * Calculate investment goal amount based on:
 * - Current net worth
 * - Retirement year
 * - Expected annual return
 * - Monthly deposits
 *
 * Uses future value of annuity formula:
 * FV = PV(1+r)^n + PMT * [((1+r)^n - 1) / r]
 */
export function calculateGoalAmount(
  currentNetWorth: number,
  retirementYear: number,
  annualReturn: number,
  monthlyDeposits: number
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

  // Future value of monthly deposits (annuity)
  const fvDeposits = monthlyDeposits *
    (Math.pow(1 + monthlyReturn, monthsToRetirement) - 1) / monthlyReturn;

  const totalGoal = fvCurrentWorth + fvDeposits;

  return Math.round(totalGoal);
}
