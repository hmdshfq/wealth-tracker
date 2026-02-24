import React from 'react';
import { PanelTopClose, PanelTopOpen } from 'lucide-react';
import { formatPreferredCurrency } from '@/lib/formatters';
import {
  Goal,
  InvestmentScenario,
  PreferredCurrency,
  ProjectionDataPoint,
  ScenarioAnalysisResult,
} from '@/lib/types';
import {
  ConfidenceBandsHelp,
  HelpTooltip,
  ScenarioAnalysisHelp,
} from '../InvestmentGoalChartHelp';
import styles from './StrategicPanelsSection.module.css';

interface GoalZone {
  percentage: number;
  value: number;
  date: string | undefined;
  color: string;
}

interface Benchmark {
  id: string;
  name: string;
  color: string;
  annualReturn: number;
  data: ProjectionDataPoint[];
}

interface StrategicPanelsSectionProps {
  effectiveScenarioAnalysisResult?: ScenarioAnalysisResult | null;
  setActiveHelpOverlay: React.Dispatch<
    React.SetStateAction<'confidence-bands' | 'scenario-analysis' | null>
  >;
  showScenarioAnalysisLocal: boolean;
  setShowScenarioAnalysisLocal: React.Dispatch<React.SetStateAction<boolean>>;
  activeScenarios: InvestmentScenario[];
  setActiveScenarios: React.Dispatch<React.SetStateAction<InvestmentScenario[]>>;
  goal: Goal;
  preferredCurrency: PreferredCurrency;
  colors: {
    actualReturns: string;
    actualContributions: string;
  };
  showWhatIf: boolean;
  setShowWhatIf: React.Dispatch<React.SetStateAction<boolean>>;
  whatIfParams: {
    annualReturn: number;
    monthlyDeposits: number;
    yearsToGoal: number;
  };
  setWhatIfParams: React.Dispatch<
    React.SetStateAction<{
      annualReturn: number;
      monthlyDeposits: number;
      yearsToGoal: number;
    }>
  >;
  whatIfProjection: ProjectionDataPoint[] | null;
  projectionData: ProjectionDataPoint[];
  goalAchievementZones: GoalZone[];
  benchmarkData: Benchmark[];
  yearsToGoalBaseYears: number;
  requiredContributions: Record<
    number,
    {
      requiredMonthly: number;
      currentShortfall: number;
      recommendedIncrease: number;
    }
  >;
  activeHelpOverlay: 'confidence-bands' | 'scenario-analysis' | null;
}

export function StrategicPanelsSection({
  effectiveScenarioAnalysisResult,
  setActiveHelpOverlay,
  showScenarioAnalysisLocal,
  setShowScenarioAnalysisLocal,
  activeScenarios,
  setActiveScenarios,
  goal,
  preferredCurrency,
  colors,
  showWhatIf,
  setShowWhatIf,
  whatIfParams,
  setWhatIfParams,
  whatIfProjection,
  projectionData,
  goalAchievementZones,
  benchmarkData,
  yearsToGoalBaseYears,
  requiredContributions,
  activeHelpOverlay,
}: StrategicPanelsSectionProps) {
  return (
    <>
      {effectiveScenarioAnalysisResult && (
        <div className={styles.scenarioAnalysisControls}>
          <div className={styles.scenarioAnalysisHeader}>
            <h4>Scenario Analysis</h4>
            <button
              onClick={() => setActiveHelpOverlay('scenario-analysis')}
              className={styles.helpButton}
              aria-label="Learn about scenario analysis"
            >
              ⓘ Help
            </button>
          </div>
          <div className={styles.scenarioAnalysisToggle}>
            <label>
              <input
                type="checkbox"
                checked={showScenarioAnalysisLocal}
                onChange={() => setShowScenarioAnalysisLocal(!showScenarioAnalysisLocal)}
              />
              Show Scenario Analysis
              <HelpTooltip content="Compare different return scenarios to understand potential outcomes">
                <span className={styles.helpIcon} aria-label="Help">
                  ⓘ
                </span>
              </HelpTooltip>
            </label>
          </div>

          {showScenarioAnalysisLocal && (
            <div className={styles.scenarioControls}>
              <div className={styles.scenarioLegend}>
                {activeScenarios.map((scenario) => (
                  <div key={scenario.id} className={styles.scenarioItem}>
                    <label>
                      <input
                        type="checkbox"
                        checked={scenario.isActive}
                        onChange={() => {
                          setActiveScenarios((prev) =>
                            prev.map((s) =>
                              s.id === scenario.id ? { ...s, isActive: !s.isActive } : s
                            )
                          );
                        }}
                      />
                      <span
                        className={styles.scenarioColor}
                        style={{ backgroundColor: scenario.color }}
                      />
                      <span className={styles.scenarioName}>{scenario.name}</span>
                      <HelpTooltip content={scenario.description}>
                        <span className={styles.helpIcon} aria-label="Help">
                          ⓘ
                        </span>
                      </HelpTooltip>
                    </label>
                  </div>
                ))}
              </div>

              <div className={styles.scenarioComparison}>
                <h5>Scenario Comparison</h5>
                <table className={styles.scenarioTable}>
                  <thead>
                    <tr>
                      <th>Scenario</th>
                      <th>Final Value</th>
                      <th>Difference</th>
                      <th>Success Probability</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeScenarios
                      .filter((s) => s.isActive)
                      .map((scenario) => {
                        const scenarioData = effectiveScenarioAnalysisResult.scenarios[scenario.id];
                        const finalValue = scenarioData?.[scenarioData.length - 1]?.value || 0;
                        const baseFinalValue =
                          effectiveScenarioAnalysisResult.baseScenario[
                            effectiveScenarioAnalysisResult.baseScenario.length - 1
                          ]?.value || 0;
                        const difference = finalValue - baseFinalValue;
                        const differencePercent =
                          baseFinalValue > 0 ? (difference / baseFinalValue) * 100 : 0;
                        const successProbability =
                          finalValue >= goal.amount
                            ? 100
                            : Math.min(100, (finalValue / goal.amount) * 100);

                        return (
                          <tr key={scenario.id}>
                            <td>
                              <span
                                className={styles.scenarioColor}
                                style={{ backgroundColor: scenario.color }}
                              />
                              {scenario.name}
                            </td>
                            <td>{formatPreferredCurrency(finalValue, preferredCurrency)}</td>
                            <td
                              style={{
                                color:
                                  difference >= 0
                                    ? colors.actualReturns
                                    : colors.actualContributions,
                              }}
                            >
                              {formatPreferredCurrency(difference, preferredCurrency)} (
                              {difference >= 0 ? '+' : ''}
                              {differencePercent.toFixed(1)}%)
                            </td>
                            <td>
                              <div className={styles.successMeter}>
                                <div
                                  className={styles.successMeterFill}
                                  style={{
                                    width: `${successProbability}%`,
                                    backgroundColor:
                                      successProbability >= 75
                                        ? '#10b981'
                                        : successProbability >= 50
                                          ? '#f59e0b'
                                          : '#ef4444',
                                  }}
                                />
                                <span>{successProbability.toFixed(0)}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      <div className={styles.whatIfControls}>
        <div className={styles.whatIfHeader}>
          <h4>What-if Scenarios</h4>
          <button
            onClick={() => setShowWhatIf(!showWhatIf)}
            className={styles.helpButton}
            aria-label={showWhatIf ? 'Hide what-if scenarios' : 'Show what-if scenarios'}
          >
            {showWhatIf ? (
              <>
                <PanelTopClose size={14} aria-hidden="true" />
                <span>Hide</span>
              </>
            ) : (
              <>
                <PanelTopOpen size={14} aria-hidden="true" />
                <span>Show</span>
              </>
            )}
          </button>
        </div>

        {showWhatIf && (
          <div className={styles.whatIfSliders}>
            <div className={styles.whatIfSlider}>
              <label>
                Annual Return: {Math.round(whatIfParams.annualReturn * 100)}%
                <input
                  type="range"
                  min="0.01"
                  max="0.2"
                  step="0.01"
                  value={whatIfParams.annualReturn}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    setWhatIfParams((prev) => ({ ...prev, annualReturn: value }));
                  }}
                  aria-label="Adjust annual return rate"
                />
              </label>
              <span className={styles.sliderValue}>{Math.round(whatIfParams.annualReturn * 100)}%</span>
            </div>

            <div className={styles.whatIfSlider}>
              <label>
                Monthly Contributions:{' '}
                {formatPreferredCurrency(whatIfParams.monthlyDeposits, preferredCurrency)}
                <input
                  type="range"
                  min="100"
                  max="10000"
                  step="100"
                  value={whatIfParams.monthlyDeposits}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setWhatIfParams((prev) => ({ ...prev, monthlyDeposits: value }));
                  }}
                  aria-label="Adjust monthly contributions"
                />
              </label>
              <span className={styles.sliderValue}>
                {formatPreferredCurrency(whatIfParams.monthlyDeposits, preferredCurrency)}
              </span>
            </div>

            <div className={styles.whatIfResults}>
              <h5>Projected Results</h5>
              {whatIfProjection && whatIfProjection.length > 0 && (
                <div className={styles.whatIfMetrics}>
                  <p>
                    Final Value:{' '}
                    {formatPreferredCurrency(
                      whatIfProjection[whatIfProjection.length - 1].value,
                      preferredCurrency
                    )}
                  </p>
                  <p>
                    Goal Progress:{' '}
                    {Math.min(
                      100,
                      (whatIfProjection[whatIfProjection.length - 1].value / goal.amount) * 100
                    ).toFixed(1)}
                    %
                  </p>
                  <p>
                    Difference from Base:{' '}
                    {formatPreferredCurrency(
                      whatIfProjection[whatIfProjection.length - 1].value -
                        projectionData[projectionData.length - 1].value,
                      preferredCurrency
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className={styles.goalAchievementZones}>
        <h4>Goal Progress Milestones</h4>
        <div className={styles.zonesGrid}>
          {goalAchievementZones.map((zone) => (
            <div key={`zone-summary-${zone.percentage}`} className={styles.zoneItem}>
              <div className={styles.zoneHeader}>
                <span className={styles.zoneMilestone}>
                  {Math.round(zone.percentage * 100)}% Milestone
                </span>
                <span className={styles.zoneValue}>
                  {formatPreferredCurrency(zone.value, preferredCurrency)}
                </span>
              </div>
              <div className={styles.zoneProgress}>
                <div
                  className={styles.zoneProgressBar}
                  style={{ width: `${zone.percentage * 100}%`, backgroundColor: zone.color }}
                />
              </div>
              <div className={styles.zoneDetails}>
                {zone.date ? (
                  <span className={styles.zoneDate}>
                    Projected: {new Date(zone.date).toLocaleDateString()}
                  </span>
                ) : (
                  <span className={styles.zoneDate}>Not yet reached</span>
                )}
                <span className={styles.zoneStatus}>
                  {zone.percentage === 1.0
                    ? '🎯 Goal Achieved!'
                    : zone.percentage >= 0.75
                      ? '🚀 Almost There!'
                      : zone.percentage >= 0.5
                        ? '📈 Making Progress'
                        : '💪 Keep Going!'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.benchmarkComparison}>
        <h4>Benchmark Performance Comparison</h4>
        <div className={styles.benchmarkGrid}>
          {benchmarkData.map((benchmark) => {
            const finalValue = benchmark.data[benchmark.data.length - 1]?.value || 0;
            const baseFinalValue = projectionData[projectionData.length - 1]?.value || 0;
            const difference = finalValue - baseFinalValue;
            const differencePercent = baseFinalValue > 0 ? (difference / baseFinalValue) * 100 : 0;

            return (
              <div key={benchmark.id} className={styles.benchmarkItem}>
                <div className={styles.benchmarkHeader}>
                  <span className={styles.benchmarkName} style={{ color: benchmark.color }}>
                    {benchmark.name} ({Math.round(benchmark.annualReturn * 100)}% return)
                  </span>
                  <span className={styles.benchmarkValue}>
                    {formatPreferredCurrency(finalValue, preferredCurrency)}
                  </span>
                </div>
                <div className={styles.benchmarkProgress}>
                  <div
                    className={styles.benchmarkProgressBar}
                    style={{
                      width: `${Math.min(100, (finalValue / goal.amount) * 100)}%`,
                      backgroundColor: benchmark.color,
                    }}
                  />
                </div>
                <div className={styles.benchmarkDetails}>
                  <span
                    className={styles.benchmarkDifference}
                    style={{ color: difference >= 0 ? '#10b981' : '#ef4444' }}
                  >
                    {difference >= 0 ? '+' : ''}
                    {differencePercent.toFixed(1)}% vs Your Plan
                  </span>
                  <span className={styles.benchmarkStatus}>
                    {finalValue >= goal.amount ? '🎯 Goal Achieved' : '📊 On Track'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.contributionOptimization}>
        <h4>Contribution Optimization</h4>
        <div className={styles.optimizationGrid}>
          <div className={styles.optimizationItem}>
            <h5>Current Plan</h5>
            <p>Monthly: {formatPreferredCurrency(goal.monthlyDeposits, preferredCurrency)}</p>
            <p>Years to Goal: {yearsToGoalBaseYears}</p>
          </div>

          {[5, 10, 15, 20].map((years) => {
            const req = requiredContributions[years];
            if (!req) return null;

            return (
              <div key={years} className={styles.optimizationItem}>
                <h5>Reach goal in {years} years</h5>
                <p>
                  Required: {formatPreferredCurrency(req.requiredMonthly, preferredCurrency)}/month
                </p>
                {req.currentShortfall > 0 ? (
                  <p className={styles.shortfall}>
                    Increase by:{' '}
                    {formatPreferredCurrency(req.recommendedIncrease, preferredCurrency)}/month
                  </p>
                ) : (
                  <p className={styles.surplus}>You&rsquo;re on track!</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {activeHelpOverlay === 'confidence-bands' && (
        <ConfidenceBandsHelp onClose={() => setActiveHelpOverlay(null)} />
      )}
      {activeHelpOverlay === 'scenario-analysis' && (
        <ScenarioAnalysisHelp onClose={() => setActiveHelpOverlay(null)} />
      )}
    </>
  );
}
