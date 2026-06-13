'use client';

import React from 'react';
import { formatPreferredCurrency } from '@/lib/formatters';
import {
  BehavioralAnalysisResult,
  PreferredCurrency,
} from '@/lib/types';
import { HelpTooltip } from '../InvestmentGoalChartHelp';
import styles from './AnalysisInsightsSection.module.css';

interface AnalysisInsightsSectionProps {
  behavioralAnalysisResult?: BehavioralAnalysisResult;
  showBehavioralAnalysisLocal: boolean;
  setShowBehavioralAnalysisLocal: React.Dispatch<React.SetStateAction<boolean>>;
  setActiveHelpOverlay: React.Dispatch<
    React.SetStateAction<'confidence-bands' | 'scenario-analysis' | null>
  >;
  preferredCurrency: PreferredCurrency;
  getHeatmapColor: (returnPercent: number) => string;
  formatChartValue: (value: number) => string;
}

export function AnalysisInsightsSection({
  behavioralAnalysisResult,
  showBehavioralAnalysisLocal,
  setShowBehavioralAnalysisLocal,
  setActiveHelpOverlay,
  preferredCurrency,
  getHeatmapColor,
}: AnalysisInsightsSectionProps) {
  return (
    <>
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
                    Keep up the great work! You&apos;ll earn badges as you progress toward your
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