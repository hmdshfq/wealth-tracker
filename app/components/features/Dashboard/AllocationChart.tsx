'use client';
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '@/components/ui';
import { COLORS } from '@/lib/constants';
import { formatEUR } from '@/lib/formatters';
import { AllocationItem } from '@/lib/types';
import styles from './Dashboard.module.css';

interface AllocationChartProps {
  data: AllocationItem[];
}

export const AllocationChart: React.FC<AllocationChartProps> = ({ data }) => {
  const chartData: Array<{ name: string; value: number }> = data.map((item) => ({
    name: item.name,
    value: item.value,
  }));

  return (
    <Card>
      <p className={styles.chartTitle}>Allocation</p>
      <div className={styles.pieContainer}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
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
