import React from 'react';
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
import { MonteCarloSimulationResult, ProjectionDataPoint, ScenarioAnalysisResult } from '@/lib/types';
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
  showMonteCarloLocal: boolean;
  effectiveMonteCarloResult?: MonteCarloSimulationResult | null;
  gradientId: string;
  theme: 'dark' | 'light';
  monteCarloColors: { p90: string; p50: string; p10: string };
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
}

export function ChartCanvasSection({
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
  showMonteCarloLocal,
  effectiveMonteCarloResult,
  gradientId,
  theme,
  monteCarloColors,
  showScenarioAnalysisLocal,
  effectiveScenarioAnalysisResult,
  activeScenarios,
  showWhatIf,
  whatIfProjection,
  benchmarkData,
  brushRange,
  setBrushRange,
}: ChartCanvasSectionProps) {
  const goalLineStyle = resolveChartLineStyle({
    dataKey: 'goal',
    seriesKind: 'core',
    theme,
    colors,
    monteCarloColors,
    background: colors.background,
  });
  const projectedContributionsLineStyle = resolveChartLineStyle({
    dataKey: 'cumulativeContributions',
    seriesKind: 'core',
    theme,
    colors,
    monteCarloColors,
    background: colors.background,
  });
  const projectedValueLineStyle = resolveChartLineStyle({
    dataKey: 'value',
    seriesKind: 'core',
    theme,
    colors,
    monteCarloColors,
    background: colors.background,
  });
  const actualContributionsLineStyle = resolveChartLineStyle({
    dataKey: 'actualContributions',
    seriesKind: 'core',
    theme,
    colors,
    monteCarloColors,
    background: colors.background,
  });
  const actualValueLineStyle = resolveChartLineStyle({
    dataKey: 'actualValue',
    seriesKind: 'core',
    theme,
    colors,
    monteCarloColors,
    background: colors.background,
  });
  const p90LineStyle = resolveChartLineStyle({
    dataKey: 'p90',
    seriesKind: 'monte-carlo',
    theme,
    colors,
    monteCarloColors,
    background: colors.background,
  });
  const p50LineStyle = resolveChartLineStyle({
    dataKey: 'p50',
    seriesKind: 'monte-carlo',
    theme,
    colors,
    monteCarloColors,
    background: colors.background,
  });
  const p10LineStyle = resolveChartLineStyle({
    dataKey: 'p10',
    seriesKind: 'monte-carlo',
    theme,
    colors,
    monteCarloColors,
    background: colors.background,
  });
  const whatIfLineStyle = resolveChartLineStyle({
    dataKey: 'whatIfValue',
    seriesKind: 'what-if',
    theme,
    colors,
    monteCarloColors,
    background: colors.background,
  });

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

            {showMonteCarloLocal && effectiveMonteCarloResult && (
              <>
                {(() => {
                  const showP90 = !hiddenLines.has('p90');
                  const showP50 = !hiddenLines.has('p50');
                  const showP10 = !hiddenLines.has('p10');

                  return (
                    <>
                      <defs>
                        <linearGradient id={`confidenceGradient-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={colors.projectedValue} stopOpacity={0.3} />
                          <stop offset="50%" stopColor={colors.projectedValue} stopOpacity={0.15} />
                          <stop offset="100%" stopColor={colors.projectedValue} stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient id={`confidenceGradientDark-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={colors.projectedValue} stopOpacity={0.4} />
                          <stop offset="50%" stopColor={colors.projectedValue} stopOpacity={0.2} />
                          <stop offset="100%" stopColor={colors.projectedValue} stopOpacity={0.1} />
                        </linearGradient>
                      </defs>

                      {showP90 && showP10 && (
                        <>
                          <Area
                            type="monotone"
                            dataKey="p90"
                            stroke="none"
                            fill={`url(#confidenceGradient${theme === 'dark' ? 'Dark' : ''}-${gradientId})`}
                            activeDot={false}
                            isAnimationActive={false}
                          />
                          <Area
                            type="monotone"
                            dataKey="p10"
                            stroke="none"
                            fill={colors.background}
                            fillOpacity={1}
                            activeDot={false}
                            isAnimationActive={false}
                          />
                        </>
                      )}

                      {showP90 && (
                        <Line
                          type="monotone"
                          dataKey="p90"
                          name="90% Confidence"
                          stroke={p90LineStyle.stroke}
                          strokeWidth={p90LineStyle.strokeWidth}
                          strokeOpacity={p90LineStyle.strokeOpacity}
                          strokeDasharray={p90LineStyle.strokeDasharray}
                          dot={p90LineStyle.dot}
                          activeDot={p90LineStyle.activeDot}
                          isAnimationActive={typeof window !== 'undefined' ? !window.matchMedia('(prefers-reduced-motion: reduce)').matches : true}
                        />
                      )}
                      {showP50 && (
                        <Line
                          type="monotone"
                          dataKey="p50"
                          name="Median Projection"
                          stroke={p50LineStyle.stroke}
                          strokeWidth={p50LineStyle.strokeWidth}
                          strokeDasharray={p50LineStyle.strokeDasharray}
                          dot={p50LineStyle.dot}
                          activeDot={p50LineStyle.activeDot}
                          isAnimationActive={typeof window !== 'undefined' ? !window.matchMedia('(prefers-reduced-motion: reduce)').matches : true}
                        />
                      )}
                      {showP10 && (
                        <Line
                          type="monotone"
                          dataKey="p10"
                          name="10% Confidence"
                          stroke={p10LineStyle.stroke}
                          strokeWidth={p10LineStyle.strokeWidth}
                          strokeOpacity={p10LineStyle.strokeOpacity}
                          strokeDasharray={p10LineStyle.strokeDasharray}
                          dot={p10LineStyle.dot}
                          activeDot={p10LineStyle.activeDot}
                          isAnimationActive={typeof window !== 'undefined' ? !window.matchMedia('(prefers-reduced-motion: reduce)').matches : true}
                        />
                      )}
                    </>
                  );
                })()}
              </>
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
                    monteCarloColors,
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
                  monteCarloColors,
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
              startIndex={brushRange.startIndex}
              endIndex={brushRange.endIndex}
              onChange={(range) => setBrushRange({ startIndex: range.startIndex, endIndex: range.endIndex })}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

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

      <div className={styles.instructions} aria-hidden="true">
        <span>Drag brush below chart to zoom</span>
        <span>Arrow keys to navigate</span>
        <span>Escape to reset</span>
      </div>
    </>
  );
}
