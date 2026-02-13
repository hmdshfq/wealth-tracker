/**
 * Example Usage of InvestmentGoalChart (Recharts version)
 * 
 * This file demonstrates how to integrate the accessible Recharts
 * investment goal chart into your Next.js application.
 */

'use client';

import React from 'react';
import { InvestmentGoalChart } from '@/app/components/features/Goal';
import { Goal, ProjectionDataPoint } from '@/app/lib/types';

// Example: Generate mock projection data
function generateProjectionData(
  startDate: string,
  monthlyDeposit: number,
  annualReturn: number,
  years: number
): ProjectionDataPoint[] {
  const data: ProjectionDataPoint[] = [];
  const monthlyReturn = annualReturn / 12;
  
  let cumulativeContributions = 0;
  let portfolioValue = 0;
  
  const start = new Date(startDate);
  
  for (let i = 0; i < years * 12; i++) {
    const date = new Date(start);
    date.setMonth(date.getMonth() + i);
    
    // Add monthly contribution
    cumulativeContributions += monthlyDeposit;
    
    // Calculate returns on existing portfolio
    const monthlyReturnAmount = portfolioValue * monthlyReturn;
    portfolioValue += monthlyReturnAmount + monthlyDeposit;
    
    data.push({
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      value: Math.round(portfolioValue),
      goal: 500000, // Target amount
      monthlyContribution: monthlyDeposit,
      cumulativeContributions: Math.round(cumulativeContributions),
      monthlyReturn: Math.round(monthlyReturnAmount),
      cumulativeReturns: Math.round(portfolioValue - cumulativeContributions),
      principalValue: Math.round(cumulativeContributions),
    });
  }
  
  return data;
}

export default function GoalChartExample() {
  // Example goal configuration
  const goal: Goal = {
    amount: 500000, // PLN 500,000 target
    targetYear: 2045,
    retirementYear: 2045,
    annualReturn: 0.07, // 7% annual return
    monthlyDeposits: 2000, // PLN 2,000/month
    depositIncreasePercentage: 0.03, // 3% annual increase
    startDate: '2024-01-01',
  };

  // Generate 20 years of projection data
  const projectionData = generateProjectionData(
    goal.startDate,
    goal.monthlyDeposits,
    goal.annualReturn,
    20
  );

  // Current portfolio value
  const currentNetWorth = 3200; // PLN

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '24px', color: '#fff' }}>
        Investment Goal Tracker
      </h1>

      {/* Basic usage */}
      <InvestmentGoalChart
        goal={goal}
        projectionData={projectionData}
        currentNetWorth={currentNetWorth}
        totalActualContributions={0}
        preferredCurrency="PLN"
      />

      {/* With high contrast mode enabled */}
      <div style={{ marginTop: '48px' }}>
        <h2 style={{ marginBottom: '16px', color: '#fff' }}>
          High Contrast Mode
        </h2>
        <InvestmentGoalChart
          goal={goal}
          projectionData={projectionData}
          currentNetWorth={currentNetWorth}
          totalActualContributions={0}
          highContrastMode={true}
          preferredCurrency="PLN"
        />
      </div>

      {/* With WebSocket real-time updates */}
      <div style={{ marginTop: '48px' }}>
        <h2 style={{ marginBottom: '16px', color: '#fff' }}>
          Real-Time Updates (WebSocket)
        </h2>
        <InvestmentGoalChart
          goal={goal}
          projectionData={projectionData}
          currentNetWorth={currentNetWorth}
          totalActualContributions={0}
          enableRealTimeUpdates={true}
          websocketUrl="ws://localhost:8080"
          preferredCurrency="PLN"
        />
      </div>
    </div>
  );
}

/**
 * Code Snippets Reference (Recharts Version)
 * ==========================================
 * 
 * 1. BASIC CHART CONFIGURATION WITH RESPONSIVE DESIGN
 * ---------------------------------------------------
 * 
 * import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
 * 
 * <ResponsiveContainer width="100%" height={400}>
 *   <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
 *     <XAxis dataKey="date" />
 *     <YAxis tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} />
 *     <Line type="monotone" dataKey="value" stroke="#4ECDC4" strokeWidth={3} />
 *   </LineChart>
 * </ResponsiveContainer>
 * 
 * 
 * 2. CUSTOM TOOLTIP TEMPLATE WITH PROGRESS PERCENTAGES
 * ----------------------------------------------------
 * 
 * const CustomTooltip = ({ active, payload, label, goalAmount }) => {
 *   if (!active || !payload) return null;
 *   
 *   const portfolioValue = payload.find(p => p.dataKey === 'value')?.value || 0;
 *   const progressPercent = (portfolioValue / goalAmount * 100).toFixed(1);
 *   
 *   return (
 *     <div className="tooltip">
 *       <p>{label}</p>
 *       <p>Portfolio: {formatPLN(portfolioValue)} ({progressPercent}% of target)</p>
 *     </div>
 *   );
 * };
 * 
 * <Tooltip content={<CustomTooltip goalAmount={500000} />} />
 * 
 * 
 * 3. TIME RANGE FILTERING WITH DATA SLICING
 * ------------------------------------------
 * 
 * const filteredData = useMemo(() => {
 *   if (selectedRange === 'all') return projectionData;
 *   
 *   const range = TIME_RANGES.find(r => r.value === selectedRange);
 *   if (!range?.months) return projectionData;
 *   
 *   const cutoffIndex = Math.max(0, projectionData.length - range.months);
 *   return projectionData.slice(cutoffIndex);
 * }, [projectionData, selectedRange]);
 * 
 * 
 * 4. BRUSH COMPONENT FOR ZOOM FUNCTIONALITY
 * -----------------------------------------
 * 
 * import { Brush } from 'recharts';
 * 
 * <Brush
 *   dataKey="date"
 *   height={30}
 *   stroke="#4ECDC4"
 *   fill="rgba(30, 30, 47, 0.9)"
 *   startIndex={brushRange.startIndex}
 *   endIndex={brushRange.endIndex}
 *   onChange={(range) => setBrushRange(range)}
 * />
 * 
 * 
 * 5. WCAG 2.1 COLORBLIND-SAFE PALETTE
 * ------------------------------------
 * 
 * // Tested for deuteranopia, protanopia, and tritanopia
 * // Minimum 4.5:1 contrast ratio against #1E1E2F background
 * const ACCESSIBLE_COLORS = {
 *   portfolio: '#4ECDC4',  // Teal (contrast: 8.2:1)
 *   target: '#FF9F43',     // Orange (contrast: 6.1:1)
 *   contributions: '#8E7CC3', // Purple (contrast: 4.7:1)
 *   projected: '#45B7D1',  // Sky blue (contrast: 5.8:1)
 * };
 * 
 * 
 * 6. KEYBOARD NAVIGATION HANDLER
 * ------------------------------
 * 
 * const handleKeyDown = (event: React.KeyboardEvent) => {
 *   switch (event.key) {
 *     case 'ArrowRight':
 *       setFocusedDataIndex(prev => Math.min(prev + 1, maxIndex));
 *       announceToScreenReader(`${data[newIndex].date}: ${formatPLN(data[newIndex].value)}`);
 *       break;
 *     case 'ArrowLeft':
 *       setFocusedDataIndex(prev => Math.max(prev - 1, 0));
 *       break;
 *     case 'Escape':
 *       setBrushRange({});
 *       break;
 *   }
 * };
 * 
 * 
 * 7. WEBSOCKET REAL-TIME UPDATES
 * ------------------------------
 * 
 * useEffect(() => {
 *   const ws = new WebSocket(websocketUrl);
 *   
 *   ws.onmessage = (event) => {
 *     const data = JSON.parse(event.data);
 *     if (data.type === 'portfolio_update') {
 *       setLiveNetWorth(data.netWorth);
 *     }
 *   };
 *   
 *   return () => ws.close();
 * }, [websocketUrl]);
 * 
 * 
 * 8. REFERENCE LINE FOR CURRENT VALUE
 * ------------------------------------
 * 
 * import { ReferenceLine } from 'recharts';
 * 
 * <ReferenceLine
 *   y={currentNetWorth}
 *   stroke="#45B7D1"
 *   strokeDasharray="4 4"
 *   label={{ value: `Current: ${formatPLN(currentNetWorth)}`, position: 'right' }}
 * />
 * 
 * 
 * 9. TOGGLE-ABLE LEGEND WITH ACCESSIBILITY
 * -----------------------------------------
 * 
 * const [hiddenLines, setHiddenLines] = useState<Set<string>>(new Set());
 * 
 * const handleLegendToggle = (dataKey: string) => {
 *   setHiddenLines(prev => {
 *     const newSet = new Set(prev);
 *     newSet.has(dataKey) ? newSet.delete(dataKey) : newSet.add(dataKey);
 *     return newSet;
 *   });
 * };
 * 
 * // In render:
 * {!hiddenLines.has('value') && (
 *   <Line dataKey="value" stroke="#4ECDC4" />
 * )}
 */
