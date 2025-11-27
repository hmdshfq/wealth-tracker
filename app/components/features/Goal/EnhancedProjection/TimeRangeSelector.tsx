'use client';
import React from 'react';
import { Button } from '@/app/components/ui';
import { TimeRange } from '@/app/lib/types';
import styles from './EnhancedProjection.module.css';

const TIME_RANGES: { label: string; value: TimeRange }[] = [
  { label: '1M', value: '1m' },
  { label: '3M', value: '3m' },
  { label: '6M', value: '6m' },
  { label: 'YTD', value: 'ytd' },
  { label: '1Y', value: '1y' },
  { label: '3Y', value: '3y' },
  { label: '5Y', value: '5y' },
  { label: 'All', value: 'all' },
];

interface TimeRangeSelectorProps {
  activeRange: TimeRange;
  onChange: (range: TimeRange) => void;
}

export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  activeRange,
  onChange,
}) => {
  return (
    <div className={styles.timeRangeSelector}>
      {TIME_RANGES.map((range) => (
        <Button
          key={range.value}
          variant={activeRange === range.value ? 'primary' : 'secondary'}
          size="small"
          onClick={() => onChange(range.value)}
        >
          {range.label}
        </Button>
      ))}
    </div>
  );
};
