'use client';

import React, { useId, useMemo, useRef } from 'react';
import styles from './InvestmentGoalChart.module.css';
import { CHART_COLORS } from './chart/types';
import { useTheme } from './chart/useTheme';
import { AnalysisInsightsSection } from './chart/AnalysisInsightsSection';
import { StrategicPanelsSection } from './chart/StrategicPanelsSection';
import { ChartCanvasSection } from './chart/ChartCanvasSection';
import { ChartHeaderSection } from './chart/ChartHeaderSection';
import { useInvestmentGoalChartModel } from './chart/useInvestmentGoalChartModel';
import { InvestmentGoalChartProps } from './chart/modelTypes';

export const InvestmentGoalChart: React.FC<InvestmentGoalChartProps> = (props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const colors = CHART_COLORS[theme];
  const gradientId = useId();
  const monteCarloColors = useMemo(
    () => ({
      p90: theme === 'dark' ? '#38bdf8' : '#0369a1',
      p50: theme === 'dark' ? '#f43f5e' : '#be123c',
      p10: theme === 'dark' ? '#a3e635' : '#4d7c0f',
    }),
    [theme]
  );

  const { headerModel, canvasModel, insightsModel, strategicModel, a11yModel } =
    useInvestmentGoalChartModel({
      ...props,
      theme,
      colors,
      gradientId,
      monteCarloColors,
    });

  return (
    <div
      ref={containerRef}
      className={`${styles.chartContainer} ${props.className ?? ''}`}
      role="application"
      aria-label="Investment Goal Progress Chart"
    >
      <div role="status" aria-live="polite" aria-atomic="true" className={styles.srOnly}>
        {a11yModel.announcement}
      </div>
      <div className={styles.srOnly} id="chart-summary">
        {a11yModel.chartSummary}
      </div>

      <ChartHeaderSection
        goal={props.goal}
        preferredCurrency={props.preferredCurrency}
        currentNetWorth={props.currentNetWorth}
        totalActualContributions={props.totalActualContributions}
        colors={colors}
        enableRealTimeUpdates={props.enableRealTimeUpdates ?? false}
        {...headerModel}
        setActiveHelpOverlay={strategicModel.setActiveHelpOverlay}
      />

      <AnalysisInsightsSection
        timeBasedAnalysisResult={props.timeBasedAnalysisResult}
        behavioralAnalysisResult={props.behavioralAnalysisResult}
        preferredCurrency={props.preferredCurrency}
        {...insightsModel}
      />

      <ChartCanvasSection
        {...canvasModel}
        colors={colors}
        preferredCurrency={props.preferredCurrency}
        goal={props.goal}
        currentNetWorth={props.currentNetWorth}
        gradientId={gradientId}
        theme={theme}
        monteCarloColors={monteCarloColors}
      />

      <StrategicPanelsSection
        {...strategicModel}
        goal={props.goal}
        preferredCurrency={props.preferredCurrency}
        colors={colors}
        projectionData={props.projectionData}
      />
    </div>
  );
};

export default InvestmentGoalChart;
