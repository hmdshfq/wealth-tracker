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

const getValue = (
  point: ProjectionDataPoint | undefined,
  metric: ProjectionMetric
): number => {
  if (!point) return 0;

  switch (metric) {
    case 'value':
      return point.value;
    case 'contribution':
      return point.monthlyContribution;
    case 'grossContribution':
      return point.cumulativeContributions;
    case 'return':
      return point.monthlyReturn;
    case 'cumulativeReturn':
      return point.cumulativeReturns;
    default:
      return 0;
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
                const value = getValue(point, metric);

                return (
                  <td key={`${year}-${monthIndex}`}>
                    <span className={styles.cellValue}>
                      {formatNumber(value)}
                    </span>
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
