'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './InvestmentGoalChartHelp.module.css';

interface HelpTooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'right' | 'bottom' | 'left';
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({ 
  content, 
  children, 
  position = 'right'
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className={styles.tooltipContainer}>
      <div 
        className={styles.trigger}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        tabIndex={0}
        role="button"
        aria-label="Show help"
      >
        {children}
      </div>
      {showTooltip && (
        <div className={`${styles.tooltip} ${styles[position]}`} role="tooltip">
          <div className={styles.tooltipArrow} />
          <div className={styles.tooltipContent}>{content}</div>
        </div>
      )}
    </div>
  );
};

interface ConfidenceBandsHelpProps {
  onClose: () => void;
}

export const ConfidenceBandsHelp: React.FC<ConfidenceBandsHelpProps> = ({ onClose }) => {
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const content = (
    <div className={styles.helpOverlay} role="dialog" aria-labelledby="confidence-bands-help-title">
      <div className={styles.helpContent}>
        <div className={styles.helpHeader}>
          <h3 id="confidence-bands-help-title" className={styles.helpTitle}>🎯 Understanding Confidence Bands</h3>
          <button 
            onClick={onClose} 
            className={styles.closeButton} 
            aria-label="Close help"
          >
            ×
          </button>
        </div>

        <div className={styles.helpSection}>
          <h4>What Are Confidence Bands?</h4>
          <p>Confidence bands show the range of possible outcomes for your investments based on historical market behavior.</p>
          <ul>
            <li><strong>90th Percentile:</strong> Only 10% of simulations exceed this</li>
            <li><strong>50th Percentile:</strong> The median - 50% above, 50% below</li>
            <li><strong>10th Percentile:</strong> Only 10% of simulations fall below this</li>
          </ul>
        </div>

        <div className={styles.helpSection}>
          <h4>How to Interpret Your Results</h4>
          <div className={styles.interpretationGuide}>
            <div className={styles.guideItem}>
              <div className={styles.guideVisual}>✅</div>
              <div>
                <strong>Goal within bands:</strong> You&rsquo;re on track!
              </div>
            </div>
            <div className={styles.guideItem}>
              <div className={styles.guideVisual}>⚠️</div>
              <div>
                <strong>Goal above bands:</strong> Consider increasing contributions
              </div>
            </div>
            <div className={styles.guideItem}>
              <div className={styles.guideVisual}>🎉</div>
              <div>
                <strong>Goal below bands:</strong> You&rsquo;ll likely exceed your target!
              </div>
            </div>
          </div>
        </div>

        <div className={styles.helpSection}>
          <h4>Adjusting the Controls</h4>
          <div className={styles.controlsGuide}>
            <div className={styles.controlItem}>
              <strong>Volatility Slider (5%-30%):</strong>
              <p>Adjust based on your investment mix:</p>
              <ul>
                <li>🐢 5-10%: Bonds, stable investments</li>
                <li>🏃 15%: Balanced portfolio (recommended)</li>
                <li>🚀 20-30%: Growth stocks, aggressive investments</li>
              </ul>
            </div>
            <div className={styles.controlItem}>
              <strong>Simulations (100-5,000):</strong>
              <p>More simulations = more accurate percentiles:</p>
              <ul>
                <li>🤏 100-500: Quick exploration</li>
                <li>✅ 1,000: Great balance (recommended)</li>
                <li>🔍 2,000-5,000: Most accurate</li>
              </ul>
            </div>
          </div>
        </div>

        <div className={styles.helpSection}>
          <h4>Pro Tips</h4>
          <ul>
            <li>📊 <strong>Narrow bands:</strong> Higher confidence in projections</li>
            <li>🌊 <strong>Wide bands:</strong> Greater uncertainty - plan conservatively</li>
            <li>🎲 <strong>1,000 simulations:</strong> Like rolling 1,000 dice to see possible outcomes</li>
            <li>📈 <strong>Long-term focus:</strong> Short-term fluctuations are normal</li>
          </ul>
        </div>

        <div className={styles.helpActions}>
          <button onClick={onClose} className={styles.primaryButton}>Got it!</button>
          <a href="/help/confidence-bands" className={styles.secondaryButton} target="_blank" rel="noopener noreferrer">
            Learn More
          </a>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

interface ScenarioAnalysisHelpProps {
  onClose: () => void;
}

export const ScenarioAnalysisHelp: React.FC<ScenarioAnalysisHelpProps> = ({ onClose }) => {
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const content = (
    <div className={styles.helpOverlay} role="dialog" aria-labelledby="scenario-analysis-help-title">
      <div className={styles.helpContent}>
        <div className={styles.helpHeader}>
          <h3 id="scenario-analysis-help-title" className={styles.helpTitle}>🔮 Understanding Scenario Analysis</h3>
          <button 
            onClick={onClose} 
            className={styles.closeButton} 
            aria-label="Close help"
          >
            ×
          </button>
        </div>

        <div className={styles.helpSection}>
          <h4>What Is Scenario Analysis?</h4>
          <p>Scenario analysis helps you understand how different market conditions could affect your investment outcomes by comparing multiple return scenarios.</p>
          <ul>
            <li><strong>Base Case:</strong> Your original plan with expected returns</li>
            <li><strong>Optimistic:</strong> Higher returns scenario (+2% annual return)</li>
            <li><strong>Pessimistic:</strong> Lower returns scenario (-2% annual return)</li>
          </ul>
        </div>

        <div className={styles.helpSection}>
          <h4>How to Use This Feature</h4>
          <div className={styles.interpretationGuide}>
            <div className={styles.guideItem}>
              <div className={styles.guideVisual}>📊</div>
              <div>
                <strong>Compare scenarios:</strong> See how different return rates affect your final portfolio value
              </div>
            </div>
            <div className={styles.guideItem}>
              <div className={styles.guideVisual}>🎯</div>
              <div>
                <strong>Assess risk:</strong> Understand the range of possible outcomes
              </div>
            </div>
            <div className={styles.guideItem}>
              <div className={styles.guideVisual}>💡</div>
              <div>
                <strong>Plan strategically:</strong> Make informed decisions about your investment strategy
              </div>
            </div>
          </div>
        </div>

        <div className={styles.helpSection}>
          <h4>Interpreting the Results</h4>
          <div className={styles.scenarioInterpretation}>
            <div className={styles.scenarioItem}>
              <span className={styles.scenarioColor} style={{ backgroundColor: '#4ECDC4' }} />
              <strong>Base Case:</strong> Your current plan - the most likely outcome based on your assumptions
            </div>
            <div className={styles.scenarioItem}>
              <span className={styles.scenarioColor} style={{ backgroundColor: '#10b981' }} />
              <strong>Optimistic:</strong> What could happen if markets perform better than expected
            </div>
            <div className={styles.scenarioItem}>
              <span className={styles.scenarioColor} style={{ backgroundColor: '#ef4444' }} />
              <strong>Pessimistic:</strong> What could happen if markets perform worse than expected
            </div>
          </div>
        </div>

        <div className={styles.helpSection}>
          <h4>Scenario Comparison Table</h4>
          <p>The table shows key metrics for each scenario:</p>
          <ul>
            <li><strong>Final Value:</strong> Projected portfolio value at retirement</li>
            <li><strong>Difference:</strong> How much more/less than your base case</li>
            <li><strong>Success Probability:</strong> Likelihood of reaching your goal</li>
          </ul>
        </div>

        <div className={styles.helpSection}>
          <h4>Pro Tips</h4>
          <ul>
            <li>📈 <strong>Wide spread:</strong> Greater uncertainty - consider diversifying</li>
            <li>🎯 <strong>All scenarios above goal:</strong> You&rsquo;re in great shape!</li>
            <li>⚠️ <strong>Pessimistic below goal:</strong> Consider increasing contributions</li>
            <li>🔄 <strong>Toggle scenarios:</strong> Focus on the scenarios most relevant to you</li>
          </ul>
        </div>

        <div className={styles.helpActions}>
          <button onClick={onClose} className={styles.primaryButton}>Got it!</button>
          <a href="/help/scenario-analysis" className={styles.secondaryButton} target="_blank" rel="noopener noreferrer">
            Learn More
          </a>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};
