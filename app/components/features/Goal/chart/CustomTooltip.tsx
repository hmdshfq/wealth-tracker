import React from 'react';
import { LegendEntry } from './types';
import { CHART_COLORS } from './types';
import styles from './CustomTooltip.module.css';

interface TooltipPayloadItem {
  dataKey?: string;
  value?: number;
  name?: string;
  stroke?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  goalAmount: number;
  colors: typeof CHART_COLORS.dark;
  legendEntries: LegendEntry[];
  formatValue: (value: number) => string;
}

export const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  goalAmount,
  colors,
  legendEntries,
  formatValue,
}) => {
  if (!active || !payload || payload.length === 0) return null;

  const legendLookup = new Map(legendEntries.map((entry) => [entry.dataKey, entry]));
  const legendValueLookup = new Map(legendEntries.map((entry) => [entry.value, entry]));
  const monteCarloColorLookup = {
    p90: legendLookup.get('p90')?.color ?? legendValueLookup.get('90% Confidence')?.color,
    p50: legendLookup.get('p50')?.color ?? legendValueLookup.get('Median')?.color,
    p10: legendLookup.get('p10')?.color ?? legendValueLookup.get('10% Confidence')?.color,
  };

  const getValue = (key: string) => {
    const item = payload.find((p) => p.dataKey === key);
    return item?.value as number | undefined;
  };

  const projectedValue = getValue('value');
  const projectedContributions = getValue('cumulativeContributions');
  const actualContributions = getValue('actualContributions');
  const actualValue = getValue('actualValue');

  const hasActual = actualContributions !== undefined || actualValue !== undefined;
  const progressPercent = projectedValue && goalAmount > 0 ? (projectedValue / goalAmount) * 100 : 0;

  const projectedReturns = projectedValue && projectedContributions ? projectedValue - projectedContributions : 0;

  const payloadByType = payload.reduce<Record<string, TooltipPayloadItem[]>>((acc, entry) => {
    const key = entry.dataKey ?? entry.name ?? '';
    const legendEntry =
      legendLookup.get(entry.dataKey ?? '') ??
      legendLookup.get(key) ??
      legendValueLookup.get(entry.name ?? '');
    const type = legendEntry?.type ?? 'projected';
    if (!acc[type]) acc[type] = [];
    acc[type].push(entry);
    return acc;
  }, {});

  const renderEntries = (entries: TooltipPayloadItem[]) => {
    const uniqueEntries = entries.reduce<TooltipPayloadItem[]>((acc, entry) => {
      const key = entry.dataKey ?? entry.name;
      if (!key || entry.value === undefined) return acc;

      const existingIndex = acc.findIndex((item) => (item.dataKey ?? item.name) === key);
      if (existingIndex === -1) {
        acc.push(entry);
        return acc;
      }

      const existingEntry = acc[existingIndex];
      const existingHasStroke = Boolean(existingEntry.stroke);
      const nextHasStroke = Boolean(entry.stroke);
      if (!existingHasStroke && nextHasStroke) {
        acc[existingIndex] = entry;
      }

      return acc;
    }, []);

    return uniqueEntries
      .map((entry, index) => ({ entry, index }))
      .map(({ entry, index }) => {
        const key = entry.dataKey ?? entry.name ?? 'value';
        const legendEntry =
          legendLookup.get(entry.dataKey ?? '') ??
          legendLookup.get(key) ??
          legendValueLookup.get(entry.name ?? '');
        const normalizedKey = `${entry.dataKey ?? ''} ${entry.name ?? ''}`.toLowerCase();
        const monteCarloFallbackColor =
          normalizedKey.includes('p90') || normalizedKey.includes('90%')
            ? monteCarloColorLookup.p90
            : normalizedKey.includes('p50') ||
                normalizedKey.includes('50%') ||
                normalizedKey.includes('median')
              ? monteCarloColorLookup.p50
              : normalizedKey.includes('p10') || normalizedKey.includes('10%')
                ? monteCarloColorLookup.p10
                : undefined;
        const displayName = legendEntry?.value ?? entry.name ?? key;
        const color = entry.stroke ?? legendEntry?.color ?? monteCarloFallbackColor ?? colors.text;
        return (
          <p key={`${displayName}-${key}-${index}`} style={{ color }}>
            {displayName}: {formatValue(entry.value!)}
          </p>
        );
      });
  };

  const monteCarloEntries = payloadByType['monte-carlo'] || [];
  const scenarioEntries = payloadByType.scenario || [];
  const targetEntries = payloadByType.target || [];
  const hasTarget = targetEntries.length > 0;

  return (
    <div className={styles.customTooltip} role="tooltip" aria-live="polite">
      <p className={styles.tooltipTitle}>{label}</p>

      <div className={styles.tooltipSection}>
        <p className={styles.tooltipSectionTitle}>Projected</p>
        {projectedValue !== undefined && (
          <p style={{ color: colors.projectedValue }}>
            Portfolio: {formatValue(projectedValue)}{' '}
            <span className={styles.tooltipProgress}>({progressPercent.toFixed(1)}% of target)</span>
          </p>
        )}
        {projectedContributions !== undefined && (
          <p style={{ color: colors.projectedContributions }}>
            Contributions: {formatValue(projectedContributions)}
          </p>
        )}
        {projectedReturns !== 0 && (
          <p className={styles.tooltipReturns}>Returns: {formatValue(projectedReturns)}</p>
        )}
      </div>

      {hasActual && (
        <div className={styles.tooltipSection}>
          <p className={styles.tooltipSectionTitle}>Actual</p>
          {actualValue !== undefined && (
            <p style={{ color: colors.actualValue }}>
              Portfolio: {formatValue(actualValue)}{' '}
              <span className={styles.tooltipProgress}>
                ({((actualValue / goalAmount) * 100).toFixed(1)}% of target)
              </span>
            </p>
          )}
          {actualContributions !== undefined && (
            <p style={{ color: colors.actualContributions }}>
              Contributions: {formatValue(actualContributions)}
            </p>
          )}
          {actualValue !== undefined && actualContributions !== undefined && (
            <p style={{ color: colors.actualReturns }}>
              Returns: {formatValue(actualValue - actualContributions)} ({actualContributions > 0
                ? (((actualValue - actualContributions) / actualContributions) * 100).toFixed(1)
                : 0}
              %)
            </p>
          )}
        </div>
      )}

      {monteCarloEntries.length > 0 && (
        <div className={styles.tooltipSection}>
          <p className={styles.tooltipSectionTitle}>Confidence Bands</p>
          {renderEntries(monteCarloEntries)}
        </div>
      )}

      {scenarioEntries.length > 0 && (
        <div className={styles.tooltipSection}>
          <p className={styles.tooltipSectionTitle}>Scenarios & Benchmarks</p>
          {renderEntries(scenarioEntries)}
        </div>
      )}

      {hasTarget && (
        <div className={styles.tooltipSection}>
          <p className={styles.tooltipSectionTitle}>Target</p>
          {renderEntries(targetEntries)}
        </div>
      )}
    </div>
  );
};
