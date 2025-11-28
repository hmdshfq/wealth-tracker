'use client';
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '@/app/components/ui';
import { COLORS } from '@/app/lib/constants';
import { formatEUR } from '@/app/lib/formatters';
import { AllocationItem } from '@/app/lib/types';
import styles from './Dashboard.module.css';

interface AllocationChartProps {
  data: AllocationItem[];
}

export const AllocationChart: React.FC<AllocationChartProps> = ({ data }) => {
  return (
    <Card>
      <p className={styles.chartTitle}>Allocation</p>
      <div className={styles.pieContainer}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data as any}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, idx) => (
                <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [formatEUR(value), name]}
              contentStyle={{
                backgroundColor: 'var(--bg-card-solid)',
                border: '1px solid var(--border-primary)',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'var(--text-primary)',
              }}
              itemStyle={{
                color: 'var(--text-primary)',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className={styles.legend}>
        {data.map((item, idx) => (
          <div key={item.name} className={styles.legendItem}>
            <div
              className={styles.legendColor}
              style={{ background: COLORS[idx % COLORS.length] }}
            />
            <span className={styles.legendName}>{item.name}</span>
            <span className={styles.legendValue}>{item.percent.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default AllocationChart;
