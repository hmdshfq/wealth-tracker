import React from 'react';
import { formatPreferredCurrency } from '@/lib/formatters';
import {
  BehavioralAnalysisResult,
  PreferredCurrency,
  TimeBasedAnalysisResult,
} from '@/lib/types';
import { HelpTooltip } from '../InvestmentGoalChartHelp';
import styles from './AnalysisInsightsSection.module.css';

interface AnalysisInsightsSectionProps {
  timeBasedAnalysisResult?: TimeBasedAnalysisResult;
  timeBasedAnalysisResultLocal: TimeBasedAnalysisResult | null;
  showTimeBasedAnalysisLocal: boolean;
  setShowTimeBasedAnalysisLocal: React.Dispatch<React.SetStateAction<boolean>>;
  behavioralAnalysisResult?: BehavioralAnalysisResult;
  showBehavioralAnalysisLocal: boolean;
  setShowBehavioralAnalysisLocal: React.Dispatch<React.SetStateAction<boolean>>;
  setActiveHelpOverlay: React.Dispatch<
    React.SetStateAction<'confidence-bands' | 'scenario-analysis' | null>
  >;
  preferredCurrency: PreferredCurrency;
  getHeatmapColor: (returnPercent: number) => string;
}

export function AnalysisInsightsSection({
  timeBasedAnalysisResult,
  timeBasedAnalysisResultLocal,
  showTimeBasedAnalysisLocal,
  setShowTimeBasedAnalysisLocal,
  behavioralAnalysisResult,
  showBehavioralAnalysisLocal,
  setShowBehavioralAnalysisLocal,
  setActiveHelpOverlay,
  preferredCurrency,
  getHeatmapColor,
}: AnalysisInsightsSectionProps) {
  return (
    <>
      {(timeBasedAnalysisResultLocal || timeBasedAnalysisResult) && (
        <div className={styles.timeBasedAnalysisControls}>
          <div className={styles.timeBasedAnalysisHeader}>
            <h4>Time-Based Analysis</h4>
            <button
              onClick={() => setActiveHelpOverlay('scenario-analysis')}
              className={styles.helpButton}
              aria-label="Learn about time-based analysis"
            >
              ⓘ Help
            </button>
          </div>
          <div className={styles.timeBasedAnalysisToggle}>
            <label>
              <input
                type="checkbox"
                checked={showTimeBasedAnalysisLocal}
                onChange={() => setShowTimeBasedAnalysisLocal(!showTimeBasedAnalysisLocal)}
              />
              Show Time-Based Analysis
              <HelpTooltip content="Analyze seasonal patterns and year-over-year performance trends">
                <span className={styles.helpIcon} aria-label="Help">
                  ⓘ
                </span>
              </HelpTooltip>
            </label>
          </div>

          {showTimeBasedAnalysisLocal && (
            <div className={styles.timeBasedAnalysisContent}>
              <div className={styles.seasonalPatterns}>
                <h5>Seasonal Patterns</h5>
                <div className={styles.patternsGrid}>
                  {(timeBasedAnalysisResultLocal?.seasonalPatterns ||
                    timeBasedAnalysisResult?.seasonalPatterns ||
                    []).map((pattern) => (
                    <div key={`pattern-${pattern.month}`} className={styles.patternItem}>
                      <div className={styles.patternHeader}>
                        <span className={styles.patternMonth}>
                          {new Date(0, pattern.month - 1).toLocaleString('default', {
                            month: 'short',
                          })}
                        </span>
                        <span
                          className={styles.patternReturn}
                          style={{ color: pattern.averageReturn >= 0 ? '#10b981' : '#ef4444' }}
                        >
                          {(pattern.averageReturn * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className={styles.patternStrength}>
                        <div
                          className={styles.patternStrengthBar}
                          style={{ width: `${pattern.patternStrength * 100}%` }}
                        />
                        <span>Strength: {Math.round(pattern.patternStrength * 100)}%</span>
                      </div>
                      <div className={styles.patternDetails}>
                        <span>Best: {pattern.bestYear}</span>
                        <span>Worst: {pattern.worstYear}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.bestWorstMonths}>
                <div className={styles.bestMonths}>
                  <h5>Best Months</h5>
                  {(timeBasedAnalysisResultLocal?.bestMonths ||
                    timeBasedAnalysisResult?.bestMonths ||
                    []).map((month) => (
                    <div key={`best-${month.month}`} className={styles.monthItem}>
                      <span className={styles.monthName}>
                        {new Date(0, month.month - 1).toLocaleString('default', {
                          month: 'long',
                        })}
                      </span>
                      <span className={styles.monthValue} style={{ color: '#10b981' }}>
                        +{(month.averageReturn * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>

                <div className={styles.worstMonths}>
                  <h5>Worst Months</h5>
                  {(timeBasedAnalysisResultLocal?.worstMonths ||
                    timeBasedAnalysisResult?.worstMonths ||
                    []).map((month) => (
                    <div key={`worst-${month.month}`} className={styles.monthItem}>
                      <span className={styles.monthName}>
                        {new Date(0, month.month - 1).toLocaleString('default', {
                          month: 'long',
                        })}
                      </span>
                      <span className={styles.monthValue} style={{ color: '#ef4444' }}>
                        {(month.averageReturn * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.yoyComparison}>
                <h5>Year-over-Year Performance</h5>
                <table className={styles.yoyTable}>
                  <thead>
                    <tr>
                      <th>Year</th>
                      <th>Start Value</th>
                      <th>End Value</th>
                      <th>Annual Return</th>
                      <th>Annual Growth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(timeBasedAnalysisResultLocal?.yearOverYearComparisons ||
                      timeBasedAnalysisResult?.yearOverYearComparisons ||
                      []).map((yoy) => (
                      <tr key={`yoy-${yoy.year}`}>
                        <td>{yoy.year}</td>
                        <td>{formatPreferredCurrency(yoy.startValue, preferredCurrency)}</td>
                        <td>{formatPreferredCurrency(yoy.endValue, preferredCurrency)}</td>
                        <td style={{ color: yoy.annualReturn >= 0 ? '#10b981' : '#ef4444' }}>
                          {(yoy.annualReturn * 100).toFixed(1)}%
                        </td>
                        <td style={{ color: yoy.annualGrowth >= 0 ? '#10b981' : '#ef4444' }}>
                          {formatPreferredCurrency(yoy.annualGrowth, preferredCurrency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={styles.performanceHeatmap}>
                <h5>Performance Heatmap</h5>
                <div className={styles.heatmapLegend}>
                  <span>Low Performance</span>
                  <div className={styles.heatmapGradient} />
                  <span>High Performance</span>
                </div>
                <div className={styles.heatmapGrid}>
                  {Object.entries(
                    timeBasedAnalysisResultLocal?.performanceHeatmap ||
                      timeBasedAnalysisResult?.performanceHeatmap ||
                      {}
                  ).map(([monthKey, returnPercent]) => (
                    <div
                      key={`heatmap-${monthKey}`}
                      className={styles.heatmapCell}
                      style={{
                        backgroundColor: getHeatmapColor(returnPercent),
                        color: Math.abs(returnPercent) > 5 ? '#ffffff' : '#1e293b',
                      }}
                      title={`${monthKey}: ${returnPercent.toFixed(1)}%`}
                    >
                      {returnPercent.toFixed(1)}%
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {behavioralAnalysisResult && (
        <div className={styles.behavioralAnalysisControls}>
          <div className={styles.behavioralAnalysisHeader}>
            <h4>Behavioral Finance Analysis</h4>
            <button
              onClick={() => setActiveHelpOverlay('scenario-analysis')}
              className={styles.helpButton}
              aria-label="Learn about behavioral finance analysis"
            >
              ⓘ Help
            </button>
          </div>
          <div className={styles.behavioralAnalysisToggle}>
            <label>
              <input
                type="checkbox"
                checked={showBehavioralAnalysisLocal}
                onChange={() => setShowBehavioralAnalysisLocal(!showBehavioralAnalysisLocal)}
              />
              Show Behavioral Analysis
              <HelpTooltip content="Identify behavioral biases and get motivational insights">
                <span className={styles.helpIcon} aria-label="Help">
                  ⓘ
                </span>
              </HelpTooltip>
            </label>
          </div>

          {showBehavioralAnalysisLocal && (
            <div className={styles.behavioralAnalysisContent}>
              <div className={styles.progressMilestones}>
                <h5>Progress Milestones</h5>
                <div className={styles.milestonesGrid}>
                  {behavioralAnalysisResult.progressMilestones.map((milestone) => (
                    <div key={`milestone-${milestone.percentage}`} className={styles.milestoneItem}>
                      <div className={styles.milestoneHeader}>
                        <span className={styles.milestonePercentage}>
                          {Math.round(milestone.percentage * 100)}%
                        </span>
                        {milestone.achieved ? (
                          <span className={styles.milestoneStatus} style={{ color: '#10b981' }}>
                            ✓ Achieved
                          </span>
                        ) : (
                          <span className={styles.milestoneStatus} style={{ color: '#f59e0b' }}>
                            🔜 Coming Soon
                          </span>
                        )}
                      </div>
                      <div className={styles.milestoneCelebration}>
                        <span className={styles.milestoneBadge}>{milestone.badge}</span>
                        <p className={styles.milestoneMessage}>{milestone.celebrationMessage}</p>
                      </div>
                      {milestone.date && (
                        <div className={styles.milestoneDate}>
                          Projected: {new Date(milestone.date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.behavioralBiases}>
                <h5>Behavioral Biases</h5>
                {behavioralAnalysisResult.behavioralBiases.length > 0 ? (
                  <div className={styles.biasesList}>
                    {behavioralAnalysisResult.behavioralBiases.map((bias) => (
                      <div key={`bias-${bias.type}`} className={styles.biasItem}>
                        <div className={styles.biasHeader}>
                          <span className={styles.biasType}>{bias.type}</span>
                          <span
                            className={styles.biasSeverity}
                            style={{
                              color:
                                bias.severity === 'high'
                                  ? '#ef4444'
                                  : bias.severity === 'medium'
                                    ? '#f59e0b'
                                    : '#10b981',
                            }}
                          >
                            {bias.severity}
                          </span>
                        </div>
                        <p className={styles.biasDescription}>{bias.description}</p>
                        <p className={styles.biasRecommendation}>
                          <strong>Recommendation:</strong> {bias.recommendation}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.noBiases}>
                    No significant behavioral biases detected. Your investment approach appears
                    balanced!
                  </p>
                )}
              </div>

              <div className={styles.motivationalMessages}>
                <h5>Motivational Insights</h5>
                <div className={styles.messagesList}>
                  {behavioralAnalysisResult.motivationalMessages.map((message, index) => (
                    <div key={`message-${index}`} className={styles.messageItem}>
                      <span className={styles.messageIcon}>💡</span>
                      <span className={styles.messageText}>{message}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.achievementBadges}>
                <h5>Your Achievements</h5>
                {behavioralAnalysisResult.achievementBadges.length > 0 ? (
                  <div className={styles.badgesList}>
                    {behavioralAnalysisResult.achievementBadges.map((badge, index) => (
                      <div key={`badge-${index}`} className={styles.badgeItem}>
                        <span className={styles.badgeIcon}>{badge}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.noBadges}>
                    Keep up the great work! You&rsquo;ll earn badges as you progress toward your
                    goals.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
