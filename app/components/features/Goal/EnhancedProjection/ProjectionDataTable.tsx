'use client';
import React, { useMemo } from 'react';
import { ProjectionDataPoint, ProjectionMetric } from '@/app/lib/types';
import styles from './EnhancedProjection.module.css';

interface ProjectionDataTableProps {
  data: Record<number, ProjectionDataPoint[]>;
  metric: ProjectionMetric;
}

const formatNumber = (value: number): string => {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

const getMetricValues = (
  point: ProjectionDataPoint | undefined,
  metric: ProjectionMetric
): { primary: number; secondary: number } => {
  if (!point) return { primary: 0, secondary: 0 };

  switch (metric) {
    case 'value':
      return { primary: point.value, secondary: point.principalValue };
    case 'contribution':
      return { primary: point.monthlyContribution, secondary: point.cumulativeContributions };
    case 'grossContribution':
      return { primary: point.cumulativeContributions, secondary: point.value };
    case 'return':
      return { primary: point.monthlyReturn, secondary: point.cumulativeReturns };
    case 'cumulativeReturn':
      return { primary: point.cumulativeReturns, secondary: point.value };
    default:
      return { primary: 0, secondary: 0 };
  }
};

export const ProjectionDataTable: React.FC<ProjectionDataTableProps> = ({
  data,
  metric,
}) => {
  const years = useMemo(() => Object.keys(data).map(Number).sort(), [data]);

  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.projectionTable}>
        <thead>
          <tr>
            <th className={styles.yearColumn}>Year</th>
            {monthNames.map((month) => (
              <th key={month}>{month}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {years.map((year) => (
            <tr key={year}>
              <td className={styles.yearColumn}>{year}</td>
              {monthNames.map((_, monthIndex) => {
                const monthNum = monthIndex + 1;
                const point = data[year]?.find((p) => p.month === monthNum);
                const { primary, secondary } = getMetricValues(point, metric);

                return (
                  <td key={`${year}-${monthIndex}`}>
                    <div className={styles.cellContent}>
                      <span className={styles.cellValue}>
                        {formatNumber(primary)}
                      </span>
                      <span className={styles.cellSecondary}>
                        {formatNumber(secondary)}
                      </span>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
