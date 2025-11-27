'use client';
import React, { useState, useMemo } from 'react';
import { Card, SectionTitle, Button } from '@/app/components/ui';
import {
  ProjectionDataPoint,
  TimeRange,
  ProjectionMetric,
  Goal,
} from '@/app/lib/types';
import {
  filterDataByTimeRange,
  groupProjectionByYear,
} from '@/app/lib/projectionCalculations';
import { ProjectionChart } from './ProjectionChart';
import { ProjectionDataTable } from './ProjectionDataTable';
import styles from './EnhancedProjection.module.css';

interface EnhancedProjectionProps {
  projectionData: ProjectionDataPoint[];
  goal: Goal;
  currentNetWorth: number;
}

export const EnhancedProjection: React.FC<EnhancedProjectionProps> = ({
  projectionData,
  goal,
  currentNetWorth,
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [activeMetric, setActiveMetric] = useState<ProjectionMetric>('value');

  const filteredData = useMemo(
    () => filterDataByTimeRange(projectionData, timeRange),
    [projectionData, timeRange]
  );

  const groupedData = useMemo(
    () => groupProjectionByYear(projectionData),
    [projectionData]
  );

  return (
    <div className={styles.container}>
      {/* Chart Section */}
      <Card>
        <SectionTitle
          subtitle={`Assuming ${(goal.annualReturn * 100).toFixed(1)}% annual return and monthly contributions`}
        >
          Projection to Goal
        </SectionTitle>
        <div className={styles.chartContainer}>
          <ProjectionChart
            fullData={projectionData}
            filteredData={filteredData}
            goal={goal}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
          />
        </div>
      </Card>

      {/* Table Section */}
      <Card>
        <SectionTitle>Detailed Projections</SectionTitle>
        <div className={styles.tableControls}>
          <div className={styles.tabButtons}>
            {[
              { label: 'Value', id: 'value' as ProjectionMetric },
              { label: 'Monthly Contribution', id: 'contribution' as ProjectionMetric },
              { label: 'Gross Contribution', id: 'grossContribution' as ProjectionMetric },
              { label: 'Monthly Return', id: 'return' as ProjectionMetric },
              { label: 'Cumulative Return', id: 'cumulativeReturn' as ProjectionMetric },
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={activeMetric === tab.id ? 'primary' : 'secondary'}
                size="small"
                onClick={() => setActiveMetric(tab.id)}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>
        <div className={styles.tableContainer}>
          <ProjectionDataTable
            data={groupedData}
            metric={activeMetric}
          />
        </div>
      </Card>
    </div>
  );
};
