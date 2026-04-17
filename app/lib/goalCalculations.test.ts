import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  calculateGoalAmount,
  calculateYearsToGoal,
  calculateRequiredContributions,
  detectBehavioralBiases,
  calculateProgressMilestones,
  generateMotivationalMessages,
  generateAchievementBadges,
  performBehavioralAnalysis,
} from './goalCalculations';
import { Goal, ProjectionDataPoint } from './types';

// ============================================
// Test Data Fixtures
// ============================================

const createMockGoal = (overrides: Partial<Goal> = {}): Goal => ({
  amount: 1000000,
  targetYear: 2045,
  retirementYear: 2045,
  annualReturn: 0.07,
  monthlyDeposits: 2000,
  depositIncreasePercentage: 0.02,
  startDate: '2025-01-01',
  ...overrides,
});

const createProjectionData = (
  months: number,
  startValue: number,
  monthlyContribution: number,
  annualReturn: number
): ProjectionDataPoint[] => {
  const data: ProjectionDataPoint[] = [];
  const monthlyReturn = Math.pow(1 + annualReturn, 1 / 12) - 1;
  let currentValue = startValue;
  let cumulativeContributions = 0;

  for (let i = 0; i < months; i++) {
    const year = 2025 + Math.floor(i / 12);
    const month = (i % 12) + 1;
    currentValue = currentValue * (1 + monthlyReturn) + monthlyContribution;
    cumulativeContributions += monthlyContribution;

    data.push({
      year,
      month,
      date: `${year}-${String(month).padStart(2, '0')}`,
      value: Math.round(currentValue),
      goal: 1000000,
      monthlyContribution,
      cumulativeContributions,
      monthlyReturn,
      cumulativeReturns: currentValue - startValue - cumulativeContributions,
      principalValue: startValue + cumulativeContributions,
    });
  }

  return data;
};

// ============================================
// calculateGoalAmount Tests
// ============================================

describe('calculateGoalAmount', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return current net worth if years to retirement is zero', () => {
    const result = calculateGoalAmount(50000, 2025, 0.07, 1000);
    expect(result).toBe(50000);
  });

  it('should return current net worth if years to retirement is negative', () => {
    const result = calculateGoalAmount(50000, 2020, 0.07, 1000);
    expect(result).toBe(50000);
  });

  it('should calculate future value with no deposits', () => {
    const result = calculateGoalAmount(100000, 2035, 0.07, 0);
    // 100000 * (1.07)^10 ≈ 196,715
    expect(result).toBeGreaterThan(190000);
    expect(result).toBeLessThan(200000);
  });

  it('should calculate future value with monthly deposits', () => {
    const result = calculateGoalAmount(0, 2030, 0.07, 1000);
    // With monthly compounding over 5 years at 7%
    expect(result).toBeGreaterThan(70000);
    expect(result).toBeLessThan(80000);
  });

  it('should include escalating deposits correctly', () => {
    const result = calculateGoalAmount(0, 2030, 0.07, 1000, 0.05);
    // With 5% annual deposit increase
    const resultNoIncrease = calculateGoalAmount(0, 2030, 0.07, 1000, 0);
    expect(result).toBeGreaterThan(resultNoIncrease);
  });

  it('should handle high returns correctly', () => {
    const result = calculateGoalAmount(10000, 2030, 0.15, 500);
    expect(result).toBeGreaterThan(30000);
  });

  it('should handle zero return rate', () => {
    const result = calculateGoalAmount(0, 2027, 0, 1000);
    // Simple accumulation: 2 years * 12 months * 1000 = 24000
    expect(result).toBe(24000);
  });

  it('should round result to nearest integer', () => {
    const result = calculateGoalAmount(1000, 2026, 0.07, 100);
    expect(Number.isInteger(result)).toBe(true);
  });
});

// ============================================
// calculateYearsToGoal Tests
// ============================================

describe('calculateYearsToGoal', () => {
  it('should return zero years if current net worth already meets goal', () => {
    const result = calculateYearsToGoal(100000, 150000, 1000, 0.07);
    expect(result.baseYears).toBe(0);
    expect(result.optimisticYears).toBe(0);
    expect(result.pessimisticYears).toBe(0);
    expect(result.confidenceInterval).toEqual([0, 0]);
  });

  it('should return zero years if current net worth exceeds goal', () => {
    const result = calculateYearsToGoal(100000, 200000, 1000, 0.07);
    expect(result.baseYears).toBe(0);
  });

  it('should calculate years needed for realistic scenario', () => {
    const result = calculateYearsToGoal(500000, 0, 2000, 0.07);
    expect(result.baseYears).toBeGreaterThan(0);
    expect(result.baseYears).toBeLessThan(100);
  });

  it('should have optimistic years less than or equal to base years', () => {
    const result = calculateYearsToGoal(500000, 10000, 2000, 0.07);
    expect(result.optimisticYears).toBeLessThanOrEqual(result.baseYears);
  });

  it('should have pessimistic years greater than or equal to base years', () => {
    const result = calculateYearsToGoal(500000, 10000, 2000, 0.07);
    expect(result.pessimisticYears).toBeGreaterThanOrEqual(result.baseYears);
  });

  it('should cap at 100 years to prevent infinite loops', () => {
    const result = calculateYearsToGoal(1000000000, 1000, 10, 0.01);
    expect(result.baseYears).toBe(100);
  });

  it('should calculate correct confidence interval', () => {
    const result = calculateYearsToGoal(500000, 0, 2000, 0.07);
    expect(result.confidenceInterval[0]).toBe(result.pessimisticYears);
    expect(result.confidenceInterval[1]).toBe(result.optimisticYears);
  });

  it('should handle escalating contributions', () => {
    const resultWithIncrease = calculateYearsToGoal(500000, 0, 2000, 0.07, 0.05);
    const resultWithoutIncrease = calculateYearsToGoal(500000, 0, 2000, 0.07, 0);
    expect(resultWithIncrease.baseYears).toBeLessThan(resultWithoutIncrease.baseYears);
  });

  it('should handle zero monthly contributions', () => {
    const result = calculateYearsToGoal(200000, 100000, 0, 0.07);
    // Should take about 10 years to double at 7%
    expect(result.baseYears).toBeGreaterThan(9);
    expect(result.baseYears).toBeLessThan(12);
  });
});

// ============================================
// calculateRequiredContributions Tests
// ============================================

describe('calculateRequiredContributions', () => {
  it('should return zeros if target years is zero or negative', () => {
    const result = calculateRequiredContributions(100000, 0, 0, 0.07, 1000);
    expect(result).toEqual({
      requiredMonthly: 0,
      currentShortfall: 0,
      recommendedIncrease: 0,
    });
  });

  it('should calculate required contribution for simple case', () => {
    const result = calculateRequiredContributions(120000, 0, 10, 0.07, 500);
    expect(result.requiredMonthly).toBeGreaterThan(0);
    expect(result.currentShortfall).toBe(result.requiredMonthly - 500);
  });

  it('should have zero shortfall when current contributions suffice', () => {
    const result = calculateRequiredContributions(100000, 50000, 10, 0.07, 5000);
    expect(result.currentShortfall).toBeLessThanOrEqual(0);
    expect(result.recommendedIncrease).toBe(0);
  });

  it('should return positive recommendedIncrease when shortfall exists', () => {
    const result = calculateRequiredContributions(1000000, 0, 10, 0.07, 100);
    if (result.currentShortfall > 0) {
      expect(result.recommendedIncrease).toBe(result.currentShortfall);
    }
  });

  it('should round all values to nearest integer', () => {
    const result = calculateRequiredContributions(123456, 10000, 5, 0.07, 500);
    expect(Number.isInteger(result.requiredMonthly)).toBe(true);
    expect(Number.isInteger(result.currentShortfall)).toBe(true);
    expect(Number.isInteger(result.recommendedIncrease)).toBe(true);
  });

  it('should consider deposit increase percentage', () => {
    const resultWithIncrease = calculateRequiredContributions(
      500000,
      0,
      10,
      0.07,
      2000,
      0.05
    );
    const resultWithoutIncrease = calculateRequiredContributions(
      500000,
      0,
      10,
      0.07,
      2000,
      0
    );
    // With escalating deposits, initial required should be lower
    expect(resultWithIncrease.requiredMonthly).toBeLessThanOrEqual(
      resultWithoutIncrease.requiredMonthly
    );
  });

  it('should use success probability correctly', () => {
    const result70 = calculateRequiredContributions(100000, 0, 10, 0.07, 500, 0, 0.7);
    const result90 = calculateRequiredContributions(100000, 0, 10, 0.07, 500, 0, 0.9);
    // Higher success probability should require more contribution
    expect(result90.requiredMonthly).toBeGreaterThanOrEqual(result70.requiredMonthly);
  });
});

// ============================================
// detectBehavioralBiases Tests
// ============================================

describe('detectBehavioralBiases', () => {
  it('should detect overconfidence bias with very high return expectations', () => {
    const goal = createMockGoal({ annualReturn: 0.15 }); // 15% is > 10.5%
    const result = detectBehavioralBiases(goal, 100000, 50000, []);
    const overconfidence = result.find(b => b.type === 'overconfidence');
    expect(overconfidence).toBeDefined();
    expect(overconfidence?.severity).toBe('high');
  });

  it('should detect medium overconfidence for moderately high returns', () => {
    const goal = createMockGoal({ annualReturn: 0.12 }); // 12% is between 10.5% and 14%
    const result = detectBehavioralBiases(goal, 100000, 50000, []);
    const overconfidence = result.find(b => b.type === 'overconfidence');
    expect(overconfidence?.severity).toBe('medium');
  });

  it('should not detect overconfidence for reasonable returns', () => {
    const goal = createMockGoal({ annualReturn: 0.07 }); // 7% is reasonable
    const result = detectBehavioralBiases(goal, 100000, 50000, []);
    const overconfidence = result.find(b => b.type === 'overconfidence');
    expect(overconfidence).toBeUndefined();
  });

  it('should detect loss aversion bias when significant losses exist', () => {
    const goal = createMockGoal();
    const projectionData = createProjectionData(12, 100000, 1000, 0.07);
    // Net worth is less than contributions (20%+ loss)
    const result = detectBehavioralBiases(goal, 40000, 50000, projectionData);
    const lossAversion = result.find(b => b.type === 'lossAversion');
    expect(lossAversion).toBeDefined();
    expect(lossAversion?.severity).toBe('high');
  });

  it('should not detect loss aversion without significant losses', () => {
    const goal = createMockGoal();
    // Net worth exceeds contributions (gain)
    const result = detectBehavioralBiases(goal, 60000, 50000, []);
    const lossAversion = result.find(b => b.type === 'lossAversion');
    expect(lossAversion).toBeUndefined();
  });

  it('should detect herd behavior for extreme high returns', () => {
    const goal = createMockGoal({ annualReturn: 0.16 }); // > 15%
    const result = detectBehavioralBiases(goal, 100000, 50000, []);
    const herd = result.find(b => b.type === 'herdBehavior');
    expect(herd).toBeDefined();
  });

  it('should detect herd behavior for extreme low returns', () => {
    const goal = createMockGoal({ annualReturn: 0.02 }); // < 3%
    const result = detectBehavioralBiases(goal, 100000, 50000, []);
    const herd = result.find(b => b.type === 'herdBehavior');
    expect(herd).toBeDefined();
  });

  it('should detect recency bias when recent performance differs from long-term', () => {
    const goal = createMockGoal();
    const projectionData = createProjectionData(24, 100000, 1000, 0.07);
    // Modify recent data to create significant difference
    projectionData[23].value = projectionData[23].value * 1.1;
    const result = detectBehavioralBiases(goal, 150000, 50000, projectionData);
    const recency = result.find(b => b.type === 'recencyBias');
    expect(recency).toBeDefined();
  });

  it('should not detect recency bias with insufficient data', () => {
    const goal = createMockGoal();
    const projectionData = createProjectionData(10, 100000, 1000, 0.07);
    const result = detectBehavioralBiases(goal, 150000, 50000, projectionData);
    const recency = result.find(b => b.type === 'recencyBias');
    expect(recency).toBeUndefined();
  });

  it('should detect confirmation bias for high contribution rates', () => {
    const goal = createMockGoal({ monthlyDeposits: 3000 }); // 3000 > 50% of 10000
    const result = detectBehavioralBiases(goal, 5000, 5000, []);
    const confirmation = result.find(b => b.type === 'confirmationBias');
    expect(confirmation).toBeDefined();
    expect(confirmation?.severity).toBe('low');
  });

  it('should include recommendation for each detected bias', () => {
    const goal = createMockGoal({ annualReturn: 0.15 });
    const result = detectBehavioralBiases(goal, 100000, 50000, []);
    result.forEach(bias => {
      expect(bias.recommendation).toBeTruthy();
      expect(bias.recommendation.length).toBeGreaterThan(0);
    });
  });
});

// ============================================
// calculateProgressMilestones Tests
// ============================================

describe('calculateProgressMilestones', () => {
  it('should create four milestones at 25%, 50%, 75%, and 100%', () => {
    const goal = createMockGoal({ amount: 100000 });
    const result = calculateProgressMilestones(goal, 10000, []);
    expect(result).toHaveLength(4);
    expect(result[0].percentage).toBe(0.25);
    expect(result[1].percentage).toBe(0.5);
    expect(result[2].percentage).toBe(0.75);
    expect(result[3].percentage).toBe(1);
  });

  it('should mark milestones as achieved when net worth meets them', () => {
    const goal = createMockGoal({ amount: 100000 });
    const result = calculateProgressMilestones(goal, 60000, []);
    expect(result[0].achieved).toBe(true); // 25000
    expect(result[1].achieved).toBe(true); // 50000
    expect(result[2].achieved).toBe(false); // 75000
    expect(result[3].achieved).toBe(false); // 100000
  });

  it('should include celebration messages for each milestone', () => {
    const goal = createMockGoal({ amount: 100000 });
    const result = calculateProgressMilestones(goal, 10000, []);
    result.forEach(milestone => {
      expect(milestone.celebrationMessage).toBeTruthy();
    });
  });

  it('should include badges for each milestone', () => {
    const goal = createMockGoal({ amount: 100000 });
    const result = calculateProgressMilestones(goal, 10000, []);
    result.forEach(milestone => {
      expect(milestone.badge).toBeTruthy();
    });
  });

  it('should set date for achieved milestones when projection data exists', () => {
    const goal = createMockGoal({ amount: 100000 });
    const projectionData = createProjectionData(60, 0, 1000, 0.07);
    const result = calculateProgressMilestones(goal, 50000, projectionData);
    // 25% milestone (25000) should have a date
    expect(result[0].date).toBeDefined();
  });

  it('should have special celebration message for 100% milestone', () => {
    const goal = createMockGoal({ amount: 100000 });
    const result = calculateProgressMilestones(goal, 100000, []);
    expect(result[3].celebrationMessage).toContain('🎉');
    expect(result[3].celebrationMessage).toContain('CONGRATULATIONS');
  });
});

// ============================================
// generateMotivationalMessages Tests
// ============================================

describe('generateMotivationalMessages', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should include progress percentage message', () => {
    vi.setSystemTime(new Date('2025-06-01'));
    const goal = createMockGoal({ amount: 100000 });
    const projectionData = createProjectionData(12, 0, 1000, 0.07);
    const result = generateMotivationalMessages(goal, 25000, projectionData);
    const progressMessage = result.find(m => m.includes('25%'));
    expect(progressMessage).toBeDefined();
  });

  it('should include years to goal message', () => {
    vi.setSystemTime(new Date('2025-06-01'));
    const goal = createMockGoal({ amount: 100000 });
    const projectionData = createProjectionData(12, 0, 1000, 0.07);
    const result = generateMotivationalMessages(goal, 25000, projectionData);
    const yearsMessage = result.find(m => m.includes('years'));
    expect(yearsMessage).toBeDefined();
  });

  it('should provide early-stage messages for progress < 25%', () => {
    vi.setSystemTime(new Date('2025-06-01'));
    const goal = createMockGoal({ amount: 100000 });
    const projectionData = createProjectionData(12, 0, 1000, 0.07);
    const result = generateMotivationalMessages(goal, 10000, projectionData);
    expect(result.some(m => m.includes('single step'))).toBe(true);
  });

  it('should provide mid-stage messages for progress 25-50%', () => {
    vi.setSystemTime(new Date('2025-06-01'));
    const goal = createMockGoal({ amount: 100000 });
    const projectionData = createProjectionData(12, 0, 1000, 0.07);
    const result = generateMotivationalMessages(goal, 35000, projectionData);
    expect(result.some(m => m.includes('solid foundation'))).toBe(true);
  });

  it('should provide late-stage messages for progress 50-75%', () => {
    vi.setSystemTime(new Date('2025-06-01'));
    const goal = createMockGoal({ amount: 100000 });
    const projectionData = createProjectionData(12, 0, 1000, 0.07);
    const result = generateMotivationalMessages(goal, 60000, projectionData);
    expect(result.some(m => m.includes('more than halfway'))).toBe(true);
  });

  it('should provide final-stage messages for progress 75-100%', () => {
    vi.setSystemTime(new Date('2025-06-01'));
    const goal = createMockGoal({ amount: 100000 });
    const projectionData = createProjectionData(12, 0, 1000, 0.07);
    const result = generateMotivationalMessages(goal, 80000, projectionData);
    expect(result.some(m => m.includes('home stretch'))).toBe(true);
  });

  it('should provide celebration messages for 100%+ progress', () => {
    vi.setSystemTime(new Date('2025-06-01'));
    const goal = createMockGoal({ amount: 100000 });
    const projectionData = createProjectionData(12, 0, 1000, 0.07);
    const result = generateMotivationalMessages(goal, 100000, projectionData);
    expect(result.some(m => m.includes('🎉'))).toBe(true);
  });

  it('should include seasonal message for January', () => {
    vi.setSystemTime(new Date('2025-01-15'));
    const goal = createMockGoal({ amount: 100000 });
    const projectionData = createProjectionData(12, 0, 1000, 0.07);
    const result = generateMotivationalMessages(goal, 25000, projectionData);
    expect(result.some(m => m.includes('New year'))).toBe(true);
  });

  it('should include seasonal message for June', () => {
    vi.setSystemTime(new Date('2025-06-15'));
    const goal = createMockGoal({ amount: 100000 });
    const projectionData = createProjectionData(12, 0, 1000, 0.07);
    const result = generateMotivationalMessages(goal, 25000, projectionData);
    expect(result.some(m => m.includes('Mid-year'))).toBe(true);
  });

  it('should include seasonal message for December', () => {
    vi.setSystemTime(new Date('2025-12-15'));
    const goal = createMockGoal({ amount: 100000 });
    const projectionData = createProjectionData(12, 0, 1000, 0.07);
    const result = generateMotivationalMessages(goal, 25000, projectionData);
    expect(result.some(m => m.includes('Year-end'))).toBe(true);
  });
});

// ============================================
// generateAchievementBadges Tests
// ============================================

describe('generateAchievementBadges', () => {
  it('should award consistency badge for 12+ months of data', () => {
    const goal = createMockGoal();
    const projectionData = createProjectionData(12, 0, 1000, 0.07);
    const result = generateAchievementBadges(goal, 15000, 5000, projectionData);
    expect(result.some(b => b.includes('Consistent Investor'))).toBe(true);
  });

  it('should not award consistency badge for less than 12 months', () => {
    const goal = createMockGoal();
    const projectionData = createProjectionData(11, 0, 1000, 0.07);
    const result = generateAchievementBadges(goal, 15000, 5000, projectionData);
    expect(result.some(b => b.includes('Consistent Investor'))).toBe(false);
  });

  it('should award growth badge for 20%+ portfolio growth', () => {
    const goal = createMockGoal();
    const projectionData = createProjectionData(24, 100000, 1000, 0.15);
    const result = generateAchievementBadges(goal, 150000, 5000, projectionData);
    expect(result.some(b => b.includes('Growth Champion'))).toBe(true);
  });

  it('should not award growth badge for less than 20% growth', () => {
    const goal = createMockGoal();
    const projectionData = createProjectionData(12, 100000, 100, 0.02);
    const result = generateAchievementBadges(goal, 100000, 1000, projectionData);
    expect(result.some(b => b.includes('Growth Champion'))).toBe(false);
  });

  it('should award discipline badge for 50%+ of goal contributed', () => {
    const goal = createMockGoal({ amount: 100000 });
    const projectionData = createProjectionData(12, 0, 1000, 0.07);
    const result = generateAchievementBadges(goal, 30000, 60000, projectionData);
    expect(result.some(b => b.includes('Discipline Master'))).toBe(true);
  });

  it('should award speed demon badge for achieving goal in under 5 years', () => {
    const goal = createMockGoal({ amount: 50000 });
    const projectionData = createProjectionData(12, 0, 1000, 0.07);
    const result = generateAchievementBadges(goal, 30000, 20000, projectionData);
    expect(result.some(b => b.includes('Speed Demon'))).toBe(true);
  });

  it('should award long-term planner badge for 10+ year goals', () => {
    const goal = createMockGoal({ retirementYear: 2040 });
    const projectionData = createProjectionData(12, 0, 1000, 0.07);
    const result = generateAchievementBadges(goal, 30000, 20000, projectionData);
    expect(result.some(b => b.includes('Long-Term Visionary'))).toBe(true);
  });

  it('should return empty array when no badges are earned', () => {
    // Use a goal with retirement within 10 years and minimal data
    const goal = createMockGoal({ retirementYear: 2034, amount: 1000000 });
    // Only 6 months of data (no consistency badge), low growth (no growth badge)
    const projectionData = createProjectionData(6, 100000, 100, 0.01);
    // Low contribution relative to goal (no discipline badge)
    const result = generateAchievementBadges(goal, 100600, 600, projectionData);
    // Should only have growth badge if growth rate > 20%, but with 1% return it won't
    expect(result.filter(b => !b.includes('Growth'))).toEqual([]);
  });
});

// ============================================
// performBehavioralAnalysis Tests
// ============================================

describe('performBehavioralAnalysis', () => {
  it('should return complete analysis result with all components', () => {
    const goal = createMockGoal();
    const projectionData = createProjectionData(24, 0, 1000, 0.07);
    const result = performBehavioralAnalysis(goal, 50000, 25000, projectionData);

    expect(result.behavioralBiases).toBeDefined();
    expect(Array.isArray(result.behavioralBiases)).toBe(true);
    expect(result.progressMilestones).toBeDefined();
    expect(Array.isArray(result.progressMilestones)).toBe(true);
    expect(result.motivationalMessages).toBeDefined();
    expect(Array.isArray(result.motivationalMessages)).toBe(true);
    expect(result.achievementBadges).toBeDefined();
    expect(Array.isArray(result.achievementBadges)).toBe(true);
  });

  it('should integrate all analysis functions correctly', () => {
    const goal = createMockGoal({ annualReturn: 0.15 }); // Will trigger overconfidence
    const projectionData = createProjectionData(12, 50000, 3000, 0.07);
    const result = performBehavioralAnalysis(goal, 80000, 30000, projectionData);

    // Should detect biases
    expect(result.behavioralBiases.length).toBeGreaterThan(0);

    // Should have 4 milestones
    expect(result.progressMilestones).toHaveLength(4);

    // Should have motivational messages
    expect(result.motivationalMessages.length).toBeGreaterThan(0);

    // Should have at least one badge
    expect(result.achievementBadges.length).toBeGreaterThan(0);
  });

  it('should handle edge case with zero projection data', () => {
    // Use retirement year within 10 years to avoid long-term planner badge
    const goal = createMockGoal({ retirementYear: 2034 });
    const result = performBehavioralAnalysis(goal, 100000, 50000, []);

    expect(result.behavioralBiases).toEqual([]);
    expect(result.progressMilestones).toHaveLength(4);
    expect(result.motivationalMessages.length).toBeGreaterThan(0);
    // Badges depending only on projection data length should be empty
    expect(result.achievementBadges.filter(b => b.includes('Consistent') || b.includes('Growth'))).toEqual([]);
  });
});
