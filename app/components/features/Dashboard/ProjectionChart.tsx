'use client';
import React from 'react';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '@/app/components/ui';
import { formatPLN } from '@/app/lib/formatters';
import { ProjectionDataPoint } from '@/app/lib/types';
import styles from './Dashboard.module.css';

interface ProjectionChartProps {
  data: ProjectionDataPoint[];
  title?: string;
  subtitle?: string;
  height?: number;
}

export const ProjectionChart: React.FC<ProjectionChartProps> = ({
  data,
  title = 'Projected Growth (7% annual + zł1,500/mo)',
  subtitle,
  height = 250,
}) => {
  return (
    <Card>
      <p className={styles.chartTitle}>{title}</p>
      {subtitle && <p className={styles.chartSubtitle}>{subtitle}</p>}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="year"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
            />
            <YAxis
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
            />
            <Tooltip
              formatter={(value: number) => [formatPLN(value)]}
              contentStyle={{
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#colorValue)"
            />
            <Line
              type="monotone"
              dataKey="goal"
              stroke="#3b82f6"
              strokeDasharray="5 5"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default ProjectionChart;
