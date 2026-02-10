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

/**
 * Calculate years required to reach investment goal
 */
export function calculateYearsToGoal(
  goalAmount: number,
  currentNetWorth: number,
  monthlyContributions: number,
  annualReturn: number,
  depositIncreasePercentage: number = 0
): {
  baseYears: number;
  optimisticYears: number;
  pessimisticYears: number;
  confidenceInterval: [number, number];
} {
  if (currentNetWorth >= goalAmount) {
    return {
      baseYears: 0,
      optimisticYears: 0,
      pessimisticYears: 0,
      confidenceInterval: [0, 0],
    };
  }

  // Convert annual return to monthly
  const monthlyReturn = Math.pow(1 + annualReturn, 1 / 12) - 1;
  
  let years = 0;
  let currentBalance = currentNetWorth;
  let currentMonthlyDeposit = monthlyContributions;

  // Calculate base case
  while (currentBalance < goalAmount && years < 100) {
    years++;
    
    for (let month = 0; month < 12; month++) {
      currentBalance = currentBalance * (1 + monthlyReturn) + currentMonthlyDeposit;
    }
    
    // Annual deposit increase
    currentMonthlyDeposit *= (1 + depositIncreasePercentage);
  }

  const baseYears = years;

  // Calculate optimistic case (+2% return)
  const optimisticMonthlyReturn = Math.pow(1 + (annualReturn + 0.02), 1 / 12) - 1;
  years = 0;
  currentBalance = currentNetWorth;
  currentMonthlyDeposit = monthlyContributions;

  while (currentBalance < goalAmount && years < 100) {
    years++;
    
    for (let month = 0; month < 12; month++) {
      currentBalance = currentBalance * (1 + optimisticMonthlyReturn) + currentMonthlyDeposit;
    }
    
    currentMonthlyDeposit *= (1 + depositIncreasePercentage);
  }

  const optimisticYears = years;

  // Calculate pessimistic case (-2% return)
  const pessimisticMonthlyReturn = Math.pow(1 + (annualReturn - 0.02), 1 / 12) - 1;
  years = 0;
  currentBalance = currentNetWorth;
  currentMonthlyDeposit = monthlyContributions;

  while (currentBalance < goalAmount && years < 100) {
    years++;
    
    for (let month = 0; month < 12; month++) {
      currentBalance = currentBalance * (1 + pessimisticMonthlyReturn) + currentMonthlyDeposit;
    }
    
    currentMonthlyDeposit *= (1 + depositIncreasePercentage);
  }

  const pessimisticYears = years;

  // Calculate confidence interval (pessimistic to optimistic)
  const confidenceInterval: [number, number] = [pessimisticYears, optimisticYears];

  return {
    baseYears,
    optimisticYears,
    pessimisticYears,
    confidenceInterval,
  };
}

/**
 * Calculate required monthly contributions to reach goal in target years
 */
export function calculateRequiredContributions(
  goalAmount: number,
  currentNetWorth: number,
  targetYears: number,
  annualReturn: number,
  monthlyContributions: number,
  depositIncreasePercentage: number = 0,
  successProbability: number = 0.7
): {
  requiredMonthly: number;
  currentShortfall: number;
  recommendedIncrease: number;
} {
  if (targetYears <= 0) {
    return {
      requiredMonthly: 0,
      currentShortfall: 0,
      recommendedIncrease: 0,
    };
  }

  // Convert annual return to monthly
  const monthlyReturn = Math.pow(1 + annualReturn, 1 / 12) - 1;
  
  // Binary search to find required monthly contribution
  let low = 0;
  let high = goalAmount / 12; // Start with a reasonable upper bound
  let requiredMonthly = 0;

  // Adjust high if current net worth is significant
  if (currentNetWorth > goalAmount * 0.5) {
    high = (goalAmount - currentNetWorth) / (targetYears * 12);
  }

  // Perform binary search
  for (let i = 0; i < 50; i++) {
    const mid = (low + high) / 2;
    let balance = currentNetWorth;
    let currentDeposit = mid;

    for (let year = 0; year < targetYears; year++) {
      for (let month = 0; month < 12; month++) {
        balance = balance * (1 + monthlyReturn) + currentDeposit;
      }
      currentDeposit *= (1 + depositIncreasePercentage);
    }

    if (balance >= goalAmount * successProbability) {
      high = mid;
      requiredMonthly = mid;
    } else {
      low = mid;
    }
  }

  const currentShortfall = requiredMonthly - monthlyContributions;
  const recommendedIncrease = currentShortfall > 0 ? currentShortfall : 0;

  return {
    requiredMonthly: Math.round(requiredMonthly),
    currentShortfall: Math.round(currentShortfall),
    recommendedIncrease: Math.round(recommendedIncrease),
  };
}
