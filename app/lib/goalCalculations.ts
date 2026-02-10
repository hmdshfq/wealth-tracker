import { Goal, ProjectionDataPoint, BehavioralBias, ProgressMilestone, BehavioralAnalysisResult } from './types';

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

// ============================================
// BEHAVIORAL FINANCE CALCULATIONS
// ============================================

/**
 * Detect behavioral biases based on user data and projections
 */
export function detectBehavioralBiases(
  goal: Goal,
  currentNetWorth: number,
  totalActualContributions: number,
  projectionData: ProjectionDataPoint[]
): BehavioralBias[] {
  const biases: BehavioralBias[] = [];
  
  // Check for overconfidence bias
  const expectedReturns = goal.annualReturn;
  const historicalMarketReturn = 0.07; // Long-term S&P 500 average
  
  if (expectedReturns > historicalMarketReturn * 1.5) {
    const severity = expectedReturns > historicalMarketReturn * 2 ? 'high' : 'medium';
    biases.push({
      type: 'overconfidence',
      description: `Your expected return (${(expectedReturns * 100).toFixed(1)}%) is significantly higher than historical market averages (${(historicalMarketReturn * 100).toFixed(1)}%)`,
      severity,
      recommendation: 'Consider more conservative return expectations to avoid disappointment and better plan for market downturns.',
    });
  }
  
  // Check for loss aversion
  const actualReturns = currentNetWorth - totalActualContributions;
  const returnPercentage = totalActualContributions > 0 ? actualReturns / totalActualContributions : 0;
  
  if (returnPercentage < -0.1 && projectionData.length > 0) {
    // Significant loss detected
    biases.push({
      type: 'lossAversion',
      description: `You've experienced significant losses (${(returnPercentage * 100).toFixed(1)}%) which may lead to overly conservative decisions`,
      severity: 'high',
      recommendation: 'Focus on long-term goals rather than short-term market fluctuations. Consider dollar-cost averaging to reduce emotional decision-making.',
    });
  }
  
  // Check for herd behavior (simplified - would need more data in real implementation)
  if (goal.annualReturn > 0.15 || goal.annualReturn < 0.03) {
    biases.push({
      type: 'herdBehavior',
      description: `Your return expectations (${(goal.annualReturn * 100).toFixed(1)}%) are at market extremes, suggesting potential herd behavior`,
      severity: 'medium',
      recommendation: 'Evaluate whether your investment strategy is based on fundamental analysis or following market trends.',
    });
  }
  
  // Check for recency bias
  if (projectionData.length > 12) {
    const recentPerformance = calculateRecentPerformance(projectionData);
    const longTermPerformance = calculateLongTermPerformance(projectionData);
    
    if (Math.abs(recentPerformance - longTermPerformance) > 0.05) {
      biases.push({
        type: 'recencyBias',
        description: `Recent performance (${(recentPerformance * 100).toFixed(1)}%) differs significantly from long-term trends (${(longTermPerformance * 100).toFixed(1)}%)`,
        severity: 'medium',
        recommendation: 'Avoid making investment decisions based solely on recent market movements. Maintain a long-term perspective.',
      });
    }
  }
  
  // Check for confirmation bias
  if (goal.monthlyDeposits > currentNetWorth * 0.5 && currentNetWorth > 0) {
    biases.push({
      type: 'confirmationBias',
      description: `Your high contribution rate (${formatPLN(goal.monthlyDeposits)}/month) relative to current net worth may indicate seeking confirmation of aggressive growth expectations`,
      severity: 'low',
      recommendation: 'Diversify your information sources and consider more balanced investment strategies.',
    });
  }
  
  return biases;
}

/**
 * Calculate recent performance (last 12 months)
 */
function calculateRecentPerformance(projectionData: ProjectionDataPoint[]): number {
  if (projectionData.length <= 12) return 0;
  
  const recentData = projectionData.slice(-12);
  const startValue = recentData[0].value - recentData[0].cumulativeContributions;
  const endValue = recentData[recentData.length - 1].value - recentData[recentData.length - 1].cumulativeContributions;
  
  return startValue > 0 ? (endValue - startValue) / startValue : 0;
}

/**
 * Calculate long-term performance
 */
function calculateLongTermPerformance(projectionData: ProjectionDataPoint[]): number {
  if (projectionData.length <= 1) return 0;
  
  const startValue = projectionData[0].value - projectionData[0].cumulativeContributions;
  const endValue = projectionData[projectionData.length - 1].value - projectionData[projectionData.length - 1].cumulativeContributions;
  
  return startValue > 0 ? (endValue - startValue) / startValue : 0;
}

/**
 * Calculate progress milestones
 */
export function calculateProgressMilestones(
  goal: Goal,
  currentNetWorth: number,
  projectionData: ProjectionDataPoint[]
): ProgressMilestone[] {
  const milestones: ProgressMilestone[] = [];
  const milestonePercentages = [0.25, 0.5, 0.75, 1.0];
  
  milestonePercentages.forEach(percentage => {
    const milestoneValue = goal.amount * percentage;
    const milestoneDate = projectionData.find(point => point.value >= milestoneValue)?.date;
    const achieved = currentNetWorth >= milestoneValue;
    
    const celebrationMessages = [
      'Great start! Keep up the momentum!',
      'Halfway there! You\'re making excellent progress!',
      'Almost at the finish line! Stay focused!',
      '🎉 CONGRATULATIONS! You\'ve achieved your investment goal! 🎉',
    ];
    
    const badges = ['🏆 First Quarter', '🥈 Halfway Hero', '🥇 Almost There', '🏅 Champion Investor'];
    
    milestones.push({
      percentage,
      achieved,
      date: milestoneDate,
      celebrationMessage: celebrationMessages[milestonePercentages.indexOf(percentage)],
      badge: badges[milestonePercentages.indexOf(percentage)],
    });
  });
  
  return milestones;
}

/**
 * Generate motivational messages based on progress
 */
export function generateMotivationalMessages(
  goal: Goal,
  currentNetWorth: number,
  projectionData: ProjectionDataPoint[]
): string[] {
  const messages: string[] = [];
  
  // Calculate progress percentage
  const progress = goal.amount > 0 ? currentNetWorth / goal.amount : 0;
  
  // Calculate years to goal
  const yearsToGoal = calculateYearsToGoal(
    goal.amount,
    currentNetWorth,
    goal.monthlyDeposits,
    goal.annualReturn,
    goal.depositIncreasePercentage
  ).baseYears;
  
  // Base motivational messages
  messages.push(`You're ${Math.round(progress * 100)}% towards your ${formatPLN(goal.amount)} goal!`);
  messages.push(`At your current pace, you'll reach your goal in approximately ${yearsToGoal} years.`);
  
  // Progress-based messages
  if (progress < 0.25) {
    messages.push('Every journey starts with a single step. Your future self will thank you for starting now!');
    messages.push('Consistency is key. Keep making those regular contributions!');
  } else if (progress < 0.5) {
    messages.push('You\'ve built a solid foundation! The power of compounding is starting to work for you.');
    messages.push('You\'re making great progress. Stay disciplined and watch your wealth grow!');
  } else if (progress < 0.75) {
    messages.push('You\'re more than halfway there! This is where compounding really accelerates!');
    messages.push('Your financial discipline is paying off. Keep up the great work!');
  } else if (progress < 1.0) {
    messages.push('You\'re in the home stretch! Your goal is within reach!');
    messages.push('All your hard work and discipline are about to pay off. Stay focused!');
  } else {
    messages.push('🎉 CONGRATULATIONS! You\'ve achieved your investment goal! 🎉');
    messages.push('Your financial discipline has paid off. Time to set new goals and continue growing!');
  }
  
  // Time-based messages
  const now = new Date();
  const currentMonth = now.getMonth();
  
  if (currentMonth === 0) { // January
    messages.push('New year, new opportunities! Review your goals and stay motivated!');
  } else if (currentMonth === 5) { // June
    messages.push('Mid-year check-in: You\'re doing great! Keep up the momentum!');
  } else if (currentMonth === 11) { // December
    messages.push('Year-end review: Look how far you\'ve come! Plan for an even better next year!');
  }
  
  return messages;
}

/**
 * Generate achievement badges
 */
export function generateAchievementBadges(
  goal: Goal,
  currentNetWorth: number,
  totalActualContributions: number,
  projectionData: ProjectionDataPoint[]
): string[] {
  const badges: string[] = [];
  
  // Consistency badge
  if (projectionData.length >= 12) {
    badges.push('🏆 Consistent Investor - 1+ year of progress');
  }
  
  // Growth badge
  const growthRate = projectionData.length > 1
    ? (projectionData[projectionData.length - 1].value - projectionData[0].value) / projectionData[0].value
    : 0;
  
  if (growthRate > 0.2) {
    badges.push('📈 Growth Champion - 20%+ portfolio growth');
  }
  
  // Discipline badge
  if (totalActualContributions > goal.amount * 0.5) {
    badges.push('💪 Discipline Master - 50%+ of goal contributed');
  }
  
  // Early achiever badge
  const yearsToGoal = calculateYearsToGoal(
    goal.amount,
    currentNetWorth,
    goal.monthlyDeposits,
    goal.annualReturn,
    goal.depositIncreasePercentage
  ).baseYears;
  
  if (yearsToGoal < 5) {
    badges.push('🚀 Speed Demon - On track to achieve goal in under 5 years');
  }
  
  // Long-term planner badge
  if (goal.retirementYear - new Date().getFullYear() > 10) {
    badges.push('🎯 Long-Term Visionary - Planning 10+ years ahead');
  }
  
  return badges;
}

/**
 * Perform comprehensive behavioral analysis
 */
export function performBehavioralAnalysis(
  goal: Goal,
  currentNetWorth: number,
  totalActualContributions: number,
  projectionData: ProjectionDataPoint[]
): BehavioralAnalysisResult {
  const behavioralBiases = detectBehavioralBiases(goal, currentNetWorth, totalActualContributions, projectionData);
  const progressMilestones = calculateProgressMilestones(goal, currentNetWorth, projectionData);
  const motivationalMessages = generateMotivationalMessages(goal, currentNetWorth, projectionData);
  const achievementBadges = generateAchievementBadges(goal, currentNetWorth, totalActualContributions, projectionData);
  
  return {
    behavioralBiases,
    progressMilestones,
    motivationalMessages,
    achievementBadges,
  };
}

// Helper function for formatting (would normally import from formatters)
function formatPLN(amount: number): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
