'use client';
import React from 'react';
import {
  Line,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush,
  Legend,
  TooltipProps,
} from 'recharts';
import { ProjectionDataPoint, TimeRange, Goal } from '@/app/lib/types';
import { TimeRangeSelector } from './TimeRangeSelector';
import styles from './EnhancedProjection.module.css';

interface ProjectionChartProps {
  fullData: ProjectionDataPoint[];
  filteredData: ProjectionDataPoint[];
  goal: Goal;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}

const formatYAxis = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`;
  }
  return value.toString();
};

const formatTooltipValue = (value: number) => {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: 'var(--bg-card-solid)',
          border: '1px solid var(--border-primary)',
          borderRadius: '8px',
          padding: '12px',
          color: 'var(--text-primary)',
        }}
      >
        <p style={{ margin: '0 0 8px 0', fontWeight: 600 }}>
          {payload[0].payload.date}
        </p>
        {payload.map((entry: any, index: number) => (
          <p
            key={index}
            style={{ margin: '4px 0', color: entry.color, fontSize: '12px' }}
          >
            {entry.name}: {formatTooltipValue(entry.value as number)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const ProjectionChart: React.FC<ProjectionChartProps> = ({
  filteredData,
  timeRange,
  onTimeRangeChange,
}) => {
  return (
    <div>
      <div className={styles.timeRangeSelector} style={{ marginBottom: '16px' }}>
        <TimeRangeSelector
          activeRange={timeRange}
          onChange={onTimeRangeChange}
        />
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={filteredData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
          <defs>
            <linearGradient id="depositsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--text-muted)" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="var(--text-muted)" stopOpacity={0.05}/>
            </linearGradient>
            <linearGradient id="returnsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--accent-green)" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="var(--accent-green)" stopOpacity={0.05}/>
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border-primary)"
            opacity={0.3}
          />
          <XAxis
            dataKey="date"
            stroke="var(--text-muted)"
            style={{ fontSize: '12px' }}
            tick={(props) => {
              const { x, y, payload } = props;
              // Show year labels only
              if (payload.value.endsWith('-01')) {
                return (
                  <text
                    x={x}
                    y={y + 10}
                    textAnchor="middle"
                    fill="var(--text-muted)"
                  >
                    {payload.value.split('-')[0]}
                  </text>
                );
              }
              return null;
            }}
          />
          <YAxis
            stroke="var(--text-muted)"
            style={{ fontSize: '12px' }}
            tickFormatter={formatYAxis}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />

          {/* Stacked areas showing portfolio composition */}
          <Area
            type="monotone"
            dataKey="cumulativeContributions"
            name="Deposits"
            fill="url(#depositsGradient)"
            stroke="var(--text-muted)"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
            stackId="portfolio"
          />
          <Area
            type="monotone"
            dataKey="cumulativeReturns"
            name="Interest/Returns"
            fill="url(#returnsGradient)"
            stroke="var(--accent-green)"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
            stackId="portfolio"
          />

          {/* Actual Investments line */}
          <Line
            type="stepAfter"
            dataKey="actualInvestedAmount"
            name="Actual Investments"
            stroke="var(--accent-yellow)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />

          {/* Goal line */}
          <Line
            type="monotone"
            dataKey="goal"
            name="Goal Amount"
            stroke="var(--accent-blue)"
            strokeWidth={2.5}
            strokeDasharray="8 4"
            dot={false}
            isAnimationActive={false}
            yAxisId="left"
          />

          {/* Brush for timeline selection */}
          <Brush
            dataKey="date"
            height={60}
            stroke="var(--border-primary)"
            fill="var(--bg-card)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
