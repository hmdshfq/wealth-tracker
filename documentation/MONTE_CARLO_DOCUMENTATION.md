# 🎯 Monte Carlo Simulation Feature Documentation

## Overview

The Monte Carlo Simulation feature enhances the Investment Goal Progress chart by providing probabilistic forecasting of investment outcomes. Instead of showing only a single deterministic projection, users can now visualize the range of possible future values based on historical market volatility.

## Key Features

### 1. Confidence Bands Visualization

**Visual Elements:**
- **90th-10th Percentile Range**: Shaded area showing the likely range of outcomes
- **50th Percentile (Median)**: Dashed line showing the median projection
- **Base Projection**: Original deterministic projection for comparison

**Color Coding:**
- Confidence bands use the same color as projected values but with transparency
- Median line uses a thinner dashed stroke for distinction

### 2. Interactive Controls

**Toggle Switch:**
- `Show Confidence Bands`: Enable/disable Monte Carlo visualization
- Default: Enabled when Monte Carlo data is available

**Volatility Slider:**
- Range: 5% to 30% annual volatility
- Default: 15% (typical for equity markets)
- Adjusts the width of confidence bands

**Simulations Slider:**
- Range: 100 to 5,000 simulations
- Default: 1,000 simulations
- Higher values provide more accurate percentiles but take longer to compute

**Reset Button:**
- Returns volatility and simulation count to default values

### 3. Legend Integration

New legend section "Confidence Bands" includes:
- 90% Confidence (upper bound)
- Median Projection (50th percentile)
- 10% Confidence (lower bound)

All legend items are toggleable like other chart elements.

## Technical Implementation

### Core Algorithm

**Geometric Brownian Motion:**
```
dS/S = μdt + σdW
```

Where:
- `S`: Portfolio value
- `μ`: Expected return (drift)
- `σ`: Volatility (diffusion)
- `dt`: Time step (monthly)
- `dW`: Wiener process (random normal variable)

### Data Flow

1. **Input Parameters:**
   - Goal configuration (return rate, contributions, etc.)
   - Current net worth
   - Volatility (configurable)
   - Number of simulations (configurable)

2. **Simulation Process:**
   - Generate random returns for each simulation path
   - Calculate portfolio growth with contributions
   - Store final values for percentile calculation

3. **Percentile Calculation:**
   - Sort all simulation results at each time point
   - Extract 10th, 50th, and 90th percentiles
   - Return structured result with base projection and percentiles

### Performance Optimization

- **Memoization**: Results are cached and only recalculated when inputs change
- **Efficient Sorting**: Percentiles calculated using efficient sorting algorithms
- **Progressive Rendering**: Chart updates smoothly as parameters change

## Usage Examples

### Basic Usage

```typescript
import { runMonteCarloSimulation } from '@/app/lib/projectionCalculations';

// Define investment goal
const goal = {
  amount: 1000000, // 1M PLN target
  targetYear: 2040,
  retirementYear: 2040,
  annualReturn: 0.07, // 7% expected return
  monthlyDeposits: 5000, // 5,000 PLN/month
  depositIncreasePercentage: 0.02, // 2% annual increase
  startDate: '2023-01-01',
};

const currentNetWorth = 250000; // 250,000 PLN starting amount

// Run simulation with default parameters
const result = runMonteCarloSimulation(goal, currentNetWorth);

// Access results
const baseProjection = result.baseProjection; // Deterministic projection
const p10 = result.percentiles.p10; // 10th percentile
const p50 = result.percentiles.p50; // Median
const p90 = result.percentiles.p90; // 90th percentile
```

### Custom Parameters

```typescript
// Custom volatility and simulation count
const customResult = runMonteCarloSimulation(goal, currentNetWorth, {
  volatility: 0.20, // 20% annual volatility
  numSimulations: 2000, // 2,000 simulation paths
  confidenceLevels: [0.1, 0.5, 0.9] // Custom percentiles
});
```

### Chart Integration

```typescript
<InvestmentGoalChart
  goal={goal}
  projectionData={chartData}
  currentNetWorth={portfolioValue}
  totalActualContributions={totalActualContributions}
  monteCarloResult={monteCarloResult} // Pass simulation results
  showMonteCarlo={true} // Enable confidence bands
  preferredCurrency="PLN"
/>
```

## Interpretation Guide

### Understanding the Visualization

**Confidence Bands Width:**
- **Narrow bands**: Higher confidence in projections (lower volatility)
- **Wide bands**: Greater uncertainty (higher volatility)

**Goal Achievement:**
- If goal line is within confidence bands: Goal is reasonably achievable
- If goal line is above 90th percentile: Ambitious goal, may require adjustments
- If goal line is below 10th percentile: Conservative goal, likely achievable

### Practical Insights

1. **Risk Assessment**: Wider bands indicate higher risk/reward potential
2. **Time Horizon**: Bands typically widen over time due to compounding uncertainty
3. **Contribution Impact**: Regular contributions reduce downside risk
4. **Volatility Sensitivity**: Test different volatility levels to understand market sensitivity

## Mathematical Foundation

### Geometric Brownian Motion

The simulation uses the following discrete approximation:

```
S_t+1 = S_t * exp((μ - σ²/2)Δt + σ√Δt * Z)
```

Where:
- `Z ~ N(0,1)` (standard normal random variable)
- `Δt = 1/12` (monthly time step)
- `μ`: Annual expected return
- `σ`: Annual volatility

### Percentile Calculation

For N simulations at each time point:

```
P10 = SortedValues[floor(0.1 * N)]
P50 = SortedValues[floor(0.5 * N)]
P90 = SortedValues[floor(0.9 * N)]
```

## Performance Characteristics

### Computational Complexity

- **Time Complexity**: O(N × T × log N) where N = simulations, T = time periods
- **Space Complexity**: O(N × T) for storing all simulation paths

### Benchmarks (Approximate)

| Simulations | Time (ms) | Memory (MB) |
|------------|----------|------------|
| 100        | 5-10     | 1-2        |
| 1,000      | 50-100   | 10-20      |
| 5,000      | 200-400  | 50-100     |

### Optimization Strategies

1. **Memoization**: Cache results until inputs change
2. **Debouncing**: Delay recalculation during rapid parameter changes
3. **Web Workers**: Offload computation to background threads (future enhancement)

## Troubleshooting

### Common Issues

**Issue: Confidence bands not appearing**
- Solution: Ensure `monteCarloResult` prop is passed to chart component
- Solution: Verify `showMonteCarlo` is set to `true`

**Issue: Performance lag with high simulation count**
- Solution: Reduce number of simulations (500-1,000 is usually sufficient)
- Solution: Use debouncing for parameter changes

**Issue: Unexpected percentile values**
- Solution: Verify volatility parameter is reasonable (5%-30% typical)
- Solution: Check that base projection has valid data

## Best Practices

### Parameter Selection

1. **Volatility**: Use historical volatility of your portfolio (15% for equities, 5-10% for bonds)
2. **Simulations**: 500-1,000 provides good balance of accuracy and performance
3. **Time Horizon**: Ensure projection period matches investment horizon

### User Experience

1. **Default Settings**: Start with moderate volatility (15%) and simulations (1,000)
2. **Education**: Explain that wider bands represent market uncertainty, not prediction errors
3. **Context**: Show confidence bands alongside deterministic projection for comparison

### Integration

1. **Progressive Enhancement**: Feature works even if Monte Carlo data is unavailable
2. **Responsive Design**: Controls adapt to different screen sizes
3. **Accessibility**: All interactive elements have proper ARIA attributes

## Future Enhancements

### Planned Features

1. **Historical Volatility Analysis**: Auto-detect volatility from portfolio composition
2. **Fat-Tail Modeling**: Incorporate extreme event probabilities
3. **Correlation Modeling**: Multi-asset class simulations
4. **Web Worker Support**: Offload computation for better UI responsiveness

### Advanced Visualizations

1. **Simulation Paths**: Option to show individual simulation paths
2. **Probability Heatmap**: Color-coded probability density
3. **Goal Probability Meter**: Visual indicator of success likelihood

## API Reference

### `runMonteCarloSimulation()`

**Signature:**
```typescript
function runMonteCarloSimulation(
  goal: Goal,
  currentNetWorth: number,
  params?: Partial<MonteCarloParams>
): MonteCarloSimulationResult
```

**Parameters:**
- `goal`: Investment goal configuration
- `currentNetWorth`: Starting portfolio value
- `params`: Optional simulation parameters

**Returns:**
```typescript
{
  baseProjection: ProjectionDataPoint[], // Deterministic projection
  simulations: ProjectionDataPoint[][], // All simulation paths
  percentiles: {
    p10: ProjectionDataPoint[], // 10th percentile
    p50: ProjectionDataPoint[], // Median
    p90: ProjectionDataPoint[]  // 90th percentile
  }
}
```

### `MonteCarloParams` Interface

```typescript
interface MonteCarloParams {
  numSimulations: number;      // Number of simulation paths
  volatility: number;           // Annual volatility (0.05-0.30)
  confidenceLevels: number[];   // Percentiles to calculate
}
```

## Conclusion

The Monte Carlo Simulation feature transforms the Investment Goal Progress chart from a deterministic forecasting tool to a sophisticated probabilistic planning system. By visualizing the range of possible outcomes, users gain a more realistic understanding of their investment potential and can make better-informed financial decisions.

For questions or support, please refer to the main project documentation or contact the development team.
