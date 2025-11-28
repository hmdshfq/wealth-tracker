'use client';

import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card } from '@/app/components/ui';
import { formatPLN } from '@/app/lib/formatters';
import { Goal } from '@/app/lib/types';
import { ExtendedProjectionDataPoint } from '@/app/lib/projectionCalculations';
import styles from './GoalChartMini.module.css';

// Theme-aware colors matching the main chart
const CHART_COLORS = {
  dark: {
    projectedValue: '#4ECDC4',
    actualValue: '#10b981',
    target: '#3b82f6',
    grid: 'rgba(148, 163, 184, 0.1)',
    areaFill: 'rgba(78, 205, 196, 0.15)',
  },
  light: {
    projectedValue: '#14b8a6',
    actualValue: '#059669',
    target: '#2563eb',
    grid: 'rgba(100, 116, 139, 0.15)',
    areaFill: 'rgba(20, 184, 166, 0.15)',
  },
};

// Custom hook to detect theme
function useTheme() {
  const [theme, setTheme] = React.useState<'dark' | 'light'>('dark');

  React.useEffect(() => {
    const checkTheme = () => {
      const htmlElement = document.documentElement;
      const dataTheme = htmlElement.getAttribute('data-theme');
      setTheme(dataTheme === 'light' ? 'light' : 'dark');
    };

    checkTheme();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          checkTheme();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  return theme;
}

interface GoalChartMiniProps {
  goal: Goal;
  projectionData: ExtendedProjectionDataPoint[];
  currentNetWorth: number;
  goalProgress: number;
  onClick?: () => void;
}

export const GoalChartMini: React.FC<GoalChartMiniProps> = ({
  goal,
  projectionData,
  currentNetWorth,
  goalProgress,
  onClick,
}) => {
  const theme = useTheme();
  const colors = CHART_COLORS[theme];

  // Simplify data for mini chart (sample every few points)
  const chartData = useMemo(() => {
    if (!projectionData || projectionData.length === 0) return [];
    
    // Sample data points for smoother mini chart
    const step = Math.max(1, Math.floor(projectionData.length / 20));
    const sampled = projectionData.filter((_, i) => i % step === 0 || i === projectionData.length - 1);
    
    return sampled.map((d) => ({
      date: d.date,
      value: d.value,
      goal: goal.amount,
    }));
  }, [projectionData, goal.amount]);

  const remaining = goal.amount - currentNetWorth;
  const yearsToGoal = goal.targetYear - new Date().getFullYear();

  const formatYAxis = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value.toString();
  };

  return (
    <Card className={styles.container}>
      <button 
        className={styles.clickableArea}
        onClick={onClick}
        aria-label="View full investment goal chart"
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <h3 className={styles.title}>Investment Goal Progress</h3>
            <span className={styles.viewMore}>
              View Details →
            </span>
          </div>
          
          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{goalProgress.toFixed(1)}%</span>
              <span className={styles.statLabel}>Progress</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{formatPLN(currentNetWorth)}</span>
              <span className={styles.statLabel}>Current</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{formatPLN(goal.amount)}</span>
              <span className={styles.statLabel}>Target</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{yearsToGoal}y</span>
              <span className={styles.statLabel}>Remaining</span>
            </div>
          </div>
        </div>

        {/* Mini Chart */}
        <div className={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="miniChartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.projectedValue} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={colors.projectedValue} stopOpacity={0} />
                </linearGradient>
              </defs>
              
              <XAxis 
                dataKey="date" 
                hide 
              />
              <YAxis 
                hide 
                domain={[0, 'dataMax']}
              />
              
              {/* Current value reference line */}
              <ReferenceLine
                y={currentNetWorth}
                stroke={colors.actualValue}
                strokeDasharray="3 3"
                strokeWidth={2}
              />
              
              {/* Target goal reference line */}
              <ReferenceLine
                y={goal.amount}
                stroke={colors.target}
                strokeDasharray="6 3"
                strokeWidth={1.5}
              />
              
              {/* Projected value area */}
              <Area
                type="monotone"
                dataKey="value"
                stroke={colors.projectedValue}
                strokeWidth={2}
                fill="url(#miniChartGradient)"
                isAnimationActive={typeof window !== 'undefined' ? !window.matchMedia('(prefers-reduced-motion: reduce)').matches : true}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.footerItem}>
            <span className={styles.legendDot} style={{ backgroundColor: colors.actualValue }} />
            <span className={styles.footerLabel}>Current: {formatPLN(currentNetWorth)}</span>
          </div>
          <div className={styles.footerItem}>
            <span className={styles.legendDot} style={{ backgroundColor: colors.target }} />
            <span className={styles.footerLabel}>Target: {formatPLN(goal.amount)}</span>
          </div>
          <div className={styles.footerItem}>
            <span className={styles.footerLabel} style={{ color: 'var(--text-dimmed)' }}>
              {formatPLN(remaining)} to go
            </span>
          </div>
        </div>
      </button>
    </Card>
  );
};

export default GoalChartMini;
