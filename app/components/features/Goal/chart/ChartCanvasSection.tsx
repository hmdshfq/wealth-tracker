import React, { useMemo } from 'react';
import {
  Area,
  Brush,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ProjectionDataPoint, ScenarioAnalysisResult } from '@/lib/types';
import { CustomLegend } from './CustomLegend';
import { CustomTooltip } from './CustomTooltip';
import {
  CHART_COLORS,
  ChartProjectionPoint,
  LegendEntry,
  resolveChartLineStyle,
} from './types';
import styles from './ChartCanvasSection.module.css';

interface ChartCanvasSectionProps {
  isMobile: boolean;
  legendPayload: LegendEntry[];
  handleLegendToggle: (dataKey: string) => void;
  hiddenLines: Set<string>;
  handleKeyDown: (event: React.KeyboardEvent) => void;
  chartSummary: string;
  currencyAdjustedData: ChartProjectionPoint[];
  colors: typeof CHART_COLORS.dark;
  formatYAxis: (value: number) => string;
  preferredCurrency: string;
  convertedGoalAmount: number;
  formatChartValue: (value: number) => string;
  goal: { amount: number };
  currentNetWorth: number;
  gradientId: string;
  theme: 'dark' | 'light';
  showScenarioAnalysisLocal: boolean;
  effectiveScenarioAnalysisResult?: ScenarioAnalysisResult | null;
  activeScenarios: { id: string; name: string; color: string; isActive: boolean }[];
  showWhatIf: boolean;
  whatIfProjection: ProjectionDataPoint[] | null;
  benchmarkData: {
    id: string;
    name: string;
    color: string;
    annualReturn: number;
    data: ProjectionDataPoint[];
  }[];
  brushRange: { startIndex?: number; endIndex?: number };
  setBrushRange: React.Dispatch<
    React.SetStateAction<{ startIndex?: number | undefined; endIndex?: number | undefined }>
  >;
  isZoomActive: boolean;
  yAxisDomain?: [number, number];

}

export const ChartCanvasSection = React.memo(function ChartCanvasSection({
  isMobile,
  legendPayload,
  handleLegendToggle,
  hiddenLines,
  handleKeyDown,
  chartSummary,
  currencyAdjustedData,
  colors,
  formatYAxis,
  preferredCurrency,
  convertedGoalAmount,
  formatChartValue,
  goal,
  currentNetWorth,
  gradientId,
  theme,
  showScenarioAnalysisLocal,
  effectiveScenarioAnalysisResult,
  activeScenarios,
  showWhatIf,
  whatIfProjection,
  benchmarkData,
  brushRange,
  setBrushRange,
  isZoomActive,
  yAxisDomain,

}: ChartCanvasSectionProps) {
  // Memoize line styles to prevent recalculation on every render
  const goalLineStyle = useMemo(() => resolveChartLineStyle({
    dataKey: 'goal',
    seriesKind: 'core',
    theme,
    colors,
    background: colors.background,
  }), [theme, colors]);
  const projectedContributionsLineStyle = useMemo(() => resolveChartLineStyle({
    dataKey: 'cumulativeContributions',
    seriesKind: 'core',
    theme,
    colors,
    background: colors.background,
  }), [theme, colors]);
  const projectedValueLineStyle = useMemo(() => resolveChartLineStyle({
    dataKey: 'value',
    seriesKind: 'core',
    theme,
    colors,
    background: colors.background,
  }), [theme, colors]);
  const actualContributionsLineStyle = useMemo(() => resolveChartLineStyle({
    dataKey: 'actualContributions',
    seriesKind: 'core',
    theme,
    colors,
    background: colors.background,
  }), [theme, colors]);
  const actualValueLineStyle = useMemo(() => resolveChartLineStyle({
    dataKey: 'actualValue',
    seriesKind: 'core',
    theme,
    colors,
    background: colors.background,
  }), [theme, colors]);

  const whatIfLineStyle = useMemo(() => resolveChartLineStyle({
    dataKey: 'whatIfValue',
    seriesKind: 'what-if',
    theme,
    colors,
    background: colors.background,
  }), [theme, colors]);



  return (
    <>
      <CustomLegend payload={legendPayload} onToggle={handleLegendToggle} hiddenLines={hiddenLines} />

      <div
        className={styles.chartWrapper}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-describedby="chart-summary"
        role="img"
        aria-label={chartSummary}
      >
         <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={currencyAdjustedData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>

            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />

            <XAxis
              dataKey="date"
              stroke={colors.textMuted}
              tick={{ fill: colors.textMuted, fontSize: 12 }}
              tickLine={{ stroke: colors.textMuted }}
              axisLine={{ stroke: colors.grid }}
              label={{ value: 'Date', position: 'insideBottom', offset: -10, fill: colors.textMuted, fontSize: 12 }}
              interval="preserveStartEnd"
              tickMargin={10}
            />

            <YAxis
              stroke={colors.textMuted}
              tick={{ fill: colors.textMuted, fontSize: 12 }}
              tickLine={{ stroke: colors.textMuted }}
              axisLine={{ stroke: colors.grid }}
              tickFormatter={formatYAxis}
              label={{ value: `Value (${preferredCurrency})`, angle: -90, position: 'insideLeft', fill: colors.textMuted, fontSize: 12 }}
              width={70}
              domain={yAxisDomain || ['auto', 'auto']}
            />

            <Tooltip
              content={
                <CustomTooltip
                  goalAmount={convertedGoalAmount}
                  colors={colors}
                  legendEntries={legendPayload}
                  formatValue={formatChartValue}
                />
              }
              cursor={{ stroke: colors.grid, strokeWidth: 1, strokeDasharray: '3 3' }}
            />

            <ReferenceLine
              y={currentNetWorth}
              stroke={colors.actualValue}
              strokeDasharray="2 2"
              strokeOpacity={0.6}
              label={{ value: 'Current', fill: colors.actualValue, fontSize: 11 }}
            />

            {[0.25, 0.5, 0.75].map((milestone) => (
              <ReferenceLine
                key={milestone}
                y={goal.amount * milestone}
                stroke={colors.target}
                strokeDasharray="1 4"
                strokeOpacity={0.3}
              />
            ))}

            {!hiddenLines.has('goal') && (
              <Line
                type="monotone"
                dataKey="goal"
                name="Target Goal"
                stroke={goalLineStyle.stroke}
                strokeWidth={goalLineStyle.strokeWidth}
                strokeDasharray={goalLineStyle.strokeDasharray}
                dot={goalLineStyle.dot}
                activeDot={goalLineStyle.activeDot}
                isAnimationActive={typeof window !== 'undefined' ? !window.matchMedia('(prefers-reduced-motion: reduce)').matches : true}
              />
            )}

            {!hiddenLines.has('cumulativeContributions') && (
              <Line
                type="monotone"
                dataKey="cumulativeContributions"
                name="Projected Contributions"
                stroke={projectedContributionsLineStyle.stroke}
                strokeWidth={projectedContributionsLineStyle.strokeWidth}
                strokeDasharray={projectedContributionsLineStyle.strokeDasharray}
                dot={projectedContributionsLineStyle.dot}
                activeDot={projectedContributionsLineStyle.activeDot}
                isAnimationActive={typeof window !== 'undefined' ? !window.matchMedia('(prefers-reduced-motion: reduce)').matches : true}
              />
            )}

            {!hiddenLines.has('value') && (
              <Line
                type="monotone"
                dataKey="value"
                name="Projected Value"
                stroke={projectedValueLineStyle.stroke}
                strokeWidth={projectedValueLineStyle.strokeWidth}
                strokeDasharray={projectedValueLineStyle.strokeDasharray}
                dot={projectedValueLineStyle.dot}
                activeDot={projectedValueLineStyle.activeDot}
                isAnimationActive={typeof window !== 'undefined' ? !window.matchMedia('(prefers-reduced-motion: reduce)').matches : true}
              />
            )}

            {showScenarioAnalysisLocal &&
              effectiveScenarioAnalysisResult &&
              activeScenarios
                .filter((s) => s.isActive && s.id !== 'base')
                .map((scenario, index) => {
                  if (hiddenLines.has(scenario.id)) {
                    return null;
                  }
                  const scenarioLineStyle = resolveChartLineStyle({
                    dataKey: scenario.id,
                    seriesKind: 'scenario',
                    theme,
                    colors,
                    background: colors.background,
                    colorHint: scenario.color,
                    index,
                  });
                  return (
                    <Line
                      key={scenario.id}
                      type="monotone"
                      dataKey={scenario.id}
                      name={scenario.name}
                      stroke={scenarioLineStyle.stroke}
                      strokeWidth={scenarioLineStyle.strokeWidth}
                      strokeDasharray={scenarioLineStyle.strokeDasharray}
                      dot={scenarioLineStyle.dot}
                      activeDot={scenarioLineStyle.activeDot}
                      isAnimationActive={typeof window !== 'undefined' ? !window.matchMedia('(prefers-reduced-motion: reduce)').matches : true}
                    />
                  );
                })}

            {showWhatIf && whatIfProjection && (
              <Line
                type="monotone"
                dataKey="whatIfValue"
                name="What-if Projection"
                stroke={whatIfLineStyle.stroke}
                strokeWidth={whatIfLineStyle.strokeWidth}
                strokeDasharray={whatIfLineStyle.strokeDasharray}
                dot={whatIfLineStyle.dot}
                activeDot={whatIfLineStyle.activeDot}
                isAnimationActive={typeof window !== 'undefined' ? !window.matchMedia('(prefers-reduced-motion: reduce)').matches : true}
              />
            )}

            {benchmarkData.map((benchmark, index) => {
              if (hiddenLines.has(benchmark.id)) {
                return null;
              }
                const benchmarkLineStyle = resolveChartLineStyle({
                  dataKey: benchmark.id,
                  seriesKind: 'benchmark',
                  theme,
                  colors,
                  background: colors.background,
                  colorHint: benchmark.color,
                  index,
                });
                return (
                  <Line
                    key={benchmark.id}
                    type="monotone"
                    dataKey={benchmark.id}
                    name={benchmark.name}
                    stroke={benchmarkLineStyle.stroke}
                    strokeWidth={benchmarkLineStyle.strokeWidth}
                    strokeDasharray={benchmarkLineStyle.strokeDasharray}
                    dot={benchmarkLineStyle.dot}
                    activeDot={benchmarkLineStyle.activeDot}
                    isAnimationActive={typeof window !== 'undefined' ? !window.matchMedia('(prefers-reduced-motion: reduce)').matches : true}
                  />
                );
              })}

            {!hiddenLines.has('actualContributions') && (
              <Line
                type="monotone"
                dataKey="actualContributions"
                name="Actual Contributions"
                stroke={actualContributionsLineStyle.stroke}
                strokeWidth={actualContributionsLineStyle.strokeWidth}
                strokeDasharray={actualContributionsLineStyle.strokeDasharray}
                dot={actualContributionsLineStyle.dot}
                activeDot={actualContributionsLineStyle.activeDot}
                connectNulls={false}
                isAnimationActive={typeof window !== 'undefined' ? !window.matchMedia('(prefers-reduced-motion: reduce)').matches : true}
              />
            )}

            {!hiddenLines.has('actualValue') && (
              <Line
                type="monotone"
                dataKey="actualValue"
                name="Actual Value"
                stroke={actualValueLineStyle.stroke}
                strokeWidth={actualValueLineStyle.strokeWidth}
                dot={actualValueLineStyle.dot}
                activeDot={actualValueLineStyle.activeDot}
                connectNulls={false}
                isAnimationActive={typeof window !== 'undefined' ? !window.matchMedia('(prefers-reduced-motion: reduce)').matches : true}
              />
            )}

            <Brush
              dataKey="date"
              height={30}
              stroke={colors.actualValue}
              fill={colors.background}
              {...(isZoomActive && {
                startIndex: brushRange.startIndex,
                endIndex: brushRange.endIndex,
              })}
              onChange={(range) => setBrushRange({ startIndex: range.startIndex, endIndex: range.endIndex })}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {!isMobile && (
        <details className={styles.dataTableDetails}>
        <summary className={styles.dataTableSummary}>View data as table</summary>
        <div className={styles.tableWrapper}>
          <table className={styles.dataTable} aria-label="Investment progress data">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Projected Value</th>
                <th scope="col">Projected Contrib.</th>
                <th scope="col">Actual Contrib.</th>
                <th scope="col">Actual Value</th>
                <th scope="col">Progress</th>
              </tr>
            </thead>
            <tbody>
              {currencyAdjustedData.slice(-12).map((point, index) => {
                const progress = (point.value / convertedGoalAmount) * 100;
                return (
                  <tr key={index}>
                    <td>{point.date}</td>
                    <td>{formatChartValue(point.value)}</td>
                    <td>{formatChartValue(point.cumulativeContributions)}</td>
                    <td>
                      {point.actualContributions !== undefined
                        ? formatChartValue(point.actualContributions)
                        : '-'}
                    </td>
                    <td>{point.actualValue !== undefined ? formatChartValue(point.actualValue) : '-'}</td>
                    <td>{progress.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>
      )}

      <div className={styles.instructions} aria-hidden="true">
        <span>Drag brush below chart to zoom</span>
        <span>Arrow keys to navigate</span>
        <span>Escape to reset</span>

      </div>
    </>
  );
});
