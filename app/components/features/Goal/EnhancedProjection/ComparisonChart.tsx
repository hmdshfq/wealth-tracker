'use client';
import React, { useMemo } from 'react';
import {
  Line,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { ProjectionDataPoint, TimeRange, Goal } from '@/app/lib/types';
import { filterDataByTimeRange } from '@/app/lib/projectionCalculations';

interface ComparisonChartProps {
  fullData: ProjectionDataPoint[];
  goal: Goal;
  timeRange: TimeRange;
  onTimeRangeChange?: (range: TimeRange) => void;
  height?: number;
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

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string; payload: { date: string } }>;
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
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
            {entry.name}: {formatYAxis(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const ComparisonChart: React.FC<ComparisonChartProps> = ({
  fullData,
  goal,
  timeRange,
  onTimeRangeChange,
  height = 400,
}) => {
  const filteredData = useMemo(
    () => filterDataByTimeRange(fullData, timeRange),
    [fullData, timeRange]
  );

  const currentValue = fullData.length > 0 ? fullData[fullData.length - 1].value : 0;
  const goalAmount = goal.amount || 0;
  const currentProgress = goalAmount > 0 ? (currentValue / goalAmount) * 100 : 0;
  const projectedValue = fullData.length > 0 ? fullData[fullData.length - 1].value : 0;
  const projectedProgress = goalAmount > 0 ? (projectedValue / goalAmount) * 100 : 0;

  return (
    <div>
      <div style={{ marginBottom: '16px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        <div style={{ padding: '12px', backgroundColor: 'var(--bg-card)', borderRadius: '8px' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 4px 0' }}>
            Current Progress
          </p>
          <p style={{ fontSize: '18px', fontWeight: 600, color: 'var(--accent-yellow)', margin: 0 }}>
            {currentProgress.toFixed(1)}%
          </p>
        </div>
        <div style={{ padding: '12px', backgroundColor: 'var(--bg-card)', borderRadius: '8px' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 4px 0' }}>
            Projected at Retirement
          </p>
          <p style={{ fontSize: '18px', fontWeight: 600, color: 'var(--accent-green)', margin: 0 }}>
            {projectedProgress.toFixed(1)}%
          </p>
        </div>
        <div style={{ padding: '12px', backgroundColor: 'var(--bg-card)', borderRadius: '8px' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 4px 0' }}>
            Goal Amount
          </p>
          <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>
            {formatYAxis(goalAmount)}
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={filteredData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
          <defs>
            <linearGradient id="actualDepositsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--text-muted)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--text-muted)" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="actualReturnsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--accent-green)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--accent-green)" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="projectedDepositsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--text-muted)" stopOpacity={0.15} />
              <stop offset="95%" stopColor="var(--text-muted)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="projectedReturnsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--accent-green)" stopOpacity={0.15} />
              <stop offset="95%" stopColor="var(--accent-green)" stopOpacity={0} />
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
          <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="line" />

          {/* Actual Deposits (past data only) */}
          <Area
            type="monotone"
            dataKey="cumulativeContributions"
            name="Actual Deposits"
            fill="url(#actualDepositsGradient)"
            stroke="var(--text-muted)"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
            stackId="actual"
            style={{ opacity: 0.8 }}
          />

          {/* Actual Returns (past data only) */}
          <Area
            type="monotone"
            dataKey="cumulativeReturns"
            name="Actual Returns"
            fill="url(#actualReturnsGradient)"
            stroke="var(--accent-green)"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
            stackId="actual"
          />

          {/* Projected Future Deposits (future data only) */}
          <Area
            type="monotone"
            dataKey="projectedFutureDeposits"
            name="Projected Deposits"
            fill="url(#projectedDepositsGradient)"
            stroke="var(--text-muted)"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
            isAnimationActive={false}
            stackId="projected"
            style={{ opacity: 0.6 }}
          />

          {/* Projected Future Returns (future data only) */}
          <Area
            type="monotone"
            dataKey="projectedFutureReturns"
            name="Projected Returns"
            fill="url(#projectedReturnsGradient)"
            stroke="var(--accent-green)"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
            isAnimationActive={false}
            stackId="projected"
            style={{ opacity: 0.6 }}
          />

          {/* Goal Line */}
          <Line
            type="monotone"
            dataKey="goal"
            name="Goal Amount"
            stroke="var(--accent-blue)"
            strokeWidth={2.5}
            strokeDasharray="8 4"
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ComparisonChart;
